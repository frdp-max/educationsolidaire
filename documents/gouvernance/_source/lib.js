// Mini-DSL de génération des documents de gouvernance UNISSON (docx-js).
const fs = require('fs');
const path = require('path');
const JSZip = require('jszip');
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, ShadingType,
  AlignmentType, BorderStyle, Header, Footer, PageNumber, LevelFormat, PageBreak, ImageRun,
  TabStopType, HeadingLevel, VerticalAlign,
} = require('docx');

const C = { ink: '2A0E45', violet: '6D28D9', lav: 'EDE4FB', lav2: 'F7F3FD', warm: 'F4A259', red: 'D92D20', muted: '574A66', line: 'D9CCEF' };
const FONT = 'Arial';
const W = 9638; // largeur utile A4 (marges 2 cm) en DXA

const ORG = 'UNISSON — Association Éducation Solidaire · loi 1901 · 45, rue Henri Barbusse, 92230 Gennevilliers · SIREN 108 606 260 · RNA W922023505';

// Texte enrichi minimal : **gras**, __souligné à remplir__ n'existe pas ; on garde **…** et _…_ (italique).
function runs(text, base = {}) {
  const out = [];
  const re = /(\*\*[^*]+\*\*)/g;
  let last = 0, m;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(new TextRun({ text: text.slice(last, m.index), ...base }));
    const t = m[0];
    out.push(new TextRun({ text: t.slice(2, -2), bold: true, ...base }));
    last = m.index + t.length;
  }
  if (last < text.length) out.push(new TextRun({ text: text.slice(last), ...base }));
  return out;
}

const border = (color = C.line, size = 4) => ({ style: BorderStyle.SINGLE, size, color });
const cellBorders = { top: border(), bottom: border(), left: border(), right: border() };

function cell(content, width, opts = {}) {
  const paras = (Array.isArray(content) ? content : [content]).map((t) =>
    t instanceof Paragraph ? t : new Paragraph({ spacing: { before: 40, after: 40 }, children: runs(String(t), opts.run || { size: 18 }) }));
  return new TableCell({
    width: { size: width, type: WidthType.DXA }, borders: cellBorders,
    shading: opts.fill ? { fill: opts.fill, type: ShadingType.CLEAR, color: 'auto' } : undefined,
    margins: { top: 60, bottom: 60, left: 100, right: 100 }, verticalAlign: opts.vAlign || VerticalAlign.TOP,
    columnSpan: opts.span, children: paras,
  });
}

function table(headers, rows, widths) {
  const total = widths.reduce((a, b) => a + b, 0);
  const trs = [];
  if (headers) trs.push(new TableRow({ tableHeader: true, children: headers.map((h, i) => cell(h, widths[i], { fill: C.ink, run: { size: 17, bold: true, color: 'FFFFFF' } })) }));
  rows.forEach((r, ri) => trs.push(new TableRow({ cantSplit: true, children: r.map((v, i) => cell(v, widths[i], { fill: ri % 2 ? C.lav2 : undefined })) })));
  return new Table({ width: { size: total, type: WidthType.DXA }, columnWidths: widths, rows: trs });
}

// Bloc encadré (note, avertissement)
function box(text, kind = 'note') {
  const fill = kind === 'alert' ? 'FEF3F2' : kind === 'warm' ? 'FFF4EA' : C.lav2;
  const bar = kind === 'alert' ? C.red : kind === 'warm' ? C.warm : C.violet;
  const paras = (Array.isArray(text) ? text : [text]).map((t) => new Paragraph({ spacing: { before: 40, after: 40 }, children: runs(t, { size: 18 }) }));
  return new Table({
    width: { size: W, type: WidthType.DXA }, columnWidths: [W],
    rows: [new TableRow({ children: [new TableCell({
      width: { size: W, type: WidthType.DXA }, shading: { fill, type: ShadingType.CLEAR, color: 'auto' },
      borders: { top: border(fill), bottom: border(fill), right: border(fill), left: { style: BorderStyle.SINGLE, size: 24, color: bar } },
      margins: { top: 100, bottom: 100, left: 180, right: 140 }, children: paras,
    })] })],
  });
}

