/* =============================================================
 * exportui.js — a single "Export…" dialog that offers the formats
 * you can actually save the open file as, with per-format options.
 * ============================================================= */
(function (DV) {
  'use strict';
  var U = DV.util, R = DV.registry, K = R.K;

  function targetsFor(state) {
    var k = state.info.kind, t = [];
    function a(f, l) { t.push({ fmt: f, label: l || ('.' + f) }); }
    if (k === K.IMAGE) { a('png', 'PNG image'); a('jpg', 'JPEG image'); a('webp', 'WebP image'); a('bmp', 'BMP image'); a('pdf', 'PDF document'); }
    else if (k === K.PDF) { a('txt', 'Plain text (extract)'); a('docx', 'Word .docx (extract)'); a('html', 'HTML (extract)'); a('png', 'PNG images — ZIP'); }
    else if (k === K.HTML) { a('html', 'HTML'); a('txt', 'Plain text'); a('md', 'Markdown'); a('pdf', 'PDF'); a('docx', 'Word .docx'); }
    else if (k === K.SHEET) { a('csv', 'CSV'); a('tsv', 'TSV'); a('xlsx', 'Excel .xlsx'); a('json', 'JSON'); a('html', 'HTML table'); a('pdf', 'PDF'); }
    else if (k === K.SLIDES) { a('pptx', 'PowerPoint .pptx'); a('pdf', 'PDF'); }
    else if (k === K.EBOOK) { a('txt', 'Plain text'); a('html', 'HTML'); a('pdf', 'PDF'); a('docx', 'Word .docx'); }
    else if (k === K.ARCHIVE) { a('zip', 'ZIP (repack)'); a('txt', 'Text listing'); }
    else if (k === K.TEXT) { a('txt', 'Plain text'); a('html', 'HTML'); a('md', 'Markdown'); a('rtf', 'Rich Text .rtf'); a('pdf', 'PDF'); a('docx', 'Word .docx'); }
    else { a('txt', 'Plain text'); a('zip', 'ZIP'); a('pdf', 'PDF'); }
    return t;
  }

  function strip(html) {
    return String(html || '')
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/(p|div|h[1-6]|li|tr|section|article)>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
      .replace(/\n{3,}/g, '\n\n').trim();
  }

  function open(state) {
    var targets = targetsFor(state);
    var back = U.el('div', { class: 'modal-back' });
    var m = U.el('div', { class: 'modal' });
    m.appendChild(U.el('h2', { text: 'Export “' + state.name + '”' }));
    m.appendChild(U.el('div', { class: 'sub', text: 'Choose the format you want to save as.' }));

    var opts = { quality: 0.92, scale: 1, dpi: 0 };
    var list = U.el('div', { class: 'stack' });
    var optionBox = U.el('div', { class: 'stack', style: { marginTop: '12px', borderTop: '1px solid var(--line)', paddingTop: '12px' } });
    var chosen = targets[0] ? targets[0].fmt : 'txt';
    var radios = [];

    targets.forEach(function (tg, i) {
      var radio = U.el('input', { type: 'radio', name: 'exfmt', value: tg.fmt });
      if (i === 0) radio.checked = true;
      radio.addEventListener('change', function () { chosen = tg.fmt; renderOptions(); });
      radios.push(radio);
      list.appendChild(U.el('label', { class: 'row', style: { cursor: 'pointer', padding: '6px 8px', borderRadius: '8px', border: '1px solid var(--line)' } }, [
        radio, U.el('span', { text: tg.label }), U.el('span', { class: 'badge', text: '.' + tg.fmt })
      ]));
    });

    function renderOptions() {
      optionBox.innerHTML = '';
      var isImageSrc = state.info.kind === K.IMAGE;
      if (chosen === 'jpg' || chosen === 'jpeg' || chosen === 'webp') {
        var q = U.el('input', { type: 'range', min: 30, max: 100, value: Math.round(opts.quality * 100) });
        var qo = U.el('span', { class: 'badge', text: Math.round(opts.quality * 100) });
        q.addEventListener('input', function () { opts.quality = parseInt(q.value, 10) / 100; qo.textContent = q.value; });
        optionBox.appendChild(U.el('label', { class: 'field' }, ['Quality', U.el('div', { class: 'row' }, [q, qo])]));
      }
      if (isImageSrc && ['png', 'jpg', 'jpeg', 'webp', 'bmp'].indexOf(chosen) >= 0) {
        var sc = U.el('input', { type: 'range', min: 10, max: 200, value: 100 });
        var so = U.el('span', { class: 'badge', text: '100%' });
        sc.addEventListener('input', function () { opts.scale = parseInt(sc.value, 10) / 100; so.textContent = sc.value + '%'; });
        optionBox.appendChild(U.el('label', { class: 'field' }, ['Scale', U.el('div', { class: 'row' }, [sc, so])]));
        if (chosen === 'jpg' || chosen === 'jpeg') {
          var dpi = U.el('input', { type: 'number', value: 0, min: 0, style: { width: '90px' }, placeholder: 'e.g. 300' });
          dpi.addEventListener('input', function () { opts.dpi = parseInt(dpi.value, 10) || 0; });
          optionBox.appendChild(U.el('label', { class: 'field' }, ['JPEG DPI (optional)', dpi]));
        }
      }
      if (!optionBox.children.length) optionBox.appendChild(U.el('div', { class: 'note', text: 'No extra options for this format.' }));
    }

    m.appendChild(list);
    m.appendChild(optionBox);
    renderOptions();

    var foot = U.el('div', { class: 'foot' });
    foot.appendChild(U.el('button', { class: 'btn', text: 'Cancel', onclick: function () { back.remove(); } }));
    var go = U.el('button', { class: 'btn primary', text: 'Export' });
    go.addEventListener('click', function () { back.remove(); run(state, chosen, opts); });
    foot.appendChild(go);
    m.appendChild(foot);
    back.appendChild(m);
    back.addEventListener('click', function (e) { if (e.target === back) back.remove(); });
    document.body.appendChild(back);
  }

  /* ---------------- dispatch ---------------- */
  function run(state, fmt, o) {
    var kind = state.info.kind;
    try {
      if (kind === K.IMAGE) return runImage(state, fmt, o);
      if (kind === K.PDF && fmt === 'png') return pdfPng(state);
      if (kind === K.SHEET && (fmt === 'json' || fmt === 'html' || fmt === 'pdf' || fmt === 'csv' || fmt === 'tsv' || fmt === 'xlsx')) return sheetTo(state, fmt);
      if (kind === K.SLIDES && (fmt === 'pptx' || fmt === 'pdf')) return slidesTo(state, fmt);
      if (kind === K.EBOOK && (fmt === 'txt' || fmt === 'html' || fmt === 'pdf' || fmt === 'docx')) return ebookTo(state, fmt);
    } catch (e) { U.toast(e.message, 'bad'); return; }
    return DV.tools.convert(state, fmt);
  }

  function runImage(state, fmt, o) {
    return DV.tools.blobToCanvas(state.blob).then(function (c) {
      var src = c;
      if (o.scale && o.scale !== 1) {
        var out = document.createElement('canvas');
        out.width = Math.max(1, Math.round(c.width * o.scale));
        out.height = Math.max(1, Math.round(c.height * o.scale));
        var ctx = out.getContext('2d'); ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(c, 0, 0, out.width, out.height);
        src = out;
      }
      if (fmt === 'pdf') return DV.tools.imageToPdf([state.blob], U.baseName(state.name));
      return DV.tools.imageToBlob(src, fmt, o.quality).then(function (b) {
        if ((fmt === 'jpg' || fmt === 'jpeg') && o.dpi) {
          return U.readAsArrayBuffer(b).then(function (ab) {
            var bytes = new Uint8Array(ab); DV.image.setJpegDpi(bytes, o.dpi);
            return new Blob([bytes], { type: 'image/jpeg' });
          });
        }
        return b;
      });
    }).then(function (b) {
      U.download(b, U.baseName(state.name) + '.' + fmt);
      U.toast('Exported .' + fmt, 'good');
    }).catch(function (e) { U.toast(e.message, 'bad'); });
  }

  function sheetTo(state, fmt) {
    var rows = DV.editors.parseDelimited(state.text || '', state.ext === 'tsv' ? '\t' : ',');
    if (fmt === 'csv') { U.download(new Blob([DV.editors.toDelimited(rows, ',')], { type: 'text/csv' }), U.baseName(state.name) + '.csv'); return; }
    if (fmt === 'tsv') { U.download(new Blob([DV.editors.toDelimited(rows, '\t')], { type: 'text/tab-separated-values' }), U.baseName(state.name) + '.tsv'); return; }
    if (fmt === 'xlsx') {
      return U.loadLib('xlsx').then(function (XLSX) {
        var ws = XLSX.utils.aoa_to_sheet(rows); var wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Sheet1'); XLSX.writeFile(wb, U.baseName(state.name) + '.xlsx');
        U.toast('Exported .xlsx', 'good');
      }).catch(function (e) { U.toast(e.message, 'bad'); });
    }
    if (fmt === 'json') {
      var hdr = rows[0] || [];
      var objs = rows.slice(1).map(function (r) { var o = {}; hdr.forEach(function (h, i) { o[h] = r[i]; }); return o; });
      U.download(new Blob([JSON.stringify(objs, null, 2)], { type: 'application/json' }), U.baseName(state.name) + '.json'); return;
    }
    if (fmt === 'html') {
      var html = '<table border="1" cellspacing="0" cellpadding="4">' + rows.map(function (r, i) {
        var tag = i === 0 ? 'th' : 'td';
        return '<tr>' + r.map(function (c) { return '<' + tag + '>' + String(c == null ? '' : c).replace(/[<>&]/g, function (m) { return ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' })[m]; }) + '</' + tag + '>'; }).join('') + '</tr>';
      }).join('') + '</table>';
      U.download(new Blob(['<!DOCTYPE html><meta charset="utf-8">' + html], { type: 'text/html' }), U.baseName(state.name) + '.html'); return;
    }
    if (fmt === 'pdf') {
      return DV.tools.textToPdf(DV.editors.toDelimited(rows, '\t'), U.baseName(state.name)).then(function (b) {
        U.download(b, U.baseName(state.name) + '.pdf'); U.toast('Exported .pdf', 'good');
      }).catch(function (e) { U.toast(e.message, 'bad'); });
    }
  }

  function slidesTo(state, fmt) {
    if (DV.present && DV.present.exportDeck) {
      return DV.present.exportDeck(state.slides || DV.present.parseDeckText(state.text || ''), U.baseName(state.name), fmt);
    }
    U.toast('Presentation export unavailable', 'bad');
  }

  function ebookTo(state, fmt) {
    return U.loadLib('jszip').then(function (JSZip) {
      return U.readAsArrayBuffer(state.blob).then(function (b) { return JSZip.loadAsync(b); });
    }).then(function (zip) {
      var names = Object.keys(zip.files).filter(function (n) { return /\.(x?html?|htm|txt)$/i.test(n) && !zip.files[n].dir; }).sort();
      var chain = Promise.resolve([]);
      names.forEach(function (n) {
        chain = chain.then(function (acc) {
          return zip.file(n).async('string').then(function (x) { var t = strip(x); if (t) acc.push(t); return acc; });
        });
      });
      return chain.then(function (parts) { return parts.join('\n\n'); });
    }).then(function (text) {
      if (fmt === 'txt') { U.download(new Blob([text], { type: 'text/plain' }), U.baseName(state.name) + '.txt'); }
      else if (fmt === 'html') { U.download(new Blob(['<!DOCTYPE html><meta charset="utf-8"><pre>' + text.replace(/[<>&]/g, function (c) { return ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' })[c]; }) + '</pre>'], { type: 'text/html' }), U.baseName(state.name) + '.html'); }
      else if (fmt === 'docx') { return DV.docx.textToDocx(text).then(function (b) { U.download(b, U.baseName(state.name) + '.docx'); }); }
      else if (fmt === 'pdf') { return DV.tools.textToPdf(text, U.baseName(state.name)).then(function (b) { U.download(b, U.baseName(state.name) + '.pdf'); }); }
      U.toast('Exported .' + fmt, 'good');
    }).catch(function (e) { U.toast('eBook export failed: ' + e.message, 'bad'); });
  }

  function pdfPng(state) {
    return U.loadLib('pdfjs').then(function (pdfjsLib) {
      return U.readAsArrayBuffer(state.blob).then(function (buf) { return pdfjsLib.getDocument({ data: buf }).promise; });
    }).then(function (d) {
      return U.loadLib('jszip').then(function (JSZip) {
        var zip = new JSZip(), chain = Promise.resolve();
        for (var p = 1; p <= d.numPages; p++) {
          (function (pno) {
            chain = chain.then(function () {
              return d.getPage(pno).then(function (page) {
                var vp = page.getViewport({ scale: 2 });
                var c = document.createElement('canvas'); c.width = vp.width; c.height = vp.height;
                return page.render({ canvasContext: c.getContext('2d'), viewport: vp }).promise.then(function () {
                  return U.canvasToBlob(c, 'image/png').then(function (b) { zip.file('page_' + pno + '.png', b); });
                });
              });
            });
          })(p);
        }
        return chain.then(function () { return zip.generateAsync({ type: 'blob' }); });
      });
    }).then(function (b) { U.download(b, U.baseName(state.name) + '_pages.zip'); U.toast('Exported pages as PNG', 'good'); })
      .catch(function (e) { U.toast(e.message, 'bad'); });
  }

  DV.exportUI = { open: open, targetsFor: targetsFor };
})(window.DV = window.DV || {});
