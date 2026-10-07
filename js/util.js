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

  // ---- lazy library loader (CDN, cached by the service worker) ----
  var LIB_URLS = {
    'pdfjs':      'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js',
    'pdfjs.worker': 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js',
    'pdflib':     'https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js',
    'jszip':      'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js',
    'xlsx':       'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js',
    'tesseract':  'https://cdnjs.cloudflare.com/ajax/libs/tesseract.js/4.1.1/tesseract.min.js',
    'epubjs':     'https://cdnjs.cloudflare.com/ajax/libs/epub.js/0.3.93/epub.min.js',
    'jspdf':      'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
    'pptxgenjs':  'https://cdn.jsdelivr.net/npm/pptxgenjs@3.12.0/dist/pptxgen.bundle.js'
  };
  var _loaded = {};
  function loadLib(name) {
    if (_loaded[name]) return Promise.resolve(window[libGlobal(name)]);
    if (!LIB_URLS[name]) return Promise.reject(new Error('unknown lib ' + name));
    return new Promise(function (res, rej) {
      var s = document.createElement('script');
      s.src = LIB_URLS[name];
      s.onload = function () {
        _loaded[name] = true;
        if (name === 'pdfjs' && window.pdfjsLib) {
          try { window.pdfjsLib.GlobalWorkerOptions.workerSrc = LIB_URLS['pdfjs.worker']; } catch (e) {}
        }
        res(window[libGlobal(name)]);
      };
      s.onerror = function () { rej(new Error('Could not load library "' + name + '" (offline & not cached?)')); };
      document.head.appendChild(s);
    });
  }
  function libGlobal(name) {
    return ({ pdfjs: 'pdfjsLib', pdflib: 'PDFLib', jszip: 'JSZip', xlsx: 'XLSX',
              tesseract: 'Tesseract', epubjs: 'ePub', jspdf: 'jspdf', pptxgenjs: 'PptxGenJS' })[name] || name;
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