// Lignes à remplir : [ [libellé, largeur relative] ... ] → « Libellé : ______ »
function fields(list) {
  return list.map((f) => new Paragraph({
    spacing: { before: 60, after: 60 },
    tabStops: [{ type: TabStopType.RIGHT, position: W, leader: 'underscore' }],
    children: [new TextRun({ text: f + ' : ', size: 19 }), new TextRun({ text: '\t', size: 19 })],
  }));
}

function checks(list) {
  return list.map((t) => new Paragraph({ spacing: { before: 30, after: 30 }, indent: { left: 200 }, children: [new TextRun({ text: '☐  ', size: 20, color: C.violet }), ...runs(t, { size: 19 })] }));
}

function signatures(names) {
  const w = Math.floor(W / names.length);
  const widths = names.map(() => w);
  return new Table({
    width: { size: w * names.length, type: WidthType.DXA }, columnWidths: widths,
    rows: [new TableRow({ cantSplit: true, children: names.map((n) => new TableCell({
      width: { size: w, type: WidthType.DXA }, borders: { top: border('FFFFFF'), bottom: border('FFFFFF'), left: border('FFFFFF'), right: border('FFFFFF') },
      margins: { left: 80, right: 80 },
      children: [
        new Paragraph({ spacing: { before: 120 }, children: runs(n, { size: 18, bold: true }) }),
        new Paragraph({ children: [new TextRun({ text: 'Date et signature', size: 16, color: C.muted })] }),
        new Paragraph({ spacing: { before: 700 }, border: { bottom: border(C.muted, 6) }, children: [] }),
      ],
    })) })],
  });
}

// Conversion des blocs du DSL en éléments docx
function render(blocks, numbering) {
  const out = [];
  for (const b of blocks) {
    const [k, a, c, d] = b;
    switch (k) {
      case 'h1': out.push(new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(a)] })); break;
      case 'h2': out.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(a)] })); break;
      case 'h3': out.push(new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun(a)] })); break;
      case 'p': out.push(new Paragraph({ spacing: { after: 100 }, alignment: AlignmentType.JUSTIFIED, children: runs(a) })); break;
      case 'small': out.push(new Paragraph({ spacing: { after: 80 }, children: runs(a, { size: 16, color: C.muted }) })); break;
      case 'center': out.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 80 }, children: runs(a, { bold: true, size: 20 }) })); break;
      case 'ul': a.forEach((t) => out.push(new Paragraph({ numbering: { reference: 'bul', level: 0 }, spacing: { after: 50 }, children: runs(t) }))); break;
      case 'ol': {
        const ref = 'num' + numbering.n++;
        numbering.list.push(ref);
        a.forEach((t) => out.push(new Paragraph({ numbering: { reference: ref, level: 0 }, spacing: { after: 50 }, children: runs(t) })));
        break;
      }
      case 'table': out.push(table(a, c, d)); out.push(new Paragraph({ spacing: { after: 60 }, children: [] })); break;
      case 'box': out.push(box(a, c)); out.push(new Paragraph({ spacing: { after: 60 }, children: [] })); break;
      case 'fields': out.push(...fields(a)); break;
      case 'checks': out.push(...checks(a)); break;
      case 'sign': out.push(signatures(a)); break;
      case 'lines': for (let i = 0; i < a; i++) out.push(new Paragraph({ spacing: { before: 200 }, border: { bottom: border(C.line, 4) }, children: [] })); break;
      case 'space': out.push(new Paragraph({ spacing: { after: a || 200 }, children: [] })); break;
      case 'break': out.push(new Paragraph({ children: [new PageBreak()] })); break;
      default: throw new Error('bloc inconnu ' + k);
    }
  }
  return out;
}

