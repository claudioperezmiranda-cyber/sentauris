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
const fitFontSize = (text, font, maxWidth, preferredSize, minSize = 10) => {
  let size = preferredSize;
  const content = String(text || '');
  while (size > minSize && font.widthOfTextAtSize(content, size) > maxWidth) size -= 0.5;
  return size;
};

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

const normalizeStateKey = (value = '') => String(value || '').toLowerCase().replace(/[\s.]/g, '').trim();

const isExecutedState = (value = '') => normalizeStateKey(value) === 'ejecutado';

const buildCorrectiveTitle = (report = {}) => {
  const correctivaEstado = String(report?.estado || '').trim();
  const correctivaEstadoKey = normalizeStateKey(correctivaEstado);
  if (report?.correctiva?.garantiaContrato || correctivaEstadoKey === 'garantia') return 'MANT. CORRECTIVO - GARANTIA';
  if (isExecutedState(report?.estado)) return 'MANT. CORRECTIVO - EJECUTADO';
  if (correctivaEstadoKey === 'ingresado') return 'MANT. CORRECTIVO - DIAGNOSTICO';
  if (correctivaEstado) return `MANT. CORRECTIVO - ${correctivaEstado.toUpperCase()}`;
  return 'MANT. CORRECTIVO';
};

const ensureAttachmentList = (items = []) => Array.isArray(items)
  ? items.filter(item => item?.src).map(item => ({
      src: item.src,
      label: String(item.label || item.name || 'Respaldo').trim(),
    }))
  : [];

