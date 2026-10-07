/* =============================================================
 * util.js — tiny helpers shared by every module.
 * ============================================================= */
(function (DV) {
  'use strict';

  function el(tag, attrs, children) {
    var n = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        if (k === 'class') n.className = attrs[k];
        else if (k === 'text') n.textContent = attrs[k];
        else if (k === 'html') n.innerHTML = attrs[k];
        else if (k === 'style' && typeof attrs[k] === 'object') Object.assign(n.style, attrs[k]);
        else if (k.indexOf('on') === 0 && typeof attrs[k] === 'function') n.addEventListener(k.slice(2), attrs[k]);
        else if (attrs[k] != null && attrs[k] !== false) n.setAttribute(k, attrs[k]);
      });
    }
    (children || []).forEach(function (c) {
      if (c == null) return;
      n.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    });
    return n;
  }

  function extOf(name) {
    var s = String(name || '').toLowerCase();
    var i = s.lastIndexOf('.');
    return i >= 0 ? s.slice(i + 1) : '';
  }

  function fmtBytes(bytes) {
    if (!bytes && bytes !== 0) return '—';
    var u = ['B', 'KB', 'MB', 'GB'], i = 0, n = bytes;
    while (n >= 1024 && i < u.length - 1) { n /= 1024; i++; }
    return (i === 0 ? n : n.toFixed(n < 10 ? 1 : 0)) + ' ' + u[i];
  }

  function readAsArrayBuffer(file) {
    return new Promise(function (res, rej) {
      var r = new FileReader();
      r.onload = function () { res(r.result); };
      r.onerror = function () { rej(r.error); };
      r.readAsArrayBuffer(file);
    });
  }
  function readAsText(file) {
    return new Promise(function (res, rej) {
      var r = new FileReader();
      r.onload = function () { res(r.result); };
      r.onerror = function () { rej(r.error); };
      r.readAsText(file);
    });
  }
  function readAsDataURL(file) {
    return new Promise(function (res, rej) {
      var r = new FileReader();
      r.onload = function () { res(r.result); };
      r.onerror = function () { rej(r.error); };
      r.readAsDataURL(file);
    });
  }

  function download(blob, filename) {
    var url = URL.createObjectURL(blob);
    var a = el('a', { href: url, download: filename });
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { document.body.removeChild(a); URL.revokeObjectURL(url); }, 500);
  }

  function baseName(name) {
    var s = String(name || 'file');
    var i = s.lastIndexOf('.');
    return i > 0 ? s.slice(0, i) : s;
  }

  // ---- lazy library loader: prefer the local vendor/ copy (fully offline),
  //      fall back to a CDN if the local file is missing. ----
  var LIBS = {
    pdfjs:     { local: 'vendor/pdf.min.js',         cdn: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js',            global: 'pdfjsLib', workerLocal: 'vendor/pdf.worker.min.js', workerCdn: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js' },
    pdflib:    { local: 'vendor/pdf-lib.min.js',     cdn: 'https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js',        global: 'PDFLib' },
    jszip:     { local: 'vendor/jszip.min.js',       cdn: 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js',            global: 'JSZip' },
    xlsx:      { local: 'vendor/xlsx.full.min.js',   cdn: 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js',        global: 'XLSX' },
    tesseract: { local: 'vendor/tesseract.min.js',   cdn: 'https://cdnjs.cloudflare.com/ajax/libs/tesseract.js/4.1.1/tesseract.min.js',  global: 'Tesseract' },
    epubjs:    { local: 'vendor/epub.min.js',        cdn: 'https://cdn.jsdelivr.net/npm/epubjs@0.3.93/dist/epub.min.js',                 global: 'ePub' },
    jspdf:     { local: 'vendor/jspdf.umd.min.js',   cdn: 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',        global: 'jspdf' },
    pptxgenjs: { local: 'vendor/pptxgen.bundle.js',  cdn: 'https://cdn.jsdelivr.net/npm/pptxgenjs@3.12.0/dist/pptxgen.bundle.js',        global: 'PptxGenJS' }
  };
  var _loaded = {};

  function injectScript(src) {
    return new Promise(function (res, rej) {
      var s = document.createElement('script');
      s.src = src;
      s.onload = function () { res(); };
      s.onerror = function () { rej(new Error('failed to load ' + src)); };
      document.head.appendChild(s);
    });
  }
  function afterLoad(name, usedLocal) {
    if (name === 'pdfjs' && window.pdfjsLib) {
      try { window.pdfjsLib.GlobalWorkerOptions.workerSrc = usedLocal ? LIBS.pdfjs.workerLocal : LIBS.pdfjs.workerCdn; } catch (e) {}
    }
  }
  function loadLib(name) {
    var def = LIBS[name];
    if (!def) return Promise.reject(new Error('unknown lib ' + name));
    if (_loaded[name]) return Promise.resolve(window[def.global]);
    return injectScript(def.local).then(function () {
      _loaded[name] = true; afterLoad(name, true); return window[def.global];
    }).catch(function () {
      return injectScript(def.cdn).then(function () {
        _loaded[name] = true; afterLoad(name, false); return window[def.global];
      });
    });
  }

  function toast(msg, kind) {
    var host = document.getElementById('toasts');
    if (!host) { console.log('[toast]', msg); return; }
    var t = el('div', { class: 'toast ' + (kind || ''), text: msg });
    host.appendChild(t);
    setTimeout(function () { t.classList.add('show'); }, 10);
    setTimeout(function () {
      t.classList.remove('show');
      setTimeout(function () { t.remove(); }, 300);
    }, 3200);
  }

  function canvasToBlob(canvas, mime, quality) {
    return new Promise(function (res) {
      canvas.toBlob(function (b) { res(b); }, mime || 'image/png', quality);
    });
  }

  function slug(s) {
    return String(s || 'file').replace(/[^\w.\-]+/g, '_').slice(0, 80);
  }

  DV.util = {
    el: el, extOf: extOf, fmtBytes: fmtBytes,
    readAsArrayBuffer: readAsArrayBuffer, readAsText: readAsText, readAsDataURL: readAsDataURL,
    download: download, baseName: baseName, loadLib: loadLib, toast: toast,
    canvasToBlob: canvasToBlob, slug: slug
  };
})(window.DV = window.DV || {});
