export { generateDiagnosticReport } from './lib/generateDiagnosticReport.js';
export {
  normalizeSelectedItems,
  classifyItemGroup,
  buildFailureDescription,
  buildActionText,
  buildImpactText,
  buildConclusion,
} from './lib/helpers.js';
export { saveGeneratedDiagnostic } from './repository/saveGeneratedDiagnostic.js';
export { generateAndSaveDiagnostic } from './service/generateAndSaveDiagnostic.js';
