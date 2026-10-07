# Supported formats

DocForge registers **123** file extensions. The table shows how each is handled in-app and what it can convert to.

Legend — **View/Edit**: `edit` = full in-app editing, `view` = read-only viewer, `extract` = text/structure pulled out into an editor, `convert` = view as-is then convert.

## Documents (18)

| Extension | Format | Viewer / editor | Mode | Converts to |
|---|---|---|---|---|
| `.txt` | Plain Text | text editor | edit | `.html` `.pdf` `.md` `.rtf` |
| `.md` | Markdown | text editor | edit | `.html` `.pdf` `.txt` |
| `.rtf` | Rich Text Format | text editor | edit | `.txt` `.html` `.pdf` |
| `.docx` | Word Document | text editor | extract | `.txt` `.html` `.pdf` |
| `.doc` | Word (legacy binary) | text editor | extract | `.txt` `.pdf` |
| `.odt` | OpenDocument Text | text editor | extract | `.txt` `.html` `.pdf` |
| `.wps` | WPS Office Word | text editor | extract | `.txt` `.pdf` |
| `.wpd` | WordPerfect Document | text editor | extract | `.txt` `.pdf` |
| `.csv` | Comma-Separated Values | spreadsheet grid | edit | `.xlsx` `.txt` `.html` `.json` |
| `.tsv` | Tab-Separated Values | spreadsheet grid | edit | `.csv` `.xlsx` `.json` |
| `.xlsx` | Excel Workbook | spreadsheet grid | edit | `.csv` `.txt` `.html` `.json` |
| `.xls` | Excel (legacy) | spreadsheet grid | edit | `.csv` `.xlsx` |
| `.ods` | OpenDocument Sheet | spreadsheet grid | edit | `.csv` `.xlsx` |
| `.msg` | Outlook Message | hex preview | view | — |
| `.pdf` | Portable Document | PDF viewer | view | `.txt` `.png` `.jpg` `.html` |
| `.pptx` | PowerPoint Presentation | hex preview | view | `.pdf` `.png` |
| `.ppt` | PowerPoint (legacy) | hex preview | view | `.pdf` |
| `.odp` | OpenDocument Presentation | hex preview | view | `.pdf` |

## Images (12)

| Extension | Format | Viewer / editor | Mode | Converts to |
|---|---|---|---|---|
| `.jpg` | JPEG Image | image canvas | edit | `.png` `.jpg` `.webp` `.bmp` `.gif` `.pdf` |
| `.jpeg` | JPEG Image | image canvas | edit | `.png` `.jpg` `.webp` `.bmp` `.gif` `.pdf` |
| `.png` | PNG Image | image canvas | edit | `.png` `.jpg` `.webp` `.bmp` `.gif` `.pdf` |
| `.webp` | WebP Image | image canvas | edit | `.png` `.jpg` `.webp` `.bmp` `.gif` `.pdf` |
| `.gif` | GIF Image | image canvas | edit | `.png` `.jpg` `.webp` `.pdf` |
| `.tif` | TIFF Image | image canvas | edit | `.png` `.jpg` `.webp` `.bmp` `.gif` `.pdf` |
| `.tiff` | TIFF Image | image canvas | edit | `.png` `.jpg` `.webp` `.bmp` `.gif` `.pdf` |
| `.bmp` | Bitmap Image | image canvas | edit | `.png` `.jpg` `.webp` `.bmp` `.gif` `.pdf` |
| `.ico` | Icon | image canvas | edit | `.png` `.jpg` |
| `.svg` | Scalable Vector Graphic | text editor | edit | `.png` `.jpg` `.html` |
| `.heic` | HEIC Image | image canvas | view | `.jpg` `.png` |
| `.avif` | AVIF Image | image canvas | edit | `.png` `.jpg` `.webp` `.bmp` `.gif` `.pdf` |

## Audio (10)

