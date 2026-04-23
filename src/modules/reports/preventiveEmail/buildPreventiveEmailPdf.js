import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

const PAGE_SIZE = [595.28, 841.89];
const PAGE_MARGIN = 34;
const HEADER_HEIGHT = 76;
const BORDER_COLOR = rgb(0.07, 0.1, 0.17);
const MUTED_COLOR = rgb(0.28, 0.33, 0.39);
const LIGHT_FILL = rgb(0.96, 0.97, 0.98);
const FONT_BODY = 10;
const FONT_LABEL = 8;
const FONT_SECTION = 11;

const normalizeText = (value = '') => String(value || '').replace(/\r/g, '').trim();
const normalizeKey = (value = '') => String(value || '').toLowerCase().replace(/[\s.]/g, '').trim();

const formatDate = (value = '') => {
  const text = String(value || '').trim();
  if (!text) return '';
  const iso = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[3]}/${iso[2]}/${iso[1]}`;
  const date = new Date(text);
  if (Number.isNaN(date.getTime())) return text;
  return date.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const dataUrlToBytes = (value) => {
  const match = String(value || '').match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return null;
  return { mimeType: match[1], bytes: Buffer.from(match[2], 'base64') };
};

const fetchImageBytes = async (src) => {
  const dataUrl = dataUrlToBytes(src);
  if (dataUrl) return dataUrl;
  if (!/^https?:\/\//i.test(String(src || ''))) return null;
  const response = await fetch(src);
  if (!response.ok) return null;
  return {
    mimeType: response.headers.get('content-type') || '',
    bytes: Buffer.from(await response.arrayBuffer()),
  };
};

const embedImage = async (pdfDoc, src) => {
  if (!src) return null;
  const imageData = await fetchImageBytes(src);
  if (!imageData?.bytes) return null;
  const mime = String(imageData.mimeType || '').toLowerCase();
  if (mime.includes('png') || /^data:image\/png/i.test(src)) return pdfDoc.embedPng(imageData.bytes);
  if (mime.includes('jpg') || mime.includes('jpeg') || /^data:image\/jpe?g/i.test(src)) return pdfDoc.embedJpg(imageData.bytes);
  return null;
};

const fitImage = (image, maxWidth, maxHeight) => {
  const ratio = Math.min(maxWidth / image.width, maxHeight / image.height, 1);
  return { width: image.width * ratio, height: image.height * ratio };
};

const drawImageCentered = (page, image, { x, y, width, height }) => {
  const size = fitImage(image, width, height);
  page.drawImage(image, { x: x + ((width - size.width) / 2), y: y + ((height - size.height) / 2), width: size.width, height: size.height });
};

const drawBox = (page, { x, y, width, height, fillColor = null, borderWidth = 1 }) => {
  page.drawRectangle({ x, y, width, height, borderWidth, borderColor: BORDER_COLOR, color: fillColor || undefined });
};

const fitFontSize = (text, font, maxWidth, preferredSize, minSize = 10) => {
  let size = preferredSize;
  while (size > minSize && font.widthOfTextAtSize(String(text || ''), size) > maxWidth) size -= 0.5;
  return size;
};

const wrapText = (text, font, size, maxWidth) => {
  const lines = [];
  const paragraphs = normalizeText(text).split('\n');
  paragraphs.forEach((paragraph, paragraphIndex) => {
    const words = paragraph.split(/\s+/).filter(Boolean);
    if (words.length === 0) {
      lines.push('');
      return;
    }
    let current = '';
    words.forEach((word) => {
      const candidate = current ? `${current} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, size) <= maxWidth || !current) current = candidate;
      else {
        lines.push(current);
        current = word;
      }
    });
    if (current) lines.push(current);
    if (paragraphIndex < paragraphs.length - 1) lines.push('');
  });
  return lines;
};

