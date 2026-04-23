import { Resend } from 'resend';
import { buildCorrectiveEmailPdf } from '../../src/modules/reports/correctiveEmail/buildCorrectiveEmailPdf.js';

const json = (res, status, payload) => {
  res.status(status).setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
};

const required = (value) => String(value || '').trim();

const defaultSubject = (report = {}) => `Informe ${report?.orden?.folio || 'correctivo'}`;

const defaultBody = (report = {}) => {
  const equipo = [report?.orden?.tipo_equipo, report?.orden?.marca, report?.orden?.modelo].filter(Boolean).join(' ');
  return [
    'Estimados,',
    '',
    `Se adjunta el informe PDF ${report?.orden?.folio || ''}${equipo ? ` correspondiente al equipo ${equipo}.` : '.'}`,
    '',
    'Saludos cordiales.',
  ].join('\n');
};

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
      json(res, 503, {
        error: 'El envio de correos no esta configurado. Define RESEND_API_KEY y RESEND_FROM_EMAIL en Vercel.',
      });
      return;
    }

    const recipient = required(req.body?.recipientEmail);
    const report = req.body?.report || {};
    if (!recipient) {
      json(res, 400, { error: 'recipientEmail es obligatorio.' });
      return;
    }
    if (!report?.orden?.folio) {
      json(res, 400, { error: 'El reporte correctivo no contiene un folio valido.' });
      return;
    }

    const pdfBytes = await buildCorrectiveEmailPdf(report);
    const resend = new Resend(apiKey);
    const subject = required(req.body?.subject) || defaultSubject(report);
    const body = required(req.body?.body) || defaultBody(report);
    const filename = `informe_${String(report.orden.folio).replace(/[^\w.-]+/g, '_')}.pdf`;

    const { data, error } = await resend.emails.send({
      from: `${fromName} <${fromEmail}>`,
      to: [recipient],
      subject,
      text: body,
      attachments: [
        {
          filename,
          content: Buffer.from(pdfBytes),
        },
      ],
    });

    if (error) {
      json(res, 502, { error: error.message || 'No fue posible enviar el correo.' });
      return;
    }

    json(res, 200, { ok: true, id: data?.id || null, filename });
  } catch (error) {
    json(res, 500, { error: error.message || 'No fue posible generar el correo con adjunto.' });
  }
}
