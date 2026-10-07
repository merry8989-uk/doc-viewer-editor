/* =============================================================
 * app.js — the controller: open files, route to a viewer/editor,
 * build blank documents, wire the toolbar and drag-drop.
 * ============================================================= */
(function (DV) {
  'use strict';
  var U = DV.util, R = DV.registry;

  DV.state = null;
  var current = null; // active view controller

  /* ---------------- open + route ---------------- */
  function setStatus(t) { var b = document.getElementById('statusBadge'); if (b) b.textContent = t; }

  function openFiles(fileList) {
    var files = Array.prototype.slice.call(fileList || []);
    if (!files.length) return;
    if (files.length > 1) U.toast(files.length + ' files — opening the first. Use Tools → Merge for many.');
    var file = files[0];
    var ext = R.normalizeExt(file.name);
    var info = R.extInfo(file.name);
    DV.state = { name: file.name, ext: ext, info: info, blob: file, file: file, text: null, editorApi: null, imageApi: null };
    setStatus('opening ' + file.name);
    renderMeta();
    route(DV.state);
  }

  function route(state) {
    var stage = document.getElementById('stage');
    if (current && current.destroy) { try { current.destroy(); } catch (e) {} }
    current = null;

    var kind = state.info.kind;
    var ext = state.ext;

    // Office / OOXML special handling (best-effort, no server needed)
    if (['docx', 'odt', 'wps', 'wpd', 'doc'].indexOf(ext) >= 0) {
      return officeText(state).then(function (txt) {
        if (txt && txt.trim()) {
          state.text = txt; state.info = Object.assign({}, state.info, { label: state.info.label + ' (text extracted)' });
          current = DV.editors.text(stage, state);
          setStatus('text view');
        } else { current = DV.viewers.binary(stage, state); setStatus('binary'); }
      }).catch(function () { current = DV.viewers.binary(stage, state); });
    }
    if (['xlsx', 'xls', 'ods'].indexOf(ext) >= 0) {
      return U.loadLib('xlsx').then(function (XLSX) {
        return U.readAsArrayBuffer(state.blob).then(function (buf) {
          var wb = XLSX.read(buf, { type: 'array' });
          var ws = wb.Sheets[wb.SheetNames[0]];
          var csv = XLSX.utils.sheet_to_csv(ws);
          state.text = csv;
          current = DV.editors.sheet(stage, state);
          setStatus('sheet');
        });
      }).catch(function () { current = DV.viewers.binary(stage, state); });
    }
    if (kind === R.K.SLIDES) {
      return officeText(state).then(function (txt) {
        state.text = txt || '';
        current = DV.present.open(stage, state);
        setStatus('slides');
      }).catch(function () { current = DV.viewers.binary(stage, state); });
    }

    switch (kind) {
      case R.K.TEXT:
        readText(state).then(function () {
          if (ext === 'md') current = DV.editors.markdown(stage, state);
          else if (['html', 'htm', 'xhtml'].indexOf(ext) >= 0) current = DV.editors.html(stage, state);
          else current = DV.editors.text(stage, state);
          setStatus('text');
        });
        break;
      case R.K.SHEET:
        readText(state).then(function () { current = DV.editors.sheet(stage, state); setStatus('sheet'); });
        break;
      case R.K.HTML:
        readText(state).then(function () { current = DV.editors.html(stage, state); setStatus('html'); });
        break;
      case R.K.IMAGE:
        current = DV.image.mount(stage, state); setStatus('image');
        break;
      case R.K.PDF:
        current = DV.viewers.pdf(stage, state); setStatus('pdf');
        break;
      case R.K.MEDIA_A:
        current = DV.viewers.media(stage, state, 'audio'); setStatus('audio');
        break;
      case R.K.MEDIA_V:
        current = DV.viewers.media(stage, state, 'video'); setStatus('video');
        break;
      case R.K.ARCHIVE:
        current = DV.viewers.archive(stage, state); setStatus('archive');
        break;
      case R.K.EBOOK:
        current = DV.viewers.ebook(stage, state); setStatus('ebook');
        break;
      default:
        current = DV.viewers.binary(stage, state); setStatus('binary');
    }
  }

  function readText(state) {
    return U.readAsText(state.blob).then(function (t) { state.text = t; }).catch(function () { state.text = ''; });
  }

  // Extract text from OOXML / OpenDocument packages (zip + xml) with JSZip.
  function officeText(state) {
    return U.loadLib('jszip').then(function (JSZip) {
      return U.readAsArrayBuffer(state.blob).then(function (buf) { return JSZip.loadAsync(buf); });
    }).then(function (zip) {
      var targets = {
        docx: ['word/document.xml'], odt: ['content.xml'], wps: ['content.xml'],
        wpd: ['content.xml'], doc: ['word/document.xml'],
        pptx: ['ppt/slides/slide1.xml', 'ppt/slides/slide2.xml', 'ppt/slides/slide3.xml'],
        ppt: ['ppt/slides/slide1.xml'], odp: ['content.xml']
      }[state.ext] || [];
      var found = Object.keys(zip.files).filter(function (n) {
        return /word\/document\.xml$|content\.xml$|ppt\/slides\/slide\d+\.xml$/.test(n);
      });
      var use = found.length ? found : targets;
      var chain = Promise.resolve([]);
      use.forEach(function (n) {
        chain = chain.then(function (acc) {
          var f = zip.file(n);
          if (!f) return acc;
          return f.async('string').then(function (xml) {
            var txt = xml
              .replace(/<w:p[ >][\s\S]*?<\/w:p>/g, '\n')
              .replace(/<a:p[ >][\s\S]*?<\/a:p>/g, '\n')
              .replace(/<\/text:p>/g, '\n')
              .replace(/<[^>]+>/g, '')
              .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
              .replace(/\n{3,}/g, '\n\n').trim();
            if (txt) acc.push('— ' + n + ' —\n' + txt);
            return acc;
          });
        });
      });
      return chain.then(function (parts) { return parts.join('\n\n'); });
    });
  }

  /* ---------------- blank documents ---------------- */
  var BLANKS = [
    { id: 'txt',  label: 'Blank text (.txt)',        make: function () { return { name: 'untitled.txt', blob: new Blob([''], { type: 'text/plain' }) }; } },
    { id: 'md',   label: 'Blank markdown (.md)',     make: function () { return { name: 'untitled.md', blob: new Blob(['# Title\n\nStart writing…\n'], { type: 'text/markdown' }) }; } },
    { id: 'html', label: 'Blank HTML page (.html)',  make: function () { return { name: 'untitled.html', blob: new Blob(['<!DOCTYPE html>\n<html>\n<head><meta charset="utf-8"><title>New page</title></head>\n<body>\n  <h1>Hello</h1>\n</body>\n</html>\n'], { type: 'text/html' }) }; } },
    { id: 'csv',  label: 'Blank spreadsheet (.csv)', make: function () { return { name: 'untitled.csv', blob: new Blob(['Column A,Column B,Column C\n,, \n'], { type: 'text/csv' }) }; } },
    { id: 'json', label: 'Blank JSON (.json)',       make: function () { return { name: 'untitled.json', blob: new Blob(['{\n  \n}\n'], { type: 'application/json' }) }; } },
    { id: 'svg',  label: 'Blank SVG (.svg)',         make: function () { return { name: 'untitled.svg', blob: new Blob(['<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400">\n  <rect width="100%" height="100%" fill="#ffffff"/>\n  <text x="20" y="40" font-size="24">New drawing</text>\n</svg>\n'], { type: 'image/svg+xml' }) }; } },
    { id: 'png',  label: 'Blank image canvas (.png)', make: function () {
        var c = document.createElement('canvas'); c.width = 1000; c.height = 1000;
        var ctx = c.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, 1000, 1000);
        return U.canvasToBlob(c, 'image/png').then(function (b) { return { name: 'untitled.png', blob: b }; });
      } },
    { id: 'pdf',  label: 'Blank PDF (.pdf)',          make: function () {
        return U.loadLib('jspdf').then(function (jspdf) {
          var JsPDF = (jspdf.jsPDF) || jspdf;
          var doc = new JsPDF({ unit: 'pt', format: 'a4' });
          doc.setFontSize(12); doc.text(' ', 40, 40);
          return { name: 'untitled.pdf', blob: doc.output('blob') };
        });
      } },
    { id: 'pptx', label: 'Blank presentation (.pptx)', make: function () {
        return DV.present.blank().then(function (f) { return { name: f.name, blob: f }; });
      } }
  ];

  function createBlank(id) {
    var def = BLANKS.filter(function (b) { return b.id === id; })[0];
    if (!def) return;
    Promise.resolve(def.make()).then(function (res) {
      var f = new File([res.blob], res.name, { type: res.blob.type });
      openFiles([f]);
    }).catch(function (e) { U.toast(e.message, 'bad'); });
  }

  /* ---------------- sidebar meta ---------------- */
  function renderMeta() {
    var host = document.getElementById('metaPanel');
    if (!host) return;
    host.innerHTML = '<h3>File</h3>';
    if (!DV.state) { host.appendChild(U.el('div', { class: 'note', text: 'Nothing open yet.' })); return; }
    var s = DV.state;
    var kv = function (k, v) { return U.el('div', { class: 'kv' }, [U.el('span', { text: k }), U.el('span', { text: v })]); };
    host.appendChild(kv('Name', s.name));
    host.appendChild(kv('Size', U.fmtBytes(s.blob.size)));
    host.appendChild(kv('Type', '.' + s.ext + ' — ' + s.info.label));
    host.appendChild(kv('Category', s.info.category));
    host.appendChild(kv('Editable', s.info.editable ? 'yes (in-app)' : 'no — view/convert'));
    if (s.info.note) host.appendChild(U.el('div', { class: 'note', style: { marginTop: '8px' }, text: s.info.note }));

    host.appendChild(U.el('h3', { style: { marginTop: '12px' }, text: 'Convert to' }));
    var cloud = U.el('div');
    R.convertTargets(s.ext).forEach(function (t) {
      cloud.appendChild(U.el('span', { class: 'chip', text: '.' + t, onclick: function () { DV.tools.convert(DV.state, t); } }));
    });
    host.appendChild(cloud);

    var actions = U.el('div', { class: 'stack', style: { marginTop: '12px' } });
    actions.appendChild(U.el('button', { class: 'btn sm primary', text: 'Export as…', onclick: function () { DV.exportUI.open(s); } }));
    if (s.info.kind === R.K.PDF) actions.appendChild(U.el('button', { class: 'btn sm primary', text: 'Open PDF Studio', onclick: function () { DV.pdfstudio.open(s); } }));
    if (s.info.kind === R.K.IMAGE) actions.appendChild(U.el('button', { class: 'btn sm', text: 'Annotate image', onclick: function () { DV.image.annotate(s); } }));
    if (s.info.kind === R.K.SLIDES) actions.appendChild(U.el('button', { class: 'btn sm primary', text: 'Edit slides', onclick: function () { DV.app.route(s); } }));
    actions.appendChild(U.el('button', { class: 'btn sm', text: 'Save a copy (original)', onclick: function () {
      U.download(s.blob, s.name); U.toast('Saved copy', 'good');
    } }));
    actions.appendChild(U.el('button', { class: 'btn sm', text: 'Extract text', onclick: function () { DV.tools.openExtract(s); } }));
    actions.appendChild(U.el('button', { class: 'btn sm', text: 'Close file', onclick: function () { DV.state = null; renderMeta(); var st = document.getElementById('stage'); st.innerHTML = ''; location.reload(); } }));
    host.appendChild(actions);
  }

  function renderFormatCloud() {
    var host = document.getElementById('formatCloud');
    if (!host) return;
    host.innerHTML = '';
    var byCat = R.byCategory();
    R.CATEGORIES.forEach(function (c) {
      var list = byCat[c.id] || [];
      if (!list.length) return;
      host.appendChild(U.el('div', { class: 'head', style: { color: 'var(--fg-dim)', marginTop: '8px', fontSize: '11px' }, text: c.label + ' (' + list.length + ')' }));
      var wrap = U.el('div');
      list.forEach(function (f) { wrap.appendChild(U.el('span', { class: 'chip', text: '.' + f.ext, title: f.label })); });
      host.appendChild(wrap);
    });
  }

  /* ---------------- wiring ---------------- */
  function wireDropdowns() {
    document.querySelectorAll('.dropdown > [data-toggle]').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        var dd = btn.parentElement;
        var open = dd.classList.contains('open');
        document.querySelectorAll('.dropdown').forEach(function (d) { d.classList.remove('open'); });
        if (!open) dd.classList.add('open');
      });
    });
    document.addEventListener('click', function () { document.querySelectorAll('.dropdown').forEach(function (d) { d.classList.remove('open'); }); });
  }

  function wireTools() {
    var menu = document.getElementById('menuTools');
    menu.addEventListener('click', function (e) {
      var item = e.target.closest('.item'); if (!item) return;
      var tool = item.getAttribute('data-tool');
      document.getElementById('ddTools').classList.remove('open');
      var s = DV.state;
      if (tool === 'merge') return DV.tools.openMerge();
      if (tool === 'scan') return startScan();
      if (tool === 'present') return createBlank('pptx');
      if (!s) { U.toast('Open a file first.', 'bad'); return; }
      if (tool === 'export') DV.exportUI.open(s);
      else if (tool === 'convert') DV.tools.openConvert(s);
      else if (tool === 'compress') DV.tools.openCompress(s);
      else if (tool === 'resize') DV.tools.openResize(s);
      else if (tool === 'extract') DV.tools.openExtract(s);
      else if (tool === 'enhance') DV.tools.openEnhance(s);
      else if (tool === 'archive') DV.tools.zipOne(s);
      else if (tool === 'pdfstudio') { if (s.info.kind === R.K.PDF) DV.pdfstudio.open(s); else U.toast('PDF Studio works on PDF files.', 'bad'); }
      else if (tool === 'annotate') { if (s.info.kind === R.K.IMAGE) DV.image.annotate(s); else U.toast('Annotate works on images.', 'bad'); }
    });
  }

  function startScan() {
    DV.image.scan(function (canvas, filter) {
      U.canvasToBlob(canvas, 'image/png').then(function (b) {
        var f = new File([b], 'scan_' + Date.now() + '.png', { type: 'image/png' });
        openFiles([f]);
        U.toast('Captured scan (' + filter + ')', 'good');
      });
    });
  }

  function wireNew() {
    var menu = document.getElementById('menuNew');
    BLANKS.forEach(function (b) {
      menu.appendChild(U.el('div', { class: 'item', text: b.label, onclick: function () {
        document.getElementById('ddNew').classList.remove('open');
        createBlank(b.id);
      } }));
    });
  }

  function wireDrop() {
    var drop = document.getElementById('drop');
    var stage = document.getElementById('stage');
    ['dragenter', 'dragover'].forEach(function (ev) {
      document.addEventListener(ev, function (e) { e.preventDefault(); if (drop) drop.classList.add('hot'); });
    });
    ['dragleave', 'drop'].forEach(function (ev) {
      document.addEventListener(ev, function (e) { e.preventDefault(); if (drop) drop.classList.remove('hot'); });
    });
    document.addEventListener('drop', function (e) {
      if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length) openFiles(e.dataTransfer.files);
    });
    // file picker
    var input = document.getElementById('fileInput');
    document.getElementById('btnOpen').addEventListener('click', function () { input.click(); });
    var o2 = document.getElementById('btnOpen2'); if (o2) o2.addEventListener('click', function () { input.click(); });
    var b2 = document.getElementById('btnBlank2'); if (b2) b2.addEventListener('click', function () { createBlank('txt'); });
    var ex = document.getElementById('btnExport'); if (ex) ex.addEventListener('click', function () { if (DV.state) DV.exportUI.open(DV.state); else U.toast('Open a file first.', 'bad'); });
    input.addEventListener('change', function () { if (input.files.length) openFiles(input.files); input.value = ''; });
  }

  function registerSW() {
    if ('serviceWorker' in navigator && location.protocol.indexOf('http') === 0) {
      navigator.serviceWorker.register('sw.js').catch(function () { /* file:// or blocked — fine */ });
    }
  }

  function init() {
    wireDropdowns(); wireTools(); wireNew(); wireDrop(); renderMeta(); renderFormatCloud(); registerSW();
    setStatus('ready');
    console.log('DocForge ready — ' + R.allExtensions().length + ' formats registered.');
  }

  DV.app = { init: init, openFiles: openFiles, createBlank: createBlank, route: route, BLANKS: BLANKS };
  document.addEventListener('DOMContentLoaded', init);
})(window.DV = window.DV || {});