const drawWrappedText = (page, text, { x, y, font, size, maxWidth, lineHeight = 12, color = BORDER_COLOR, align = 'left' }) => {
  const lines = wrapText(text, font, size, maxWidth);
  let cursorY = y;
  lines.forEach((line) => {
    const width = font.widthOfTextAtSize(line, size);
    let drawX = x;
    if (align === 'center') drawX = x + Math.max((maxWidth - width) / 2, 0);
    if (align === 'right') drawX = x + Math.max(maxWidth - width, 0);
    page.drawText(line, { x: drawX, y: cursorY, font, size, color });
    cursorY -= lineHeight;
  });
  return { lines, cursorY };
};

const normalizeChecklistEntry = (value) => {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const estado = String(value.estado || '').trim();
    const criticidad = normalizeKey(value.criticidad) === 'critico' ? 'Critico' : 'No critico';
    return { criticidad, estado, falla: criticidad === 'Critico' && estado === 'No' ? Boolean(value.falla) : false };
  }
  const legacyEstado = String(value || '').trim();
  return { criticidad: 'No critico', estado: legacyEstado === 'Falla' ? 'No' : legacyEstado, falla: legacyEstado === 'Falla' };
};

const checklistMatches = (value, status) => {
  const entry = normalizeChecklistEntry(value);
  if (status === 'Falla') return entry.falla;
  return entry.estado === status;
};

const buildEntries = (report = {}) => ([
  ['Cliente', report.cliente?.name || ''],
  ['RUT', report.cliente?.rut || ''],
  ['Licitacion', report.licitacion?.id_licitacion || report.licitacion?.name || ''],
  ['Servicio', report.orden?.ubicacion_area || ''],
  ['Equipo', report.orden?.tipo_equipo || ''],
  ['Marca', report.orden?.marca || ''],
  ['Modelo', report.orden?.modelo || ''],
  ['Serie / Inventario', `${report.orden?.numero_serie || ''} / ${report.orden?.numero_inventario || ''}`.trim().replace(/^\/\s*/, '').replace(/\s+\/$/, '')],
]);

