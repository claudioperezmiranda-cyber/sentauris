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
const LINE_HEIGHT = 13;

const normalizeText = (value = '') => String(value || '').replace(/\r/g, '').replace(/\s+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();

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

const wrapText = (text, font, size, maxWidth) => {
  const paragraphs = normalizeText(text).split('\n');
  const lines = [];
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

const drawWrappedText = (page, text, { x, y, font, size, maxWidth, lineHeight = LINE_HEIGHT, color = BORDER_COLOR, align = 'left' }) => {
  const lines = wrapText(text, font, size, maxWidth);
  let cursorY = y;
  lines.forEach((line) => {
    const lineWidth = font.widthOfTextAtSize(line, size);
    let drawX = x;
    if (align === 'center') drawX = x + Math.max((maxWidth - lineWidth) / 2, 0);
    if (align === 'right') drawX = x + Math.max(maxWidth - lineWidth, 0);
    page.drawText(line, { x: drawX, y: cursorY, font, size, color });
    cursorY -= lineHeight;
  });
  return { lines, cursorY };
};

const fitImage = (image, maxWidth, maxHeight) => {
  const ratio = Math.min(maxWidth / image.width, maxHeight / image.height, 1);
  return { width: image.width * ratio, height: image.height * ratio };
};

const drawImageCentered = (page, image, { x, y, width, height }) => {
  const size = fitImage(image, width, height);
  page.drawImage(image, {
    x: x + ((width - size.width) / 2),
    y: y + ((height - size.height) / 2),
    width: size.width,
    height: size.height,
  });
};

const drawBox = (page, { x, y, width, height, fillColor = null, borderWidth = 1 }) => {
  page.drawRectangle({
    x,
    y,
    width,
    height,
    borderWidth,
    borderColor: BORDER_COLOR,
    color: fillColor || undefined,
  });
};

const fitFontSize = (text, font, maxWidth, preferredSize, minSize = 10) => {
  let size = preferredSize;
  while (size > minSize && font.widthOfTextAtSize(String(text || ''), size) > maxWidth) size -= 0.5;
  return size;
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

const measureRowHeight = (entries, fonts, colWidth) => Math.max(...entries.map(([, value]) => Math.max(28, 18 + (wrapText(String(value || ''), fonts.regular, FONT_BODY, colWidth - 16).length * 12))), 30);

export async function buildPreventiveEmailPdf(report = {}) {
  const pdfDoc = await PDFDocument.create();
  const fonts = {
    regular: await pdfDoc.embedFont(StandardFonts.Helvetica),
    bold: await pdfDoc.embedFont(StandardFonts.HelveticaBold),
  };
  const page = pdfDoc.addPage(PAGE_SIZE);
  const [pageWidth, pageHeight] = PAGE_SIZE;
  const contentWidth = pageWidth - (PAGE_MARGIN * 2);
  const empresa = report.empresa || {};
  const headerY = pageHeight - PAGE_MARGIN - HEADER_HEIGHT;
  const logoWidth = 122;
  const metaWidth = 138;
  const companyWidth = contentWidth - logoWidth - metaWidth;
  const logo = await embedImage(pdfDoc, report.assets?.logoSrc || empresa.membreteImagen || '');

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

  page.drawText(report.title || 'MANT. PREVENTIVO', {
    x: PAGE_MARGIN,
    y: headerY - 24,
    font: fonts.bold,
    size: 16,
    color: BORDER_COLOR,
  });

  let cursorY = headerY - 42;
  const entries = buildEntries(report);
  const colWidth = contentWidth / 2;
  for (let i = 0; i < entries.length; i += 2) {
    const rowEntries = [entries[i], entries[i + 1]].filter(Boolean);
    const rowHeight = measureRowHeight(rowEntries, fonts, colWidth);
    rowEntries.forEach(([label, value], idx) => {
      const x = PAGE_MARGIN + (idx * colWidth);
      drawBox(page, { x, y: cursorY - rowHeight, width: colWidth, height: rowHeight });
      page.drawText(label, { x: x + 8, y: cursorY - 12, font: fonts.bold, size: FONT_LABEL, color: MUTED_COLOR });
      drawWrappedText(page, String(value || '—'), {
        x: x + 8,
        y: cursorY - 24,
        font: fonts.regular,
        size: FONT_BODY,
        maxWidth: colWidth - 16,
        lineHeight: 12,
      });
    });
    cursorY -= rowHeight;
  }
  cursorY -= 18;

  const observations = normalizeText(report.preventiva?.observaciones || '');
  page.drawText('Observaciones', { x: PAGE_MARGIN, y: cursorY, font: fonts.bold, size: FONT_SECTION, color: BORDER_COLOR });
  const obsHeight = Math.max(84, 24 + (wrapText(observations, fonts.regular, FONT_BODY, contentWidth - 20).length * 13));
  drawBox(page, { x: PAGE_MARGIN, y: cursorY - obsHeight - 8, width: contentWidth, height: obsHeight });
  drawWrappedText(page, observations, {
    x: PAGE_MARGIN + 10,
    y: cursorY - 22,
    font: fonts.regular,
    size: FONT_BODY,
    maxWidth: contentWidth - 20,
    lineHeight: 13,
  });
  cursorY -= obsHeight + 24;

  page.drawText(`Estado final: ${report.orden?.estado_equipo || report.orden?.estado || ''}`, {
    x: PAGE_MARGIN,
    y: cursorY,
    font: fonts.bold,
    size: 10,
    color: BORDER_COLOR,
  });
  cursorY -= 24;

  if (report.preventiva?.recibidoPor || report.preventiva?.cargoRecepcion) {
    page.drawText('Recepcion del equipo', { x: PAGE_MARGIN, y: cursorY, font: fonts.bold, size: FONT_SECTION, color: BORDER_COLOR });
    const tableTop = cursorY - 10;
    const width = contentWidth;
    const colWidthTable = width / 2;
    drawBox(page, { x: PAGE_MARGIN, y: tableTop - 20, width, height: 20, fillColor: LIGHT_FILL });
    drawBox(page, { x: PAGE_MARGIN, y: tableTop - 54, width, height: 34 });
    page.drawLine({ start: { x: PAGE_MARGIN + colWidthTable, y: tableTop }, end: { x: PAGE_MARGIN + colWidthTable, y: tableTop - 54 }, thickness: 1, color: BORDER_COLOR });
    page.drawText('Nombre', { x: PAGE_MARGIN + 8, y: tableTop - 14, font: fonts.bold, size: 9, color: BORDER_COLOR });
    page.drawText('Cargo', { x: PAGE_MARGIN + colWidthTable + 8, y: tableTop - 14, font: fonts.bold, size: 9, color: BORDER_COLOR });
    drawWrappedText(page, report.preventiva?.recibidoPor || '', { x: PAGE_MARGIN + 8, y: tableTop - 32, font: fonts.regular, size: FONT_BODY, maxWidth: colWidthTable - 16, lineHeight: 12 });
    drawWrappedText(page, report.preventiva?.cargoRecepcion || '', { x: PAGE_MARGIN + colWidthTable + 8, y: tableTop - 32, font: fonts.regular, size: FONT_BODY, maxWidth: colWidthTable - 16, lineHeight: 12 });
    cursorY = tableTop - 72;
  }

  const signTop = Math.max(cursorY, PAGE_MARGIN + 130);
  const signWidth = (contentWidth - 24) / 2;
  const drawSignature = async (x, imageSrc, label) => {
    drawBox(page, { x, y: signTop - 116, width: signWidth, height: 116 });
    page.drawLine({ start: { x, y: signTop - 86 }, end: { x: x + signWidth, y: signTop - 86 }, thickness: 1, color: BORDER_COLOR });
    const image = await embedImage(pdfDoc, imageSrc);
    if (image) drawImageCentered(page, image, { x: x + 10, y: signTop - 82, width: signWidth - 20, height: 62 });
    drawWrappedText(page, label, { x: x + 10, y: signTop - 100, font: fonts.regular, size: 10, maxWidth: signWidth - 20, lineHeight: 12, align: 'center' });
  };
  await drawSignature(PAGE_MARGIN, report.preventiva?.firmaRecepcion, 'Firma y Recepcion Conforme');
  await drawSignature(PAGE_MARGIN + signWidth + 24, report.preventiva?.firma, `Tecnico en Mantenimiento Equipo Medico${report.preventiva?.tecnicoNombre ? `\n${report.preventiva.tecnicoNombre}` : ''}${report.preventiva?.tecnicoRut ? ` - RUT: ${report.preventiva.tecnicoRut}` : ''}`);

  return pdfDoc.save();
}
