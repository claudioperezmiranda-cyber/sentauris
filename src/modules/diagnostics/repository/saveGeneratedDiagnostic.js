import { supabase } from '../../../supabaseClient.js';

const MODEL_NAME = 'local-template-engine-v1';

const isMissingDiagnosticsTableError = (error) => {
  const message = String(error?.message || error || '').toLowerCase();
  return (
    message.includes('schema cache') ||
    message.includes('could not find the table') ||
    message.includes('relation') ||
    message.includes('does not exist')
  ) && (
    message.includes('technical_findings') ||
    message.includes('selected_catalog_items') ||
    message.includes('generated_diagnostics')
  );
};

const buildGeneratedDiagnosticsPayload = ({ workOrderId, report, inputSnapshot, generatedByModel }) => ({
  work_order_id: String(workOrderId),
  diagnosis_text: report.diagnosisText,
  conclusion_text: report.conclusionText,
  full_report_text: report.fullReportText,
  input_snapshot_json: inputSnapshot,
  generated_at: new Date().toISOString(),
  generated_by_model: generatedByModel || MODEL_NAME,
  updated_at: new Date().toISOString(),
});

export const saveGeneratedDiagnostic = async ({
  workOrderId,
  findingsText,
  equipmentId = null,
  createdBy = null,
  normalizedItems = [],
  report,
  inputSnapshot,
}) => {
  if (!workOrderId) throw new Error('workOrderId es requerido para guardar el diagnóstico.');
  if (!report?.fullReportText) throw new Error('El reporte generado es obligatorio para persistir el diagnóstico.');

  // Se guarda el hallazgo original para mantener trazabilidad entre texto libre y reporte final.
  const findingsPayload = {
    work_order_id: String(workOrderId),
    equipment_id: equipmentId != null ? String(equipmentId) : null,
    raw_findings_text: findingsText || '',
    created_by: createdBy,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  try {
    const { data: findingRow, error: findingsError } = await supabase
      .from('technical_findings')
      .insert([findingsPayload])
      .select()
      .single();

    if (findingsError) throw findingsError;

    const { error: deleteSelectedError } = await supabase
      .from('selected_catalog_items')
      .delete()
      .eq('work_order_id', workOrderId);

    if (deleteSelectedError) throw deleteSelectedError;

    if (normalizedItems.length > 0) {
      const selectedRows = normalizedItems.map((item) => ({
        work_order_id: String(workOrderId),
        catalog_item_id: item.id != null ? String(item.id) : null,
        quantity: item.quantity,
        optional_note: item.optionalNote || null,
        created_at: new Date().toISOString(),
      }));

      const { error: selectedItemsError } = await supabase
        .from('selected_catalog_items')
        .insert(selectedRows);

      if (selectedItemsError) throw selectedItemsError;
    }

    const generatedPayload = buildGeneratedDiagnosticsPayload({
      workOrderId,
      report,
      inputSnapshot,
    });

    const { data: generatedDiagnostic, error: generatedError } = await supabase
      .from('generated_diagnostics')
      .upsert([generatedPayload], { onConflict: 'work_order_id' })
      .select()
      .single();

    if (generatedError) throw generatedError;

    return {
      findingRow,
      generatedDiagnostic,
      skipped: false,
    };
  } catch (error) {
    if (isMissingDiagnosticsTableError(error)) {
      console.warn('Persistencia extendida de diagnósticos omitida: faltan tablas nuevas en Supabase.', error);
      return {
        findingRow: null,
        generatedDiagnostic: null,
        skipped: true,
        reason: 'missing_diagnostics_tables',
      };
    }
    throw error;
  }
};

export default saveGeneratedDiagnostic;
