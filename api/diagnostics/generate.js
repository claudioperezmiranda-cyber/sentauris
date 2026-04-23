import { generateDiagnosticReport } from '../../src/modules/diagnostics/lib/generateDiagnosticReport.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const report = generateDiagnosticReport(req.body || {});
    res.status(200).json(report);
  } catch (error) {
    res.status(400).json({ error: error.message || 'No fue posible generar el diagnóstico.' });
  }
}
