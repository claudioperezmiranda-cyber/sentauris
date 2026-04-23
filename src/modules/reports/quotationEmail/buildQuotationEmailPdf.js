import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

const PAGE_SIZE = [595.28, 841.89];
const PAGE_MARGIN = 34;
const HEADER_HEIGHT = 76;
const BORDER_COLOR = rgb(0.07, 0.1, 0.17);
const MUTED_COLOR = rgb(0.28, 0.33, 0.39);
const LIGHT_FILL = rgb(0.96, 0.97, 0.98);

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

const formatDate = (value = '') => {
  const text = String(value || '').trim();
  if (!text) return '';
  const iso = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[3]}/${iso[2]}/${iso[1]}`;
  const date = new Date(text);
  if (Number.isNaN(date.getTime())) return text;
  return date.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const wrapText = (text, font, size, maxWidth) => {
  const lines = [];
  const paragraphs = String(text || '').split('\n');
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

const drawWrapped = (page, text, { x, y, font, size, maxWidth, lineHeight = 12, color = BORDER_COLOR, align = 'left' }) => {
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
  return cursorY;
};

const fitFontSize = (text, font, maxWidth, preferredSize, minSize = 10) => {
  let size = preferredSize;
  while (size > minSize && font.widthOfTextAtSize(String(text || ''), size) > maxWidth) size -= 0.5;
  return size;
};

const lineTotal = (item) => {
  const quantity = Number(item?.cantidad || 0);
  const price = Number(item?.precio || 0);
  const discount = Number(item?.dcto || 0);
  return Math.round(quantity * price * (1 - (discount / 100)));
};

const totalsFor = (items = []) => {
  const neto = items.reduce((sum, item) => sum + (item?.tipo === 'info' ? 0 : lineTotal(item)), 0);
  const iva = Math.round(neto * 0.19);
  return { neto, iva, total: neto + iva };
};

export async function buildQuotationEmailPdf(draft = {}, empresaInforme = {}) {
  const pdfDoc = await PDFDocument.create();
  const regular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  let page = pdfDoc.addPage(PAGE_SIZE);
  const [pageWidth, pageHeight] = PAGE_SIZE;
  const contentWidth = pageWidth - (PAGE_MARGIN * 2);
  const headerY = pageHeight - PAGE_MARGIN - HEADER_HEIGHT;
  const logoWidth = 122;
  const metaWidth = 138;
  const companyWidth = contentWidth - logoWidth - metaWidth;
  const logo = await embedImage(pdfDoc, draft.assets?.logoSrc || empresaInforme?.membreteImagen || '');
  const empresaNombre = empresaInforme?.razonSocial || empresaInforme?.nombreFantasia || 'Sentauris ERP';
  const empresaRut = empresaInforme?.rut || empresaInforme?.RUT || '';
  const empresaGiro = empresaInforme?.giro || '';
  const empresaMail = empresaInforme?.correoContacto || empresaInforme?.email || '';
  const { neto, iva, total } = totalsFor(draft.items || []);

  drawBox(page, { x: PAGE_MARGIN, y: headerY, width: contentWidth, height: HEADER_HEIGHT, borderWidth: 1.4 });
  page.drawLine({ start: { x: PAGE_MARGIN + logoWidth, y: headerY }, end: { x: PAGE_MARGIN + logoWidth, y: headerY + HEADER_HEIGHT }, thickness: 1, color: BORDER_COLOR });
  page.drawLine({ start: { x: PAGE_MARGIN + contentWidth - metaWidth, y: headerY }, end: { x: PAGE_MARGIN + contentWidth - metaWidth, y: headerY + HEADER_HEIGHT }, thickness: 1, color: BORDER_COLOR });
  if (logo) drawImageCentered(page, logo, { x: PAGE_MARGIN + 8, y: headerY + 8, width: logoWidth - 16, height: HEADER_HEIGHT - 16 });
  const companyX = PAGE_MARGIN + logoWidth + 10;
  drawWrapped(page, empresaNombre, { x: companyX, y: headerY + HEADER_HEIGHT - 16, font: bold, size: 14, maxWidth: companyWidth - 20, lineHeight: 16, align: 'center' });
  drawWrapped(page, `RUT: ${empresaRut}`, { x: companyX, y: headerY + HEADER_HEIGHT - 38, font: regular, size: 10, maxWidth: companyWidth - 20, lineHeight: 12, color: MUTED_COLOR, align: 'center' });
  drawWrapped(page, `Giro: ${empresaGiro}`, { x: companyX, y: headerY + HEADER_HEIGHT - 51, font: regular, size: 9, maxWidth: companyWidth - 20, lineHeight: 11, color: MUTED_COLOR, align: 'center' });
  drawWrapped(page, `Correo: ${empresaMail}`, { x: companyX, y: headerY + HEADER_HEIGHT - 63, font: regular, size: 9, maxWidth: companyWidth - 20, lineHeight: 11, color: MUTED_COLOR, align: 'center' });

  const metaX = PAGE_MARGIN + contentWidth - metaWidth;
  page.drawText('Cotizacion', { x: metaX + 12, y: headerY + HEADER_HEIGHT - 16, font: bold, size: 8, color: MUTED_COLOR });
  const numeroText = String(draft.numero || '');
  const numeroSize = fitFontSize(numeroText, bold, metaWidth - 24, 20, 12);
  page.drawText(numeroText, { x: metaX + 12, y: headerY + HEADER_HEIGHT - 18 - numeroSize, font: bold, size: numeroSize, color: BORDER_COLOR });
  page.drawText(`Fecha: ${formatDate(draft.fecha)}`, { x: metaX + 12, y: headerY + 12, font: regular, size: 10, color: BORDER_COLOR });

  let cursorY = headerY - 24;
  page.drawText(draft.masiva ? 'COTIZACION MASIVA' : 'COTIZACION', { x: PAGE_MARGIN, y: cursorY, font: bold, size: 16, color: BORDER_COLOR });
  cursorY -= 26;

  const infoEntries = [
    ['Sres.', draft.cliente || ''],
    ['Fecha documento', formatDate(draft.fecha)],
    ['RUT', draft.rut || ''],
    ['Vendedor', draft.vendedor || ''],
    ['Direccion', draft.direccion || ''],
    ['Comuna', draft.comuna || ''],
    ['Telefono', draft.telefono || ''],
    ['Solicitado por', draft.solicitadoPor || ''],
  ];
  const colWidth = contentWidth / 2;
  for (let i = 0; i < infoEntries.length; i += 2) {
    const row = [infoEntries[i], infoEntries[i + 1]].filter(Boolean);
    const rowHeight = Math.max(...row.map(([, value]) => Math.max(28, 18 + (wrapText(String(value || ''), regular, 10, colWidth - 16).length * 12))), 30);
    row.forEach(([label, value], idx) => {
      const x = PAGE_MARGIN + (idx * colWidth);
      drawBox(page, { x, y: cursorY - rowHeight, width: colWidth, height: rowHeight });
      page.drawText(label, { x: x + 8, y: cursorY - 12, font: bold, size: 8, color: MUTED_COLOR });
      drawWrapped(page, String(value || '—'), { x: x + 8, y: cursorY - 24, font: regular, size: 10, maxWidth: colWidth - 16, lineHeight: 12 });
    });
    cursorY -= rowHeight;
  }
  cursorY -= 14;
  page.drawText('Tenemos el agrado de cotizar a usted lo siguiente:', { x: PAGE_MARGIN, y: cursorY, font: regular, size: 10, color: BORDER_COLOR });
  cursorY -= 18;

  const columns = [
    { label: 'Item', width: 26 },
    { label: 'Codigo', width: 58 },
    { label: 'N Parte', width: 64 },
    { label: 'Descripcion', width: 166 },
    { label: 'Unid.', width: 40 },
    { label: 'Cant.', width: 38 },
    { label: 'P. Unit.', width: 52 },
    { label: 'Dcto', width: 34 },
    { label: 'Total', width: 53 },
  ];
  const tableWidth = columns.reduce((sum, col) => sum + col.width, 0);
  const scale = contentWidth / tableWidth;
  const cols = columns.map(col => ({ ...col, width: col.width * scale }));
  const headerHeight = 22;
  let x = PAGE_MARGIN;
  cols.forEach((col) => {
    drawBox(page, { x, y: cursorY - headerHeight, width: col.width, height: headerHeight, fillColor: LIGHT_FILL });
    drawWrapped(page, col.label, { x: x + 4, y: cursorY - 13, font: bold, size: 8, maxWidth: col.width - 8, lineHeight: 10, align: 'center' });
    x += col.width;
  });
  cursorY -= headerHeight;

  let printableItem = 0;
  for (const item of draft.items || []) {
    const isInfo = item?.tipo === 'info';
    const rowHeight = isInfo ? 22 : Math.max(
      24,
      10 + (wrapText(String(item.descripcion || ''), regular, 9, cols[3].width - 8).length * 11),
    );
    if (cursorY - rowHeight < PAGE_MARGIN + 120) {
      page = pdfDoc.addPage(PAGE_SIZE);
      cursorY = pageHeight - PAGE_MARGIN;
    }
    if (isInfo) {
      drawBox(page, { x: PAGE_MARGIN, y: cursorY - rowHeight, width: contentWidth, height: rowHeight, fillColor: LIGHT_FILL });
      drawWrapped(page, String(item.descripcion || ''), { x: PAGE_MARGIN + 6, y: cursorY - 14, font: bold, size: 9, maxWidth: contentWidth - 12, lineHeight: 10 });
      cursorY -= rowHeight;
      continue;
    }
    let cellX = PAGE_MARGIN;
    const values = [
      String(++printableItem),
      item.codigo || '',
      item.parte || '',
      item.descripcion || '',
      item.unidad || '',
      String(item.cantidad || 0),
      `$${Number(item.precio || 0).toLocaleString('es-CL')}`,
      String(item.dcto || 0),
      `$${lineTotal(item).toLocaleString('es-CL')}`,
    ];
    cols.forEach((col, index) => {
      drawBox(page, { x: cellX, y: cursorY - rowHeight, width: col.width, height: rowHeight });
      drawWrapped(page, values[index], { x: cellX + 4, y: cursorY - 14, font: regular, size: 9, maxWidth: col.width - 8, lineHeight: 10, align: index === 3 ? 'left' : 'center' });
      cellX += col.width;
    });
    cursorY -= rowHeight;
  }

  const details = String(draft.detalles || '').trim();
  if (details) {
    cursorY -= 14;
    page.drawText('Descripcion Adicional', { x: PAGE_MARGIN, y: cursorY, font: bold, size: 11, color: BORDER_COLOR });
    const detailsHeight = Math.max(70, 22 + (wrapText(details, regular, 10, contentWidth - 20).length * 12));
    drawBox(page, { x: PAGE_MARGIN, y: cursorY - detailsHeight - 8, width: contentWidth, height: detailsHeight, fillColor: LIGHT_FILL });
    drawWrapped(page, details, { x: PAGE_MARGIN + 10, y: cursorY - 22, font: regular, size: 10, maxWidth: contentWidth - 20, lineHeight: 12 });
    cursorY -= detailsHeight + 18;
  }

  const totalsX = PAGE_MARGIN + contentWidth - 220;
  const totalRows = [
    ['Neto', `$${neto.toLocaleString('es-CL')}`],
    ['Monto Exento', '$0'],
    ['I.V.A. (19%)', `$${iva.toLocaleString('es-CL')}`],
    ['Total', `$${total.toLocaleString('es-CL')}`],
  ];
  totalRows.forEach(([label, value]) => {
    drawBox(page, { x: totalsX, y: cursorY - 24, width: 220, height: 24 });
    page.drawLine({ start: { x: totalsX + 100, y: cursorY }, end: { x: totalsX + 100, y: cursorY - 24 }, thickness: 1, color: BORDER_COLOR });
    page.drawText(label, { x: totalsX + 8, y: cursorY - 15, font: bold, size: 9, color: BORDER_COLOR });
    drawWrapped(page, value, { x: totalsX + 108, y: cursorY - 15, font: regular, size: 9, maxWidth: 104, lineHeight: 10, align: 'right' });
    cursorY -= 24;
  });

  cursorY -= 16;
  page.drawText('Observaciones', { x: PAGE_MARGIN, y: cursorY, font: bold, size: 11, color: BORDER_COLOR });
  drawBox(page, { x: PAGE_MARGIN, y: cursorY - 60, width: contentWidth, height: 52 });
  cursorY -= 74;
  page.drawText(`Cotizacion emitida por ${empresaNombre}. Valores netos afectos a IVA, salvo indicacion contraria.`, {
    x: PAGE_MARGIN,
    y: cursorY,
    font: regular,
    size: 9,
    color: MUTED_COLOR,
  });

  return pdfDoc.save();
}