const createPage = async (pdfDoc, report, fonts, logo) => {
  const page = pdfDoc.addPage(PAGE_SIZE);
  const [pageWidth, pageHeight] = PAGE_SIZE;
  const contentWidth = pageWidth - (PAGE_MARGIN * 2);
  const empresa = report.empresa || {};
  const headerY = pageHeight - PAGE_MARGIN - HEADER_HEIGHT;
  const logoWidth = 122;
  const metaWidth = 138;
  const companyWidth = contentWidth - logoWidth - metaWidth;
  drawBox(page, { x: PAGE_MARGIN, y: headerY, width: contentWidth, height: HEADER_HEIGHT, borderWidth: 1.4 });
  page.drawLine({ start: { x: PAGE_MARGIN + logoWidth, y: headerY }, end: { x: PAGE_MARGIN + logoWidth, y: headerY + HEADER_HEIGHT }, thickness: 1, color: BORDER_COLOR });
  page.drawLine({ start: { x: PAGE_MARGIN + contentWidth - metaWidth, y: headerY }, end: { x: PAGE_MARGIN + contentWidth - metaWidth, y: headerY + HEADER_HEIGHT }, thickness: 1, color: BORDER_COLOR });

  if (logo) {
    drawImageCentered(page, logo, { x: PAGE_MARGIN + 8, y: headerY + 8, width: logoWidth - 16, height: HEADER_HEIGHT - 16 });
  }

  const companyTop = headerY + HEADER_HEIGHT - 16;
  drawWrappedText(page, empresa.razonSocial || empresa.nombreFantasia || 'Sentauris ERP', {
    x: PAGE_MARGIN + logoWidth + 10,
    y: companyTop,
    font: fonts.bold,
    size: 14,
    maxWidth: companyWidth - 20,
    lineHeight: 16,
    align: 'center',
  });
  drawWrappedText(page, `RUT: ${empresa.rut || empresa.RUT || ''}`, {
    x: PAGE_MARGIN + logoWidth + 10,
    y: companyTop - 22,
    font: fonts.regular,
    size: 10,
    maxWidth: companyWidth - 20,
    lineHeight: 12,
    color: MUTED_COLOR,
    align: 'center',
  });
  drawWrappedText(page, `Giro: ${empresa.giro || ''}`, {
    x: PAGE_MARGIN + logoWidth + 10,
    y: companyTop - 35,
    font: fonts.regular,
    size: 9,
    maxWidth: companyWidth - 20,
    lineHeight: 11,
    color: MUTED_COLOR,
    align: 'center',
  });
  drawWrappedText(page, `Correo: ${empresa.correoContacto || empresa.email || ''}`, {
    x: PAGE_MARGIN + logoWidth + 10,
    y: companyTop - 47,
    font: fonts.regular,
    size: 9,
    maxWidth: companyWidth - 20,
    lineHeight: 11,
    color: MUTED_COLOR,
    align: 'center',
  });

  const metaX = PAGE_MARGIN + contentWidth - metaWidth;
  page.drawText('Folio', { x: metaX + 12, y: headerY + HEADER_HEIGHT - 16, font: fonts.bold, size: FONT_LABEL, color: MUTED_COLOR });
  const folioText = String(report.orden?.folio || '');
  const folioFontSize = fitFontSize(folioText, fonts.bold, metaWidth - 24, 20, 12);
  page.drawText(folioText, { x: metaX + 12, y: headerY + HEADER_HEIGHT - 18 - folioFontSize, font: fonts.bold, size: folioFontSize, color: BORDER_COLOR });
  page.drawText(`Fecha: ${formatDate(report.orden?.fecha)}`, { x: metaX + 12, y: headerY + 12, font: fonts.regular, size: 10, color: BORDER_COLOR });
  page.drawText(report.title || 'MANT. PREVENTIVO', { x: PAGE_MARGIN, y: headerY - 24, font: fonts.bold, size: 16, color: BORDER_COLOR });
  return { page, cursorY: headerY - 42, contentWidth };
};

