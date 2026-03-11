export { applyIssueSuggestionToScript, applyLibraryPhraseToScript, buildCorrectionEntry, correctionMatchesIssue, normalizeDictionaryEntry, syncCorrectionHistory } from "@/lib/script-generator/editor";
export { getIssueSeverityLabel, getIssueSeverityTone, getPriorityIssues, normalizeIssueSeverity, sortIssuesBySeverity, summarizeIssuesBySeverity } from "@/lib/script-generator/alerts";
export { buildScriptDiff } from "@/lib/script-generator/diff";
export {
  buildEditableVideo,
  buildRepetitionReport,
  buildTotals,
  buildVideoBalanceSummary,
  formatFileSize,
  getDocumentConfidenceState,
  getRangeMessage,
  getRangeTone,
  getScriptExcerpt,
  getVideoDurationStatus,
} from "@/lib/script-generator/metrics";
export { downloadScriptsPdf } from "@/lib/script-generator/pdf";
export { createScriptGeneratorTour } from "@/lib/script-generator/tour";
export { ACCEPTED_TYPES, getCurrentStepId, getNextActionCard, getOverallSemaphore, getProcessSteps, getStatusChipClass } from "@/lib/script-generator/workflow";