| Extension | Format | Viewer / editor | Mode | Converts to |
|---|---|---|---|---|
| `.mp3` | MP3 Audio | audio player | view | `.wav` `.ogg` |
| `.wav` | WAVE Audio | audio player | view | `.mp3` `.ogg` |
| `.ogg` | Ogg Audio | audio player | view | `.wav` `.mp3` |
| `.aac` | AAC Audio | audio player | view | `.mp3` `.wav` |
| `.wma` | Windows Media Audio | audio player | view | `.mp3` `.wav` |
| `.flac` | FLAC Audio | audio player | view | `.wav` `.mp3` |
| `.m4a` | MPEG-4 Audio | audio player | view | `.mp3` `.wav` |
| `.snd` | Sound | audio player | view | — |
| `.ra` | RealAudio | audio player | view | — |
| `.au` | Sun Audio | audio player | view | — |

## Video (9)

| Extension | Format | Viewer / editor | Mode | Converts to |
|---|---|---|---|---|
| `.mp4` | MPEG-4 Video | video player | view | `.webm` |
| `.webm` | WebM Video | video player | view | `.mp4` |
| `.mov` | QuickTime Movie | video player | view | `.mp4` |
| `.avi` | Audio Video Interleave | video player | view | `.mp4` |
| `.mkv` | Matroska Video | video player | view | `.mp4` |
| `.wmv` | Windows Media Video | video player | view | `.mp4` |
| `.mpg` | MPEG Video | video player | view | `.mp4` |
| `.mpeg` | MPEG Video | video player | view | `.mp4` |
| `.3gp` | 3GPP Multimedia | video player | view | `.mp4` |

## Code & Scripts (45)

| Extension | Format | Viewer / editor | Mode | Converts to |
|---|---|---|---|---|
| `.c` | C Source | text editor | edit | `.txt` `.html` |
| `.h` | C Header | text editor | edit | `.txt` `.html` |
| `.cpp` | C++ Source | text editor | edit | `.txt` `.html` |
| `.cs` | C# Source | text editor | edit | `.txt` `.html` |
| `.java` | Java Source | text editor | edit | `.txt` `.html` |
| `.py` | Python Script | text editor | edit | `.txt` `.html` |
| `.js` | JavaScript | text editor | edit | `.txt` `.html` |
| `.mjs` | JavaScript Module | text editor | edit | `.txt` `.html` |
| `.ts` | TypeScript | text editor | edit | `.txt` `.html` |
| `.jsx` | React JSX | text editor | edit | `.txt` `.html` |
| `.tsx` | React TSX | text editor | edit | `.txt` `.html` |
| `.swift` | Swift Source | text editor | edit | `.txt` `.html` |
| `.kt` | Kotlin Source | text editor | edit | `.txt` `.html` |
| `.go` | Go Source | text editor | edit | `.txt` `.html` |
| `.rs` | Rust Source | text editor | edit | `.txt` `.html` |
| `.rb` | Ruby Script | text editor | edit | `.txt` `.html` |
| `.php` | PHP Script | text editor | edit | `.txt` `.html` |
| `.pl` | Perl Script | text editor | edit | `.txt` `.html` |
| `.lua` | Lua Script | text editor | edit | `.txt` `.html` |
| `.r` | R Script | text editor | edit | `.txt` `.html` |
| `.m` | Objective-C / MATLAB | text editor | edit | `.txt` `.html` |
| `.dart` | Dart Source | text editor | edit | `.txt` `.html` |
| `.scala` | Scala Source | text editor | edit | `.txt` `.html` |
| `.sql` | SQL | text editor | edit | `.txt` `.html` |
| `.sh` | Shell Script | text editor | edit | `.txt` `.html` |
| `.bash` | Bash Script | text editor | edit | `.txt` `.html` |
| `.zsh` | Zsh Script | text editor | edit | `.txt` `.html` |
| `.bat` | Windows Batch | text editor | edit | `.txt` `.html` |
| `.cmd` | Windows Command | text editor | edit | `.txt` `.html` |
| `.ps1` | PowerShell | text editor | edit | `.txt` `.html` |
| `.dta` | Stata Data | text editor | edit | `.txt` `.html` |
| `.json` | JSON | text editor | edit | `.txt` `.html` |
| `.xml` | XML | text editor | edit | `.txt` `.html` |
| `.yaml` | YAML | text editor | edit | `.txt` `.html` |
| `.yml` | YAML | text editor | edit | `.txt` `.html` |
| `.toml` | TOML | text editor | edit | `.txt` `.html` |
| `.ini` | INI Config | text editor | edit | `.txt` `.html` |
| `.cfg` | Config | text editor | edit | `.txt` `.html` |
| `.conf` | Config | text editor | edit | `.txt` `.html` |
| `.env` | Env File | text editor | edit | `.txt` `.html` |
| `.log` | Log File | text editor | edit | `.txt` `.html` |
| `.tex` | LaTeX | text editor | edit | `.txt` `.html` |
| `.rss` | RSS Feed | text editor | edit | `.txt` `.html` |
| `.srt` | Subtitle | text editor | edit | `.txt` `.html` |
| `.vtt` | WebVTT | text editor | edit | `.txt` `.html` |

