// 기획 마크다운 → Word(.docx) 변환기 (2026-09-18)
// 이 저장소의 기획 문서 구조(제목·표·목록·인용·굵게·구분선)에 맞춘 경량 변환기.
const fs = require('fs');
const path = require('path');
const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  AlignmentType,
} = require('docx');

const srcPath = process.argv[2];
const outPath = process.argv[3];
if (!srcPath || !outPath) {
  console.error('usage: node md-to-docx.js <in.md> <out.docx>');
  process.exit(1);
}

const md = fs.readFileSync(srcPath, 'utf8');
const lines = md.split(/\r?\n/);

// **굵게** 인라인 처리 → TextRun[]
function runs(text) {
  const out = [];
  const re = /\*\*([^*]+)\*\*/g;
  let last = 0;
  let m;
  while ((m = re.exec(text))) {
    if (m.index > last) {
      out.push(new TextRun({ text: text.slice(last, m.index), font: 'Malgun Gothic' }));
    }
    out.push(new TextRun({ text: m[1], bold: true, font: 'Malgun Gothic' }));
    last = re.lastIndex;
  }
  if (last < text.length) {
    out.push(new TextRun({ text: text.slice(last), font: 'Malgun Gothic' }));
  }
  return out.length ? out : [new TextRun({ text: '', font: 'Malgun Gothic' })];
}

const children = [];
let i = 0;

function flushTable(start) {
  const rows = [];
  let j = start;
  while (j < lines.length && lines[j].trim().startsWith('|')) {
    rows.push(lines[j]);
    j++;
  }
  const parsed = rows
    .map((r) => r.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim()))
    .filter((cells, idx) => !(idx === 1 && cells.every((c) => /^-+$/.test(c.replace(/:/g, '')))));
  const tableRows = parsed.map(
    (cells, idx) =>
      new TableRow({
        children: cells.map(
          (c) =>
            new TableCell({
              width: { size: Math.floor(100 / cells.length), type: WidthType.PERCENTAGE },
              children: [new Paragraph({ children: runs(c) })],
              shading: idx === 0 ? { fill: 'F1E7D4' } : undefined,
            }),
        ),
      }),
  );
  children.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: tableRows,
    }),
  );
  children.push(new Paragraph({ text: '' }));
  return j;
}

while (i < lines.length) {
  const line = lines[i];
  const t = line.trim();

  if (t === '') {
    i++;
    continue;
  }
  if (t.startsWith('|')) {
    i = flushTable(i);
    continue;
  }
  if (/^---+$/.test(t)) {
    children.push(
      new Paragraph({
        border: { bottom: { color: 'C9BE9E', style: BorderStyle.SINGLE, size: 6 } },
        spacing: { after: 120 },
      }),
    );
    i++;
    continue;
  }
  if (t.startsWith('# ')) {
    children.push(new Paragraph({ children: runs(t.slice(2)), heading: HeadingLevel.TITLE, spacing: { after: 160 } }));
    i++;
    continue;
  }
  if (t.startsWith('## ')) {
    children.push(new Paragraph({ children: runs(t.slice(3)), heading: HeadingLevel.HEADING_1, spacing: { before: 200, after: 100 } }));
    i++;
    continue;
  }
  if (t.startsWith('### ')) {
    children.push(new Paragraph({ children: runs(t.slice(4)), heading: HeadingLevel.HEADING_2, spacing: { before: 140, after: 80 } }));
    i++;
    continue;
  }
  if (t.startsWith('> ')) {
    children.push(
      new Paragraph({
        children: runs(t.slice(2)),
        indent: { left: 360 },
        border: { left: { color: 'E0B23A', style: BorderStyle.SINGLE, size: 18, space: 120 } },
        spacing: { after: 80 },
      }),
    );
    i++;
    continue;
  }
  const bullet = t.match(/^[-*]\s+(.*)/);
  if (bullet) {
    children.push(new Paragraph({ children: runs(bullet[1]), bullet: { level: 0 } }));
    i++;
    continue;
  }
  const num = t.match(/^(\d+)\.\s+(.*)/);
  if (num) {
    children.push(new Paragraph({ children: runs(num[2]), numbering: undefined, indent: { left: 360 }, spacing: { after: 40 } }));
    i++;
    continue;
  }
  children.push(new Paragraph({ children: runs(t), spacing: { after: 80 } }));
  i++;
}

const doc = new Document({
  styles: {
    default: {
      document: { run: { font: 'Malgun Gothic', size: 20 } },
    },
  },
  sections: [{ properties: {}, children }],
});

Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync(outPath, buf);
  console.log('WROTE ' + outPath + ' (' + buf.length + ' bytes)');
});
