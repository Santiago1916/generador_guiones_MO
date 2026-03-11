import ScriptDiffView from "@/components/script-generator/final-preview/ScriptDiffView";

export default function FinalPreviewCard({
  video,
  index,
  originalVideo,
  isReviewed,
  showAdvanced,
}) {
  const wasChanged = originalVideo && originalVideo.scriptText !== video.scriptText;

  return (
    <article className="final-preview-card">
      <div className="final-preview-head">
        <div>
          <span className="eyebrow">Video {index + 1}</span>
          <h3>{video.title}</h3>
          <p className="supporting-text">
            {video.wordCount} palabras | {video.estimatedDuration}
          </p>
        </div>

        <div className="final-preview-status">
          <span className={`status-chip ${isReviewed ? "is-success" : "is-warning"}`}>
            {isReviewed ? "Revisado" : "Sin revisar"}
          </span>
          <span className={`status-chip ${wasChanged ? "is-warning" : "is-success"}`}>
            {wasChanged ? "Con cambios" : "Sin cambios"}
          </span>
        </div>
      </div>

      {showAdvanced ? (
        <div className="final-preview-grid">
          <div className="final-preview-block">
            <strong>Texto original</strong>
            <p>{originalVideo?.scriptText || "No hay version original disponible."}</p>
          </div>

          <div className="final-preview-block">
            <strong>Guion aceptado</strong>
            <p>{video.scriptText}</p>
          </div>
        </div>
      ) : null}

      <ScriptDiffView originalText={originalVideo?.scriptText || ""} nextText={video.scriptText} />
    </article>
  );
}
