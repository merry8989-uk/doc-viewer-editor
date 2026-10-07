/* =============================================================
 * editors.js — text / code editor, spreadsheet grid, HTML editor.
 * ============================================================= */
(function (DV) {
  'use strict';
  var U = DV.util;

  function head(title, editable, extras) {
    var v = U.el('div', { class: 'viewhead' });
    v.appendChild(U.el('span', { class: 'badge ' + (editable ? 'edit' : 'ro'), text: editable ? 'editable' : 'read-only' }));
    v.appendChild(U.el('strong', { text: title }));
    (extras || []).forEach(function (e) { v.appendChild(e); });
    return v;
  }

  function saveBtn(label, getText, ext, mime) {
    return U.el('button', { class: 'btn sm primary', text: label, onclick: function () {
      var txt = getText();
      U.download(new Blob([txt], { type: mime || 'text/plain' }), U.baseName(DV.state.name) + '.' + ext);
      U.toast('Saved .' + ext, 'good');
    } });
  }

  /* ---------------- Plain text / code ---------------- */
  function textEditor(stage, state) {
    stage.innerHTML = '';
    var wrap = U.el('div', { class: 'editor-wrap' });
    var gutter = U.el('div', { class: 'gutter' });
    var area = U.el('textarea', { class: 'code-area', spellcheck: 'false' });
    area.value = state.text || '';
    wrap.appendChild(gutter); wrap.appendChild(area);

    function lines() {
      var n = area.value.split('\n').length;
      var out = '';
      for (var i = 1; i <= n; i++) out += i + '\n';
      gutter.textContent = out;
      gutter.scrollTop = area.scrollTop;
    }
    area.addEventListener('input', lines);
    area.addEventListener('scroll', function () { gutter.scrollTop = area.scrollTop; });
    area.addEventListener('keydown', function (e) {
      if (e.key === 'Tab') {
        e.preventDefault();
        var s = area.selectionStart, en = area.selectionEnd;
        area.value = area.value.slice(0, s) + '  ' + area.value.slice(en);
        area.selectionStart = area.selectionEnd = s + 2;
        lines();
      }
    });

    var stats = U.el('span', { class: 'badge' });
    function upd() {
      var t = area.value;
      stats.textContent = t.length + ' chars · ' + t.split(/\s+/).filter(Boolean).length + ' words · ' + t.split('\n').length + ' lines';
    }
    area.addEventListener('input', upd);

    var view = head(state.info.label, true, [
      saveBtn('Save', function () { return area.value; }, state.ext, 'text/plain'),
      stats
    ]);
    stage.appendChild(view);
    var body = U.el('div', { class: 'viewbody' });
    body.appendChild(wrap);
    stage.appendChild(body);
    lines(); upd();
    return { getText: function () { return area.value; } };
  }

  /* ---------------- CSV / TSV / sheet grid ---------------- */
  function parseDelimited(text, delim) {
    var rows = [], row = [], cell = '', inQ = false;
    for (var i = 0; i < text.length; i++) {
      var c = text[i];
      if (inQ) {
        if (c === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else inQ = false; }
        else cell += c;
      } else {
        if (c === '"') inQ = true;
        else if (c === delim) { row.push(cell); cell = ''; }
        else if (c === '\n') { row.push(cell); rows.push(row); row = []; cell = ''; }
        else if (c === '\r') { /* skip */ }
        else cell += c;
      }
    }
    if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
    return rows;
  }
  function toDelimited(rows, delim) {
    return rows.map(function (r) {
      return r.map(function (c) {
        c = c == null ? '' : String(c);
        return (c.indexOf(delim) >= 0 || c.indexOf('"') >= 0 || c.indexOf('\n') >= 0)
          ? '"' + c.replace(/"/g, '""') + '"' : c;
      }).join(delim);
    }).join('\n');
  }

  function sheetEditor(stage, state) {
    stage.innerHTML = '';
    var delim = state.ext === 'tsv' ? '\t' : ',';
    var rows = parseDelimited(state.text || '', delim);
    if (!rows.length) rows = [['']];

    var body = U.el('div', { class: 'viewbody' });
    function draw() {
      body.innerHTML = '';
      var table = U.el('table', { class: 'grid' });
      var cols = Math.max.apply(null, rows.map(function (r) { return r.length; })) || 1;
      var thead = U.el('tr');
      thead.appendChild(U.el('th', { text: '#' }));
      for (var c = 0; c < cols; c++) thead.appendChild(U.el('th', { text: String.fromCharCode(65 + (c % 26)) + (c >= 26 ? Math.floor(c / 26) : '') }));
      table.appendChild(thead);
      rows.forEach(function (r, ri) {
        var tr = U.el('tr');
        tr.appendChild(U.el('th', { text: String(ri + 1) }));
        for (var ci = 0; ci < cols; ci++) {
          var td = U.el('td', { contenteditable: 'true', text: r[ci] == null ? '' : r[ci] });
          (function (ri2, ci2, cell) {
            cell.addEventListener('input', function () {
              while (rows[ri2].length <= ci2) rows[ri2].push('');
              rows[ri2][ci2] = cell.textContent;
            });
          })(ri, ci, td);
          tr.appendChild(td);
        }
        table.appendChild(tr);
      });
      body.appendChild(table);
    }

    var view = head(state.info.label + ' — grid', true, [
      U.el('button', { class: 'btn sm', text: '+ Row', onclick: function () { rows.push(new Array(rows[0].length).fill('')); draw(); } }),
      U.el('button', { class: 'btn sm', text: '+ Column', onclick: function () { rows.forEach(function (r) { r.push(''); }); draw(); } }),
      saveBtn('Save CSV', function () { return toDelimited(rows, ','); }, 'csv', 'text/csv'),
      saveBtn('Save TSV', function () { return toDelimited(rows, '\t'); }, 'tsv', 'text/tab-separated-values'),
      U.el('button', { class: 'btn sm', text: 'Save XLSX', onclick: function () {
        U.loadLib('xlsx').then(function (XLSX) {
          var ws = XLSX.utils.aoa_to_sheet(rows);
          var wb = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
          XLSX.writeFile(wb, U.baseName(state.name) + '.xlsx');
          U.toast('Saved .xlsx', 'good');
        }).catch(function (e) { U.toast(e.message, 'bad'); });
      } }),
      U.el('button', { class: 'btn sm', text: 'Save JSON', onclick: function () {
        var hdr = rows[0] || [];
        var objs = rows.slice(1).map(function (r) { var o = {}; hdr.forEach(function (h, i) { o[h] = r[i]; }); return o; });
        U.download(new Blob([JSON.stringify(objs, null, 2)], { type: 'application/json' }), U.baseName(state.name) + '.json');
      } })
    ]);
    stage.appendChild(view);
    stage.appendChild(body);
    draw();
    return { getRows: function () { return rows; } };
  }

  /* ---------------- HTML / markup ---------------- */
  function htmlEditor(stage, state) {
    stage.innerHTML = '';
    var area = U.el('textarea', { class: 'code-area', spellcheck: 'false' });
    area.value = state.text || '';
    var iframe = U.el('iframe', { sandbox: 'allow-same-origin allow-modals allow-popups' });
    var left = U.el('div', { class: 'viewbody', style: { display: 'flex' } });
    left.appendChild(area);
    var right = U.el('div', { class: 'viewbody' });
    right.appendChild(iframe);
    var split = U.el('div', { class: 'split' }, [left, right]);

    function preview() {
      iframe.srcdoc = area.value;
    }
    var t = null;
    area.addEventListener('input', function () { clearTimeout(t); t = setTimeout(preview, 250); });

    var view = head(state.info.label + ' — live editor', true, [
      U.el('button', { class: 'btn sm', text: 'Run preview', onclick: preview }),
      saveBtn('Save HTML', function () { return area.value; }, 'html', 'text/html'),
      U.el('button', { class: 'btn sm', text: 'Save .txt', onclick: function () {
        U.download(new Blob([area.value], { type: 'text/plain' }), U.baseName(state.name) + '.txt');
      } }),
      U.el('button', { class: 'btn sm', text: 'Print → PDF', onclick: function () {
        var w = window.open('', '_blank');
        w.document.write(area.value); w.document.close(); w.focus(); w.print();
      } })
    ]);
    stage.appendChild(view);
    stage.appendChild(split);
    preview();
    return { getText: function () { return area.value; } };
  }

  /* ---------------- Markdown (edit + preview) ---------------- */
  function markdownEditor(stage, state) {
    stage.innerHTML = '';
    var area = U.el('textarea', { class: 'code-area', spellcheck: 'false' });
    area.value = state.text || '';
    var iframe = U.el('iframe', { sandbox: 'allow-same-origin' });
    var left = U.el('div', { class: 'viewbody', style: { display: 'flex' } });
    left.appendChild(area);
    var right = U.el('div', { class: 'viewbody' });
    right.appendChild(iframe);
    var split = U.el('div', { class: 'split' }, [left, right]);

    function renderMd() {
      var html = escapeHtml(area.value)
        .replace(/^###### (.*)$/gm, '<h6>$1</h6>').replace(/^##### (.*)$/gm, '<h5>$1</h5>')
        .replace(/^#### (.*)$/gm, '<h4>$1</h4>').replace(/^### (.*)$/gm, '<h3>$1</h3>')
        .replace(/^## (.*)$/gm, '<h2>$1</h2>').replace(/^# (.*)$/gm, '<h1>$1</h1>')
        .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/\*(.+?)\*/g, '<i>$1</i>')
        .replace(/`(.+?)`/g, '<code>$1</code>')
        .replace(/\[(.+?)\]\((.*?)\)/g, '<a href="$2">$1</a>')
        .replace(/^- (.*)$/gm, '<li>$1</li>')
        .replace(/\n/g, '<br>');
      iframe.srcdoc = '<style>body{font-family:system-ui;padding:24px;line-height:1.6;max-width:760px;margin:auto}</style>' + html;
    }
    function escapeHtml(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
    var t = null;
    area.addEventListener('input', function () { clearTimeout(t); t = setTimeout(renderMd, 250); });

    var view = head('Markdown', true, [
      saveBtn('Save MD', function () { return area.value; }, 'md', 'text/markdown'),
      U.el('button', { class: 'btn sm', text: 'Export HTML', onclick: function () {
        U.download(new Blob([iframe.srcdoc], { type: 'text/html' }), U.baseName(state.name) + '.html');
      } })
    ]);
    stage.appendChild(view); stage.appendChild(split); renderMd();
    return { getText: function () { return area.value; } };
  }

  DV.editors = {
    text: textEditor, sheet: sheetEditor, html: htmlEditor, markdown: markdownEditor,
    parseDelimited: parseDelimited, toDelimited: toDelimited
  };
})(window.DV = window.DV || {});
