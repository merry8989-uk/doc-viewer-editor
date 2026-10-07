/* =============================================================
 * registry.js — the format catalog.
 * One entry per extension: what it is, which viewer/editor it
 * maps to, whether it can be edited, and what it can convert to.
 * ============================================================= */
(function (DV) {
  'use strict';

  // Viewer/editor "kinds" the app knows how to render.
  // text    -> plain-text/code editor
  // sheet   -> tabular grid editor
  // html    -> markup editor with live preview
  // image   -> canvas image viewer/editor
  // pdf     -> pdf.js viewer (+ text extract / merge)
  // media   -> native <audio>/<video>
  // archive -> zip browse/extract
  // ebook   -> epub.js reader
  // binary  -> hex preview (last-resort, always works)
  var K = {
    TEXT: 'text', SHEET: 'sheet', HTML: 'html', IMAGE: 'image',
    PDF: 'pdf', MEDIA_A: 'audio', MEDIA_V: 'video',
    ARCHIVE: 'archive', EBOOK: 'ebook', BINARY: 'binary'
  };

  var CATEGORIES = [
    { id: 'document', label: 'Documents' },
    { id: 'image',    label: 'Images' },
    { id: 'audio',    label: 'Audio' },
    { id: 'video',    label: 'Video' },
    { id: 'code',     label: 'Code & Scripts' },
    { id: 'archive',  label: 'Archives' },
    { id: 'web',      label: 'Web' },
    { id: 'ebook',    label: 'eBooks' },
    { id: 'design',   label: 'Design / RAW' },
    { id: 'other',    label: 'Other' }
  ];

  // fmt(ext, label, category, kind, opts)
  function fmt(ext, label, category, kind, opts) {
    opts = opts || {};
    return {
      ext: ext, label: label, category: category, kind: kind,
      editable: opts.editable !== false,          // can we edit in-app?
      raw: !!opts.raw,                            // raw text-ish editing
      convert: opts.convert || [],                // target extensions
      note: opts.note || ''
    };
  }

  var IMG_TARGETS = ['png', 'jpg', 'webp', 'bmp', 'gif'];
  var DOC_TARGETS = ['txt', 'html', 'pdf', 'md', 'rtf'];

  var FORMATS = {};
  function add(list) { list.forEach(function (f) { FORMATS[f.ext] = f; }); }

  /* ---------------- Documents ---------------- */
  add([
    fmt('txt',  'Plain Text',            'document', K.TEXT,  { raw: true, convert: ['html','pdf','md','rtf'] }),
    fmt('md',   'Markdown',              'document', K.TEXT,  { raw: true, convert: ['html','pdf','txt'] }),
    fmt('rtf',  'Rich Text Format',      'document', K.TEXT,  { raw: true, convert: ['txt','html','pdf'] }),
    fmt('docx', 'Word Document',         'document', K.TEXT,  { editable: false, convert: ['txt','html','pdf'],
          note: 'Full fidelity Word editing needs a server/lib; text + structure is extracted and editable.' }),
    fmt('doc',  'Word (legacy binary)',  'document', K.TEXT,  { editable: false, convert: ['txt','pdf'] }),
    fmt('odt',  'OpenDocument Text',     'document', K.TEXT,  { editable: false, convert: ['txt','html','pdf'] }),
    fmt('wps',  'WPS Office Word',       'document', K.TEXT,  { editable: false, convert: ['txt','pdf'] }),
    fmt('wpd',  'WordPerfect Document',  'document', K.TEXT,  { editable: false, convert: ['txt','pdf'] }),
    fmt('csv',  'Comma-Separated Values','document', K.SHEET, { convert: ['xlsx','txt','html','json'] }),
    fmt('tsv',  'Tab-Separated Values',  'document', K.SHEET, { convert: ['csv','xlsx','json'] }),
    fmt('xlsx', 'Excel Workbook',        'document', K.SHEET, { convert: ['csv','txt','html','json'] }),
    fmt('xls',  'Excel (legacy)',        'document', K.SHEET, { convert: ['csv','xlsx'] }),
    fmt('ods',  'OpenDocument Sheet',    'document', K.SHEET, { convert: ['csv','xlsx'] }),
    fmt('msg',  'Outlook Message',       'document', K.BINARY,{ editable: false, note: 'Read-only preview; text extraction where possible.' }),
    fmt('pdf',  'Portable Document',     'document', K.PDF,   { editable: false, convert: ['txt','png','jpg','html'],
          note: 'View + extract text + merge/split. Page-level PDF editing is on the roadmap.' }),
    fmt('pptx', 'PowerPoint Presentation','document', K.BINARY, { editable: false, convert: ['pdf','png'],
          note: 'Slide viewer + notes extraction. Full PPT authoring is on the roadmap.' }),
    fmt('ppt',  'PowerPoint (legacy)',   'document', K.BINARY,{ editable: false, convert: ['pdf'] }),
    fmt('odp',  'OpenDocument Presentation','document', K.BINARY,{ editable: false, convert: ['pdf'] })
  ]);

  /* ---------------- Images ---------------- */
  add([
    fmt('jpg',  'JPEG Image',   'image', K.IMAGE, { convert: IMG_TARGETS.concat(['pdf']) }),
    fmt('jpeg', 'JPEG Image',   'image', K.IMAGE, { convert: IMG_TARGETS.concat(['pdf']) }),
    fmt('png',  'PNG Image',    'image', K.IMAGE, { convert: IMG_TARGETS.concat(['pdf']) }),
    fmt('webp', 'WebP Image',   'image', K.IMAGE, { convert: IMG_TARGETS.concat(['pdf']) }),
    fmt('gif',  'GIF Image',    'image', K.IMAGE, { convert: ['png','jpg','webp','pdf'] }),
    fmt('tif',  'TIFF Image',   'image', K.IMAGE, { convert: IMG_TARGETS.concat(['pdf']) }),
    fmt('tiff', 'TIFF Image',   'image', K.IMAGE, { convert: IMG_TARGETS.concat(['pdf']) }),
    fmt('bmp',  'Bitmap Image', 'image', K.IMAGE, { convert: IMG_TARGETS.concat(['pdf']) }),
    fmt('ico',  'Icon',         'image', K.IMAGE, { convert: ['png','jpg'] }),
    fmt('svg',  'Scalable Vector Graphic', 'image', K.TEXT, { raw: true, convert: ['png','jpg','html'] }),
    fmt('heic', 'HEIC Image',   'image', K.IMAGE, { editable: false, convert: ['jpg','png'], note: 'Browser decode varies; falls back to convert.' }),
    fmt('avif', 'AVIF Image',   'image', K.IMAGE, { convert: IMG_TARGETS.concat(['pdf']) }),
    fmt('eps',  'Encapsulated PostScript', 'design', K.BINARY, { editable: false, convert: ['png','pdf'] })
  ]);

  /* ---------------- Audio ---------------- */
  add([
    fmt('mp3',  'MP3 Audio',        'audio', K.MEDIA_A, { editable: false, convert: ['wav','ogg'] }),
    fmt('wav',  'WAVE Audio',       'audio', K.MEDIA_A, { editable: false, convert: ['mp3','ogg'] }),
    fmt('ogg',  'Ogg Audio',        'audio', K.MEDIA_A, { editable: false, convert: ['wav','mp3'] }),
    fmt('aac',  'AAC Audio',        'audio', K.MEDIA_A, { editable: false, convert: ['mp3','wav'] }),
    fmt('wma',  'Windows Media Audio','audio', K.MEDIA_A, { editable: false, convert: ['mp3','wav'] }),
    fmt('flac', 'FLAC Audio',       'audio', K.MEDIA_A, { editable: false, convert: ['wav','mp3'] }),
    fmt('m4a',  'MPEG-4 Audio',     'audio', K.MEDIA_A, { editable: false, convert: ['mp3','wav'] }),
    fmt('snd',  'Sound',            'audio', K.MEDIA_A, { editable: false }),
    fmt('ra',   'RealAudio',        'audio', K.MEDIA_A, { editable: false }),
    fmt('au',   'Sun Audio',        'audio', K.MEDIA_A, { editable: false })
  ]);

  /* ---------------- Video ---------------- */
  add([
    fmt('mp4',  'MPEG-4 Video',     'video', K.MEDIA_V, { editable: false, convert: ['webm'] }),
    fmt('webm', 'WebM Video',       'video', K.MEDIA_V, { editable: false, convert: ['mp4'] }),
    fmt('mov',  'QuickTime Movie',  'video', K.MEDIA_V, { editable: false, convert: ['mp4'] }),
    fmt('avi',  'Audio Video Interleave','video', K.MEDIA_V, { editable: false, convert: ['mp4'] }),
    fmt('mkv',  'Matroska Video',   'video', K.MEDIA_V, { editable: false, convert: ['mp4'] }),
    fmt('wmv',  'Windows Media Video','video', K.MEDIA_V, { editable: false, convert: ['mp4'] }),
    fmt('mpg',  'MPEG Video',       'video', K.MEDIA_V, { editable: false, convert: ['mp4'] }),
    fmt('mpeg', 'MPEG Video',       'video', K.MEDIA_V, { editable: false, convert: ['mp4'] }),
    fmt('3gp',  '3GPP Multimedia',  'video', K.MEDIA_V, { editable: false, convert: ['mp4'] })
  ]);

  /* ---------------- Code & scripts ---------------- */
  function code(ext, label) {
    return fmt(ext, label, 'code', K.TEXT, { raw: true, convert: ['txt','html'] });
  }
  add([
    code('c', 'C Source'), code('h', 'C Header'), code('cpp', 'C++ Source'),
    code('cs', 'C# Source'), code('java', 'Java Source'), code('py', 'Python Script'),
    code('js', 'JavaScript'), code('mjs', 'JavaScript Module'), code('ts', 'TypeScript'),
    code('jsx', 'React JSX'), code('tsx', 'React TSX'), code('swift', 'Swift Source'),
    code('kt', 'Kotlin Source'), code('go', 'Go Source'), code('rs', 'Rust Source'),
    code('rb', 'Ruby Script'), code('php', 'PHP Script'), code('pl', 'Perl Script'),
    code('lua', 'Lua Script'), code('r', 'R Script'), code('m', 'Objective-C / MATLAB'),
    code('dart', 'Dart Source'), code('scala', 'Scala Source'), code('sql', 'SQL'),
    code('sh', 'Shell Script'), code('bash', 'Bash Script'), code('zsh', 'Zsh Script'),
    code('bat', 'Windows Batch'), code('cmd', 'Windows Command'),
    code('ps1', 'PowerShell'), code('pl', 'Perl Script'), code('dta', 'Stata Data'),
    code('json', 'JSON'), code('xml', 'XML'), code('yaml', 'YAML'), code('yml', 'YAML'),
    code('toml', 'TOML'), code('ini', 'INI Config'), code('cfg', 'Config'),
    code('conf', 'Config'), code('env', 'Env File'), code('log', 'Log File'),
    code('tex', 'LaTeX'), code('rss', 'RSS Feed'), code('srt', 'Subtitle'), code('vtt', 'WebVTT')
  ]);

  /* ---------------- Archives ---------------- */
  add([
    fmt('zip',  'ZIP Archive',      'archive', K.ARCHIVE, { convert: ['tar','gz'] }),
    fmt('tar',  'Tarball',          'archive', K.ARCHIVE, { convert: ['zip','gz'] }),
    fmt('gz',   'GZIP Compressed',  'archive', K.ARCHIVE, { convert: ['zip'] }),
    fmt('7z',   '7-Zip Archive',    'archive', K.BINARY,  { editable: false, convert: ['zip'], note: 'Extract/repack where supported; else convert.' }),
    fmt('rar',  'WinRAR Archive',   'archive', K.BINARY,  { editable: false, convert: ['zip'], note: 'RAR is proprietary; extraction support is limited in-browser.' }),
    fmt('arj',  'ARJ Archive',      'archive', K.BINARY,  { editable: false }),
    fmt('arc',  'ARC Archive',      'archive', K.BINARY,  { editable: false }),
    fmt('sit',  'StuffIt Archive',  'archive', K.BINARY,  { editable: false }),
    fmt('hqx',  'BinHex',           'archive', K.BINARY,  { editable: false }),
    fmt('z',    'Compress (.Z)',    'archive', K.BINARY,  { editable: false })
  ]);

  /* ---------------- Web ---------------- */
  add([
    fmt('html', 'HTML Page',        'web', K.HTML, { convert: ['txt','pdf','md'] }),
    fmt('htm',  'HTML Page',        'web', K.HTML, { convert: ['txt','pdf','md'] }),
    fmt('xhtml','XHTML Page',       'web', K.HTML, { convert: ['html','pdf'] }),
    fmt('css',  'Cascading Style Sheet','web', K.TEXT, { raw: true, convert: ['txt'] }),
    fmt('asp',  'Active Server Page','web', K.TEXT, { raw: true }),
    fmt('aspx', 'ASP.NET Page',     'web', K.TEXT, { raw: true })
  ]);

  /* ---------------- eBooks ---------------- */
  add([
    fmt('epub', 'EPUB eBook',       'ebook', K.EBOOK, { convert: ['pdf','txt','html'] }),
    fmt('mobi', 'Mobipocket eBook', 'ebook', K.BINARY,{ editable: false, convert: ['epub','pdf','txt'] }),
    fmt('azw',  'Kindle eBook',     'ebook', K.BINARY,{ editable: false, convert: ['epub','txt'] }),
    fmt('azw3', 'Kindle eBook',     'ebook', K.BINARY,{ editable: false, convert: ['epub','txt'] }),
    fmt('fb2',  'FictionBook',      'ebook', K.TEXT,  { raw: true, convert: ['epub','txt'] })
  ]);

  /* ---------------- Design / RAW ---------------- */
  add([
    fmt('psd',  'Photoshop Document','design', K.IMAGE, { editable: false, convert: ['png','jpg','pdf'],
          note: 'Layered PSD preview (composite) + flatten/export. Layer-level editing is on the roadmap.' }),
    fmt('ai',   'Illustrator Artwork','design', K.BINARY, { editable: false, convert: ['png','pdf'] }),
    fmt('raw',  'Camera RAW',       'design', K.IMAGE, { editable: false, convert: ['jpg','png','tif'],
          note: 'RAW decode is best-effort; embedded JPEG preview is used when present.' }),
    fmt('cr2',  'Canon RAW',        'design', K.IMAGE, { editable: false, convert: ['jpg','png','tif'] }),
    fmt('nef',  'Nikon RAW',        'design', K.IMAGE, { editable: false, convert: ['jpg','png','tif'] }),
    fmt('arw',  'Sony RAW',         'design', K.IMAGE, { editable: false, convert: ['jpg','png','tif'] }),
    fmt('dng',  'Digital Negative', 'design', K.IMAGE, { editable: false, convert: ['jpg','png','tif'] })
  ]);

  /* ---------------- Helpers ---------------- */
  function normalizeExt(nameOrExt) {
    if (!nameOrExt) return '';
    var s = String(nameOrExt).toLowerCase();
    var dot = s.lastIndexOf('.');
    if (dot >= 0) s = s.slice(dot + 1);
    return s.trim();
  }

  function extInfo(nameOrExt) {
    var ext = normalizeExt(nameOrExt);
    if (FORMATS[ext]) return FORMATS[ext];
    return {
      ext: ext || 'bin', label: ext ? ext.toUpperCase() + ' File' : 'Unknown File',
      category: 'other', kind: K.BINARY, editable: false, raw: false,
      convert: ['txt', 'png', 'zip'], note: 'Unrecognized type — shown as a hex preview.'
    };
  }

  function allExtensions() { return Object.keys(FORMATS).sort(); }

  function byCategory() {
    var out = {};
    CATEGORIES.forEach(function (c) { out[c.id] = []; });
    Object.keys(FORMATS).forEach(function (e) {
      var f = FORMATS[e];
      (out[f.category] || out.other).push(f);
    });
    return out;
  }

  // What a given type can be converted into (falls back to a safe default set).
  function convertTargets(nameOrExt) {
    var info = extInfo(nameOrExt);
    return (info.convert && info.convert.length) ? info.convert.slice()
      : ['txt', 'png', 'pdf', 'zip'];
  }

  DV.registry = {
    K: K, CATEGORIES: CATEGORIES, FORMATS: FORMATS,
    extInfo: extInfo, normalizeExt: normalizeExt,
    allExtensions: allExtensions, byCategory: byCategory,
    convertTargets: convertTargets
  };
})(window.DV = window.DV || {});
