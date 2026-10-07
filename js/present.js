/* =============================================================
 * present.js — presentation editor for PPTX/PPT/ODP.
 * Edit slides (title + bullets + notes) and export real .pptx
 * (PptxGenJS) or .pdf (jsPDF). Imports existing decks at text level.
 * ============================================================= */
(function (DV) {
  'use strict';
  var U = DV.util;

  function parseDeckText(text) {
    // Our extractor joins slides as: "— ppt/slides/slideN.xml —\n<lines>"
    var slides = [];
    var lines = String(text || '').split('\n');
    var cur = null;
    lines.forEach(function (ln) {
      if (/^\s*[—-]{1,2}\s*.*slide.*\s*[—-]{1,2}\s*$/i.test(ln) || /^\s*[—-]{1,2}\s*.*\.xml\s*[—-]{1,2}\s*$/i.test(ln)) {
        if (cur) slides.push(cur);
        cur = { title: '', bullets: [], notes: '' };
        return;
      }
      if (!cur) cur = { title: '', bullets: [], notes: '' };
      var t = ln.trim();
      if (!t) return;
      if (!cur.title) cur.title = t;
      else cur.bullets.push(t);
    });
    if (cur) slides.push(cur);
    if (!slides.length) slides = [{ title: '', bullets: [], notes: '' }];
    return slides;
  }

  function open(stage, state) {
    stage.innerHTML = '';
    if (!state.slides) state.slides = parseDeckText(state.text || '');
    var selected = 0;

    var view = U.el('div', { class: 'viewhead' });
    view.appendChild(U.el('span', { class: 'badge edit', text: 'editable' }));
    view.appendChild(U.el('strong', { text: 'Presentation — ' + state.slides.length + ' slide(s)' }));
    view.appendChild(U.el('button', { class: 'btn sm', text: '+ Slide', onclick: function () {
      state.slides.push({ title: '', bullets: [], notes: '' }); selected = state.slides.length - 1; render();
    } }));
    view.appendChild(U.el('button', { class: 'btn sm primary', text: 'Export .pptx', onclick: exportPptx }));
    view.appendChild(U.el('button', { class: 'btn sm', text: 'Export .pdf', onclick: exportPdf }));
    stage.appendChild(view);

    var body = U.el('div', { class: 'viewbody' });
    body.style.display = 'grid';
    body.style.gridTemplateColumns = '260px 1fr';
    stage.appendChild(body);

    var list = U.el('div', { style: { borderRight: '1px solid var(--line)', overflow: 'auto', padding: '8px' } });
    var editor = U.el('div', { style: { padding: '16px', overflow: 'auto' } });
    body.appendChild(list); body.appendChild(editor);

    function render() {
      list.innerHTML = '';
      state.slides.forEach(function (s, i) {
        var item = U.el('div', { class: 'item', style: {
          padding: '8px 10px', borderRadius: '8px', cursor: 'pointer', marginBottom: '4px',
          background: i === selected ? 'var(--bg-3)' : 'transparent', border: '1px solid ' + (i === selected ? 'var(--accent)' : 'var(--line)')
        } }, [
          U.el('div', { style: { fontSize: '11px', color: 'var(--fg-dim)' }, text: 'Slide ' + (i + 1) }),
          U.el('div', { style: { fontSize: '13px' }, text: (s.title || '(untitled)').slice(0, 40) })
        ]);
        item.addEventListener('click', function () { selected = i; render(); });
        list.appendChild(item);
      });

      var cur = state.slides[selected];
      editor.innerHTML = '';
      if (!cur) { editor.appendChild(U.el('div', { class: 'note', text: 'No slide selected.' })); return; }

      var titleIn = U.el('input', { type: 'text', value: cur.title, style: { width: '100%' } });
      titleIn.addEventListener('input', function () { cur.title = titleIn.value; syncList(); });
      var bulletsIn = U.el('textarea', { style: { width: '100%', height: '220px', fontFamily: 'var(--mono)' } });
      bulletsIn.value = cur.bullets.join('\n');
      bulletsIn.addEventListener('input', function () { cur.bullets = bulletsIn.value.split('\n').filter(function (x) { return x.trim() !== ''; }); });
      var notesIn = U.el('textarea', { style: { width: '100%', height: '80px' } });
      notesIn.value = cur.notes || '';
      notesIn.addEventListener('input', function () { cur.notes = notesIn.value; });

      editor.appendChild(U.el('label', { class: 'field' }, ['Slide title', titleIn]));
      editor.appendChild(U.el('label', { class: 'field', style: { marginTop: '12px' } }, ['Bullets (one per line)', bulletsIn]));
      editor.appendChild(U.el('label', { class: 'field', style: { marginTop: '12px' } }, ['Speaker notes', notesIn]));

      var ctrl = U.el('div', { class: 'row', style: { marginTop: '14px' } }, [
        U.el('button', { class: 'btn sm', text: '↑ Move up', onclick: function () { move(-1); } }),
        U.el('button', { class: 'btn sm', text: '↓ Move down', onclick: function () { move(1); } }),
        U.el('button', { class: 'btn sm', text: 'Duplicate', onclick: function () {
          state.slides.splice(selected + 1, 0, { title: cur.title, bullets: cur.bullets.slice(), notes: cur.notes });
          selected++; render();
        } }),
        U.el('button', { class: 'btn sm', text: 'Delete slide', onclick: function () {
          state.slides.splice(selected, 1);
          if (!state.slides.length) state.slides.push({ title: '', bullets: [], notes: '' });
          selected = Math.max(0, selected - 1); render();
        } })
      ]);
      editor.appendChild(ctrl);

      var preview = U.el('div', { style: {
        marginTop: '18px', background: '#fff', color: '#111', borderRadius: '8px', padding: '20px',
        aspectRatio: '16/9', overflow: 'hidden'
      } });
      preview.appendChild(U.el('div', { style: { fontSize: '22px', fontWeight: '700', marginBottom: '12px' }, text: cur.title || '' }));
      var ul = U.el('ul', { style: { margin: '0', paddingLeft: '20px', lineHeight: '1.7' } });
      cur.bullets.forEach(function (b) { ul.appendChild(U.el('li', { text: b })); });
      preview.appendChild(ul);
      editor.appendChild(U.el('div', { class: 'note', style: { marginTop: '8px' }, text: 'Slide preview' }));
      editor.appendChild(preview);
    }

    function syncList() {
      var items = list.children;
      if (items[selected]) items[selected].lastChild.textContent = (state.slides[selected].title || '(untitled)').slice(0, 40);
    }
    function move(d) {
      var ni = selected + d;
      if (ni < 0 || ni >= state.slides.length) return;
      var t = state.slides[selected]; state.slides[selected] = state.slides[ni]; state.slides[ni] = t;
      selected = ni; render();
    }

    function exportPptx() { exportDeck(state.slides, U.baseName(state.name), 'pptx'); }
    function exportPdf() { exportDeck(state.slides, U.baseName(state.name), 'pdf'); }

    render();
    return { getSlides: function () { return state.slides; } };
  }

  // Create a blank one-slide deck as a File (routes into the editor).
  function blank() {
    return U.loadLib('pptxgenjs').then(function (PptxGenJS) {
      var pptx = new PptxGenJS();
      pptx.layout = 'LAYOUT_16x9';
      var s = pptx.addSlide();
      s.addText('New presentation', { x: 0.5, y: 2.4, w: 9, h: 1, fontSize: 28, bold: true, color: '222222', align: 'center' });
      return pptx.write({ outputType: 'blob' }).then(function (blob) {
        return new File([blob], 'untitled.pptx', { type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' });
      });
    });
  }

  // Export a deck (array of {title,bullets,notes}) as pptx or pdf. Reused by the export dialog.
  function exportDeck(slides, baseName, fmt) {
    if (fmt === 'pptx') {
      return U.loadLib('pptxgenjs').then(function (PptxGenJS) {
        var pptx = new PptxGenJS();
        pptx.layout = 'LAYOUT_16x9';
        slides.forEach(function (s) {
          var slide = pptx.addSlide();
          if (s.title) slide.addText(s.title, { x: 0.5, y: 0.4, w: 9, h: 1, fontSize: 30, bold: true, color: '222222' });
          if (s.bullets && s.bullets.length) slide.addText(s.bullets.map(function (b) { return { text: b, options: { bullet: true, fontSize: 18 } }; }), { x: 0.7, y: 1.6, w: 8.6, h: 4.6, fontSize: 18, color: '333333', lineSpacingMultiple: 1.2 });
          if (s.notes) slide.addNotes(s.notes);
        });
        return pptx.write({ outputType: 'blob' }).then(function (blob) { U.download(blob, baseName + '.pptx'); U.toast('Exported .pptx (' + slides.length + ' slides)', 'good'); });
      }).catch(function (e) { U.toast('PPTX export unavailable: ' + e.message, 'bad'); });
    }
    if (fmt === 'pdf') {
      return U.loadLib('jspdf').then(function (jspdf) {
        var JsPDF = (jspdf.jsPDF) || jspdf;
        var doc = new JsPDF({ orientation: 'landscape', unit: 'pt', format: [720, 405] });
        slides.forEach(function (s, i) {
          if (i > 0) doc.addPage([720, 405], 'landscape');
          doc.setFontSize(24); doc.setTextColor(34); doc.text((s.title || '').slice(0, 80), 40, 60);
          doc.setFontSize(13); doc.setTextColor(60);
          var y = 110;
          (s.bullets || []).forEach(function (b) {
            var lines = doc.splitTextToSize('• ' + b, 640);
            doc.text(lines, 50, y); y += lines.length * 18 + 4;
            if (y > 370) { doc.addPage([720, 405], 'landscape'); y = 60; }
          });
        });
        doc.save(baseName + '.pdf'); U.toast('Exported .pdf', 'good');
      }).catch(function (e) { U.toast('PDF export unavailable: ' + e.message, 'bad'); });
    }
    U.toast('Unsupported deck format: ' + fmt, 'bad');
  }

  DV.present = { open: open, blank: blank, parseDeckText: parseDeckText, exportDeck: exportDeck };
})(window.DV = window.DV || {});