const buildAnnexItems = (correctiva = {}) => {
  const initial = ensureAttachmentList(correctiva.fotos).map(item => ({ ...item, label: 'Condicion inicial' }));
  const repuestos = Array.isArray(correctiva.repuestosDetalle)
    ? correctiva.repuestosDetalle.flatMap(item =>
        ensureAttachmentList(item.respaldos).map(photo => ({
          ...photo,
          label: `${item.name || 'Repuesto'}${item.part_number ? ` - ${item.part_number}` : ''}`.trim(),
        }))
      )
    : [];
  const final = ensureAttachmentList(correctiva.condicionFinalRespaldos).map(item => ({ ...item, label: 'Condicion final' }));
  return [...initial, ...repuestos, ...final];
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
      const width = font.widthOfTextAtSize(candidate, size);
      if (width <= maxWidth || !current) current = candidate;
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

const drawLines = (page, lines, { x, y, font, size, lineHeight = LINE_HEIGHT, color = BORDER_COLOR, align = 'left', width = 0 }) => {
  let cursorY = y;
  lines.forEach((line) => {
    const lineWidth = font.widthOfTextAtSize(line, size);
    let drawX = x;
    if (align === 'center') drawX = x + Math.max((width - lineWidth) / 2, 0);
    if (align === 'right') drawX = x + Math.max(width - lineWidth, 0);
    page.drawText(line, { x: drawX, y: cursorY, font, size, color });
    cursorY -= lineHeight;
  });
  return cursorY;
};

const drawWrappedText = (page, text, options) => {
  const { x, y, font, size, maxWidth, lineHeight = LINE_HEIGHT, color = BORDER_COLOR, align = 'left' } = options;
  const lines = wrapText(text, font, size, maxWidth);
  const cursorY = drawLines(page, lines, { x, y, font, size, lineHeight, color, align, width: maxWidth });
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

const createPage = (pdfDoc) => {
  const page = pdfDoc.addPage(PAGE_SIZE);
  return { page, cursorY: PAGE_SIZE[1] - PAGE_MARGIN };
};

const drawHeader = async (page, report, fonts) => {
  const [pageWidth, pageHeight] = PAGE_SIZE;
  const contentWidth = pageWidth - (PAGE_MARGIN * 2);
  const title = buildCorrectiveTitle(report);
  const empresa = report.empresa || {};
  const headerY = pageHeight - PAGE_MARGIN - HEADER_HEIGHT;
  const logoWidth = 122;
  const metaWidth = 138;
  const companyWidth = contentWidth - logoWidth - metaWidth;
  const logoX = PAGE_MARGIN;
  const companyX = PAGE_MARGIN + logoWidth;
  const metaX = PAGE_MARGIN + contentWidth - metaWidth;

  drawBox(page, { x: PAGE_MARGIN, y: headerY, width: contentWidth, height: HEADER_HEIGHT, borderWidth: 1.4 });
  page.drawLine({ start: { x: companyX, y: headerY }, end: { x: companyX, y: headerY + HEADER_HEIGHT }, thickness: 1, color: BORDER_COLOR });
  page.drawLine({ start: { x: metaX, y: headerY }, end: { x: metaX, y: headerY + HEADER_HEIGHT }, thickness: 1, color: BORDER_COLOR });

  const logo = await embedImage(pdfDocRef, report.assets?.logoSrc || empresa.membreteImagen || '');
  if (logo) {
    drawImageCentered(page, logo, {
      x: logoX + 8,
      y: headerY + 8,
      width: logoWidth - 16,
      height: HEADER_HEIGHT - 16,
    });
  }

  const companyTop = headerY + HEADER_HEIGHT - 16;
  const companyName = empresa.razonSocial || empresa.nombreFantasia || 'Sentauris ERP';
  drawWrappedText(page, companyName, {
    x: companyX + 10,
    y: companyTop,
    font: fonts.bold,
    size: 14,
    maxWidth: companyWidth - 20,
    lineHeight: 16,
    align: 'center',
  });
  drawWrappedText(page, `RUT: ${empresa.rut || empresa.RUT || ''}`, {
    x: companyX + 10,
    y: companyTop - 22,
    font: fonts.regular,
    size: 10,
    maxWidth: companyWidth - 20,
    lineHeight: 12,
    color: MUTED_COLOR,
    align: 'center',
  });
  drawWrappedText(page, `Giro: ${empresa.giro || ''}`, {
    x: companyX + 10,
    y: companyTop - 35,
    font: fonts.regular,
    size: 9,
    maxWidth: companyWidth - 20,
    lineHeight: 11,
    color: MUTED_COLOR,
    align: 'center',
  });
  drawWrappedText(page, `Correo: ${empresa.correoContacto || empresa.email || ''}`, {
    x: companyX + 10,
    y: companyTop - 47,
    font: fonts.regular,
    size: 9,
    maxWidth: companyWidth - 20,
    lineHeight: 11,
    color: MUTED_COLOR,
    align: 'center',
  });

  page.drawText('Folio', {
    x: metaX + 12,
    y: headerY + HEADER_HEIGHT - 16,
    font: fonts.bold,
    size: FONT_LABEL,
    color: MUTED_COLOR,
  });
  const folioText = String(report.orden?.folio || '');
  const folioFontSize = fitFontSize(folioText, fonts.bold, metaWidth - 24, 20, 12);
  page.drawText(folioText, {
    x: metaX + 12,
    y: headerY + HEADER_HEIGHT - 18 - folioFontSize,
    font: fonts.bold,
    size: folioFontSize,
    color: BORDER_COLOR,
  });
  page.drawText(`Fecha: ${formatDate(report.orden?.fecha)}`, {
    x: metaX + 12,
    y: headerY + 12,
    font: fonts.regular,
    size: 10,
    color: BORDER_COLOR,
  });

  page.drawText(title, {
    x: PAGE_MARGIN,
    y: headerY - 24,
    font: fonts.bold,
    size: 16,
    color: BORDER_COLOR,
  });

  return headerY - 42;
};

let pdfDocRef = null;

const buildEquipmentEntries = (report = {}) => ([
  ['Cliente', report.cliente?.name || ''],
  ['RUT', report.cliente?.rut || ''],
  ['Licitacion convenio', report.licitacion?.id_licitacion || report.licitacion?.name || ''],
  ['Servicio', report.orden?.ubicacion_area || ''],
  ['Tipo de equipo', report.orden?.tipo_equipo || ''],
  ['Marca', report.orden?.marca || ''],
  ['Modelo', report.orden?.modelo || ''],
  ['Serie / Inventario', `${report.orden?.numero_serie || ''} / ${report.orden?.numero_inventario || ''}`.trim().replace(/^\/\s*/, '').replace(/\s+\/$/, '')],
]);

const measureGridRowHeight = (entries, fonts, colWidth) => {
  const contentWidth = colWidth - 16;
  const heights = entries.map(([, value]) => {
    const lines = wrapText(String(value || ''), fonts.regular, FONT_BODY, contentWidth);
    return Math.max(28, 18 + (lines.length * 12));
  });
  return Math.max(...heights, 30);
};

const drawEquipmentGrid = (page, yTop, report, fonts) => {
  const entries = buildEquipmentEntries(report);
  const colWidth = (PAGE_SIZE[0] - (PAGE_MARGIN * 2)) / 2;
  let cursorY = yTop;
  for (let i = 0; i < entries.length; i += 2) {
    const rowEntries = [entries[i], entries[i + 1]].filter(Boolean);
    const rowHeight = measureGridRowHeight(rowEntries, fonts, colWidth);
    rowEntries.forEach(([label, value], columnIndex) => {
      const x = PAGE_MARGIN + (columnIndex * colWidth);
      drawBox(page, { x, y: cursorY - rowHeight, width: colWidth, height: rowHeight });
      page.drawText(label, {
        x: x + 8,
        y: cursorY - 12,
        font: fonts.bold,
        size: FONT_LABEL,
        color: MUTED_COLOR,
      });
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
  return cursorY - 16;
};

const sectionHeightFor = (text, font, width) => {
  const lines = wrapText(text, font, FONT_BODY, width - 20);
  return Math.max(82, 22 + (lines.length * 13));
};

const drawSection = (page, yTop, title, text, fonts) => {
  const width = PAGE_SIZE[0] - (PAGE_MARGIN * 2);
  const height = sectionHeightFor(text, fonts.regular, width);
  page.drawText(title, {
    x: PAGE_MARGIN,
    y: yTop,
    font: fonts.bold,
    size: FONT_SECTION,
    color: BORDER_COLOR,
  });
  drawBox(page, { x: PAGE_MARGIN, y: yTop - height - 8, width, height });
  drawWrappedText(page, text, {
    x: PAGE_MARGIN + 10,
    y: yTop - 22,
    font: fonts.regular,
    size: FONT_BODY,
    maxWidth: width - 20,
    lineHeight: 13,
  });
  return yTop - height - 22;
};

const drawReceptionTable = (page, yTop, correctiva, fonts) => {
  const width = PAGE_SIZE[0] - (PAGE_MARGIN * 2);
  const colWidth = width / 2;
  page.drawText('Recepcion del equipo', {
    x: PAGE_MARGIN,
    y: yTop,
    font: fonts.bold,
    size: FONT_SECTION,
    color: BORDER_COLOR,
  });
  const tableTop = yTop - 10;
  const headerHeight = 20;
  const bodyHeight = 34;
  drawBox(page, { x: PAGE_MARGIN, y: tableTop - headerHeight, width, height: headerHeight, fillColor: LIGHT_FILL });
  drawBox(page, { x: PAGE_MARGIN, y: tableTop - headerHeight - bodyHeight, width, height: bodyHeight });
  page.drawLine({ start: { x: PAGE_MARGIN + colWidth, y: tableTop }, end: { x: PAGE_MARGIN + colWidth, y: tableTop - headerHeight - bodyHeight }, thickness: 1, color: BORDER_COLOR });
  page.drawText('Nombre', {
    x: PAGE_MARGIN + 8,
    y: tableTop - 14,
    font: fonts.bold,
    size: 9,
    color: BORDER_COLOR,
  });
  page.drawText('Cargo', {
    x: PAGE_MARGIN + colWidth + 8,
    y: tableTop - 14,
    font: fonts.bold,
    size: 9,
    color: BORDER_COLOR,
  });
  drawWrappedText(page, correctiva.recibidoPor || '', {
    x: PAGE_MARGIN + 8,
    y: tableTop - 32,
    font: fonts.regular,
    size: FONT_BODY,
    maxWidth: colWidth - 16,
    lineHeight: 12,
  });
  drawWrappedText(page, correctiva.cargoRecepcion || '', {
    x: PAGE_MARGIN + colWidth + 8,
    y: tableTop - 32,
    font: fonts.regular,
    size: FONT_BODY,
    maxWidth: colWidth - 16,
    lineHeight: 12,
  });
  return tableTop - headerHeight - bodyHeight - 20;
};

const drawSignatureBlock = async (page, yTop, correctiva, fonts) => {
  const width = PAGE_SIZE[0] - (PAGE_MARGIN * 2);
  const colWidth = (width - 24) / 2;
  const cardHeight = 116;
  const leftX = PAGE_MARGIN;
  const rightX = PAGE_MARGIN + colWidth + 24;
  const drawCard = async (x, imageSrc, label) => {
    drawBox(page, { x, y: yTop - cardHeight, width: colWidth, height: cardHeight });
    page.drawLine({ start: { x, y: yTop - 86 }, end: { x: x + colWidth, y: yTop - 86 }, thickness: 1, color: BORDER_COLOR });
    const image = await embedImage(pdfDocRef, imageSrc);
    if (image) {
      drawImageCentered(page, image, {
        x: x + 10,
        y: yTop - 82,
        width: colWidth - 20,
        height: 62,
      });
    }
    drawWrappedText(page, label, {
      x: x + 10,
      y: yTop - 100,
      font: fonts.regular,
      size: 10,
      maxWidth: colWidth - 20,
      lineHeight: 12,
      align: 'center',
    });
  };

  await drawCard(leftX, correctiva.firmaRecepcion, 'Firma y Recepcion Conforme');
  await drawCard(rightX, correctiva.firma, 'Tecnico en Mantenimiento Equipo Medico');
  return yTop - cardHeight - 18;
};

const drawAnnexes = async (pdfDoc, annexItems, fonts) => {
  if (annexItems.length === 0) return;
  let { page, cursorY } = createPage(pdfDoc);
  page.drawText('Anexos fotograficos', {
    x: PAGE_MARGIN,
    y: cursorY,
    font: fonts.bold,
    size: 16,
    color: BORDER_COLOR,
  });
  cursorY -= 24;

  for (const item of annexItems) {
    const image = await embedImage(pdfDoc, item.src);
    if (!image) continue;
    const contentWidth = PAGE_SIZE[0] - (PAGE_MARGIN * 2);
    const imageSize = fitImage(image, contentWidth - 16, 260);
    const blockHeight = imageSize.height + 34;
    if (cursorY - blockHeight < PAGE_MARGIN) {
      ({ page, cursorY } = createPage(pdfDoc));
    }
    page.drawText(item.label, {
      x: PAGE_MARGIN,
      y: cursorY,
      font: fonts.bold,
      size: FONT_SECTION,
      color: BORDER_COLOR,
    });
    drawBox(page, {
      x: PAGE_MARGIN,
      y: cursorY - blockHeight,
      width: contentWidth,
      height: blockHeight - 8,
    });
    page.drawImage(image, {
      x: PAGE_MARGIN + ((contentWidth - imageSize.width) / 2),
      y: cursorY - blockHeight + 12,
      width: imageSize.width,
      height: imageSize.height,
    });
    cursorY -= blockHeight + 12;
  }
};

export async function buildCorrectiveEmailPdf(report = {}) {
  pdfDocRef = await PDFDocument.create();
  const pdfDoc = pdfDocRef;
  const fonts = {
    regular: await pdfDoc.embedFont(StandardFonts.Helvetica),
    bold: await pdfDoc.embedFont(StandardFonts.HelveticaBold),
  };
  const correctiva = report.correctiva || {};
  let { page, cursorY } = createPage(pdfDoc);

  cursorY = await drawHeader(page, report, fonts);
  cursorY = drawEquipmentGrid(page, cursorY, report, fonts);

  const sections = [
    ['Condicion inicial de equipo', correctiva.condicionInicial || ''],
    ['Informacion de diagnostico', correctiva.conclusion || correctiva.diagnostico || ''],
    ...((['garantia', 'sugerenciadebaja'].includes(normalizeStateKey(report.estado)) || isExecutedState(report.estado))
      ? [['Condicion final', correctiva.condicionFinal || '']]
      : []),
  ].filter(([, text]) => normalizeText(text));

  for (const [sectionTitle, sectionText] of sections) {
    const neededHeight = sectionHeightFor(sectionText, fonts.regular, PAGE_SIZE[0] - (PAGE_MARGIN * 2)) + 28;
    if (cursorY - neededHeight < PAGE_MARGIN + 90) {
      ({ page, cursorY } = createPage(pdfDoc));
      cursorY = await drawHeader(page, report, fonts);
    }
    cursorY = drawSection(page, cursorY, sectionTitle, sectionText, fonts);
  }

  if (correctiva.recibidoPor || correctiva.cargoRecepcion) {
    if (cursorY - 90 < PAGE_MARGIN + 130) {
      ({ page, cursorY } = createPage(pdfDoc));
      cursorY = await drawHeader(page, report, fonts);
    }
    cursorY = drawReceptionTable(page, cursorY, correctiva, fonts);
  }

  if (cursorY - 130 < PAGE_MARGIN) {
    ({ page, cursorY } = createPage(pdfDoc));
    cursorY = await drawHeader(page, report, fonts);
  }
  await drawSignatureBlock(page, cursorY, correctiva, fonts);

  await drawAnnexes(pdfDoc, buildAnnexItems(correctiva), fonts);
  return pdfDoc.save();
}
