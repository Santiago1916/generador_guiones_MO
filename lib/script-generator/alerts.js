const SEVERITY_ORDER = {
  blocking: 0,
  important: 1,
  suggested: 2,
};

export function normalizeIssueSeverity(issue = {}) {
  if (issue.severity) return issue.severity;
  if (issue.level === "error") return "blocking";
  if (issue.blocksDownload) return "important";
  return "suggested";
}

export function getIssueSeverityLabel(issue = {}) {
  const severity = normalizeIssueSeverity(issue);
  if (severity === "blocking") return "Bloqueante";
  if (severity === "important") return "Importante";
  return "Sugerida";
}

export function getIssueSeverityTone(issue = {}) {
  const severity = normalizeIssueSeverity(issue);
  if (severity === "blocking") return "is-error";
  if (severity === "important") return "is-warning";
  return "is-success";
}

export function sortIssuesBySeverity(issues = []) {
  return [...issues].sort((left, right) => {
    const leftOrder = SEVERITY_ORDER[normalizeIssueSeverity(left)] ?? 3;
    const rightOrder = SEVERITY_ORDER[normalizeIssueSeverity(right)] ?? 3;
    return leftOrder - rightOrder;
  });
}

export function summarizeIssuesBySeverity(issues = []) {
  const summary = {
    blocking: 0,
    important: 0,
    suggested: 0,
  };

  issues.forEach((issue) => {
    summary[normalizeIssueSeverity(issue)] += 1;
  });

  return summary;
}

export function getPriorityIssues(issues = [], max = 2) {
  return sortIssuesBySeverity(issues).slice(0, max);
}
