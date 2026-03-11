import {
  correctionMatchesIssue,
  getIssueSeverityLabel,
  getIssueSeverityTone,
  normalizeDictionaryEntry,
} from "@/lib/script-generator";

export default function ReviewIssuesPanel({
  issues,
  currentValidation,
  currentCorrections,
  currentVideoId,
  customDictionary,
  isValidatingScripts,
  showAdvanced,
  onApplyIssueSuggestion,
  onIgnoreIssue,
  onAddToDictionary,
  getSuggestionButtonLabel,
}) {
  const customDictionarySet = new Set((customDictionary || []).map((entry) => normalizeDictionaryEntry(entry)));

  if (!currentValidation?.issues?.length) return null;

  return (
    <div className="notes-box issues-box">
      <h4>{showAdvanced ? "Observaciones del video actual" : "Observaciones prioritarias"}</h4>
      <div className="issue-list">
        {issues.map((issue, index) => {
          const matchingHistory = currentCorrections.find((entry) => correctionMatchesIssue(entry, issue));
          const dictionaryToken = normalizeDictionaryEntry(issue.dictionaryCandidate || "");
          const isDictionaryEntry = dictionaryToken && customDictionarySet.has(dictionaryToken);

          return (
            <article key={`${currentValidation.id}-${index}`} className="issue-card">
              <div className="issue-card-header">
                <strong>{issue.message}</strong>
                <span className={`status-chip ${getIssueSeverityTone(issue)}`}>{getIssueSeverityLabel(issue)}</span>
              </div>

              {matchingHistory ? (
                <span
                  className={`status-chip ${
                    matchingHistory.status === "resuelta" ? "is-success" : "is-warning"
                  }`}
                >
                  {matchingHistory.status === "resuelta" ? "Ya aplicada y resuelta" : "Ya aplicada, revisar"}
                </span>
              ) : null}

              {issue.context ? <p>{issue.context}</p> : null}

              {issue.suggestions?.length ? (
                <div className="issue-actions-row">
                  {issue.suggestions.slice(0, 3).map((suggestion) => (
                    <button
                      key={`${index}-${suggestion}`}
                      type="button"
                      className="ghost-button issue-action-button"
                      onClick={() => onApplyIssueSuggestion(currentVideoId, issue, suggestion)}
                      disabled={isValidatingScripts}
                    >
                      {getSuggestionButtonLabel(suggestion)}
                    </button>
                  ))}
                </div>
              ) : null}

              <div className="issue-actions-row">
                <button
                  type="button"
                  className="ghost-button issue-action-button"
                  onClick={() => onIgnoreIssue(currentVideoId, issue)}
                  disabled={isValidatingScripts}
                >
                  Ignorar
                </button>
                <button
                  type="button"
                  className="ghost-button issue-action-button"
                  onClick={() => onAddToDictionary(currentVideoId, issue)}
                  disabled={isValidatingScripts || !issue.dictionaryCandidate || isDictionaryEntry}
                >
                  {isDictionaryEntry ? "Ya esta en el diccionario" : "Agregar al diccionario"}
                </button>
              </div>
            </article>
          );
        })}
      </div>

      {!showAdvanced && currentValidation.issues.length > 1 ? (
        <p className="supporting-text compact-helper-text">
          Hay mas observaciones disponibles en la vista avanzada.
        </p>
      ) : null}
    </div>
  );
}
