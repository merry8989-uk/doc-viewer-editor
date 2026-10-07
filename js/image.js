/* =============================================================
 * image.js — canvas image viewer + editor, plus camera scan
 * and JPEG-DPI metadata writing.
 * ============================================================= */
(function (DV) {
  'use strict';
  var U = DV.util;

  function loadImage(src) {
    return new Promise(function (res, rej) {
      var img = new Image();
      img.onload = function () { res(img); };
      img.onerror = function () { rej(new Error('Could not decode image')); };
      img.src = src;
    });
  }

  // -------- JPEG DPI metadata (best-effort) --------
  function setJpegDpi(bytes, dpi) {
    try {
      // Look for the JFIF APP0 marker: FF D8 FF E0 "JFIF\0"
      if (bytes[0] !== 0xFF || bytes[1] !== 0xD8) return bytes;
      var i = 2;
      if (bytes[i] === 0xFF && bytes[i + 1] === 0xE0) {
        var len = (bytes[i + 2] << 8) | bytes[i + 3];
        // APP0 data begins at i+4; density fields sit at offset 9 (units), 10-11 (Xdensity), 12-13 (Ydensity)
        var base = i + 4;
        bytes[base + 7] = 1;                 // units: 1 = dots per inch
        bytes[base + 8] = (dpi >> 8) & 0xFF;
        bytes[base + 9] = dpi & 0xFF;
        bytes[base + 10] = (dpi >> 8) & 0xFF;
        bytes[base + 11] = dpi & 0xFF;
      }
      return bytes;
    } catch (e) { return bytes; }
  }

  var FILTER_DEFAULTS = { brightness: 100, contrast: 100, saturate: 100, grayscale: 0, sepia: 0, invert: 0, blur: 0 };

  function filterString(f) {
    return 'brightness(' + f.brightness + '%) contrast(' + f.contrast + '%) saturate(' + f.saturate + '%) ' +
           'grayscale(' + f.grayscale + '%) sepia(' + f.sepia + '%) invert(' + f.invert + '%) blur(' + f.blur + 'px)';
  }

  // Build an ImageEditor bound to a stage element.
  function mount(stage, state) {
    var img = null;
    var rot = 0, flipX = false, flipY = false;
    var filters = Object.assign({}, FILTER_DEFAULTS);
    var crop = null; // {x,y,w,h} in source pixels

    stage.innerHTML = '';
    var view = U.el('div', { class: 'viewhead' });
    var body = U.el('div', { class: 'viewbody' });
    var canvasStage = U.el('div', { class: 'canvas-stage' });
    var canvas = U.el('canvas', { class: 'preview' });
    canvasStage.appendChild(canvas);
    body.appendChild(canvasStage);
    stage.appendChild(view);
    stage.appendChild(body);

    function naturalW() { return crop ? crop.w : img.naturalWidth; }
    function naturalH() { return crop ? crop.h : img.naturalHeight; }

    function draw() {
      var w = naturalW(), h = naturalH();
      var swap = (rot % 180) !== 0;
      canvas.width = swap ? h : w;
      canvas.height = swap ? w : h;
      var ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.filter = filterString(filters);
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(rot * Math.PI / 180);
      ctx.scale(flipX ? -1 : 1, flipY ? -1 : 1);
      var sx = crop ? crop.x : 0, sy = crop ? crop.y : 0;
      ctx.drawImage(img, sx, sy, w, h, -w / 2, -h / 2, w, h);
      ctx.restore();
      updateMeta();
    }

    function updateMeta() {
      metaEl.textContent = naturalW() + ' × ' + naturalH() + ' px  ·  rot ' + rot + '°' +
        (flipX ? ' · ⇋' : '') + (flipY ? ' · ⇅' : '') + (crop ? ' · cropped' : '');
    }

    var metaEl = U.el('span', { class: 'badge' });

    function mkBtn(label, fn, title) { return U.el('button', { class: 'btn sm', text: label, title: title || label, onclick: fn }); }

    view.appendChild(mkBtn('↺ 90°', function () { rot = (rot + 270) % 360; draw(); }));
    view.appendChild(mkBtn('↻ 90°', function () { rot = (rot + 90) % 360; draw(); }));
    view.appendChild(mkBtn('⇋ Flip', function () { flipX = !flipX; draw(); }));
    view.appendChild(mkBtn('⇅ Flip', function () { flipY = !flipY; draw(); }));
    view.appendChild(mkBtn('Crop…', function () { askCrop(); }));
    view.appendChild(mkBtn('Resize…', function () { askResize(); }));
    view.appendChild(mkBtn('Filters…', function () { askFilters(); }));
    view.appendChild(mkBtn('Reset', function () {
      rot = 0; flipX = flipY = false; crop = null; filters = Object.assign({}, FILTER_DEFAULTS); draw();
    }));
    view.appendChild(metaEl);

    var saveWrap = U.el('div', { class: 'dropdown' });
    saveWrap.appendChild(U.el('button', { class: 'btn sm primary', text: 'Export ▾', onclick: function () { saveWrap.classList.toggle('open'); } }));
    var saveMenu = U.el('div', { class: 'menu' });
    ['png', 'jpg', 'webp', 'bmp'].forEach(function (fmt) {
      saveMenu.appendChild(U.el('div', { class: 'item', text: 'Save as .' + fmt, onclick: function () { saveWrap.classList.remove('open'); exportImage(fmt); } }));
    });
    saveWrap.appendChild(saveMenu);
    view.appendChild(saveWrap);

    // close dropdowns on outside click
    document.addEventListener('click', function (e) { if (!saveWrap.contains(e.target)) saveWrap.classList.remove('open'); });

    function renderOut(targetW, targetH) {
      var w = naturalW(), h = naturalH();
      var swap = (rot % 180) !== 0;
      var ow = targetW || (swap ? h : w);
      var oh = targetH || (swap ? w : h);
      var out = document.createElement('canvas');
      out.width = Math.max(1, Math.round(ow));
      out.height = Math.max(1, Math.round(oh));
      var ctx = out.getContext('2d');
      ctx.filter = filterString(filters);
      ctx.translate(out.width / 2, out.height / 2);
      ctx.rotate(rot * Math.PI / 180);
      ctx.scale(flipX ? -1 : 1, flipY ? -1 : 1);
      var sx = crop ? crop.x : 0, sy = crop ? crop.y : 0;
      ctx.drawImage(img, sx, sy, w, h, -w / 2, -h / 2, w, h);
      ctx.restore();
      return out;
    }

    function exportImage(fmt, quality, dpi, targetW, targetH) {
      var out = renderOut(targetW, targetH);
      var mime = ({ png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', bmp: 'image/bmp' })[fmt] || 'image/png';
      var q = (fmt === 'png') ? undefined : (quality == null ? 0.92 : quality);
      out.toBlob(function (blob) {
        if (!blob) { U.toast('Export failed for ' + fmt, 'bad'); return; }
        if ((fmt === 'jpg' || fmt === 'jpeg') && dpi) {
          blob.arrayBuffer().then(function (ab) {
            var bytes = new Uint8Array(ab);
            setJpegDpi(bytes, dpi);
            U.download(new Blob([bytes], { type: 'image/jpeg' }), U.baseName(state.name) + (dpi ? '_' + dpi + 'dpi' : '') + '.jpg');
            U.toast('Exported JPEG at ' + dpi + ' DPI', 'good');
          });
        } else {
          U.download(blob, U.baseName(state.name) + '.' + fmt);
          U.toast('Exported .' + fmt, 'good');
        }
      }, mime, q);
    }

    function modal(title, sub, build, onOk) {
      var back = U.el('div', { class: 'modal-back' });
      var m = U.el('div', { class: 'modal' });
      m.appendChild(U.el('h2', { text: title }));
      if (sub) m.appendChild(U.el('div', { class: 'sub', text: sub }));
      var bodyEl = U.el('div', { class: 'stack' });
      m.appendChild(bodyEl);
      var foot = U.el('div', { class: 'foot' });
      var cancel = U.el('button', { class: 'btn', text: 'Cancel', onclick: function () { back.remove(); } });
      var ok = U.el('button', { class: 'btn primary', text: 'Apply', onclick: function () { if (onOk() !== false) back.remove(); } });
      foot.appendChild(cancel); foot.appendChild(ok);
      m.appendChild(foot);
      back.appendChild(m);
      back.addEventListener('click', function (e) { if (e.target === back) back.remove(); });
      document.body.appendChild(back);
      return build(bodyEl);
    }

    function askResize() {
      var w = parseInt(prompt('New width (px):', String(naturalW())) || '', 10);
      if (!w || w < 1) return;
      var ratio = naturalH() / naturalW();
      var h = Math.round(w * ratio);
      var fmt = (state.ext === 'png' || state.ext === 'webp') ? state.ext : 'jpg';
      exportImage(fmt, 0.92, null, w, h);
      U.toast('Resized to ' + w + '×' + h + ' and exported', 'good');
    }

    function askCrop() {
      var x = parseInt(prompt('Crop left (px):', '0') || '0', 10);
      var y = parseInt(prompt('Crop top (px):', '0') || '0', 10);
      var w = parseInt(prompt('Crop width (px):', String(naturalW())) || '', 10);
      var h = parseInt(prompt('Crop height (px):', String(naturalH())) || '', 10);
      if (!w || !h) return;
      crop = { x: x, y: y, w: w, h: h };
      draw();
      U.toast('Cropped to ' + w + '×' + h);
    }

    function askFilters() {
      var back = U.el('div', { class: 'modal-back' });
      var m = U.el('div', { class: 'modal' });
      m.appendChild(U.el('h2', { text: 'Adjustments & filters' }));
      m.appendChild(U.el('div', { class: 'sub', text: 'Live preview — changes apply to the canvas behind this dialog.' }));
      var bodyEl = U.el('div', { class: 'stack' });
      var specs = [
        ['brightness', 0, 200], ['contrast', 0, 200], ['saturate', 0, 300],
        ['grayscale', 0, 100], ['sepia', 0, 100], ['invert', 0, 100], ['blur', 0, 10]
      ];
      specs.forEach(function (s) {
        var key = s[0];
        var range = U.el('input', { type: 'range', min: s[1], max: s[2], value: filters[key], step: (key === 'blur' ? 0.5 : 1) });
        var out = U.el('span', { class: 'badge', text: filters[key] });
        range.addEventListener('input', function () { filters[key] = parseFloat(range.value); out.textContent = range.value; draw(); });
        bodyEl.appendChild(U.el('label', { class: 'field' }, [key, U.el('div', { class: 'row' }, [range, out])]));
      });
      m.appendChild(bodyEl);
      var presets = U.el('div', { class: 'row' });
      [['B&W', { grayscale: 100, contrast: 115 }], ['Sepia', { sepia: 70 }], ['Punch', { contrast: 125, saturate: 140 }],
       ['Sharpen-ish', { contrast: 120, saturate: 115 }], ['Doc scan', { grayscale: 100, contrast: 150, brightness: 110 }],
       ['Reset', Object.assign({}, FILTER_DEFAULTS)]].forEach(function (p) {
        presets.appendChild(U.el('button', { class: 'btn sm', text: p[0], onclick: function () {
          filters = Object.assign({}, FILTER_DEFAULTS, p[1]); draw();
          // sync sliders
          bodyEl.querySelectorAll('input[type=range]').forEach(function (r, i) { r.value = filters[specs[i][0]]; });
        } }));
      });
      m.appendChild(U.el('div', { class: 'sub', text: 'Presets' }));
      m.appendChild(presets);
      var foot = U.el('div', { class: 'foot' });
      foot.appendChild(U.el('button', { class: 'btn', text: 'Done', onclick: function () { back.remove(); } }));
      m.appendChild(foot);
      back.appendChild(m);
      document.body.appendChild(back);
    }

    // expose for tools/convert
    state.imageApi = {
      exportImage: exportImage,
      renderOut: renderOut,
      getFilters: function () { return filters; },
      getRotation: function () { return rot; }
    };

    U.readAsDataURL(state.blob).then(loadImage).then(function (im) {
      img = im; draw();
      state.rendered = true;
    }).catch(function (e) {
      U.toast('Image decode failed: ' + e.message, 'bad');
      DV.viewers.binary(stage, state);
    });

    return { destroy: function () {} };
  }

  /* ---------------- Camera document scanner ---------------- */
  function scan(onCapture) {
    var back = U.el('div', { class: 'modal-back' });
    var m = U.el('div', { class: 'modal', style: { width: 'min(760px,94vw)' } });
    m.appendChild(U.el('h2', { text: 'Scan document' }));
    m.appendChild(U.el('div', { class: 'sub', text: 'Point the camera at the page, choose a filter, then capture.' }));
    var video = U.el('video', { autoplay: '', playsinline: '', muted: '', style: { width: '100%', borderRadius: '10px', background: '#000' } });
    m.appendChild(video);
    var filterSel = U.el('select');
    [['none', 'None'], ['grayscale', 'Grayscale'], ['doc', 'Document (B&W high-contrast)'],
     ['bright', 'Brighten'], ['sharp', 'Sharpen-ish'], ['sepia', 'Sepia']].forEach(function (o) {
      filterSel.appendChild(U.el('option', { value: o[0], text: o[1] }));
    });
    m.appendChild(U.el('div', { class: 'row', style: { marginTop: '10px' } }, [
      U.el('label', { class: 'field' }, ['Filter', filterSel])
    ]));
    var foot = U.el('div', { class: 'foot' });
    var cap = U.el('button', { class: 'btn primary', text: 'Capture' });
    var close = U.el('button', { class: 'btn', text: 'Close', onclick: stop });
    foot.appendChild(close); foot.appendChild(cap);
    m.appendChild(foot);
    back.appendChild(m);
    document.body.appendChild(back);

    var stream = null;
    function stop() {
      if (stream) stream.getTracks().forEach(function (t) { t.stop(); });
      back.remove();
    }
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment', width: { ideal: 2560 }, height: { ideal: 1440 } } })
      .then(function (s) { stream = s; video.srcObject = s; })
      .catch(function (e) { U.toast('Camera unavailable: ' + e.message, 'bad'); });

    cap.addEventListener('click', function () {
      if (!stream) { U.toast('No camera stream', 'bad'); return; }
      var c = document.createElement('canvas');
      c.width = video.videoWidth; c.height = video.videoHeight;
      var ctx = c.getContext('2d');
      var f = filterSel.value;
      var cf = { none: '', grayscale: 'grayscale(100%)', doc: 'grayscale(100%) contrast(160%) brightness(112%)',
                 bright: 'brightness(125%) contrast(105%)', sharp: 'contrast(130%) saturate(115%)', sepia: 'sepia(75%)' }[f];
      ctx.filter = cf || 'none';
      ctx.drawImage(video, 0, 0, c.width, c.height);
      stop();
      if (onCapture) onCapture(c, f);
    });
  }

  /* ---------------- Annotation (pen / highlight / box / arrow / text) ---------------- */
  function annotate(state) {
    var back = U.el('div', { class: 'modal-back' });
    var m = U.el('div', { class: 'modal', style: { width: 'min(920px,96vw)' } });
    m.appendChild(U.el('h2', { text: 'Annotate image' }));
    m.appendChild(U.el('div', { class: 'sub', text: 'Pen, highlight, box, arrow or text — then export.' }));
    var wrap = U.el('div', { style: { display: 'grid', placeItems: 'center', background: '#0b0d12', borderRadius: '10px', padding: '10px' } });
    var canvas = U.el('canvas', { style: { maxWidth: '100%', maxHeight: '58vh', cursor: 'crosshair', background: '#fff' } });
    wrap.appendChild(canvas); m.appendChild(wrap);

    var tool = 'pen', color = '#ff3b30', lw = 4;
    var history = [], drawing = false, sx = 0, sy = 0, snap = null;

    var toolsRow = U.el('div', { class: 'row', style: { marginTop: '10px' } });
    ['pen', 'highlight', 'rect', 'arrow', 'text'].forEach(function (t) {
      var b = U.el('button', { class: 'btn sm' + (t === 'pen' ? ' primary' : ''), text: t, onclick: function () {
        tool = t;
        Array.prototype.forEach.call(toolsRow.children, function (c) { if (c.tagName === 'BUTTON') c.classList.remove('primary'); });
        b.classList.add('primary');
      } });
      toolsRow.appendChild(b);
    });
    var colorIn = U.el('input', { type: 'color', value: color });
    colorIn.addEventListener('input', function () { color = colorIn.value; });
    var sizeIn = U.el('input', { type: 'range', min: 1, max: 24, value: lw });
    sizeIn.addEventListener('input', function () { lw = parseInt(sizeIn.value, 10); });
    toolsRow.appendChild(U.el('span', { class: 'note', text: 'color' })); toolsRow.appendChild(colorIn);
    toolsRow.appendChild(U.el('span', { class: 'note', text: 'size' })); toolsRow.appendChild(sizeIn);
    m.appendChild(toolsRow);

    var foot = U.el('div', { class: 'foot' });
    foot.appendChild(U.el('button', { class: 'btn', text: 'Undo', onclick: undo }));
    foot.appendChild(U.el('button', { class: 'btn', text: 'Close', onclick: function () { back.remove(); } }));
    foot.appendChild(U.el('button', { class: 'btn primary', text: 'Export PNG', onclick: function () {
      U.canvasToBlob(canvas, 'image/png').then(function (b) { U.download(b, U.baseName(state.name) + '_annotated.png'); U.toast('Saved annotated image', 'good'); });
    } }));
    foot.appendChild(U.el('button', { class: 'btn primary', text: 'Export JPG', onclick: function () {
      U.canvasToBlob(canvas, 'image/jpeg', 0.92).then(function (b) { U.download(b, U.baseName(state.name) + '_annotated.jpg'); });
    } }));
    m.appendChild(foot);
    back.appendChild(m);
    back.addEventListener('click', function (e) { if (e.target === back) back.remove(); });
    document.body.appendChild(back);

    var ctx = canvas.getContext('2d');
    U.readAsDataURL(state.blob).then(loadImage).then(function (img) {
      canvas.width = img.naturalWidth; canvas.height = img.naturalHeight;
      ctx.drawImage(img, 0, 0);
      history.push(canvas.toDataURL());
    });

    function pos(e) {
      var r = canvas.getBoundingClientRect();
      return { x: (e.clientX - r.left) * canvas.width / r.width, y: (e.clientY - r.top) * canvas.height / r.height };
    }
    function undo() {
      if (history.length > 1) {
        history.pop();
        var im = new Image();
        im.onload = function () { ctx.clearRect(0, 0, canvas.width, canvas.height); ctx.drawImage(im, 0, 0); };
        im.src = history[history.length - 1];
      }
    }
    function commit() { history.push(canvas.toDataURL()); }

    canvas.addEventListener('pointerdown', function (e) {
      var p = pos(e); sx = p.x; sy = p.y;
      ctx.lineJoin = ctx.lineCap = 'round';
      if (tool === 'text') {
        var txt = prompt('Text to add:');
        if (txt) { ctx.globalAlpha = 1; ctx.fillStyle = color; ctx.font = (lw * 6 + 12) + 'px sans-serif'; ctx.fillText(txt, sx, sy); commit(); }
        return;
      }
      drawing = true;
      snap = ctx.getImageData(0, 0, canvas.width, canvas.height);
      ctx.globalAlpha = tool === 'highlight' ? 0.35 : 1;
      ctx.strokeStyle = tool === 'highlight' ? '#ffe066' : color;
      ctx.lineWidth = tool === 'highlight' ? lw * 4 : lw;
      ctx.beginPath(); ctx.moveTo(sx, sy);
      try { canvas.setPointerCapture(e.pointerId); } catch (err) {}
    });
    canvas.addEventListener('pointermove', function (e) {
      if (!drawing) return;
      var p = pos(e);
      if (tool === 'pen' || tool === 'highlight') { ctx.lineTo(p.x, p.y); ctx.stroke(); }
      else {
        ctx.putImageData(snap, 0, 0);
        ctx.beginPath();
        if (tool === 'rect') { ctx.rect(sx, sy, p.x - sx, p.y - sy); ctx.stroke(); }
        else {
          ctx.moveTo(sx, sy); ctx.lineTo(p.x, p.y); ctx.stroke();
          var ang = Math.atan2(p.y - sy, p.x - sx), len = 12 + lw * 2;
          ctx.beginPath(); ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x - len * Math.cos(ang - Math.PI / 7), p.y - len * Math.sin(ang - Math.PI / 7));
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x - len * Math.cos(ang + Math.PI / 7), p.y - len * Math.sin(ang + Math.PI / 7));
          ctx.stroke();
        }
      }
    });
    canvas.addEventListener('pointerup', function () { if (drawing) { drawing = false; ctx.globalAlpha = 1; commit(); } });
  }

  DV.image = { mount: mount, scan: scan, annotate: annotate, setJpegDpi: setJpegDpi, loadImage: loadImage, render: mount };
})(window.DV = window.DV || {});
