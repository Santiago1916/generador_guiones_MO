export default function ReviewComparePanels({ currentVideo, showAdvanced, sourcePreview, onScriptChange }) {
  return (
    <div className={`compare-grid ${showAdvanced ? "" : "review-compare-grid"}`}>
      <article className="compare-panel">
        <div className="compare-heading">
          <h3>{showAdvanced ? "Texto detectado del documento" : "Resumen del texto detectado"}</h3>
          <span className="pill">{currentVideo.sourceHeading || "Seccion detectada"}</span>
        </div>
        <p className="supporting-text">
          {showAdvanced
            ? "Este bloque sirve para contrastar el contenido fuente con el guion final."
            : "Aqui tienes un resumen corto del texto original para revisar sin saturarte."}
        </p>
        <pre className="source-text-block">
          {showAdvanced
            ? currentVideo.sourceText || "No se detecto texto fuente para esta seccion."
            : sourcePreview}
        </pre>
      </article>

      <article className="compare-panel">
        <div className="compare-heading">
          <h3>Guion editable</h3>
          <span className="pill">{currentVideo.title}</span>
        </div>
        <label className="editor-label" htmlFor={`review-editor-${currentVideo.id}`}>
          Ajusta el guion del video actual
        </label>
        <textarea
          id={`review-editor-${currentVideo.id}`}
          className={`modal-textarea tour-review-editor ${showAdvanced ? "" : "modal-textarea-compact"}`}
          value={currentVideo.scriptText}
          onChange={(event) => onScriptChange(currentVideo.id, event.target.value)}
        />
      </article>
    </div>
  );
}
