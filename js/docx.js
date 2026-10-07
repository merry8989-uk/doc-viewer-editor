/* =============================================================
 * docx.js — write real .docx (Office Open XML) files from text,
 * markdown or HTML, using JSZip. No server required.
 * ============================================================= */
(function (DV) {
  'use strict';
  var U = DV.util;

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  var CONTENT_TYPES =
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' +
    '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
    '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
    '<Default Extension="xml" ContentType="application/xml"/>' +
    '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>' +
    '<Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>' +
    '</Types>';

  var RELS =
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' +
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>' +
    '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="word/styles.xml"/>' +
    '</Relationships>';

  var DOC_RELS =
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' +
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>' +
    '</Relationships>';

  function styleDef(id, name, size, bold, outline) {
    return '<w:style w:type="paragraph" w:styleId="' + id + '"><w:name w:val="' + name + '"/>' +
      (outline ? '<w:basedOn w:val="Normal"/><w:qFormat/>' : '') +
      '<w:rPr>' + (bold ? '<w:b/>' : '') + (size ? '<w:sz w:val="' + (size * 2) + '"/><w:szCs w:val="' + (size * 2) + '"/>' : '') + '</w:rPr></w:style>';
  }

  var STYLES =
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' +
    '<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">' +
    '<w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/><w:sz w:val="22"/></w:rPr></w:rPrDefault></w:docDefaults>' +
    '<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style>' +
    styleDef('Heading1', 'heading 1', 18, true, true) +
    styleDef('Heading2', 'heading 2', 15, true, true) +
    styleDef('Heading3', 'heading 3', 13, true, true) +
    styleDef('Title', 'Title', 24, true, true) +
    '</w:styles>';

  function run(text, rpr) {
    if (text === '') return '';
    return '<w:r>' + (rpr ? '<w:rPr>' + rpr + '</w:rPr>' : '') + '<w:t xml:space="preserve">' + esc(text) + '</w:t></w:r>';
  }

  // paragraphs: array of {text, style:'Title'|'Heading1'..|null, bold, italic, list}
  function build(paragraphs) {
    var body = paragraphs.map(function (p) {
      var text = p.text == null ? '' : String(p.text);
      var ppr = '';
      if (p.style) ppr += '<w:pStyle w:val="' + p.style + '"/>';
      if (p.list) ppr += '<w:ind w:left="720"/>';
      var rpr = '';
      if (p.bold) rpr += '<w:b/>';
      if (p.italic) rpr += '<w:i/>';
      var content = text === '' ? '' : run(p.list ? '• ' + text : text, rpr);
      return '<w:p>' + (ppr ? '<w:pPr>' + ppr + '</w:pPr>' : '') + content + '</w:p>';
    }).join('');
    var sect = '<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/></w:sectPr>';
    var doc =
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' +
      '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">' +
      '<w:body>' + body + sect + '</w:body></w:document>';

    return U.loadLib('jszip').then(function (JSZip) {
      var zip = new JSZip();
      zip.file('[Content_Types].xml', CONTENT_TYPES);
      zip.folder('_rels').file('.rels', RELS);
      var w = zip.folder('word');
      w.file('document.xml', doc);
      w.file('styles.xml', STYLES);
      w.folder('_rels').file('document.xml.rels', DOC_RELS);
      return zip.generateAsync({ type: 'blob', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
    });
  }

  // Plain text / markdown -> paragraphs (light markdown awareness)
  function textToParagraphs(text) {
    var lines = String(text || '').split('\n');
    var out = [];
    var inCode = false;
    lines.forEach(function (ln) {
      var t = ln.replace(/\s+$/, '');
      if (/^```/.test(t)) { inCode = !inCode; return; }
      if (inCode) { out.push({ text: t, style: null }); return; }
      var m;
      if ((m = t.match(/^#\s+(.*)$/))) { out.push({ text: m[1], style: 'Title' }); return; }
      if ((m = t.match(/^##\s+(.*)$/))) { out.push({ text: m[1], style: 'Heading1' }); return; }
      if ((m = t.match(/^###\s+(.*)$/))) { out.push({ text: m[1], style: 'Heading2' }); return; }
      if ((m = t.match(/^#{4,6}\s+(.*)$/))) { out.push({ text: m[1], style: 'Heading3' }); return; }
      if ((m = t.match(/^\s*[-*+]\s+(.*)$/))) { out.push({ text: m[1].replace(/\*\*/g, '').replace(/\*/g, ''), list: true }); return; }
      if ((m = t.match(/^\s*\d+[.)]\s+(.*)$/))) { out.push({ text: m[1], list: true }); return; }
      var plain = t.replace(/\*\*(.+?)\*\*/g, '$1').replace(/\*(.+?)\*/g, '$1').replace(/`(.+?)`/g, '$1');
      out.push({ text: plain });
    });
    return out;
  }

  function textToDocx(text) { return build(textToParagraphs(text)); }

  function htmlToDocx(html) {
    // Very small HTML -> paragraphs: block tags become paragraphs, inline tags stripped.
    var s = String(html || '')
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/(p|div|h[1-6]|li|tr|section|article)>/gi, '\n')
      .replace(/<li[^>]*>/gi, '\n• ')
      .replace(/<h1[^>]*>/gi, '\n# ').replace(/<h2[^>]*>/gi, '\n## ').replace(/<h3[^>]*>/gi, '\n### ');
    var text = s.replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"');
    return build(textToParagraphs(text));
  }

  DV.docx = { build: build, textToParagraphs: textToParagraphs, textToDocx: textToDocx, htmlToDocx: htmlToDocx };
})(window.DV = window.DV || {});
