/* =============================================================
 * viewers.js — pdf, media, archive, ebook and binary viewers.
 * ============================================================= */
(function (DV) {
  'use strict';
  var U = DV.util;

  function head(label, extra) {
    var v = U.el('div', { class: 'viewhead' });
    v.appendChild(U.el('span', { class: 'badge ro', text: 'view' }));
    v.appendChild(U.el('strong', { text: label }));
    (extra || []).forEach(function (e) { v.appendChild(e); });
    return v;
  }

  /* ---------------- PDF (pdf.js) ---------------- */
  function pdf(stage, state) {
    stage.innerHTML = '';
    var view = head('PDF', []);
    var body = U.el('div', { class: 'viewbody' });
    var loading = U.el('div', { class: 'center' }, [U.el('div', {}, [U.el('div', { text: 'Rendering PDF…' }), U.el('div', { class: 'progress' }, [U.el('i')])])]);
    body.appendChild(loading);
    stage.appendChild(view); stage.appendChild(body);

    var scale = 1.3, doc = null, pageCount = 0, rendered = [];
    var nav = U.el('div', { class: 'toolbar' });

    U.loadLib('pdfjs').then(function (pdfjsLib) {
      return U.readAsArrayBuffer(state.blob).then(function (buf) {
        return pdfjsLib.getDocument({ data: buf }).promise;
      });
    }).then(function (d) {
      doc = d; pageCount = d.numPages;
      loading.remove();
      nav.appendChild(U.el('button', { class: 'btn sm', text: '−', onclick: function () { scale = Math.max(0.4, scale - 0.2); renderAll(); } }));
      nav.appendChild(U.el('button', { class: 'btn sm', text: '+', onclick: function () { scale = Math.min(4, scale + 0.2); renderAll(); } }));
      nav.appendChild(U.el('span', { class: 'badge', text: pageCount + ' page(s)' }));
      nav.appendChild(U.el('button', { class: 'btn sm', text: 'Extract text', onclick: function () { extractPdfText(d); } }));
      nav.appendChild(U.el('button', { class: 'btn sm', text: 'Save page as PNG', onclick: function () { savePagePng(d); } }));
      view.appendChild(nav);
      renderAll();
    }).catch(function (e) {
      loading.remove();
      body.appendChild(U.el('div', { class: 'center' }, [U.el('div', { class: 'note', text: 'PDF viewer unavailable: ' + e.message })]));
    });

    function renderAll() {
      rendered.forEach(function (c) { c.remove(); });
      rendered = [];
      var queue = Promise.resolve();
      for (var p = 1; p <= pageCount; p++) {
        (function (pno) {
          queue = queue.then(function () {
            return doc.getPage(pno).then(function (page) {
              var vp = page.getViewport({ scale: scale });
              var c = U.el('canvas', { class: 'pdf-page' });
              c.width = vp.width; c.height = vp.height;
              body.appendChild(c); rendered.push(c);
              return page.render({ canvasContext: c.getContext('2d'), viewport: vp }).promise;
            });
          });
        })(p);
      }
    }

    function extractPdfText(d) {
      var all = [];
      var chain = Promise.resolve();
      for (var p = 1; p <= d.numPages; p++) {
        (function (pno) {
          chain = chain.then(function () {
            return d.getPage(pno).then(function (pg) { return pg.getTextContent(); }).then(function (tc) {
              all.push(tc.items.map(function (i) { return i.str; }).join(' '));
            });
          });
        })(p);
      }
      chain.then(function () {
        var txt = all.join('\n\n');
        U.download(new Blob([txt], { type: 'text/plain' }), U.baseName(state.name) + '.txt');
        U.toast('Extracted text from ' + d.numPages + ' page(s)', 'good');
      });
    }

    function savePagePng(d) {
      d.getPage(1).then(function (page) {
        var vp = page.getViewport({ scale: 2 });
        var c = document.createElement('canvas'); c.width = vp.width; c.height = vp.height;
        return page.render({ canvasContext: c.getContext('2d'), viewport: vp }).promise.then(function () {
          U.canvasToBlob(c, 'image/png').then(function (b) { U.download(b, U.baseName(state.name) + '_page1.png'); });
        });
      });
    }
    return { destroy: function () {} };
  }

  /* ---------------- Audio / Video ---------------- */
  function media(stage, state, kind) {
    stage.innerHTML = '';
    var view = head(kind === 'audio' ? 'Audio' : 'Video');
    var body = U.el('div', { class: 'viewbody' });
    var wrap = U.el('div', { class: 'media-stage' });
    var url = URL.createObjectURL(state.blob);
    var elm = kind === 'audio' ? U.el('audio', { controls: '', src: url }) : U.el('video', { controls: '', src: url });
    wrap.appendChild(elm);
    body.appendChild(wrap);
    stage.appendChild(view); stage.appendChild(body);
    return { destroy: function () { try { elm.pause(); } catch (e) {} URL.revokeObjectURL(url); } };
  }

  /* ---------------- Archive (zip) ---------------- */
  function archive(stage, state) {
    stage.innerHTML = '';
    var view = head('Archive');
    var body = U.el('div', { class: 'viewbody' });
    var info = U.el('div', { class: 'center' }, [U.el('div', { text: 'Reading archive…' })]);
    body.appendChild(info);
    stage.appendChild(view); stage.appendChild(body);

    U.loadLib('jszip').then(function (JSZip) {
      return U.readAsArrayBuffer(state.blob).then(function (buf) { return JSZip.loadAsync(buf); });
    }).then(function (zip) {
      info.remove();
      var names = Object.keys(zip.files).filter(function (n) { return !zip.files[n].dir; });
      var ul = U.el('ul', { class: 'filelist' });
      view.appendChild(U.el('span', { class: 'badge', text: names.length + ' file(s)' }));
      view.appendChild(U.el('button', { class: 'btn sm', text: 'Extract all', onclick: function () { extractAll(zip, names); } }));
      names.forEach(function (n) {
        var f = zip.files[n];
        var li = U.el('li');
        li.appendChild(U.el('span', { class: 'fname', text: n }));
        li.appendChild(U.el('span', { class: 'badge', text: U.fmtBytes(f._data ? f._data.uncompressedSize : 0) }));
        li.appendChild(U.el('button', { class: 'btn sm', text: 'Extract', onclick: function () {
          zip.file(n).async('blob').then(function (b) { U.download(b, n.split('/').pop()); });
        } }));
        ul.appendChild(li);
      });
      body.appendChild(ul);
    }).catch(function (e) {
      info.remove();
      body.appendChild(U.el('div', { class: 'center' }, [U.el('div', {}, [
        U.el('div', { text: 'This archive type can’t be browsed in-browser.' }),
        U.el('div', { class: 'note', text: e.message + ' — try Tools → Convert.' })
      ])]));
    });

    function extractAll(zip, names) {
      var folder = U.baseName(state.name);
      var chain = Promise.all(names.map(function (n) {
        return zip.file(n).async('blob').then(function (b) { return { n: n, b: b }; });
      }));
      chain.then(function (items) {
        var out = new (window.JSZip)();
        items.forEach(function (it) { out.file(it.n, it.b); });
        out.generateAsync({ type: 'blob' }).then(function (b) {
          U.download(b, folder + '_extracted.zip');
          U.toast('Repacked ' + items.length + ' files', 'good');
        });
      });
    }
    return { destroy: function () {} };
  }

  /* ---------------- eBook (epub) ---------------- */
  function ebook(stage, state) {
    stage.innerHTML = '';
    var view = head('eBook');
    var body = U.el('div', { class: 'viewbody' });
    var holder = U.el('div', { id: 'epub-area', style: { height: '100%', padding: '0' } });
    body.appendChild(holder);
    stage.appendChild(view); stage.appendChild(body);

    U.loadLib('epubjs').then(function (ePub) {
      return U.readAsArrayBuffer(state.blob).then(function (buf) {
        var book = ePub(buf);
        var rendition = book.renderTo('epub-area', { width: '100%', height: '100%' });
        rendition.display();
        view.appendChild(U.el('button', { class: 'btn sm', text: '‹ Prev', onclick: function () { rendition.prev(); } }));
        view.appendChild(U.el('button', { class: 'btn sm', text: 'Next ›', onclick: function () { rendition.next(); } }));
        return book;
      });
    }).catch(function (e) {
      body.innerHTML = '';
      body.appendChild(U.el('div', { class: 'center' }, [U.el('div', {}, [
        U.el('div', { text: 'eBook reader unavailable.' }),
        U.el('div', { class: 'note', text: e.message })
      ])]));
    });
    return { destroy: function () {} };
  }

  /* ---------------- Binary / hex preview ---------------- */
  function binary(stage, state) {
    stage.innerHTML = '';
    var view = head(state.info.label + ' (binary preview)');
    var body = U.el('div', { class: 'viewbody' });
    var pre = U.el('pre', { class: 'hex', text: 'Reading…' });
    body.appendChild(pre);
    stage.appendChild(view); stage.appendChild(body);
    U.readAsArrayBuffer(state.blob).then(function (buf) {
      var bytes = new Uint8Array(buf).subarray(0, 4096);
      var out = '';
      for (var i = 0; i < bytes.length; i += 16) {
        var chunk = bytes.subarray(i, i + 16);
        var hex = [], asc = '';
        for (var j = 0; j < chunk.length; j++) {
          hex.push(chunk[j].toString(16).padStart(2, '0'));
          asc += (chunk[j] >= 32 && chunk[j] < 127) ? String.fromCharCode(chunk[j]) : '.';
        }
        out += i.toString(16).padStart(8, '0') + '  ' + hex.join(' ').padEnd(47) + '  ' + asc + '\n';
      }
      pre.textContent = out + '\n… (' + U.fmtBytes(state.blob.size) + ' total, showing first 4 KB)';
    });
    return { destroy: function () {} };
  }

  DV.viewers = { pdf: pdf, media: media, archive: archive, ebook: ebook, binary: binary };
})(window.DV = window.DV || {});
