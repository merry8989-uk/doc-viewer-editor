/* =============================================================
 * registry.js — the format catalog.
 * Broad coverage of DOCUMENT-oriented formats (documents, sheets,
 * presentations, ebooks, web, data, code, design). Audio/video are
 * kept for viewing only. One entry per extension.
 * ============================================================= */
(function (DV) {
  'use strict';

  var K = {
    TEXT: 'text', SHEET: 'sheet', HTML: 'html', IMAGE: 'image',
    PDF: 'pdf', SLIDES: 'slides', MEDIA_A: 'audio', MEDIA_V: 'video',
    ARCHIVE: 'archive', EBOOK: 'ebook', BINARY: 'binary'
  };

  var CATEGORIES = [
    { id: 'document',     label: 'Documents' },
    { id: 'sheet',        label: 'Spreadsheets' },
    { id: 'presentation', label: 'Presentations' },
    { id: 'ebook',        label: 'eBooks & Comics' },
    { id: 'web',          label: 'Web' },
    { id: 'data',         label: 'Data & Structured' },
    { id: 'code',         label: 'Code & Scripts' },
    { id: 'image',        label: 'Images' },
    { id: 'design',       label: 'Design / RAW' },
    { id: 'archive',      label: 'Archives' },
    { id: 'audio',        label: 'Audio (view only)' },
    { id: 'video',        label: 'Video (view only)' },
    { id: 'other',        label: 'Other' }
  ];

  function fmt(ext, label, category, kind, opts) {
    opts = opts || {};
    return {
      ext: ext, label: label, category: category, kind: kind,
      editable: opts.editable !== false,
      raw: !!opts.raw,
      convert: opts.convert || [],
      note: opts.note || ''
    };
  }

  var FORMATS = {};
  function add(list) { list.forEach(function (f) { FORMATS[f.ext] = f; }); }

  var IMG_OUT = ['png', 'jpg', 'webp', 'bmp', 'gif', 'pdf'];
  var TXT_OUT = ['txt', 'html', 'pdf', 'md', 'docx'];
  var EXTRACT_NOTE = 'Structure/text is extracted into an editor (no server). Round-trip fidelity editing is on the roadmap.';

  /* ---------- helpers that cut repetition ---------- */
  function editText(ext, label, conv) { return fmt(ext, label, 'document', K.TEXT, { raw: true, convert: conv || TXT_OUT }); }
  function extractText(ext, label, conv, note) { return fmt(ext, label, 'document', K.TEXT, { editable: false, convert: conv || ['txt', 'html', 'pdf', 'docx'], note: note || EXTRACT_NOTE }); }
  function sheet(ext, label, conv) { return fmt(ext, label, 'sheet', K.SHEET, { convert: conv || ['csv', 'xlsx', 'json', 'html'] }); }
  function slides(ext, label, conv) { return fmt(ext, label, 'presentation', K.SLIDES, { convert: conv || ['pptx', 'pdf', 'png'] }); }
  function ebook(ext, label, conv) { return fmt(ext, label, 'ebook', K.EBOOK, { editable: false, convert: conv || ['txt', 'html', 'pdf', 'epub'] }); }
  function web(ext, label, kind, conv) { return fmt(ext, label, 'web', kind, { convert: conv || ['html', 'txt', 'pdf', 'docx'] }); }
  function data(ext, label, conv) { return fmt(ext, label, 'data', K.TEXT, { raw: true, convert: conv || ['csv', 'json', 'txt'] }); }
  function code(ext, label) { return fmt(ext, label, 'code', K.TEXT, { raw: true, convert: ['txt', 'html'] }); }
  function bin(ext, label, cat, note) { return fmt(ext, label, cat || 'document', K.BINARY, { editable: false, convert: ['txt', 'pdf'], note: note || 'Binary format — preview + best-effort extraction.' }); }

  /* ============ DOCUMENTS (plain text / editable) ============ */
  add([
    editText('txt', 'Plain Text'), editText('text', 'Plain Text'),
    editText('md', 'Markdown'), editText('markdown', 'Markdown'), editText('mdown', 'Markdown'),
    editText('mkd', 'Markdown'), editText('mdx', 'MDX'),
    editText('rst', 'reStructuredText'), editText('adoc', 'AsciiDoc'), editText('asciidoc', 'AsciiDoc'),
    editText('org', 'Org-mode'), editText('creole', 'Creole'),
    editText('tex', 'LaTeX'), editText('latex', 'LaTeX'), editText('ltx', 'LaTeX'), editText('bib', 'BibTeX'),
    editText('rtf', 'Rich Text Format'),
    editText('srt', 'SubRip Subtitle'), editText('vtt', 'WebVTT'), editText('ass', 'SubStation Subtitle'),
    editText('nfo', 'Info File'), editText('me', 'Readme'), editText('1st', 'Readme')
  ]);

  /* ============ DOCUMENTS (rich / extracted) ============ */
  add([
    extractText('docx', 'Word Document', ['txt', 'html', 'pdf', 'docx', 'md']),
    extractText('docm', 'Word Macro-Enabled', ['txt', 'html', 'pdf', 'docx']),
    extractText('dotx', 'Word Template', ['txt', 'docx']),
    extractText('dot', 'Word Template (legacy)', ['txt', 'docx']),
    extractText('doc', 'Word (legacy binary)', ['txt', 'pdf', 'docx']),
    extractText('odt', 'OpenDocument Text', ['txt', 'html', 'pdf', 'docx']),
    extractText('ott', 'OpenDocument Text Template', ['txt', 'docx']),
    extractText('uot', 'Uniform Office Text', ['txt', 'docx']),
    extractText('sxw', 'OpenOffice Writer', ['txt', 'docx']),
    extractText('sdw', 'StarOffice Writer', ['txt', 'docx']),
    extractText('wpd', 'WordPerfect Document', ['txt', 'pdf', 'docx']),
    extractText('wps', 'WPS Office Word', ['txt', 'pdf', 'docx']),
    extractText('abw', 'AbiWord Document', ['txt', 'html', 'docx']),
    extractText('zabw', 'AbiWord (compressed)', ['txt', 'docx']),
    extractText('pages', 'Apple Pages', ['txt', 'pdf', 'docx'], 'Apple Pages is a package; text is extracted where possible.'),
    extractText('fodt', 'Flat OpenDocument Text', ['txt', 'html', 'docx']),
    extractText('xps', 'XML Paper Specification', ['txt', 'pdf', 'png']),
    extractText('oxps', 'OpenXPS', ['txt', 'pdf', 'png']),
    extractText('djvu', 'DjVu Document', ['txt', 'pdf', 'png'], 'DjVu needs a decoder; preview/convert is best-effort.'),
    extractText('chm', 'Compiled HTML Help', ['txt', 'html', 'pdf'], 'CHM is a compiled archive; extraction is best-effort.'),
    extractText('hlp', 'Windows Help', ['txt']),
    bin('one', 'OneNote Notebook'), bin('onetoc2', 'OneNote TOC'),
    bin('vsd', 'Visio Drawing'), bin('vsdx', 'Visio Drawing'), bin('vss', 'Visio Stencil'), bin('vst', 'Visio Template'),
    bin('msg', 'Outlook Message'), bin('eml', 'Email Message'), bin('emlx', 'Apple Mail Message'),
    bin('mbox', 'Mailbox'), bin('vcf', 'vCard'), bin('ics', 'iCalendar'), bin('ifb', 'iCalendar')
  ]);

  /* ============ PDF ============ */
  add([
    fmt('pdf', 'Portable Document', 'document', K.PDF, { editable: false, convert: ['txt', 'png', 'jpg', 'html', 'docx'],
      note: 'View + full PDF Studio: rotate, delete, reorder, split, watermark, page numbers, pages to PNG, merge.' }),
    fmt('fdf', 'Forms Data Format', 'document', K.BINARY, { editable: false }),
    fmt('xfa', 'XFA Form', 'document', K.BINARY, { editable: false })
  ]);

  /* ============ SPREADSHEETS ============ */
  add([
    sheet('csv', 'Comma-Separated Values', ['xlsx', 'tsv', 'json', 'html', 'txt', 'pdf']),
    sheet('tsv', 'Tab-Separated Values', ['csv', 'xlsx', 'json', 'html']),
    sheet('tab', 'Tab-Delimited', ['csv', 'xlsx']),
    sheet('xlsx', 'Excel Workbook', ['csv', 'tsv', 'json', 'html', 'txt', 'pdf']),
    sheet('xlsm', 'Excel Macro-Enabled', ['csv', 'xlsx', 'json']),
    sheet('xlsb', 'Excel Binary Workbook', ['csv', 'xlsx']),
    sheet('xls', 'Excel (legacy)', ['csv', 'xlsx', 'json']),
    sheet('xltx', 'Excel Template', ['csv', 'xlsx']), sheet('xlt', 'Excel Template (legacy)', ['csv', 'xlsx']),
    sheet('ods', 'OpenDocument Spreadsheet', ['csv', 'xlsx']),
    sheet('ots', 'OpenDocument Sheet Template', ['csv', 'xlsx']),
    sheet('uos', 'Uniform Office Sheet', ['csv', 'xlsx']),
    sheet('numbers', 'Apple Numbers', ['csv', 'xlsx'], 'Apple Numbers is a package; import is best-effort.'),
    sheet('et', 'WPS Spreadsheet', ['csv', 'xlsx']), sheet('ett', 'WPS Spreadsheet Template', ['csv', 'xlsx']),
    sheet('123', 'Lotus 1-2-3', ['csv', 'xlsx']), sheet('wk1', 'Lotus Worksheet', ['csv']), sheet('wks', 'Works Spreadsheet', ['csv']),
    sheet('gnumeric', 'Gnumeric', ['csv', 'xlsx']), sheet('dif', 'Data Interchange Format', ['csv']), sheet('slk', 'SYLK', ['csv']),
    sheet('sxc', 'OpenOffice Calc', ['csv', 'xlsx'])
  ]);

  /* ============ PRESENTATIONS ============ */
  add([
    slides('pptx', 'PowerPoint Presentation'),
    slides('pptm', 'PowerPoint Macro-Enabled'),
    slides('ppsx', 'PowerPoint Show'), slides('pps', 'PowerPoint Show (legacy)'), slides('ppsm', 'PowerPoint Show (macro)'),
    slides('potx', 'PowerPoint Template'), slides('pot', 'PowerPoint Template (legacy)'), slides('potm', 'PowerPoint Template (macro)'),
    slides('ppt', 'PowerPoint (legacy)'),
    slides('odp', 'OpenDocument Presentation'),
    slides('otp', 'OpenDocument Presentation Template'),
    slides('uop', 'Uniform Office Presentation'),
    slides('sxi', 'OpenOffice Impress'), slides('sdd', 'StarOffice Impress'),
    slides('key', 'Apple Keynote'),
    slides('dps', 'WPS Presentation'), slides('dpt', 'WPS Presentation Template'),
    slides('show', 'Presentation Show')
  ]);

  /* ============ eBOOKS & COMICS ============ */
  add([
    ebook('epub', 'EPUB eBook', ['txt', 'html', 'pdf', 'docx']),
    ebook('mobi', 'Mobipocket eBook', ['txt', 'html', 'pdf', 'epub']),
    ebook('azw', 'Kindle eBook', ['txt', 'epub', 'pdf']),
    ebook('azw3', 'Kindle eBook', ['txt', 'epub', 'pdf']),
    ebook('kf8', 'Kindle Format 8', ['txt', 'epub']),
    ebook('fb2', 'FictionBook', ['txt', 'html', 'epub', 'pdf']),
    ebook('fbz', 'FictionBook (zipped)', ['txt', 'epub']),
    ebook('lit', 'Microsoft Reader', ['txt', 'epub'], 'LIT is legacy; extraction is best-effort.'),
    ebook('lrf', 'Sony BBeB', ['txt']), ebook('pdb', 'Palm Doc', ['txt']), ebook('prc', 'Mobipocket PRC', ['txt', 'epub']),
    ebook('rb', 'Rocket eBook', ['txt']), ebook('imp', 'eReader', ['txt']), ebook('oeb', 'Open eBook', ['txt', 'epub']),
    ebook('ibooks', 'Apple iBooks', ['txt', 'epub']), ebook('snb', 'Samsung eBook', ['txt']),
    ebook('cbz', 'Comic Book ZIP', ['pdf', 'png']),
    ebook('cbr', 'Comic Book RAR', ['pdf'], 'RAR comics need a RAR decoder; limited.'),
    ebook('cb7', 'Comic Book 7-Zip', ['pdf']), ebook('cbt', 'Comic Book TAR', ['pdf']), ebook('cba', 'Comic Book ACE', ['pdf'])
  ]);

  /* ============ WEB ============ */
  add([
    web('html', 'HTML Page', K.HTML), web('htm', 'HTML Page', K.HTML),
    web('xhtml', 'XHTML Page', K.HTML), web('shtml', 'Server-Parsed HTML', K.HTML),
    web('dhtml', 'Dynamic HTML', K.HTML), web('mhtml', 'MHTML Web Archive', K.HTML),
    web('mht', 'MHTML Web Archive', K.HTML),
    web('xml', 'XML', K.TEXT, ['json', 'txt', 'html']),
    web('xsl', 'XSL Stylesheet', K.TEXT, ['txt', 'html']),
    web('xslt', 'XSLT Stylesheet', K.TEXT, ['txt', 'html']),
    web('css', 'Cascading Style Sheet', K.TEXT, ['txt']),
    web('scss', 'Sass (SCSS)', K.TEXT, ['css', 'txt']),
    web('sass', 'Sass', K.TEXT, ['css', 'txt']),
    web('less', 'Less', K.TEXT, ['css', 'txt']),
    web('js', 'JavaScript', K.TEXT, ['txt']), web('mjs', 'JavaScript Module', K.TEXT, ['txt']),
    web('jsx', 'React JSX', K.TEXT, ['txt']), web('ts', 'TypeScript', K.TEXT, ['txt']), web('tsx', 'React TSX', K.TEXT, ['txt']),
    web('asp', 'Active Server Page', K.TEXT, ['txt']), web('aspx', 'ASP.NET Page', K.TEXT, ['txt']),
    web('php', 'PHP Script', K.TEXT, ['txt']), web('jsp', 'JavaServer Page', K.TEXT, ['txt']),
    web('jspx', 'JavaServer Page', K.TEXT, ['txt']), web('cgi', 'CGI Script', K.TEXT, ['txt']),
    web('cfm', 'ColdFusion Page', K.TEXT, ['txt']), web('rss', 'RSS Feed', K.TEXT, ['txt', 'html']),
    web('atom', 'Atom Feed', K.TEXT, ['txt', 'html']), web('rdf', 'RDF', K.TEXT, ['txt'])
  ]);

  /* ============ DATA & STRUCTURED ============ */
  add([
    data('json', 'JSON', ['csv', 'txt', 'yaml']), data('jsonl', 'JSON Lines', ['csv', 'txt']),
    data('ndjson', 'Newline JSON', ['csv', 'txt']), data('json5', 'JSON5', ['json', 'txt']),
    data('yaml', 'YAML', ['json', 'txt']), data('yml', 'YAML', ['json', 'txt']),
    data('toml', 'TOML', ['json', 'txt']), data('ini', 'INI Config', ['txt', 'json']),
    data('cfg', 'Config', ['txt']), data('conf', 'Config', ['txt']), data('env', 'Env File', ['txt']),
    data('properties', 'Java Properties', ['txt']), data('plist', 'Property List', ['xml', 'txt']),
    data('log', 'Log File', ['txt']), data('dat', 'Data File', ['txt']),
    data('sql', 'SQL', ['txt']), data('sqlite', 'SQLite Database', ['txt', 'csv']),
    data('db', 'Database', ['txt']), data('dbf', 'dBase Database', ['csv']),
    data('mdb', 'Access Database', ['csv'], ), data('accdb', 'Access Database', ['csv']),
    data('odb', 'OpenDocument Database', ['csv']),
    data('parquet', 'Apache Parquet', ['csv']), data('avro', 'Apache Avro', ['csv']),
    data('orc', 'Apache ORC', ['csv']), data('arrow', 'Arrow', ['csv']),
    data('ipynb', 'Jupyter Notebook', ['html', 'md', 'txt']),
    data('ttl', 'Turtle RDF', ['txt']), data('sparql', 'SPARQL', ['txt']),
    data('nc', 'NetCDF', ['csv']), data('hdf', 'HDF', ['csv']), data('hdf5', 'HDF5', ['csv']),
    data('gpx', 'GPS Exchange', ['txt']), data('kml', 'Keyhole Markup', ['txt']),
    data('vtt2', 'WebVTT', ['txt'])
  ]);

  /* ============ CODE & SCRIPTS ============ */
  add([
    code('c', 'C Source'), code('h', 'C Header'), code('cpp', 'C++ Source'), code('cc', 'C++ Source'),
    code('cxx', 'C++ Source'), code('hpp', 'C++ Header'), code('cs', 'C# Source'),
    code('java', 'Java Source'), code('kt', 'Kotlin Source'), code('kts', 'Kotlin Script'), code('scala', 'Scala Source'),
    code('py', 'Python Script'), code('pyw', 'Python Script'), code('rb', 'Ruby Script'), code('pl', 'Perl Script'),
    code('pm', 'Perl Module'), code('php2', 'PHP'), code('lua', 'Lua Script'), code('r', 'R Script'),
    code('m', 'Objective-C / MATLAB'), code('mm', 'Objective-C++'), code('swift', 'Swift Source'),
    code('go', 'Go Source'), code('rs', 'Rust Source'), code('dart', 'Dart Source'),
    code('groovy', 'Groovy'), code('clj', 'Clojure'), code('ex', 'Elixir'), code('exs', 'Elixir Script'),
    code('erl', 'Erlang'), code('hs', 'Haskell'), code('ml', 'OCaml'), code('fs', 'F#'),
    code('jl', 'Julia'), code('nim', 'Nim'), code('zig', 'Zig'), code('v', 'V Source'),
    code('asm', 'Assembly'), code('s', 'Assembly'), code('vb', 'Visual Basic'), code('pas', 'Pascal'),
    code('f', 'Fortran'), code('f90', 'Fortran'), code('cob', 'COBOL'), code('ada', 'Ada'), code('adb', 'Ada'),
    code('sh', 'Shell Script'), code('bash', 'Bash Script'), code('zsh', 'Zsh Script'), code('ksh', 'Korn Shell'),
    code('fish', 'Fish Shell'), code('bat', 'Windows Batch'), code('cmd', 'Windows Command'),
    code('ps1', 'PowerShell'), code('psm1', 'PowerShell Module'), code('vbs', 'VBScript'),
    code('awk', 'AWK Script'), code('sed', 'Sed Script'), code('tcl', 'Tcl Script'),
    code('dta', 'Stata Data'), code('do', 'Stata Do-file'), code('sas', 'SAS Program'), code('sps', 'SPSS Syntax'),
    code('makefile', 'Makefile'), code('mk', 'Makefile'), code('cmake', 'CMake'), code('gradle', 'Gradle'),
    code('dockerfile', 'Dockerfile'), code('tf', 'Terraform'), code('proto', 'Protocol Buffers'),
    code('graphql', 'GraphQL'), code('gql', 'GraphQL'), code('diff', 'Diff'), code('patch', 'Patch'),
    code('csv2', 'CSV'), code('reg', 'Windows Registry'), code('desktop', 'Desktop Entry')
  ]);

  /* ============ IMAGES ============ */
  add([
    fmt('jpg', 'JPEG Image', 'image', K.IMAGE, { convert: IMG_OUT }),
    fmt('jpeg', 'JPEG Image', 'image', K.IMAGE, { convert: IMG_OUT }),
    fmt('jpe', 'JPEG Image', 'image', K.IMAGE, { convert: IMG_OUT }),
    fmt('png', 'PNG Image', 'image', K.IMAGE, { convert: IMG_OUT }),
    fmt('apng', 'Animated PNG', 'image', K.IMAGE, { convert: IMG_OUT }),
    fmt('webp', 'WebP Image', 'image', K.IMAGE, { convert: IMG_OUT }),
    fmt('gif', 'GIF Image', 'image', K.IMAGE, { convert: ['png', 'jpg', 'webp', 'pdf'] }),
    fmt('tif', 'TIFF Image', 'image', K.IMAGE, { convert: IMG_OUT }),
    fmt('tiff', 'TIFF Image', 'image', K.IMAGE, { convert: IMG_OUT }),
    fmt('bmp', 'Bitmap Image', 'image', K.IMAGE, { convert: IMG_OUT }),
    fmt('ico', 'Icon', 'image', K.IMAGE, { convert: ['png', 'jpg'] }),
    fmt('cur', 'Cursor', 'image', K.IMAGE, { convert: ['png'] }),
    fmt('svg', 'Scalable Vector Graphic', 'image', K.TEXT, { raw: true, convert: ['png', 'jpg', 'html', 'pdf'] }),
    fmt('heic', 'HEIC Image', 'image', K.IMAGE, { editable: false, convert: ['jpg', 'png'], note: 'Browser decode varies; falls back to convert.' }),
    fmt('heif', 'HEIF Image', 'image', K.IMAGE, { editable: false, convert: ['jpg', 'png'] }),
    fmt('avif', 'AVIF Image', 'image', K.IMAGE, { convert: IMG_OUT }),
    fmt('jxl', 'JPEG XL', 'image', K.IMAGE, { editable: false, convert: ['png', 'jpg'] }),
    fmt('jfif', 'JPEG Image', 'image', K.IMAGE, { convert: IMG_OUT }),
    fmt('pbm', 'Portable Bitmap', 'image', K.IMAGE, { convert: ['png', 'jpg'] }),
    fmt('pgm', 'Portable Graymap', 'image', K.IMAGE, { convert: ['png', 'jpg'] }),
    fmt('ppm', 'Portable Pixmap', 'image', K.IMAGE, { convert: ['png', 'jpg'] }),
    fmt('pnm', 'Portable AnyMap', 'image', K.IMAGE, { convert: ['png', 'jpg'] }),
    fmt('tga', 'Truevision TGA', 'image', K.IMAGE, { convert: ['png', 'jpg'] }),
    fmt('dds', 'DirectDraw Surface', 'image', K.IMAGE, { editable: false, convert: ['png'] }),
    fmt('exr', 'OpenEXR', 'image', K.IMAGE, { editable: false, convert: ['png'] }),
    fmt('hdr', 'Radiance HDR', 'image', K.IMAGE, { editable: false, convert: ['png'] })
  ]);

  /* ============ DESIGN / RAW ============ */
  add([
    fmt('psd', 'Photoshop Document', 'design', K.IMAGE, { editable: false, convert: ['png', 'jpg', 'pdf'],
      note: 'Layered PSD composite preview + flatten/export. Layer-level editing is on the roadmap.' }),
    fmt('psb', 'Photoshop Large Document', 'design', K.IMAGE, { editable: false, convert: ['png', 'jpg'] }),
    fmt('ai', 'Illustrator Artwork', 'design', K.BINARY, { editable: false, convert: ['png', 'pdf'] }),
    fmt('indd', 'InDesign Document', 'design', K.BINARY, { editable: false, convert: ['pdf'] }),
    fmt('idml', 'InDesign Markup', 'design', K.BINARY, { editable: false, convert: ['pdf'] }),
    fmt('xcf', 'GIMP Project', 'design', K.IMAGE, { editable: false, convert: ['png', 'jpg'] }),
    fmt('sketch', 'Sketch Document', 'design', K.BINARY, { editable: false, convert: ['png', 'svg'] }),
    fmt('fig', 'Figma Document', 'design', K.BINARY, { editable: false, convert: ['png', 'svg'] }),
    fmt('cdr', 'CorelDRAW', 'design', K.BINARY, { editable: false, convert: ['png', 'pdf'] }),
    fmt('eps', 'Encapsulated PostScript', 'design', K.BINARY, { editable: false, convert: ['png', 'pdf'] }),
    fmt('ps', 'PostScript', 'design', K.BINARY, { editable: false, convert: ['pdf', 'png'] }),
    fmt('raw', 'Camera RAW', 'design', K.IMAGE, { editable: false, convert: ['jpg', 'png', 'tif'], note: 'RAW decode is best-effort; embedded JPEG preview is used when present.' }),
    fmt('cr2', 'Canon RAW', 'design', K.IMAGE, { editable: false, convert: ['jpg', 'png', 'tif'] }),
    fmt('cr3', 'Canon RAW', 'design', K.IMAGE, { editable: false, convert: ['jpg', 'png'] }),
    fmt('crw', 'Canon RAW', 'design', K.IMAGE, { editable: false, convert: ['jpg', 'png'] }),
    fmt('nef', 'Nikon RAW', 'design', K.IMAGE, { editable: false, convert: ['jpg', 'png', 'tif'] }),
    fmt('nrw', 'Nikon RAW', 'design', K.IMAGE, { editable: false, convert: ['jpg', 'png'] }),
    fmt('arw', 'Sony RAW', 'design', K.IMAGE, { editable: false, convert: ['jpg', 'png', 'tif'] }),
    fmt('srf', 'Sony RAW', 'design', K.IMAGE, { editable: false, convert: ['jpg', 'png'] }),
    fmt('orf', 'Olympus RAW', 'design', K.IMAGE, { editable: false, convert: ['jpg', 'png'] }),
    fmt('raf', 'Fujifilm RAW', 'design', K.IMAGE, { editable: false, convert: ['jpg', 'png'] }),
    fmt('rw2', 'Panasonic RAW', 'design', K.IMAGE, { editable: false, convert: ['jpg', 'png'] }),
    fmt('pef', 'Pentax RAW', 'design', K.IMAGE, { editable: false, convert: ['jpg', 'png'] }),
    fmt('dng', 'Digital Negative', 'design', K.IMAGE, { editable: false, convert: ['jpg', 'png', 'tif'] })
  ]);

  /* ============ ARCHIVES ============ */
  add([
    fmt('zip', 'ZIP Archive', 'archive', K.ARCHIVE, { convert: ['tar', 'gz'] }),
    fmt('tar', 'Tarball', 'archive', K.ARCHIVE, { convert: ['zip', 'gz'] }),
    fmt('gz', 'GZIP Compressed', 'archive', K.ARCHIVE, { convert: ['zip'] }),
    fmt('tgz', 'Gzipped Tarball', 'archive', K.ARCHIVE, { convert: ['zip'] }),
    fmt('bz2', 'Bzip2 Compressed', 'archive', K.ARCHIVE, { convert: ['zip'] }),
    fmt('xz', 'XZ Compressed', 'archive', K.ARCHIVE, { convert: ['zip'] }),
    fmt('7z', '7-Zip Archive', 'archive', K.BINARY, { editable: false, convert: ['zip'], note: 'Extract/repack where supported; else convert.' }),
    fmt('rar', 'WinRAR Archive', 'archive', K.BINARY, { editable: false, convert: ['zip'], note: 'RAR is proprietary; in-browser extraction is limited.' }),
    fmt('arj', 'ARJ Archive', 'archive', K.BINARY, { editable: false }),
    fmt('arc', 'ARC Archive', 'archive', K.BINARY, { editable: false }),
    fmt('sit', 'StuffIt Archive', 'archive', K.BINARY, { editable: false }),
    fmt('sitx', 'StuffIt X Archive', 'archive', K.BINARY, { editable: false }),
    fmt('hqx', 'BinHex', 'archive', K.BINARY, { editable: false }),
    fmt('z', 'Compress (.Z)', 'archive', K.BINARY, { editable: false }),
    fmt('lzh', 'LHA Archive', 'archive', K.BINARY, { editable: false }),
    fmt('cab', 'Cabinet', 'archive', K.BINARY, { editable: false }),
    fmt('iso', 'Disc Image', 'archive', K.BINARY, { editable: false }),
    fmt('dmg', 'Apple Disk Image', 'archive', K.BINARY, { editable: false })
  ]);

  /* ============ AUDIO (view only) ============ */
  add([
    fmt('mp3', 'MP3 Audio', 'audio', K.MEDIA_A, { editable: false }),
    fmt('wav', 'WAVE Audio', 'audio', K.MEDIA_A, { editable: false }),
    fmt('ogg', 'Ogg Audio', 'audio', K.MEDIA_A, { editable: false }),
    fmt('oga', 'Ogg Audio', 'audio', K.MEDIA_A, { editable: false }),
    fmt('aac', 'AAC Audio', 'audio', K.MEDIA_A, { editable: false }),
    fmt('wma', 'Windows Media Audio', 'audio', K.MEDIA_A, { editable: false }),
    fmt('flac', 'FLAC Audio', 'audio', K.MEDIA_A, { editable: false }),
    fmt('m4a', 'MPEG-4 Audio', 'audio', K.MEDIA_A, { editable: false }),
    fmt('opus', 'Opus Audio', 'audio', K.MEDIA_A, { editable: false }),
    fmt('aiff', 'AIFF Audio', 'audio', K.MEDIA_A, { editable: false }),
    fmt('aif', 'AIFF Audio', 'audio', K.MEDIA_A, { editable: false }),
    fmt('amr', 'AMR Audio', 'audio', K.MEDIA_A, { editable: false }),
    fmt('mid', 'MIDI', 'audio', K.MEDIA_A, { editable: false }),
    fmt('midi', 'MIDI', 'audio', K.MEDIA_A, { editable: false }),
    fmt('snd', 'Sound', 'audio', K.MEDIA_A, { editable: false }),
    fmt('ra', 'RealAudio', 'audio', K.MEDIA_A, { editable: false }),
    fmt('au', 'Sun Audio', 'audio', K.MEDIA_A, { editable: false })
  ]);

  /* ============ VIDEO (view only) ============ */
  add([
    fmt('mp4', 'MPEG-4 Video', 'video', K.MEDIA_V, { editable: false }),
    fmt('m4v', 'MPEG-4 Video', 'video', K.MEDIA_V, { editable: false }),
    fmt('webm', 'WebM Video', 'video', K.MEDIA_V, { editable: false }),
    fmt('mov', 'QuickTime Movie', 'video', K.MEDIA_V, { editable: false }),
    fmt('avi', 'Audio Video Interleave', 'video', K.MEDIA_V, { editable: false }),
    fmt('mkv', 'Matroska Video', 'video', K.MEDIA_V, { editable: false }),
    fmt('wmv', 'Windows Media Video', 'video', K.MEDIA_V, { editable: false }),
    fmt('flv', 'Flash Video', 'video', K.MEDIA_V, { editable: false }),
    fmt('mpg', 'MPEG Video', 'video', K.MEDIA_V, { editable: false }),
    fmt('mpeg', 'MPEG Video', 'video', K.MEDIA_V, { editable: false }),
    fmt('3gp', '3GPP Multimedia', 'video', K.MEDIA_V, { editable: false }),
    fmt('ogv', 'Ogg Video', 'video', K.MEDIA_V, { editable: false }),
    fmt('ts', 'MPEG Transport Stream', 'video', K.MEDIA_V, { editable: false }),
    fmt('vob', 'DVD Video Object', 'video', K.MEDIA_V, { editable: false })
  ]);

  /* ============ Helpers ============ */
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
      convert: ['txt', 'png', 'pdf', 'zip'], note: 'Unrecognized type — shown as a hex preview.'
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
  function convertTargets(nameOrExt) {
    var info = extInfo(nameOrExt);
    return (info.convert && info.convert.length) ? info.convert.slice() : ['txt', 'png', 'pdf', 'docx', 'zip'];
  }

  DV.registry = {
    K: K, CATEGORIES: CATEGORIES, FORMATS: FORMATS,
    extInfo: extInfo, normalizeExt: normalizeExt,
    allExtensions: allExtensions, byCategory: byCategory, convertTargets: convertTargets
  };
})(window.DV = window.DV || {});
