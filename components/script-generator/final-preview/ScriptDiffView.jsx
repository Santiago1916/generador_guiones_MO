import { buildScriptDiff } from "@/lib/script-generator";

function renderSegments(segments = []) {
  return segments.map((segment, index) => (
    <span
      key={`${segment.type}-${index}`}
      className={`diff-token ${segment.type === "added" ? "is-added" : ""}`}
    >
      {segment.text}
    </span>
  ));
}

export default function ScriptDiffView({ originalText, nextText }) {
  const diff = buildScriptDiff(originalText, nextText);

  if (!diff.hasChanges) {
    return (
      <div className="script-diff-card">
        <strong>Sin cambios relevantes</strong>
        <p className="supporting-text">El guion final quedo igual al borrador original.</p>
      </div>
    );
  }

  return (
    <div className="script-diff-card">
      <strong>Cambios aceptados</strong>
      <div className="script-diff-preview">{renderSegments(diff.updatedSegments)}</div>

      {diff.removedText ? (
        <div className="script-diff-removed">
          <span className="status-chip is-warning">Texto retirado o cambiado</span>
          <p>{diff.removedText}</p>
        </div>
      ) : null}
    </div>
  );
}
