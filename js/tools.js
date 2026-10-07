/* =============================================================
 * tools.js — convert, compress, resize/DPI/quality, extract text,
 * enhance, merge, create-zip, and camera scan.
 * ============================================================= */
(function (DV) {
  'use strict';
  var U = DV.util;
  var R = DV.registry;

  function modal(title, sub) {
    var back = U.el('div', { class: 'modal-back' });
    var m = U.el('div', { class: 'modal' });
    m.appendChild(U.el('h2', { text: title }));
    if (sub) m.appendChild(U.el('div', { class: 'sub', text: sub }));
    var body = U.el('div', { class: 'stack' });
    m.appendChild(body);
    var foot = U.el('div', { class: 'foot' });
    var close = U.el('button', { class: 'btn', text: 'Close', onclick: function () { back.remove(); } });
    foot.appendChild(close);
    m.appendChild(foot);
    back.appendChild(m);
    back.addEventListener('click', function (e) { if (e.target === back) back.remove(); });
    document.body.appendChild(back);
    return { back: back, body: body, foot: foot, close: close, m: m };
  }

  // Draw any image-ish blob into a canvas (used by convert/enhance/compress).
  function blobToCanvas(blob) {
    return U.readAsDataURL(blob).then(DV.image.loadImage).then(function (img) {
      var c = document.createElement('canvas');
      c.width = img.naturalWidth; c.height = img.naturalHeight;
      c.getContext('2d').drawImage(img, 0, 0);
      return c;
    });
  }

  function imageToBlob(canvas, fmt, quality) {
    var mime = ({ png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', bmp: 'image/bmp' })[fmt] || 'image/png';
    return U.canvasToBlob(canvas, mime, fmt === 'png' ? undefined : (quality == null ? 0.92 : quality));
  }

  /* ---------------- Convert / change file type ---------------- */
  function openConvert(state) {
    var targets = R.convertTargets(state.ext);
    var d = modal('Convert / change file type', 'Current: .' + state.ext + ' — choose an output format.');
    var sel = U.el('select');
    targets.forEach(function (t) { sel.appendChild(U.el('option', { value: t, text: '.' + t })); });
    d.body.appendChild(U.el('label', { class: 'field' }, ['Output format', sel]));
    var run = U.el('button', { class: 'btn primary', text: 'Convert & download' });
    d.foot.insertBefore(run, d.close);
    run.addEventListener('click', function () { convert(state, sel.value); });
  }

  function convert(state, target) {
    var srcKind = state.info.kind;
    var t = target.toLowerCase();
    // -> real .docx
    if (t === 'docx') {
      var work;
      if (srcKind === R.K.HTML) work = DV.docx.htmlToDocx(state.text || '');
      else if (state.text != null) work = DV.docx.textToDocx(state.text);
      else work = extractText(state, false).then(function (tx) { return DV.docx.textToDocx(tx || ''); });
      return Promise.resolve(work).then(function (b) {
        U.download(b, U.baseName(state.name) + '.docx'); U.toast('Converted to .docx', 'good');
      }).catch(function (e) { U.toast(e.message, 'bad'); });
    }
    // image -> image
    if (srcKind === R.K.IMAGE && ['png', 'jpg', 'jpeg', 'webp', 'bmp', 'gif'].indexOf(t) >= 0) {
      return blobToCanvas(state.blob).then(function (c) {
        return imageToBlob(c, t, 0.92);
      }).then(function (b) {
        U.download(b, U.baseName(state.name) + '.' + t); U.toast('Converted to .' + t, 'good');
      }).catch(function (e) { U.toast('Convert failed: ' + e.message, 'bad'); });
    }
    // image -> pdf
    if (srcKind === R.K.IMAGE && t === 'pdf') {
      return imageToPdf([state.blob], U.baseName(state.name)).then(function (b) {
        U.download(b, U.baseName(state.name) + '.pdf'); U.toast('Converted to PDF', 'good');
      }).catch(function (e) { U.toast(e.message, 'bad'); });
    }
    // text-ish -> pdf
    if ((srcKind === R.K.TEXT || srcKind === R.K.HTML) && t === 'pdf') {
      return textToPdf(state.text || '', U.baseName(state.name)).then(function (b) {
        U.download(b, U.baseName(state.name) + '.pdf'); U.toast('Converted to PDF', 'good');
      }).catch(function (e) { U.toast(e.message, 'bad'); });
    }
    // anything -> txt (extract)
    if (t === 'txt') { return extractText(state, true); }
    // anything -> zip
    if (t === 'zip') { return zipOne(state); }
    // csv/sheet -> xlsx
    if (t === 'xlsx' && (state.ext === 'csv' || state.ext === 'tsv')) {
      var rows = DV.editors.parseDelimited(state.text || '', state.ext === 'tsv' ? '\t' : ',');
      return U.loadLib('xlsx').then(function (XLSX) {
        var ws = XLSX.utils.aoa_to_sheet(rows);
        var wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
        XLSX.writeFile(wb, U.baseName(state.name) + '.xlsx'); U.toast('Converted to .xlsx', 'good');
      }).catch(function (e) { U.toast(e.message, 'bad'); });
    }
    // html -> txt / md
    if (t === 'txt' || t === 'md') {
      var stripped = (state.text || '').replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      U.download(new Blob([stripped], { type: 'text/plain' }), U.baseName(state.name) + '.' + t);
      U.toast('Converted to .' + t, 'good'); return;
    }
    U.toast('Direct .' + state.ext + ' → .' + t + ' isn’t supported here yet; try Extract text or the merge tool.', 'bad');
  }

  /* ---------------- Images / text -> PDF (pdf-lib) ---------------- */
  function imageToPdf(blobs, name) {
    return U.loadLib('pdflib').then(function (PDFLib) {
      return PDFLib.PDFDocument.create().then(function (pdf) {
        return Promise.all(blobs.map(function (b) {
          return U.readAsArrayBuffer(b).then(function (buf) {
            var isPng = b.type === 'image/png';
            return (isPng ? pdf.embedPng(buf) : pdf.embedJpg(buf)).catch(function () { return pdf.embedPng(buf); });
          });
        })).then(function (imgs) {
          imgs.forEach(function (img) {
            var page = pdf.addPage([img.width, img.height]);
            page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
          });
          return pdf.save();
        });
      });
    }).then(function (bytes) { return new Blob([bytes], { type: 'application/pdf' }); });
  }

  function textToPdf(text, name) {
    return U.loadLib('jspdf').then(function (jspdf) {
      var JsPDF = (jspdf.jsPDF) || jspdf;
      var doc = new JsPDF({ unit: 'pt', format: 'a4' });
      var margin = 40, lh = 15, y = margin;
      doc.setFontSize(11);
      var lines = doc.splitTextToSize(text || '', 515);
      lines.forEach(function (ln) {
        if (y > 800) { doc.addPage(); y = margin; }
        doc.text(ln, margin, y); y += lh;
      });
      return doc.output('blob');
    });
  }

  /* ---------------- Compress ---------------- */
  function openCompress(state) {
    var d = modal('Compress / reduce size', 'Original: ' + U.fmtBytes(state.blob.size));
    var quality = U.el('input', { type: 'range', min: 30, max: 95, value: 70 });
    var qOut = U.el('span', { class: 'badge', text: '70' });
    quality.addEventListener('input', function () { qOut.textContent = quality.value; });
    var scale = U.el('input', { type: 'range', min: 20, max: 100, value: 100 });
    var sOut = U.el('span', { class: 'badge', text: '100%' });
    scale.addEventListener('input', function () { sOut.textContent = scale.value + '%'; });
    d.body.appendChild(U.el('label', { class: 'field' }, ['JPEG/WebP quality', U.el('div', { class: 'row' }, [quality, qOut])]));
    d.body.appendChild(U.el('label', { class: 'field' }, ['Scale', U.el('div', { class: 'row' }, [scale, sOut])]));
    var run = U.el('button', { class: 'btn primary', text: 'Compress & download' });
    d.foot.insertBefore(run, d.close);
    run.addEventListener('click', function () {
      var q = parseInt(quality.value, 10) / 100;
      var s = parseInt(scale.value, 10) / 100;
      if (state.info.kind === R.K.IMAGE) {
        blobToCanvas(state.blob).then(function (c) {
          var out = document.createElement('canvas');
          out.width = Math.round(c.width * s); out.height = Math.round(c.height * s);
          var ctx = out.getContext('2d');
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(c, 0, 0, out.width, out.height);
          var fmt = (state.ext === 'png') ? 'webp' : state.ext;
          return imageToBlob(out, fmt === 'gif' ? 'png' : fmt, q);
        }).then(function (b) {
          U.download(b, U.baseName(state.name) + '_compressed.' + (state.ext === 'png' ? 'webp' : state.ext));
          U.toast('Compressed: ' + U.fmtBytes(state.blob.size) + ' → ' + U.fmtBytes(b.size), 'good');
        }).catch(function (e) { U.toast(e.message, 'bad'); });
      } else {
        U.toast('Compression for this type isn’t available yet — try Convert to ZIP.', 'bad');
      }
    });
  }

  /* ---------------- Resize / DPI / quality ---------------- */
  function openResize(state) {
    var d = modal('Resize · DPI · quality', 'Change pixel size, print DPI, or output quality.');
    var w = U.el('input', { type: 'number', min: 1 });
    var h = U.el('input', { type: 'number', min: 1 });
    var dpi = U.el('input', { type: 'number', value: 300, min: 30 });
    var inchesW = U.el('input', { type: 'number', value: 6, step: 0.1, min: 0.5 });
    var fmt = U.el('select');
    ['png', 'jpg', 'webp'].forEach(function (f) { fmt.appendChild(U.el('option', { value: f, text: '.' + f })); });
    var q = U.el('input', { type: 'range', min: 30, max: 100, value: 92 });
    var qOut = U.el('span', { class: 'badge', text: '92' });
    q.addEventListener('input', function () { qOut.textContent = q.value; });
    d.body.appendChild(U.el('div', { class: 'row' }, [
      U.el('label', { class: 'field' }, ['Width px', w]), U.el('label', { class: 'field' }, ['Height px', h])
    ]));
    d.body.appendChild(U.el('div', { class: 'row' }, [
      U.el('label', { class: 'field' }, ['DPI', dpi]), U.el('label', { class: 'field' }, ['Print width (in)', inchesW])
    ]));
    d.body.appendChild(U.el('div', { class: 'row' }, [
      U.el('label', { class: 'field' }, ['Format', fmt]), U.el('label', { class: 'field' }, ['Quality', U.el('div', { class: 'row' }, [q, qOut])])
    ]));
    var applyDpi = U.el('button', { class: 'btn sm', text: 'Apply DPI to size', onclick: function () {
      var target = Math.round(parseFloat(inchesW.value) * parseInt(dpi.value, 10));
      if (target > 0) { w.value = target; U.toast('Width set to ' + target + 'px for ' + dpi.value + ' DPI'); }
    } });
    d.body.appendChild(applyDpi);
    blobToCanvas(state.blob).then(function (c) {
      w.value = c.width; h.value = c.height;
    }).catch(function () {});
    var run = U.el('button', { class: 'btn primary', text: 'Apply & download' });
    d.foot.insertBefore(run, d.close);
    run.addEventListener('click', function () {
      blobToCanvas(state.blob).then(function (c) {
        var tw = parseInt(w.value, 10) || c.width, th = parseInt(h.value, 10) || c.height;
        var out = document.createElement('canvas'); out.width = tw; out.height = th;
        var ctx = out.getContext('2d'); ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(c, 0, 0, tw, th);
        return imageToBlob(out, fmt.value, parseInt(q.value, 10) / 100).then(function (b) {
          if (fmt.value === 'jpg') {
            return U.readAsArrayBuffer(b).then(function (ab) {
              var bytes = new Uint8Array(ab); DV.image.setJpegDpi(bytes, parseInt(dpi.value, 10));
              return new Blob([bytes], { type: 'image/jpeg' });
            });
          }
          return b;
        }).then(function (b) {
          U.download(b, U.baseName(state.name) + '_' + tw + 'x' + th + '.' + fmt.value);
          U.toast('Exported ' + tw + '×' + th + ' @ ' + dpi.value + ' DPI', 'good');
        });
      }).catch(function (e) { U.toast(e.message, 'bad'); });
    });
  }

  /* ---------------- Extract text (PDF text or OCR) ---------------- */
  function openExtract(state) {
    var d = modal('Extract text', 'Get editable text out of a PDF or image (OCR).');
    var note = U.el('div', { class: 'note', text: state.info.kind === R.K.PDF ? 'PDF text layer will be read.' : 'OCR runs fully in-browser (first run downloads the language model).' });
    d.body.appendChild(note);
    var run = U.el('button', { class: 'btn primary', text: 'Extract' });
    d.foot.insertBefore(run, d.close);
    run.addEventListener('click', function () { extractText(state, false); });
  }

  function extractText(state, silentDownload) {
    if (state.info.kind === R.K.PDF) {
      return U.loadLib('pdfjs').then(function (pdfjsLib) {
        return U.readAsArrayBuffer(state.blob).then(function (buf) { return pdfjsLib.getDocument({ data: buf }).promise; });
      }).then(function (d) {
        var all = [], chain = Promise.resolve();
        for (var p = 1; p <= d.numPages; p++) {
          (function (pno) { chain = chain.then(function () {
            return d.getPage(pno).then(function (pg) { return pg.getTextContent(); })
              .then(function (tc) { all.push(tc.items.map(function (i) { return i.str; }).join(' ')); });
          }); })(p);
        }
        return chain.then(function () { return all.join('\n\n'); });
      }).then(function (txt) {
        U.download(new Blob([txt], { type: 'text/plain' }), U.baseName(state.name) + '.txt');
        U.toast('Text extracted', 'good'); return txt;
      }).catch(function (e) { U.toast(e.message, 'bad'); });
    }
    // OCR for images
    if (state.info.kind === R.K.IMAGE) {
      return U.loadLib('tesseract').then(function (Tesseract) {
        return U.readAsDataURL(state.blob).then(function (url) {
          return Tesseract.recognize(url, 'eng', { logger: function () {} });
        });
      }).then(function (res) {
        var txt = (res && res.data && res.data.text) || '';
        U.download(new Blob([txt], { type: 'text/plain' }), U.baseName(state.name) + '_ocr.txt');
        U.toast('OCR complete (' + txt.length + ' chars)', 'good'); return txt;
      }).catch(function (e) { U.toast('OCR unavailable: ' + e.message, 'bad'); });
    }
    // plain text passthrough
    U.download(new Blob([state.text || ''], { type: 'text/plain' }), U.baseName(state.name) + '.txt');
    return Promise.resolve(state.text);
  }

  /* ---------------- Enhance document (image) ---------------- */
  function openEnhance(state) {
    if (state.info.kind !== R.K.IMAGE) { U.toast('Enhance works on images/scans.', 'bad'); return; }
    var d = modal('Enhance document', 'Sharpen, brighten, boost contrast and flatten to a clean scan.');
    var sharp = U.el('input', { type: 'range', min: 0, max: 100, value: 40 });
    var bright = U.el('input', { type: 'range', min: 80, max: 140, value: 108 });
    var contrast = U.el('input', { type: 'range', min: 80, max: 180, value: 125 });
    d.body.appendChild(U.el('label', { class: 'field' }, ['Sharpen', sharp]));
    d.body.appendChild(U.el('label', { class: 'field' }, ['Brightness', bright]));
    d.body.appendChild(U.el('label', { class: 'field' }, ['Contrast', contrast]));
    var run = U.el('button', { class: 'btn primary', text: 'Enhance & download' });
    d.foot.insertBefore(run, d.close);
    run.addEventListener('click', function () {
      blobToCanvas(state.blob).then(function (c) {
        var ctx = c.getContext('2d');
        var id = ctx.getImageData(0, 0, c.width, c.height);
        var data = id.data;
        var b = parseInt(bright.value, 10) / 100, ct = parseInt(contrast.value, 10) / 100;
        for (var i = 0; i < data.length; i += 4) {
          data[i] = clamp((data[i] - 128) * ct + 128 * b);
          data[i + 1] = clamp((data[i + 1] - 128) * ct + 128 * b);
          data[i + 2] = clamp((data[i + 2] - 128) * ct + 128 * b);
        }
        ctx.putImageData(id, 0, 0);
        var amt = parseInt(sharp.value, 10) / 100;
        if (amt > 0) sharpen(ctx, c.width, c.height, amt);
        return imageToBlob(c, 'png', 1).then(function (blob) {
          U.download(blob, U.baseName(state.name) + '_enhanced.png');
          U.toast('Enhanced', 'good');
        });
      }).catch(function (e) { U.toast(e.message, 'bad'); });
    });
  }
  function clamp(v) { return v < 0 ? 0 : v > 255 ? 255 : v; }
  function sharpen(ctx, w, h, amt) {
    var src = ctx.getImageData(0, 0, w, h);
    var out = ctx.createImageData(w, h);
    var s = src.data, o = out.data;
    var k = [0, -amt, 0, -amt, 1 + 4 * amt, -amt, 0, -amt, 0];
    for (var y = 0; y < h; y++) {
      for (var x = 0; x < w; x++) {
        var i = (y * w + x) * 4;
        for (var c = 0; c < 3; c++) {
          var acc = 0, ki = 0;
          for (var dy = -1; dy <= 1; dy++) for (var dx = -1; dx <= 1; dx++) {
            var xx = Math.min(w - 1, Math.max(0, x + dx)), yy = Math.min(h - 1, Math.max(0, y + dy));
            acc += s[(yy * w + xx) * 4 + c] * k[ki++];
          }
          o[i + c] = clamp(acc);
        }
        o[i + 3] = s[i + 3];
      }
    }
    ctx.putImageData(out, 0, 0);
  }

  /* ---------------- Merge multiple files ---------------- */
  function openMerge() {
    var d = modal('Merge / combine files', 'Pick several files. Images → one PDF; PDFs → one PDF; anything → one ZIP.');
    var input = U.el('input', { type: 'file', multiple: '' });
    var list = U.el('div', { class: 'note', text: 'No files selected.' });
    var mode = U.el('select');
    [['auto', 'Auto (best match)'], ['pdf', 'Merge into one PDF'], ['zip', 'Bundle into one ZIP']].forEach(function (o) {
      mode.appendChild(U.el('option', { value: o[0], text: o[1] }));
    });
    input.addEventListener('change', function () {
      list.textContent = input.files.length + ' file(s): ' + Array.prototype.map.call(input.files, function (f) { return f.name; }).join(', ');
    });
    d.body.appendChild(input);
    d.body.appendChild(U.el('label', { class: 'field' }, ['Mode', mode]));
    d.body.appendChild(list);
    var run = U.el('button', { class: 'btn primary', text: 'Merge & download' });
    d.foot.insertBefore(run, d.close);
    run.addEventListener('click', function () {
      var files = Array.prototype.slice.call(input.files);
      if (!files.length) { U.toast('Choose some files first', 'bad'); return; }
      mergeFiles(files, mode.value);
    });
  }

  function mergeFiles(files, mode) {
    if (mode === 'zip' || (mode === 'auto' && !allSameKind(files, ['pdf', 'image']))) {
      return U.loadLib('jszip').then(function (JSZip) {
        var zip = new JSZip();
        return Promise.all(files.map(function (f) {
          return U.readAsArrayBuffer(f).then(function (b) { zip.file(f.name, b); });
        })).then(function () { return zip.generateAsync({ type: 'blob' }); });
      }).then(function (b) {
        U.download(b, 'merged_bundle.zip'); U.toast('Bundled ' + files.length + ' files', 'good');
      }).catch(function (e) { U.toast(e.message, 'bad'); });
    }
    var onlyPdf = files.every(function (f) { return U.extOf(f.name) === 'pdf'; });
    if (onlyPdf) {
      return U.loadLib('pdflib').then(function (PDFLib) {
        return PDFLib.PDFDocument.create().then(function (out) {
          var chain = Promise.resolve();
          files.forEach(function (f) {
            chain = chain.then(function () {
              return U.readAsArrayBuffer(f).then(function (buf) { return PDFLib.PDFDocument.load(buf); })
                .then(function (src) { return out.copyPages(src, src.getPageIndices()); })
                .then(function (pages) { pages.forEach(function (p) { out.addPage(p); }); });
            });
          });
          return chain.then(function () { return out.save(); });
        });
      }).then(function (bytes) {
        U.download(new Blob([bytes], { type: 'application/pdf' }), 'merged.pdf');
        U.toast('Merged ' + files.length + ' PDFs', 'good');
      }).catch(function (e) { U.toast(e.message, 'bad'); });
    }
    // images -> pdf
    Promise.all(files.map(function (f) { return new Blob([f], { type: f.type }); }))
      .then(function (blobs) { return imageToPdf(blobs, 'merged'); })
      .then(function (b) { U.download(b, 'merged_images.pdf'); U.toast('Images merged to PDF', 'good'); })
      .catch(function (e) { U.toast(e.message, 'bad'); });
  }
  function allSameKind(files, kinds) {
    return files.every(function (f) {
      var info = R.extInfo(f.name);
      return kinds.some(function (k) {
        return (k === 'pdf' && info.kind === R.K.PDF) ||
               (k === 'image' && info.kind === R.K.IMAGE) ||
               (k === info.kind);
      });
    });
  }

  /* ---------------- Create ZIP from current file ---------------- */
  function zipOne(state) {
    return U.loadLib('jszip').then(function (JSZip) {
      var zip = new JSZip();
      return U.readAsArrayBuffer(state.blob).then(function (b) {
        zip.file(state.name, b);
        return zip.generateAsync({ type: 'blob' });
      });
    }).then(function (b) { U.download(b, U.baseName(state.name) + '.zip'); U.toast('Zipped', 'good'); });
  }

  DV.tools = {
    openConvert: openConvert, convert: convert,
    openCompress: openCompress, openResize: openResize,
    openExtract: openExtract, extractText: extractText,
    openEnhance: openEnhance, openMerge: openMerge, mergeFiles: mergeFiles,
    zipOne: zipOne, imageToPdf: imageToPdf, textToPdf: textToPdf, blobToCanvas: blobToCanvas,
    imageToBlob: imageToBlob
  };
})(window.DV = window.DV || {});
