"use client";

import { ArrowLeft, Download, X } from "lucide-react";

export default function FinalPreviewModal({
  isOpen,
  videos,
  originalVideos,
  reviewedVideoIds,
  validationReport,
  liveTotals,
  isValidatingScripts,
  onClose,
  onBackToReview,
  onValidateAndDownload,
}) {
  if (!isOpen || !videos.length) return null;

  const changedCount = videos.filter((video) => {
    const originalVideo = originalVideos.find((candidate) => candidate.id === video.id);
    return originalVideo && originalVideo.scriptText !== video.scriptText;
  }).length;

  return (
    <div
      className="modal-overlay"
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <section
        className="modal-card final-preview-modal tour-final-preview"
        role="dialog"
        aria-modal="true"
        aria-labelledby="final-preview-title"
      >
        <div className="modal-top">
          <div>
            <span className="eyebrow modal-eyebrow">Paso 3</span>
            <h2 id="final-preview-title">Preview final del guion aceptado</h2>
            <p className="supporting-text">
              Aqui ves el resultado final de lo revisado en el paso 2. Si todo esta correcto, desde
              este mismo modal puedes validar escritura y descargar el PDF.
            </p>
          </div>

          <button type="button" className="ghost-button modal-close" onClick={onClose}>
            <span className="button-content">
              <X size={18} />
              Cerrar
            </span>
          </button>
        </div>

        <div className="review-progress-bar">
          <span className="pill">{reviewedVideoIds.length} videos revisados</span>
          <span className="pill">{changedCount} videos con cambios</span>
          <span className="pill">Duracion total: {liveTotals.estimatedDuration}</span>
          {validationReport?.provider ? <span className="pill">{validationReport.provider}</span> : null}
        </div>

        <div className="final-preview-list">
          {videos.map((video, index) => {
            const originalVideo = originalVideos.find((candidate) => candidate.id === video.id);
            const wasChanged = originalVideo && originalVideo.scriptText !== video.scriptText;

            return (
              <article key={video.id} className="final-preview-card">
                <div className="final-preview-head">
                  <div>
                    <span className="eyebrow">Video {index + 1}</span>
                    <h3>{video.title}</h3>
                    <p className="supporting-text">
                      {video.wordCount} palabras | {video.estimatedDuration}
                    </p>
                  </div>

                  <div className="final-preview-status">
                    <span className={`status-chip ${reviewedVideoIds.includes(video.id) ? "is-success" : "is-warning"}`}>
                      {reviewedVideoIds.includes(video.id) ? "Revisado" : "Sin revisar"}
                    </span>
                    <span className={`status-chip ${wasChanged ? "is-warning" : "is-success"}`}>
                      {wasChanged ? "Con cambios" : "Sin cambios"}
                    </span>
                  </div>
                </div>

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
              </article>
            );
          })}
        </div>

        <div className="modal-actions">
          <button type="button" className="ghost-button" onClick={onBackToReview}>
            <span className="button-content">
              <ArrowLeft size={18} />
              Volver al paso 2
            </span>
          </button>
          <button type="button" className="ghost-button" onClick={onClose}>
            <span className="button-content">
              <X size={18} />
              Seguir revisando luego
            </span>
          </button>
          <button
            type="button"
            className="primary-button modal-primary tour-download-pdf"
            onClick={onValidateAndDownload}
            disabled={isValidatingScripts}
          >
            <span className="button-content">
              <Download size={18} />
              {isValidatingScripts ? "Validando escritura..." : "Validar escritura y descargar PDF"}
            </span>
          </button>
        </div>
      </section>
    </div>
  );
}