## Archives (10)

| Extension | Format | Viewer / editor | Mode | Converts to |
|---|---|---|---|---|
| `.zip` | ZIP Archive | archive browser | edit | `.tar` `.gz` |
| `.tar` | Tarball | archive browser | edit | `.zip` `.gz` |
| `.gz` | GZIP Compressed | archive browser | edit | `.zip` |
| `.7z` | 7-Zip Archive | hex preview | view | `.zip` |
| `.rar` | WinRAR Archive | hex preview | view | `.zip` |
| `.arj` | ARJ Archive | hex preview | view | — |
| `.arc` | ARC Archive | hex preview | view | — |
| `.sit` | StuffIt Archive | hex preview | view | — |
| `.hqx` | BinHex | hex preview | view | — |
| `.z` | Compress (.Z) | hex preview | view | — |

## Web (6)

| Extension | Format | Viewer / editor | Mode | Converts to |
|---|---|---|---|---|
| `.html` | HTML Page | HTML editor | edit | `.txt` `.pdf` `.md` |
| `.htm` | HTML Page | HTML editor | edit | `.txt` `.pdf` `.md` |
| `.xhtml` | XHTML Page | HTML editor | edit | `.html` `.pdf` |
| `.css` | Cascading Style Sheet | text editor | edit | `.txt` |
| `.asp` | Active Server Page | text editor | edit | — |
| `.aspx` | ASP.NET Page | text editor | edit | — |

## eBooks (5)

| Extension | Format | Viewer / editor | Mode | Converts to |
|---|---|---|---|---|
| `.epub` | EPUB eBook | ebook reader | edit | `.pdf` `.txt` `.html` |
| `.mobi` | Mobipocket eBook | hex preview | view | `.epub` `.pdf` `.txt` |
| `.azw` | Kindle eBook | hex preview | view | `.epub` `.txt` |
| `.azw3` | Kindle eBook | hex preview | view | `.epub` `.txt` |
| `.fb2` | FictionBook | text editor | edit | `.epub` `.txt` |

## Design / RAW (8)

| Extension | Format | Viewer / editor | Mode | Converts to |
|---|---|---|---|---|
| `.eps` | Encapsulated PostScript | hex preview | view | `.png` `.pdf` |
| `.psd` | Photoshop Document | image canvas | view | `.png` `.jpg` `.pdf` |
| `.ai` | Illustrator Artwork | hex preview | view | `.png` `.pdf` |
| `.raw` | Camera RAW | image canvas | view | `.jpg` `.png` `.tif` |
| `.cr2` | Canon RAW | image canvas | view | `.jpg` `.png` `.tif` |
| `.nef` | Nikon RAW | image canvas | view | `.jpg` `.png` `.tif` |
| `.arw` | Sony RAW | image canvas | view | `.jpg` `.png` `.tif` |
| `.dng` | Digital Negative | image canvas | view | `.jpg` `.png` `.tif` |

## Notes on partial support

- **PSD / AI / EPS / RAW** are previewed and flattened for export; deep layer/RAW editing is on the roadmap.
- **RAR / 7Z / ARJ / ARC / SIT / HQX / Z** are proprietary or legacy; in-browser extraction is limited.
- **Office formats** (docx/xlsx/pptx and friends) are read (text, structure, grid) but not round-trip editable yet.
- Unknown extensions fall back to a **hex preview** and the convert tools.
