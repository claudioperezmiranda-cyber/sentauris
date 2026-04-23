import { generateDiagnosticReport } from '../lib/generateDiagnosticReport.js';

export const buildFrontendDiagnosticPreview = ({ workOrderId, formData, selectedItems, findingsText }) =>
  generateDiagnosticReport({
    workOrderId,
    equipment: {
      name: formData.tipoEquipo || 'Equipo',
      brand: formData.marca || '',
      model: formData.modelo || '',
      category: formData.tipoEquipo || '',
      serviceArea: formData.ubicacionArea || '',
    },
    findingsText,
    selectedItems: selectedItems.map((item) => ({
      id: item.id,
      code: item.sku || item.part_number || item.code || 'SIN-CODIGO',
      name: item.name || 'Item sin nombre',
      itemType: item.item_type,
      quantity: item.qty,
      optionalNote: item.optionalNote,
    })),
  });

export default buildFrontendDiagnosticPreview;
