import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

const PAGE_MARGIN = 42;
const PAGE_SIZE = [595.28, 841.89];
const FONT_SIZE_BODY = 10;
const FONT_SIZE_LABEL = 9;
const FONT_SIZE_TITLE = 15;
const FONT_SIZE_SECTION = 11;
const LINE_HEIGHT = 14;

const normalizeText = (value = '') => String(value || '').replace(/\s+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();

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
  const contentType = response.headers.get('content-type') || '';
  const bytes = Buffer.from(await response.arrayBuffer());
  return { mimeType: contentType, bytes };
};

const drawWrappedText = (page, text, options) => {
  const {
    x,
    y,
    maxWidth,
    font,
    size = FONT_SIZE_BODY,
    color = rgb(0.07, 0.1, 0.17),
    lineHeight = LINE_HEIGHT,
  } = options;
  const lines = [];
  const paragraphs = normalizeText(text).split('\n');

  paragraphs.forEach((paragraph, paragraphIndex) => {
    const words = paragraph.split(/\s+/).filter(Boolean);
    if (words.length === 0) {
      lines.push('');
      return;
    }
    let currentLine = '';
    words.forEach((word) => {
      const candidate = currentLine ? `${currentLine} ${word}` : word;
      const width = font.widthOfTextAtSize(candidate, size);
      if (width <= maxWidth || !currentLine) {
        currentLine = candidate;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    });
    if (currentLine) lines.push(currentLine);
    if (paragraphIndex < paragraphs.length - 1) lines.push('');
  });

  let cursorY = y;
  lines.forEach((line) => {
    page.drawText(line, { x, y: cursorY, size, font, color });
    cursorY -= lineHeight;
  });
  return { cursorY, lineCount: lines.length };
};

const countWrappedLines = (text, { font, size, maxWidth }) => {
  const paragraphs = normalizeText(text).split('\n');
  let count = 0;
  paragraphs.forEach((paragraph, paragraphIndex) => {
    const words = paragraph.split(/\s+/).filter(Boolean);
    if (words.length === 0) {
      count += 1;
      return;
    }
    let currentLine = '';
    words.forEach((word) => {
      const candidate = currentLine ? `${currentLine} ${word}` : word;
      const width = font.widthOfTextAtSize(candidate, size);
      if (width <= maxWidth || !currentLine) {
        currentLine = candidate;
      } else {
        count += 1;
        currentLine = word;
      }
    });
    if (currentLine) count += 1;
    if (paragraphIndex < paragraphs.length - 1) count += 1;
  });
  return count;
};

const buildEquipmentLines = (report = {}) => ([
  ['Cliente', report.cliente?.name || ''],
  ['RUT', report.cliente?.rut || ''],
  ['Licitacion', report.licitacion?.id_licitacion || report.licitacion?.name || ''],
  ['Servicio', report.orden?.ubicacion_area || ''],
  ['Tipo de equipo', report.orden?.tipo_equipo || ''],
  ['Marca', report.orden?.marca || ''],
  ['Modelo', report.orden?.modelo || ''],
  ['Serie / Inventario', `${report.orden?.numero_serie || ''} / ${report.orden?.numero_inventario || ''}`.trim().replace(/^\/\s*/, '').replace(/\s+\/$/, '')],
]).filter(([, value]) => value);

const drawKeyValueGrid = (page, entries, options) => {
  const { x, y, width, rowHeight = 30, fontBold, fontRegular } = options;
  const colWidth = width / 2;
  let cursorY = y;
  for (let index = 0; index < entries.length; index += 2) {
    const row = [entries[index], entries[index + 1]].filter(Boolean);
    row.forEach((entry, columnIndex) => {
      const boxX = x + (columnIndex * colWidth);
      page.drawRectangle({
        x: boxX,
        y: cursorY - rowHeight,
        width: colWidth,
        height: rowHeight,
        borderWidth: 1,
        borderColor: rgb(0.15, 0.23, 0.33),
      });
      page.drawText(entry[0], {
        x: boxX + 8,
        y: cursorY - 12,
        size: FONT_SIZE_LABEL,
        font: fontBold,
        color: rgb(0.39, 0.45, 0.54),
      });
      page.drawText(String(entry[1] || '').slice(0, 64), {
        x: boxX + 8,
        y: cursorY - 24,
        size: FONT_SIZE_BODY,
        font: fontRegular,
        color: rgb(0.07, 0.1, 0.17),
      });
    });
    cursorY -= rowHeight;
  }
  return cursorY;
};

const addImageToPdf = async (pdfDoc, item) => {
  const imageData = await fetchImageBytes(item.src);
  if (!imageData?.bytes) return null;
  const mime = String(imageData.mimeType || '').toLowerCase();
  if (mime.includes('png')) return pdfDoc.embedPng(imageData.bytes);
  if (mime.includes('jpg') || mime.includes('jpeg')) return pdfDoc.embedJpg(imageData.bytes);
  if (/^data:image\/png/i.test(item.src)) return pdfDoc.embedPng(imageData.bytes);
  if (/^data:image\/jpe?g/i.test(item.src)) return pdfDoc.embedJpg(imageData.bytes);
  return null;
};

export async function buildCorrectiveEmailPdf(report = {}) {
  const pdfDoc = await PDFDocument.create();
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const [pageWidth, pageHeight] = PAGE_SIZE;
  const contentWidth = pageWidth - (PAGE_MARGIN * 2);
  const title = buildCorrectiveTitle(report);
  const correctiva = report.correctiva || {};
  let activePage = pdfDoc.addPage(PAGE_SIZE);

  activePage.drawRectangle({
    x: PAGE_MARGIN,
    y: pageHeight - 94,
    width: contentWidth,
    height: 58,
    borderWidth: 1.4,
    borderColor: rgb(0.15, 0.23, 0.33),
  });

  const empresa = report.empresa || {};
  activePage.drawText(empresa.razonSocial || empresa.nombreFantasia || 'Sentauris ERP', {
    x: PAGE_MARGIN + 12,
    y: pageHeight - 58,
    size: 14,
    font: fontBold,
    color: rgb(0.07, 0.1, 0.17),
  });
  activePage.drawText(`RUT: ${empresa.rut || empresa.RUT || ''}`, {
    x: PAGE_MARGIN + 12,
    y: pageHeight - 74,
    size: FONT_SIZE_BODY,
    font: fontRegular,
    color: rgb(0.2, 0.29, 0.39),
  });
  activePage.drawText(`Correo: ${empresa.correoContacto || empresa.email || ''}`, {
    x: PAGE_MARGIN + 160,
    y: pageHeight - 74,
    size: FONT_SIZE_BODY,
    font: fontRegular,
    color: rgb(0.2, 0.29, 0.39),
  });
  activePage.drawText(`Folio ${report.orden?.folio || ''}`, {
    x: pageWidth - 150,
    y: pageHeight - 58,
    size: 14,
    font: fontBold,
    color: rgb(0.07, 0.1, 0.17),
  });
  activePage.drawText(`Fecha ${formatDate(report.orden?.fecha)}`, {
    x: pageWidth - 150,
    y: pageHeight - 74,
    size: FONT_SIZE_BODY,
    font: fontRegular,
    color: rgb(0.2, 0.29, 0.39),
  });

  activePage.drawText(title, {
    x: PAGE_MARGIN,
    y: pageHeight - 125,
    size: FONT_SIZE_TITLE,
    font: fontBold,
    color: rgb(0.07, 0.1, 0.17),
  });

  let cursorY = pageHeight - 146;
  cursorY = drawKeyValueGrid(activePage, buildEquipmentLines(report), {
    x: PAGE_MARGIN,
    y: cursorY,
    width: contentWidth,
    rowHeight: 34,
    fontBold,
    fontRegular,
  }) - 18;

  const sections = [
    ['Condicion inicial de equipo', correctiva.condicionInicial || ''],
    ['Informacion de diagnostico', correctiva.conclusion || correctiva.diagnostico || ''],
    ...((['garantia', 'sugerenciadebaja'].includes(normalizeStateKey(report.estado)) || isExecutedState(report.estado))
      ? [['Condicion final', correctiva.condicionFinal || '']]
      : []),
  ].filter(([, value]) => normalizeText(value));

  sections.forEach(([label, text]) => {
    const boxTextWidth = contentWidth - 20;
    const lineCount = countWrappedLines(text, {
      font: fontRegular,
      size: FONT_SIZE_BODY,
      maxWidth: boxTextWidth,
    });
    const boxHeight = Math.max(84, (lineCount * 13) + 28);

    if (cursorY - boxHeight < 90) {
      activePage = pdfDoc.addPage(PAGE_SIZE);
      cursorY = pageHeight - PAGE_MARGIN;
      activePage.drawText(title, {
        x: PAGE_MARGIN,
        y: cursorY,
        size: FONT_SIZE_TITLE,
        font: fontBold,
        color: rgb(0.07, 0.1, 0.17),
      });
      cursorY -= 26;
    }
    activePage.drawText(label, {
      x: PAGE_MARGIN,
      y: cursorY,
      size: FONT_SIZE_SECTION,
      font: fontBold,
      color: rgb(0.07, 0.1, 0.17),
    });
    cursorY -= 16;
    activePage.drawRectangle({
      x: PAGE_MARGIN,
      y: cursorY - boxHeight + 6,
      width: contentWidth,
      height: boxHeight,
      borderWidth: 1,
      borderColor: rgb(0.15, 0.23, 0.33),
    });
    const wrapped = drawWrappedText(activePage, text, {
      x: PAGE_MARGIN + 10,
      y: cursorY - 14,
      maxWidth: boxTextWidth,
      font: fontRegular,
      size: FONT_SIZE_BODY,
      lineHeight: 13,
    });
    cursorY = Math.min(wrapped.cursorY, cursorY - boxHeight + 20) - 18;
  });

  if (correctiva.recibidoPor || correctiva.cargoRecepcion) {
    if (cursorY < 90) {
      activePage = pdfDoc.addPage(PAGE_SIZE);
      cursorY = pageHeight - PAGE_MARGIN;
      activePage.drawText(title, {
        x: PAGE_MARGIN,
        y: cursorY,
        size: FONT_SIZE_TITLE,
        font: fontBold,
        color: rgb(0.07, 0.1, 0.17),
      });
      cursorY -= 26;
    }
    activePage.drawText('Recepcion del equipo', {
      x: PAGE_MARGIN,
      y: cursorY,
      size: FONT_SIZE_SECTION,
      font: fontBold,
      color: rgb(0.07, 0.1, 0.17),
    });
    cursorY -= 16;
    cursorY = drawKeyValueGrid(activePage, [
      ['Nombre', correctiva.recibidoPor || ''],
      ['Cargo', correctiva.cargoRecepcion || ''],
    ], {
      x: PAGE_MARGIN,
      y: cursorY,
      width: contentWidth,
      rowHeight: 34,
      fontBold,
      fontRegular,
    }) - 14;
  }

  const annexItems = buildAnnexItems(correctiva);
  if (annexItems.length > 0) {
    let annexPage = pdfDoc.addPage(PAGE_SIZE);
    let annexY = pageHeight - PAGE_MARGIN;
    annexPage.drawText('Anexos fotograficos', {
      x: PAGE_MARGIN,
      y: annexY,
      size: FONT_SIZE_TITLE,
      font: fontBold,
      color: rgb(0.07, 0.1, 0.17),
    });
    annexY -= 24;

    for (const item of annexItems) {
      const embedded = await addImageToPdf(pdfDoc, item);
      if (!embedded) continue;
      const maxWidth = contentWidth;
      const maxHeight = 220;
      const scale = Math.min(maxWidth / embedded.width, maxHeight / embedded.height, 1);
      const imageWidth = embedded.width * scale;
      const imageHeight = embedded.height * scale;
      const blockHeight = imageHeight + 32;

      if (annexY - blockHeight < PAGE_MARGIN) {
        annexPage = pdfDoc.addPage(PAGE_SIZE);
        annexY = pageHeight - PAGE_MARGIN;
      }

      annexPage.drawText(item.label, {
        x: PAGE_MARGIN,
        y: annexY,
        size: FONT_SIZE_SECTION,
        font: fontBold,
        color: rgb(0.07, 0.1, 0.17),
      });
      annexY -= 16;
      annexPage.drawRectangle({
        x: PAGE_MARGIN,
        y: annexY - imageHeight - 10,
        width: contentWidth,
        height: imageHeight + 14,
        borderWidth: 1,
        borderColor: rgb(0.8, 0.84, 0.89),
      });
      annexPage.drawImage(embedded, {
        x: PAGE_MARGIN + ((contentWidth - imageWidth) / 2),
        y: annexY - imageHeight - 4,
        width: imageWidth,
        height: imageHeight,
      });
      annexY -= blockHeight;
    }
  }

  return pdfDoc.save();
}
