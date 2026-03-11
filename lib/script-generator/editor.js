function replaceTextRange(text = "", offset = 0, length = 0, replacement = "") {
  return `${text.slice(0, offset)}${replacement}${text.slice(offset + length)}`;
}

function replaceFirstOccurrence(text = "", search = "", replacement = "") {
  if (!search) return text;
  const index = text.indexOf(search);
  if (index < 0) return text;
  return replaceTextRange(text, index, search.length, replacement);
}

export function applyIssueSuggestionToScript(scriptText = "", issue, suggestion = "") {
  if (!suggestion) return scriptText;

  if (Number.isInteger(issue?.offset) && Number.isInteger(issue?.length)) {
    const currentMatch = scriptText.slice(issue.offset, issue.offset + issue.length);
    if (!issue.matchText || currentMatch === issue.matchText || currentMatch.length === issue.length) {
      return replaceTextRange(scriptText, issue.offset, issue.length, suggestion);
    }
  }

  if (issue?.matchText) {
    return replaceFirstOccurrence(scriptText, issue.matchText, suggestion);
  }

  return scriptText;
}

function replaceBlockSection(scriptText = "", startLabel = "", endLabel = "", nextText = "") {
  const startToken = `${startLabel}\n`;
  const startIndex = scriptText.indexOf(startToken);
  if (startIndex < 0) return scriptText;

  const bodyStart = startIndex + startToken.length;
  const endToken = endLabel ? `\n\n${endLabel}\n` : "";
  const endIndex = endLabel ? scriptText.indexOf(endToken, bodyStart) : -1;

  if (endLabel && endIndex < 0) return scriptText;
  if (!endLabel) {
    return `${scriptText.slice(0, bodyStart)}${nextText}`;
  }

  return `${scriptText.slice(0, bodyStart)}${nextText}${scriptText.slice(endIndex)}`;
}

export function applyLibraryPhraseToScript(scriptText = "", slot = "", phraseText = "") {
  if (slot === "opening") {
    return replaceBlockSection(scriptText, "Frase inicial", "Desarrollo", phraseText);
  }

  if (slot === "closing") {
    return replaceBlockSection(scriptText, "Frase final", "", phraseText);
  }

  if (slot === "transition") {
    const closingToken = "\n\nFrase final\n";
    const closingIndex = scriptText.indexOf(closingToken);
    const developmentToken = "Desarrollo\n";
    const developmentIndex = scriptText.indexOf(developmentToken);

    if (closingIndex < 0 || developmentIndex < 0) return scriptText;
    const beforeClosing = scriptText.slice(0, closingIndex).trimEnd();
    if (beforeClosing.includes(phraseText)) return scriptText;
    return `${beforeClosing}\n\n${phraseText}${scriptText.slice(closingIndex)}`;
  }

  return scriptText;
}

export function buildCorrectionEntry(issue, suggestion = "") {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    message: issue?.message || "",
    source: issue?.source || "",
    ruleId: issue?.ruleId || "",
    suggestion,
    status: "checking",
  };
}

export function correctionMatchesIssue(entry, issue) {
  if (!entry || !issue) return false;
  if (entry.ruleId && issue.ruleId) return entry.ruleId === issue.ruleId;
  return entry.message === issue.message && entry.source === issue.source;
}

export function syncCorrectionHistory(currentHistory = {}, report) {
  if (!report?.videos?.length) return currentHistory;

  const nextHistory = { ...currentHistory };

  for (const videoReport of report.videos) {
    const entries = currentHistory[videoReport.id] || [];
    if (!entries.length) continue;

    nextHistory[videoReport.id] = entries.map((entry) => ({
      ...entry,
      status: videoReport.issues?.some((issue) => correctionMatchesIssue(entry, issue))
        ? "revisar"
        : "resuelta",
    }));
  }

  return nextHistory;
}
