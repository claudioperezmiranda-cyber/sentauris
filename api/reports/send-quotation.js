import { Resend } from 'resend';
import { buildQuotationEmailPdf } from '../../src/modules/reports/quotationEmail/buildQuotationEmailPdf.js';

const json = (res, status, payload) => {
  res.status(status).setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
};

const required = (value) => String(value || '').trim();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    json(res, 405, { error: 'Method not allowed' });
    return;
  }

  try {
    const apiKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.RESEND_FROM_EMAIL;
    const fromName = process.env.RESEND_FROM_NAME || 'Sentauris ERP';
    if (!apiKey || !fromEmail) {
      json(res, 503, { error: 'El envio de correos no esta configurado. Define RESEND_API_KEY y RESEND_FROM_EMAIL en Vercel.' });
      return;
    }

    const recipient = required(req.body?.recipientEmail);
    const quotation = req.body?.quotation || {};
    const company = req.body?.company || {};
    if (!recipient) {
      json(res, 400, { error: 'recipientEmail es obligatorio.' });
      return;
    }
    if (!quotation?.numero) {
      json(res, 400, { error: 'La cotizacion no contiene un numero valido.' });
      return;
    }

    const pdfBytes = await buildQuotationEmailPdf(quotation, company);
    const resend = new Resend(apiKey);
    const total = Number(quotation.total || 0).toLocaleString('es-CL');
    const subject = required(req.body?.subject) || `Cotizacion ${quotation.numero}`;
    const body = required(req.body?.body) || [
      'Estimados,',
      '',
      `Se adjunta la cotizacion ${quotation.numero} por un total de $${total}.`,
      '',
      'Saludos cordiales.',
    ].join('\n');

    const { data, error } = await resend.emails.send({
      from: `${fromName} <${fromEmail}>`,
      to: [recipient],
      subject,
      text: body,
      attachments: [{
        filename: `cotizacion_${String(quotation.numero).replace(/[^\w.-]+/g, '_')}.pdf`,
        content: Buffer.from(pdfBytes),
      }],
    });

    if (error) {
      json(res, 502, { error: error.message || 'No fue posible enviar el correo.' });
      return;
    }

    json(res, 200, { ok: true, id: data?.id || null });
  } catch (error) {
    json(res, 500, { error: error.message || 'No fue posible generar el correo con adjunto.' });
  }
}
