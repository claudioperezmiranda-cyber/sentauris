import {
  normalizeSelectedItems,
  classifyItemGroup,
  buildFailureDescription,
  buildActionText,
  buildImpactText,
  buildConclusion,
} from './helpers.js';

const buildEquipmentLabel = (equipment = {}) =>
  [
    equipment.name || 'equipo',
    equipment.brand || '',
    equipment.model || '',
  ].filter(Boolean).join(' ');

const validateInput = (input = {}) => {
  if (!input.workOrderId) {
    throw new Error('workOrderId es requerido para generar el diagnóstico.');
  }
  if (!input.equipment?.name) {
    throw new Error('equipment.name es requerido para generar el diagnóstico.');
  }
  if (!Array.isArray(input.selectedItems) || input.selectedItems.length === 0) {
    throw new Error('Debe seleccionar al menos un repuesto o servicio para generar el diagnóstico.');
  }
};

export const generateDiagnosticReport = (input) => {
  validateInput(input);

  // La normalización consolida duplicados, corrige cantidades inválidas y resuelve el tipo del ítem.
  const normalizedItems = normalizeSelectedItems(input.selectedItems);
  if (normalizedItems.length === 0) {
    throw new Error('No fue posible normalizar los ítems seleccionados para el diagnóstico.');
  }

  const equipmentLabel = buildEquipmentLabel(input.equipment);
  const introduction = input.promptInstructions
    ? `Tras la evaluación técnica del ${equipmentLabel}, y conforme al criterio de redacción definido para el informe, se identificaron fallas que afectan su funcionamiento, seguridad y condición operativa.`
    : `Tras la evaluación técnica del ${equipmentLabel}, se identificaron fallas que afectan su funcionamiento, seguridad y condición operativa.`;

  const bulletLines = normalizedItems.map((item, index) => {
    const group = classifyItemGroup(item);
    const failure = buildFailureDescription({
      item,
      findingsText: input.findingsText,
      group,
      variationIndex: index,
    });
    const action = buildActionText({ item, group });
    const impact = buildImpactText({ group, variationIndex: index });

    return `• (${item.code} - ${item.name}) x${item.quantity}: ${failure} ${action} ${impact}`;
  });

  const diagnosisText = [
    introduction,
    'Fallas detectadas:',
    ...bulletLines,
  ].join('\n');

  const conclusionText = buildConclusion({
    equipment: input.equipment,
    normalizedItems,
    findingsText: input.findingsText,
    promptInstructions: input.promptInstructions,
  });

  const diagnosisTitle = 'DIAGNÓSTICO TÉCNICO';
  const conclusionTitle = 'CONCLUSIÓN DEL DIAGNÓSTICO';
  const fullReportText = [
    diagnosisTitle,
    diagnosisText,
    '',
    conclusionTitle,
    conclusionText,
  ].join('\n');

  return {
    diagnosisTitle,
    diagnosisText,
    conclusionTitle,
    conclusionText,
    fullReportText,
    normalizedItems,
  };
};

export default generateDiagnosticReport;
