const ITEM_TYPE_REPLACEMENT = 'replacement';
const ITEM_TYPE_REPAIR = 'repair_service';

const GROUP_KEYWORDS = [
  { group: 'electrical', keywords: ['fuente', 'bateria', 'tarjeta', 'modulo', 'fusible', 'transformador', 'cableado', 'pantalla', 'touch', 'control', 'electrico', 'electronico', 'placa', 'display', 'teclado'] },
  { group: 'mechanical', keywords: ['rueda', 'freno', 'baranda', 'estructura', 'soldadura', 'respaldo', 'pedal', 'soporte', 'chasis', 'bisagra', 'base', 'columna', 'soporteria'] },
  { group: 'hydraulic', keywords: ['cilindro', 'bombin', 'piston', 'valvula', 'aceite', 'electroiman', 'hidraul', 'bomba', 'reten', 'sello'] },
  { group: 'biosafety', keywords: ['colchon', 'forro', 'tapizado', 'cubierta', 'acrilico', 'superficie', 'protector', 'espuma', 'funda'] },
  { group: 'gases', keywords: ['oxigeno', 'o2', 'vacio', 'aire', 'n2o', 'manguera', 'flange', 'gas', 'caudal', 'regulador', 'toma'] },
  { group: 'motors', keywords: ['motor', 'actuador', 'hi-low', 'hilow', 'pierna', 'elevacion', 'traslacion', 'movimiento', 'husillo'] },
];

const GROUP_CONFIG = {
  electrical: {
    failures: [
      'Se evidenció una alteración en el subsistema eléctrico/electrónico asociado, con respuesta inestable y pérdida de desempeño durante la operación.',
      'Se identificó falla funcional en el conjunto eléctrico/electrónico intervenido, con comportamiento irregular en la alimentación o control del sistema.',
      'El componente presenta deterioro operativo compatible con una falla eléctrica/electrónica que limita la respuesta normal del equipo.',
    ],
    impact: [
      'Esta condición afecta alimentación, control o respuesta del sistema y compromete la operatividad general del equipo.',
      'La incidencia altera la estabilidad eléctrica y reduce la confiabilidad funcional del equipo durante su uso.',
      'El desperfecto compromete la continuidad de operación y la respuesta segura del sistema intervenido.',
    ],
    repairAction: 'Corresponde reparación técnica del conjunto para restituir alimentación, control y respuesta estable del sistema.',
  },
  mechanical: {
    failures: [
      'Se observó desgaste, deformación o pérdida de ajuste en el conjunto mecánico/estructural relacionado con el hallazgo informado.',
      'Se verificó deterioro físico en el elemento mecánico/estructural, con compromiso de su condición de trabajo y soporte.',
      'El componente presenta daño mecánico recuperable o severo, con afectación directa sobre su comportamiento estructural.',
    ],
    impact: [
      'Esta condición compromete estabilidad, desplazamiento o seguridad del paciente durante la utilización del equipo.',
      'La falla reduce la seguridad operativa y afecta el uso estable del equipo en condiciones normales de servicio.',
      'El deterioro impacta la integridad estructural y aumenta el riesgo operativo asociado al equipo.',
    ],
    repairAction: 'Corresponde reparación mecánica del conjunto afectado para recuperar ajuste, resistencia y funcionamiento seguro.',
  },
  hydraulic: {
    failures: [
      'Se identificó deterioro funcional en el circuito hidráulico/neumático, con pérdida de respuesta, estanqueidad o retención.',
      'El elemento presenta falla en su desempeño hidráulico/neumático, con comportamiento irregular bajo carga o movimiento.',
      'Se evidenció compromiso del componente hidráulico/neumático, compatible con fuga, pérdida de presión o respuesta deficiente.',
    ],
    impact: [
      'Esta condición afecta elevación, posicionamiento o retención de carga del equipo.',
      'La falla compromete maniobras de ajuste y disminuye la estabilidad funcional bajo operación.',
      'El desperfecto reduce la capacidad de posicionamiento seguro y confiable del equipo.',
    ],
    repairAction: 'Corresponde reparación especializada del circuito para recuperar estanqueidad, retención y respuesta funcional.',
  },
  biosafety: {
    failures: [
      'Se constató deterioro superficial y funcional del elemento, con pérdida de integridad en condiciones de uso clínico.',
      'El componente presenta daño visible en su terminación o cubierta, con afectación de su condición higiénica y de soporte.',
      'Se observó desgaste material en la superficie intervenida, con compromiso de su integridad y continuidad de uso.',
    ],
    impact: [
      'Esta condición afecta higiene, integridad superficial o condiciones de uso clínico del equipo.',
      'El deterioro compromete bioseguridad y dificulta mantener condiciones adecuadas de limpieza y protección.',
      'La falla impacta la presentación sanitaria del equipo y su aptitud para uso asistencial seguro.',
    ],
    repairAction: 'Corresponde reparación o reacondicionamiento del elemento para recuperar integridad superficial y condiciones de bioseguridad.',
  },
  gases: {
    failures: [
      'Se evidenció una alteración en el sistema de gases clínicos, con pérdida de estanqueidad o respuesta funcional del punto intervenido.',
      'El conjunto presenta falla asociada al manejo o conducción de gases, con deterioro operativo verificable.',
      'Se identificó compromiso técnico en el elemento del sistema de gases, con comportamiento incompatible con una operación segura.',
    ],
    impact: [
      'Esta condición compromete hermeticidad, suministro o seguridad operativa del sistema de gases.',
      'La incidencia afecta la continuidad del servicio de gases clínicos y eleva el riesgo operativo del equipo.',
      'El desperfecto reduce la seguridad del sistema y requiere corrección para restituir un uso confiable.',
    ],
    repairAction: 'Corresponde reparación certificada del punto afectado para restablecer hermeticidad, suministro y seguridad operativa.',
  },
  motors: {
    failures: [
      'Se verificó falla funcional en el sistema motriz/actuador asociado, con respuesta deficiente o ausencia de movimiento.',
      'El componente presenta deterioro operativo en el accionamiento, con pérdida de fuerza, recorrido o sincronía funcional.',
      'Se identificó compromiso del conjunto motriz/actuador que limita la ejecución normal de los movimientos del equipo.',
    ],
    impact: [
      'Esta condición afecta movimientos y posicionamiento funcional del equipo.',
      'La falla compromete la capacidad de ajuste y respuesta mecánica del equipo durante la operación.',
      'El desperfecto limita maniobras operativas y reduce la funcionalidad esperada del equipo.',
    ],
    repairAction: 'Corresponde reparación del sistema de accionamiento para recuperar movimiento, recorrido y respuesta estable.',
  },
  generic: {
    failures: [
      'Se identificó una condición de falla o deterioro en el elemento seleccionado, coherente con los hallazgos técnicos reportados.',
      'El ítem presenta una alteración funcional que requiere intervención correctiva para restablecer su desempeño.',
      'Se verificó compromiso operativo en el componente indicado, con afectación sobre el funcionamiento esperado.',
    ],
    impact: [
      'Esta condición afecta el desempeño general del equipo y reduce su confiabilidad operativa.',
      'La incidencia compromete el funcionamiento estable del equipo y requiere corrección técnica.',
      'El desperfecto disminuye la seguridad y continuidad operativa del equipo.',
    ],
    repairAction: 'Corresponde reparación técnica del elemento para recuperar su desempeño funcional.',
  },
};

