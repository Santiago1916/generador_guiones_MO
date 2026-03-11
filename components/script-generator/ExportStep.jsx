"use client";

import { Download, Eye } from "lucide-react";
import { getRangeMessage, getRangeTone } from "@/lib/script-generator";

export default function ExportStep({
  result,
  overallStatus,
  liveTotals,
  reviewConfirmed,
  reviewedVideoIds,
  editableVideos,
  validationReport,
  actionError,
  actionMessage,
  onOpenFinalPreview,
}) {
  if (!result) {
    return (
      <div className="panel-card step-placeholder-card">
        <p className="supporting-text">
          El paso 3 se habilita cuando el curso ya tenga borradores generados y el usuario termine
          la revision del paso 2.
        </p>
      </div>
    );
  }

  return (
    <>
      <section className="summary-grid summary-grid-wide">
        <article className={`metric-card tone-${overallStatus.tone}`}>
          <span className="metric-label">Semaforo general</span>
          <strong>{overallStatus.label}</strong>
          <p>
            {overallStatus.title}. {overallStatus.description}
          </p>
        </article>

        <article className={`metric-card tone-${getRangeTone(liveTotals)}`}>
          <span className="metric-label">Duracion total estimada</span>
          <strong>{liveTotals.estimatedDuration}</strong>
          <p>{getRangeMessage(liveTotals)}</p>
        </article>

        <article className="metric-card">
          <span className="metric-label">Videos revisados</span>
          <strong>
            {reviewedVideoIds.length}/{editableVideos.length}
          </strong>
          <p>El preview final se habilita cuando todos hayan sido revisados por el usuario.</p>
        </article>

        <article className={`metric-card ${validationReport?.passed ? "tone-success" : "tone-warning"}`}>
          <span className="metric-label">Validacion final</span>
          <strong>{validationReport?.passed ? "Aprobada" : "Pendiente"}</strong>
          <p>
            {validationReport?.passed
              ? "El ultimo chequeo de escritura salio bien."
              : "Abre el preview final y corre la validacion desde ese modal."}
          </p>
        </article>
      </section>

      <article className={`panel-card final-step-card tone-${overallStatus.tone} tour-export-card`}>
        <div className="final-step-copy">
          <span className="eyebrow">Paso 3</span>
          <h2>Preview final y descarga</h2>
          <p>
            Este paso ya no es para editar. Aqui validas el resultado aceptado por el usuario y
            luego descargas el PDF si todo esta bien.
          </p>
        </div>

        <div className="final-step-meta">
          <span className="pill">
            Revision humana: {reviewConfirmed ? "Confirmada" : "Pendiente"}
          </span>
          <span className="pill">Duracion total: {liveTotals.estimatedDuration}</span>
          {validationReport?.provider ? <span className="pill">{validationReport.provider}</span> : null}
        </div>

        {actionError ? <p className="feedback error-text">{actionError}</p> : null}
        {actionMessage ? <p className="feedback success-text">{actionMessage}</p> : null}

        <button
          type="button"
          className="primary-button final-step-button tour-open-final-preview"
          onClick={onOpenFinalPreview}
          disabled={!reviewConfirmed}
        >
          <span className="button-content">
            {validationReport?.passed ? <Download size={18} /> : <Eye size={18} />}
            Abrir preview final
          </span>
        </button>
      </article>
    </>
  );
}
