import { generateDiagnosticReport } from '../lib/generateDiagnosticReport.js';
import { saveGeneratedDiagnostic } from '../repository/saveGeneratedDiagnostic.js';

export const generateAndSaveDiagnostic = async ({
  input,
  equipmentId = null,
  createdBy = null,
  persist = true,
}) => {
  const report = generateDiagnosticReport(input);

  if (!persist) {
    return { report, persistence: null };
  }

  const persistence = await saveGeneratedDiagnostic({
    workOrderId: input.workOrderId,
    findingsText: input.findingsText,
    equipmentId,
    createdBy,
    normalizedItems: report.normalizedItems,
    report,
    inputSnapshot: {
      workOrderId: input.workOrderId,
      equipment: input.equipment,
      findingsText: input.findingsText,
      selectedItems: report.normalizedItems,
    },
  });

  return { report, persistence };
};

export default generateAndSaveDiagnostic;