export async function buildPreventiveEmailPdf(report = {}) {
  const pdfDoc = await PDFDocument.create();
  const fonts = {
    regular: await pdfDoc.embedFont(StandardFonts.Helvetica),
    bold: await pdfDoc.embedFont(StandardFonts.HelveticaBold),
  };
  const logo = await embedImage(pdfDoc, report.assets?.logoSrc || report.empresa?.membreteImagen || '');
  let current = await createPage(pdfDoc, report, fonts, logo);
  const checklist = report.checklist || {};
  const protocol = report.protocol || { sections: [] };

  const entries = buildEntries(report);
  const colWidth = current.contentWidth / 2;
  for (let i = 0; i < entries.length; i += 2) {
    const row = [entries[i], entries[i + 1]].filter(Boolean);
    const rowHeight = Math.max(...row.map(([, value]) => Math.max(28, 18 + (wrapText(String(value || ''), fonts.regular, FONT_BODY, colWidth - 16).length * 12))), 30);
    row.forEach(([label, value], idx) => {
      const x = PAGE_MARGIN + (idx * colWidth);
      drawBox(current.page, { x, y: current.cursorY - rowHeight, width: colWidth, height: rowHeight });
      current.page.drawText(label, { x: x + 8, y: current.cursorY - 12, font: fonts.bold, size: FONT_LABEL, color: MUTED_COLOR });
      drawWrappedText(current.page, String(value || '—'), { x: x + 8, y: current.cursorY - 24, font: fonts.regular, size: FONT_BODY, maxWidth: colWidth - 16, lineHeight: 12 });
    });
    current.cursorY -= rowHeight;
  }
  current.cursorY -= 18;

  const drawChecklistHeader = () => {
    const cols = [
      { label: 'Accion', width: 230 },
      { label: 'Criticidad', width: 72 },
      { label: 'Si', width: 36 },
      { label: 'No', width: 36 },
      { label: 'N/A', width: 42 },
      { label: 'Falla', width: 42 },
    ];
    const scale = current.contentWidth / cols.reduce((sum, col) => sum + col.width, 0);
    let x = PAGE_MARGIN;
    cols.forEach((col) => {
      const width = col.width * scale;
      drawBox(current.page, { x, y: current.cursorY - 22, width, height: 22, fillColor: LIGHT_FILL });
      drawWrappedText(current.page, col.label, { x: x + 4, y: current.cursorY - 14, font: fonts.bold, size: 8, maxWidth: width - 8, lineHeight: 10, align: 'center' });
      x += width;
    });
    current.cursorY -= 22;
    return cols.map(col => ({ ...col, width: col.width * scale }));
  };

  let checklistCols = drawChecklistHeader();
  for (const section of protocol.sections || []) {
    if (current.cursorY - 28 < PAGE_MARGIN + 120) {
      current = await createPage(pdfDoc, report, fonts, logo);
      checklistCols = drawChecklistHeader();
    }
    drawBox(current.page, { x: PAGE_MARGIN, y: current.cursorY - 22, width: current.contentWidth, height: 22, fillColor: LIGHT_FILL });
    drawWrappedText(current.page, section.section || 'Seccion', {
      x: PAGE_MARGIN + 8,
      y: current.cursorY - 14,
      font: fonts.bold,
      size: 9,
      maxWidth: current.contentWidth - 16,
      lineHeight: 10,
    });
    current.cursorY -= 22;

    for (const item of section.items || []) {
      const label = typeof item === 'string' ? item : (item?.label || item?.name || item?.item || '');
      const itemKey = `${section.section} - ${label}`;
      const criticidad = normalizeChecklistEntry(checklist[itemKey]).criticidad;
      const actionLines = wrapText(label, fonts.regular, 9, checklistCols[0].width - 8);
      const rowHeight = Math.max(20, 8 + (actionLines.length * 10));
      if (current.cursorY - rowHeight < PAGE_MARGIN + 120) {
        current = await createPage(pdfDoc, report, fonts, logo);
        checklistCols = drawChecklistHeader();
      }
      let x = PAGE_MARGIN;
      const values = [
        label,
        criticidad,
        checklistMatches(checklist[itemKey], 'Si') ? 'X' : '',
        checklistMatches(checklist[itemKey], 'No') ? 'X' : '',
        checklistMatches(checklist[itemKey], 'N/A') ? 'X' : '',
        checklistMatches(checklist[itemKey], 'Falla') ? 'X' : '',
      ];
      checklistCols.forEach((col, index) => {
        drawBox(current.page, { x, y: current.cursorY - rowHeight, width: col.width, height: rowHeight });
        drawWrappedText(current.page, values[index], {
          x: x + 4,
          y: current.cursorY - 12,
          font: index < 2 ? fonts.regular : fonts.bold,
          size: 9,
          maxWidth: col.width - 8,
          lineHeight: 10,
          align: index === 0 ? 'left' : 'center',
        });
        x += col.width;
      });
      current.cursorY -= rowHeight;
    }
  }

  current.cursorY -= 18;
  const observations = normalizeText(report.preventiva?.observaciones || '');
  if (current.cursorY - 110 < PAGE_MARGIN + 120) current = await createPage(pdfDoc, report, fonts, logo);
  current.page.drawText('Observaciones', { x: PAGE_MARGIN, y: current.cursorY, font: fonts.bold, size: FONT_SECTION, color: BORDER_COLOR });
  const obsHeight = Math.max(84, 24 + (wrapText(observations, fonts.regular, FONT_BODY, current.contentWidth - 20).length * 13));
  drawBox(current.page, { x: PAGE_MARGIN, y: current.cursorY - obsHeight - 8, width: current.contentWidth, height: obsHeight });
  drawWrappedText(current.page, observations, { x: PAGE_MARGIN + 10, y: current.cursorY - 22, font: fonts.regular, size: FONT_BODY, maxWidth: current.contentWidth - 20, lineHeight: 13 });
  current.cursorY -= obsHeight + 24;

  current.page.drawText(`Estado final: ${report.orden?.estado_equipo || report.orden?.estado || ''}`, {
    x: PAGE_MARGIN,
    y: current.cursorY,
    font: fonts.bold,
    size: 10,
    color: BORDER_COLOR,
  });
  current.cursorY -= 24;

  if (report.preventiva?.recibidoPor || report.preventiva?.cargoRecepcion) {
    current.page.drawText('Recepcion del equipo', { x: PAGE_MARGIN, y: current.cursorY, font: fonts.bold, size: FONT_SECTION, color: BORDER_COLOR });
    const tableTop = current.cursorY - 10;
    const colWidthTable = current.contentWidth / 2;
    drawBox(current.page, { x: PAGE_MARGIN, y: tableTop - 20, width: current.contentWidth, height: 20, fillColor: LIGHT_FILL });
    drawBox(current.page, { x: PAGE_MARGIN, y: tableTop - 54, width: current.contentWidth, height: 34 });
    current.page.drawLine({ start: { x: PAGE_MARGIN + colWidthTable, y: tableTop }, end: { x: PAGE_MARGIN + colWidthTable, y: tableTop - 54 }, thickness: 1, color: BORDER_COLOR });
    current.page.drawText('Nombre', { x: PAGE_MARGIN + 8, y: tableTop - 14, font: fonts.bold, size: 9, color: BORDER_COLOR });
    current.page.drawText('Cargo', { x: PAGE_MARGIN + colWidthTable + 8, y: tableTop - 14, font: fonts.bold, size: 9, color: BORDER_COLOR });
    drawWrappedText(current.page, report.preventiva?.recibidoPor || '', { x: PAGE_MARGIN + 8, y: tableTop - 32, font: fonts.regular, size: FONT_BODY, maxWidth: colWidthTable - 16, lineHeight: 12 });
    drawWrappedText(current.page, report.preventiva?.cargoRecepcion || '', { x: PAGE_MARGIN + colWidthTable + 8, y: tableTop - 32, font: fonts.regular, size: FONT_BODY, maxWidth: colWidthTable - 16, lineHeight: 12 });
    current.cursorY = tableTop - 72;
  }

  if (current.cursorY - 130 < PAGE_MARGIN) current = await createPage(pdfDoc, report, fonts, logo);
  const signTop = Math.max(current.cursorY, PAGE_MARGIN + 130);
  const signWidth = (current.contentWidth - 24) / 2;
  const drawSignature = async (x, imageSrc, label) => {
    drawBox(current.page, { x, y: signTop - 116, width: signWidth, height: 116 });
    current.page.drawLine({ start: { x, y: signTop - 86 }, end: { x: x + signWidth, y: signTop - 86 }, thickness: 1, color: BORDER_COLOR });
    const image = await embedImage(pdfDoc, imageSrc);
    if (image) drawImageCentered(current.page, image, { x: x + 10, y: signTop - 82, width: signWidth - 20, height: 62 });
    drawWrappedText(current.page, label, { x: x + 10, y: signTop - 100, font: fonts.regular, size: 10, maxWidth: signWidth - 20, lineHeight: 12, align: 'center' });
  };
  await drawSignature(PAGE_MARGIN, report.preventiva?.firmaRecepcion, 'Firma y Recepcion Conforme');
  await drawSignature(PAGE_MARGIN + signWidth + 24, report.preventiva?.firma, `Tecnico en Mantenimiento Equipo Medico${report.preventiva?.tecnicoNombre ? `\n${report.preventiva.tecnicoNombre}` : ''}${report.preventiva?.tecnicoRut ? ` - RUT: ${report.preventiva.tecnicoRut}` : ''}`);

  return pdfDoc.save();
}