const cleanText = (value = '') =>
  String(value || '')
    .replace(/\s+/g, ' ')
    .trim();

const normalizeKey = (value = '') =>
  cleanText(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

const toTitleCase = (value = '') =>
  cleanText(value)
    .toLowerCase()
    .replace(/(^|\s|[-/(])([a-záéíóúñ])/g, (match, prefix, char) => `${prefix}${char.toUpperCase()}`);

const inferItemType = (item = {}) => {
  const explicit = normalizeKey(item.itemType);
  if (explicit === ITEM_TYPE_REPAIR || explicit === 'repairservice' || explicit === 'servicio' || explicit === 'reparacion') {
    return ITEM_TYPE_REPAIR;
  }
  if (explicit === ITEM_TYPE_REPLACEMENT || explicit === 'repuesto' || explicit === 'componente') {
    return ITEM_TYPE_REPLACEMENT;
  }

  const source = normalizeKey(`${item.code || ''} ${item.name || ''} ${item.optionalNote || ''}`);
  if (/(servicio|reparacion|ajuste|calibracion|mantenimiento|rectificacion|soldadura|mano de obra)/.test(source)) {
    return ITEM_TYPE_REPAIR;
  }
  return ITEM_TYPE_REPLACEMENT;
};

export const normalizeSelectedItems = (items = []) => {
  const consolidated = new Map();

  (Array.isArray(items) ? items : []).forEach((item) => {
    const code = cleanText(item?.code || item?.sku || item?.part_number || '');
    const name = cleanText(item?.name || 'Item sin nombre');
    if (!code && !name) return;

    const itemType = inferItemType(item);
    const quantityValue = Number(item?.quantity ?? item?.qty ?? 1);
    const quantity = Number.isFinite(quantityValue) && quantityValue > 0 ? Math.floor(quantityValue) : 1;
    const optionalNote = cleanText(item?.optionalNote || item?.note || '');
    const key = `${normalizeKey(code || name)}::${itemType}`;
    const previous = consolidated.get(key);

    if (previous) {
      previous.quantity += quantity;
      if (optionalNote) {
        const notes = new Set([...(previous.optionalNote ? previous.optionalNote.split(' | ') : []), optionalNote]);
        previous.optionalNote = Array.from(notes).filter(Boolean).join(' | ');
      }
      return;
    }

    consolidated.set(key, {
      id: item?.id,
      code: code || name.toUpperCase(),
      name: toTitleCase(name),
      itemType,
      quantity,
      optionalNote: optionalNote || undefined,
    });
  });

  return Array.from(consolidated.values());
};

export const classifyItemGroup = (item = {}) => {
  const source = normalizeKey(`${item.code || ''} ${item.name || ''} ${item.optionalNote || ''}`);
  const matched = GROUP_KEYWORDS.find(({ keywords }) => keywords.some((keyword) => source.includes(normalizeKey(keyword))));
  return matched?.group || 'generic';
};

const pickVariant = (list = [], seed = 0) => list[seed % list.length] || '';

const buildContextClause = ({ findingsText, optionalNote }) => {
  const findings = cleanText(findingsText);
  const note = cleanText(optionalNote);
  if (findings && note) {
    return ` En relación con los hallazgos reportados (${findings}) y la observación complementaria (${note}), `;
  }
  if (findings) {
    return ` En relación con los hallazgos reportados (${findings}), `;
  }
  if (note) {
    return ` Considerando la observación complementaria (${note}), `;
  }
  return ' ';
};

export const buildFailureDescription = ({ item, findingsText, group, variationIndex = 0 }) => {
  const groupConfig = GROUP_CONFIG[group] || GROUP_CONFIG.generic;
  const opener = pickVariant(groupConfig.failures, variationIndex);
  return `${opener}${buildContextClause({ findingsText, optionalNote: item.optionalNote })}se concluye que el elemento requiere intervención correctiva específica.`;
};

export const buildActionText = ({ item, group }) => {
  const quantityLabel = item.quantity > 1 ? ` por ${item.quantity} unidades nuevas` : ' por unidad nueva';
  if (item.itemType === ITEM_TYPE_REPLACEMENT) {
    return `Corresponde reemplazo${quantityLabel}.`;
  }
  const groupConfig = GROUP_CONFIG[group] || GROUP_CONFIG.generic;
  return groupConfig.repairAction;
};

export const buildImpactText = ({ group, variationIndex = 0 }) => {
  const groupConfig = GROUP_CONFIG[group] || GROUP_CONFIG.generic;
  return pickVariant(groupConfig.impact, variationIndex);
};

export const buildConclusion = ({ equipment = {}, normalizedItems = [], findingsText = '' }) => {
  const equipmentName = cleanText([
    equipment.name || 'equipo',
    equipment.brand || '',
    equipment.model || '',
  ].filter(Boolean).join(' '));
  const area = cleanText(equipment.serviceArea || '');
  const criticalGroups = new Set(['electrical', 'gases', 'motors', 'hydraulic']);
  const totalQuantity = normalizedItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
  const hasCriticalItem = normalizedItems.some((item) => criticalGroups.has(classifyItemGroup(item)));
  const hasRepairs = normalizedItems.some((item) => item.itemType === ITEM_TYPE_REPAIR);
  const hasReplacements = normalizedItems.some((item) => item.itemType === ITEM_TYPE_REPLACEMENT);

  const status = hasCriticalItem
    ? 'presenta fallas de criticidad operativa alta'
    : totalQuantity > 2
      ? 'presenta múltiples fallas que inciden en su condición operativa'
      : 'presenta fallas que afectan su desempeño funcional';

  const scope = hasRepairs && hasReplacements
    ? 'considerando intervenciones de reparación y reemplazo según corresponda a cada elemento diagnosticado'
    : hasRepairs
      ? 'mediante la ejecución de las reparaciones técnicas indicadas'
      : 'mediante el reemplazo de los componentes comprometidos';

  const context = cleanText(findingsText)
    ? ` Los hallazgos técnicos consignados evidencian ${cleanText(findingsText)}.`
    : '';

  return `El ${equipmentName}${area ? ` del área ${area}` : ''} ${status}.${context} Para restablecer condiciones adecuadas de operatividad, seguridad y confiabilidad, deben ejecutarse las acciones correctivas indicadas, ${scope}, verificando posteriormente su respuesta funcional antes de su retorno al servicio.`;
};

export const diagnosticsHelpers = {
  cleanText,
  normalizeKey,
  toTitleCase,
  normalizeSelectedItems,
  classifyItemGroup,
  buildFailureDescription,
  buildActionText,
  buildImpactText,
  buildConclusion,
};