const LOGO = fs.readFileSync(fs.existsSync(path.join(__dirname, 'logo-symbole.png')) ? path.join(__dirname, 'logo-symbole.png') : path.join(__dirname, '..', '..', 'logo-symbole.png'));

function titleBlock(doc) {
  return [
    new Paragraph({ spacing: { after: 0 }, children: [
      new ImageRun({ type: 'png', data: LOGO, transformation: { width: 46, height: 46 } }),
      new TextRun({ text: '   UNISSON', bold: true, size: 30, color: C.ink, font: FONT }),
      new TextRun({ text: '   ASSOCIATION ÉDUCATION SOLIDAIRE', bold: true, size: 15, color: C.violet, characterSpacing: 20 }),
    ] }),
    new Paragraph({ spacing: { before: 240, after: 40 }, children: [new TextRun({ text: doc.kicker.toUpperCase(), bold: true, size: 16, color: C.violet, characterSpacing: 30 })] }),
    new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: doc.title, bold: true, size: 40, color: C.ink })] }),
    new Paragraph({ spacing: { after: 200 }, border: { bottom: { style: BorderStyle.SINGLE, size: 18, color: C.warm, space: 6 } },
      children: [new TextRun({ text: doc.meta, size: 17, color: C.muted })] }),
  ];
}

async function build(doc, outDir) {
  const numbering = { n: 0, list: [] };
  const body = render(doc.blocks, numbering);
  const config = [{ reference: 'bul', levels: [{ level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 400, hanging: 240 } } } }] }];
  numbering.list.forEach((ref) => config.push({ reference: ref, levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 420, hanging: 300 } } } }] }));
  const d = new Document({
    creator: 'UNISSON — Association Éducation Solidaire', title: doc.title, description: doc.meta,
    styles: {
      default: { document: { run: { font: FONT, size: 20, color: '1E112A' }, paragraph: { spacing: { line: 276 } } } },
      paragraphStyles: [
        { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 28, bold: true, color: C.ink, font: FONT }, paragraph: { spacing: { before: 320, after: 120 }, keepNext: true, outlineLevel: 0 } },
        { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 23, bold: true, color: C.violet, font: FONT }, paragraph: { spacing: { before: 240, after: 80 }, keepNext: true, outlineLevel: 1 } },
        { id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 20, bold: true, color: C.ink, font: FONT }, paragraph: { spacing: { before: 160, after: 60 }, keepNext: true, outlineLevel: 2 } },
      ],
    },
    numbering: { config },
    sections: [{
      properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1134, bottom: 1134, left: 1134, right: 1134 } } },
      headers: { default: new Header({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: `${doc.code} · ${doc.title}`, size: 14, color: C.muted })] })] }) },
      footers: { default: new Footer({ children: [new Paragraph({
        border: { top: { style: BorderStyle.SINGLE, size: 4, color: C.line, space: 4 } },
        tabStops: [{ type: TabStopType.RIGHT, position: W }],
        children: [new TextRun({ text: ORG, size: 13, color: C.muted }), new TextRun({ children: ['\tp. ', PageNumber.CURRENT, ' / ', PageNumber.TOTAL_PAGES], size: 13, color: C.muted })],
      })] }) },
      children: [...titleBlock(doc), ...body],
    }],
  });
  const file = path.join(outDir, `${doc.code}_${doc.file}.docx`);
  // docx-js ajoute un redémarrage forcé (startOverride) à chaque liste, que Word
  // applique parfois de travers après un saut de page : on le retire.
  const zip = await JSZip.loadAsync(await Packer.toBuffer(d));
  const num = await zip.file('word/numbering.xml').async('string');
  zip.file('word/numbering.xml', num.replace(/<w:lvlOverride w:ilvl="0"><w:startOverride w:val="1"\/><\/w:lvlOverride>/g, ''));
  fs.writeFileSync(file, await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' }));
  return file;
}

module.exports = { build, C };
