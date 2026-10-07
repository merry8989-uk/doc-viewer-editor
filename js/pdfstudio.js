/* =============================================================
 * pdfstudio.js — real PDF page operations via pdf-lib:
 * rotate, delete, reorder, extract/split, watermark, page numbers,
 * insert pages from another PDF, and export pages as PNG.
 * ============================================================= */
(function (DV) {
  'use strict';
  var U = DV.util;

  // "1,3,5-8" -> [0,2,4,5,6,7] (0-based, clamped to [0,count))
  function parseRange(str, count) {
    var out = [];
    String(str || '').split(',').forEach(function (part) {
      part = part.trim();
      if (!part) return;
      var m = part.match(/^(\d+)\s*-\s*(\d+)$/);
      if (m) {
        var a = parseInt(m[1], 10), b = parseInt(m[2], 10);
        if (a > b) { var t = a; a = b; b = t; }
        for (var i = a; i <= b; i++) out.push(i - 1);
      } else if (/^\d+$/.test(part)) {
        out.push(parseInt(part, 10) - 1);
      } else if (/^all$/i.test(part)) {
        for (var j = 0; j < count; j++) out.push(j);
      }
    });
    return out.filter(function (i) { return i >= 0 && i < count; });
  }

  function loadPdf(PDFLib, state) {
    return U.readAsArrayBuffer(state.blob).then(function (buf) { return PDFLib.PDFDocument.load(buf, { ignoreEncryption: true }); });
  }

  function out(bytes, name) {
    U.download(new Blob([bytes], { type: 'application/pdf' }), name);
    U.toast('Saved ' + name, 'good');
  }

  function openPdfStudio(state) {
    var back = U.el('div', { class: 'modal-back' });
    var m = U.el('div', { class: 'modal', style: { width: 'min(680px,94vw)' } });
    m.appendChild(U.el('h2', { text: 'PDF Studio' }));
    m.appendChild(U.el('div', { class: 'sub', text: state.name + ' — page operations run locally with pdf-lib.' }));
    var body = U.el('div', { class: 'stack' });
    m.appendChild(body);
    var foot = U.el('div', { class: 'foot' });
    foot.appendChild(U.el('button', { class: 'btn', text: 'Close', onclick: function () { back.remove(); } }));
    m.appendChild(foot);
    back.appendChild(m);
    back.addEventListener('click', function (e) { if (e.target === back) back.remove(); });
    document.body.appendChild(back);

    var pageCount = 0, lib = null;
    var status = U.el('div', { class: 'badge', text: 'loading…' });
    body.appendChild(status);

    U.loadLib('pdflib').then(function (PDFLib) {
      lib = PDFLib;
      return loadPdf(PDFLib, state);
    }).then(function (doc) {
      pageCount = doc.getPageCount();
      status.textContent = pageCount + ' page(s)';
      buildTools();
    }).catch(function (e) {
      status.textContent = 'Could not open PDF: ' + e.message;
    });

    function row(label, ...controls) {
      var r = U.el('div', { class: 'row' }, [U.el('span', { style: { minWidth: '120px', color: 'var(--fg-dim)' }, text: label })].concat(controls));
      return r;
    }

    function buildTools() {
      var rangeIn = U.el('input', { type: 'text', placeholder: 'e.g. 1,3,5-8 or all', style: { flex: '1' } });
      body.appendChild(U.el('div', { class: 'head', text: 'Page range' }));
      body.appendChild(rangeIn);
      body.appendChild(U.el('div', { class: 'note', text: 'Leave blank or type "all" to target every page.' }));

      // Rotate
      var ang = U.el('select'); [90, 180, 270].forEach(function (a) { ang.appendChild(U.el('option', { value: a, text: a + '°' })); });
      body.appendChild(row('Rotate', ang, U.el('button', { class: 'btn sm', text: 'Apply', onclick: function () {
        withDoc(function (doc) {
          var idx = parseRange(rangeIn.value || 'all', doc.getPageCount());
          idx.forEach(function (i) { var p = doc.getPage(i); p.setRotation(lib.degrees((p.getRotation().angle + parseInt(ang.value, 10)) % 360)); });
          return doc.save();
        }, 'rotated.pdf');
      } })));

      // Delete
      body.appendChild(row('Delete pages', U.el('button', { class: 'btn sm', text: 'Delete', onclick: function () {
        var idx = parseRange(rangeIn.value, pageCount);
        if (!idx.length) { U.toast('Enter pages to delete', 'bad'); return; }
        withDoc(function (doc) {
          idx.slice().sort(function (a, b) { return b - a; }).forEach(function (i) { doc.removePage(i); });
          return doc.save();
        }, 'deleted.pdf');
      } })));

      // Extract
      body.appendChild(row('Extract range', U.el('button', { class: 'btn sm', text: 'Extract', onclick: function () {
        var idx = parseRange(rangeIn.value, pageCount);
        if (!idx.length) { U.toast('Enter a range', 'bad'); return; }
        U.loadLib('pdflib').then(function (PDFLib) {
          return PDFLib.PDFDocument.create().then(function (np) {
            return loadPdf(PDFLib, state).then(function (src) { return np.copyPages(src, idx); }).then(function (pages) {
              pages.forEach(function (p) { np.addPage(p); });
              return np.save();
            });
          });
        }).then(function (bytes) { out(bytes, U.baseName(state.name) + '_extract.pdf'); }).catch(function (e) { U.toast(e.message, 'bad'); });
      } })));

      // Split every N
      var nIn = U.el('input', { type: 'number', value: 1, min: 1, style: { width: '80px' } });
      body.appendChild(row('Split every', nIn, U.el('span', { class: 'note', text: 'pages' }), U.el('button', { class: 'btn sm', text: 'Split → ZIP', onclick: function () {
        var n = parseInt(nIn.value, 10) || 1;
        U.loadLib('pdflib').then(function (PDFLib) { return loadPdf(PDFLib, state).then(function (src) {
          return U.loadLib('jszip').then(function (JSZip) {
            var zip = new JSZip(); var chain = Promise.resolve();
            for (var s = 0; s < src.getPageCount(); s += n) {
              (function (start) {
                chain = chain.then(function () {
                  return PDFLib.PDFDocument.create().then(function (np) {
                    var idx = []; for (var k = start; k < Math.min(start + n, src.getPageCount()); k++) idx.push(k);
                    return np.copyPages(src, idx).then(function (pages) { pages.forEach(function (p) { np.addPage(p); }); return np.save(); })
                      .then(function (bytes) { zip.file('part_' + (start / n + 1) + '.pdf', bytes); });
                  });
                });
              })(s);
            }
            return chain.then(function () { return zip.generateAsync({ type: 'blob' }); });
          });
        }); }).then(function (b) { U.download(b, U.baseName(state.name) + '_split.zip'); U.toast('Split complete', 'good'); }).catch(function (e) { U.toast(e.message, 'bad'); });
      } })));

      // Move page
      var fromIn = U.el('input', { type: 'number', min: 1, value: 1, style: { width: '70px' } });
      var toIn = U.el('input', { type: 'number', min: 1, value: 2, style: { width: '70px' } });
      body.appendChild(row('Move page', fromIn, U.el('span', { class: 'note', text: '→ position' }), toIn, U.el('button', { class: 'btn sm', text: 'Move', onclick: function () {
        withDoc(function (doc) {
          var from = Math.min(Math.max(parseInt(fromIn.value, 10), 1), doc.getPageCount()) - 1;
          var to = Math.min(Math.max(parseInt(toIn.value, 10), 1), doc.getPageCount()) - 1;
          var page = doc.getPage(from);
          doc.removePage(from);
          doc.insertPage(to, page);
          return doc.save();
        }, 'reordered.pdf');
      } })));

      // Watermark
      var wmText = U.el('input', { type: 'text', value: 'DRAFT', style: { flex: '1' } });
      body.appendChild(row('Watermark', wmText, U.el('button', { class: 'btn sm', text: 'Apply', onclick: function () {
        withDoc(function (doc) {
          var font = null;
          return doc.embedFont(lib.StandardFonts.HelveticaBold).then(function (f) {
            font = f;
            doc.getPages().forEach(function (p) {
              var w = p.getWidth(), h = p.getHeight(), size = 60;
              p.drawText(wmText.value || 'DRAFT', { x: w * 0.12, y: h * 0.42, size: size, font: font, color: lib.rgb(0.85, 0.85, 0.85), rotate: lib.degrees(45), opacity: 0.5 });
            });
            return doc.save();
          });
        }, 'watermarked.pdf');
      } })));

      // Page numbers
      body.appendChild(row('Page numbers', U.el('button', { class: 'btn sm', text: 'Add "n / total"', onclick: function () {
        withDoc(function (doc) {
          return doc.embedFont(lib.StandardFonts.Helvetica).then(function (font) {
            var pages = doc.getPages(), total = pages.length;
            pages.forEach(function (p, i) {
              var label = (i + 1) + ' / ' + total;
              var w = font.widthOfTextAtSize(label, 11);
              p.drawText(label, { x: (p.getWidth() - w) / 2, y: 22, size: 11, font: font, color: lib.rgb(0.3, 0.3, 0.3) });
            });
            return doc.save();
          });
        }, 'numbered.pdf');
      } })));

      // Insert pages from another PDF
      var insFile = U.el('input', { type: 'file', accept: '.pdf' });
      var insPos = U.el('input', { type: 'number', min: 1, value: 1, style: { width: '70px' } });
      body.appendChild(row('Insert PDF at', insPos, insFile, U.el('button', { class: 'btn sm', text: 'Insert', onclick: function () {
        if (!insFile.files[0]) { U.toast('Choose a PDF to insert', 'bad'); return; }
        U.loadLib('pdflib').then(function (PDFLib) {
          return Promise.all([loadPdf(PDFLib, state), U.readAsArrayBuffer(insFile.files[0]).then(function (b) { return PDFLib.PDFDocument.load(b, { ignoreEncryption: true }); })])
            .then(function (docs) {
              var target = docs[0], src = docs[1];
              var pos = Math.min(Math.max(parseInt(insPos.value, 10), 1), target.getPageCount() + 1) - 1;
              return target.copyPages(src, src.getPageIndices()).then(function (pages) {
                pages.forEach(function (p, k) { target.insertPage(pos + k, p); });
                return target.save();
              });
            });
        }).then(function (bytes) { out(bytes, U.baseName(state.name) + '_inserted.pdf'); }).catch(function (e) { U.toast(e.message, 'bad'); });
      } })));

      // Export pages as PNG (pdf.js)
      body.appendChild(row('Pages → PNG', U.el('button', { class: 'btn sm', text: 'Export PNGs (ZIP)', onclick: function () {
        var idx = parseRange(rangeIn.value || 'all', pageCount);
        exportPngs(idx);
      } })));
    }

    function withDoc(mutate, filename) {
      U.loadLib('pdflib').then(function (PDFLib) {
        return loadPdf(PDFLib, state).then(function (doc) { return mutate(doc); });
      }).then(function (bytes) { out(bytes, U.baseName(state.name) + '_' + filename); }).catch(function (e) { U.toast('Operation failed: ' + e.message, 'bad'); });
    }

    function exportPngs(indices) {
      U.loadLib('pdfjs').then(function (pdfjsLib) {
        return U.readAsArrayBuffer(state.blob).then(function (buf) { return pdfjsLib.getDocument({ data: buf }).promise; });
      }).then(function (d) {
        return U.loadLib('jszip').then(function (JSZip) {
          var zip = new JSZip(), chain = Promise.resolve();
          indices.forEach(function (pi) {
            chain = chain.then(function () {
              return d.getPage(pi + 1).then(function (page) {
                var vp = page.getViewport({ scale: 2 });
                var c = document.createElement('canvas'); c.width = vp.width; c.height = vp.height;
                return page.render({ canvasContext: c.getContext('2d'), viewport: vp }).promise.then(function () {
                  return U.canvasToBlob(c, 'image/png').then(function (b) { zip.file('page_' + (pi + 1) + '.png', b); });
                });
              });
            });
          });
          return chain.then(function () { return zip.generateAsync({ type: 'blob' }); });
        });
      }).then(function (b) { U.download(b, U.baseName(state.name) + '_pages.zip'); U.toast('Exported pages as PNG', 'good'); })
        .catch(function (e) { U.toast(e.message, 'bad'); });
    }
  }

  DV.pdfstudio = { open: openPdfStudio, parseRange: parseRange };
})(window.DV = window.DV || {});
