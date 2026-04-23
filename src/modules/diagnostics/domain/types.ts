export type CatalogItemType = 'replacement' | 'repair_service';

export type DiagnosticItemGroup =
  | 'electrical'
  | 'mechanical'
  | 'hydraulic'
  | 'biosafety'
  | 'gases'
  | 'motors'
  | 'generic';

export interface DiagnosticEquipmentContext {
  name: string;
  brand?: string;
  model?: string;
  category?: string;
  serviceArea?: string;
}

export interface DiagnosticSelectedItemInput {
  id?: string | number;
  code: string;
  name: string;
  itemType?: CatalogItemType | string | null;
  quantity?: number | string | null;
  optionalNote?: string | null;
}

export interface DiagnosticReportInput {
  workOrderId: string;
  equipment: DiagnosticEquipmentContext;
  findingsText: string;
  selectedItems: DiagnosticSelectedItemInput[];
}

export interface NormalizedDiagnosticSelectedItem {
  id?: string | number;
  code: string;
  name: string;
  itemType: CatalogItemType;
  quantity: number;
  optionalNote?: string;
}

export interface GeneratedDiagnosticReport {
  diagnosisTitle: 'DIAGNÓSTICO TÉCNICO';
  diagnosisText: string;
  conclusionTitle: 'CONCLUSIÓN DEL DIAGNÓSTICO';
  conclusionText: string;
  fullReportText: string;
  normalizedItems: NormalizedDiagnosticSelectedItem[];
}
