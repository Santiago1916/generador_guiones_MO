"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Download, X } from "lucide-react";
import FinalPreviewCard from "@/components/script-generator/final-preview/FinalPreviewCard";

export default function FinalPreviewModal({
  modalRef,
  isOpen,
  videos,
  originalVideos,
  reviewedVideoIds,
  validationReport,
  liveTotals,
  repetitionReport,
  balanceReport,
  documentConfidence,
  isValidatingScripts,
  onClose,
  onBackToReview,
  onValidateAndDownload,
}) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShowAdvanced(false);
    }
  }, [isOpen]);

  const changedCount = useMemo(
    () =>
      videos.filter((video) => {
        const originalVideo = originalVideos.find((candidate) => candidate.id === video.id);
        return originalVideo && originalVideo.scriptText !== video.scriptText;
      }).length,
    [originalVideos, videos]
  );

  if (!isOpen || !videos.length) return null;

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
        ref={modalRef}
        className="modal-card final-preview-modal tour-final-preview"
        role="dialog"
        aria-modal="true"
        aria-labelledby="final-preview-title"
        tabIndex={-1}
      >
        <div className="modal-top modal-top-compact">
          <div className="modal-title-block">
            <h2 id="final-preview-title">Preview final del guion aceptado</h2>
            <p className="supporting-text">
              Aqui confirmas la version final antes de validar escritura y descargar el PDF.
            </p>
          </div>

          <div className="modal-top-actions">
            <button
              type="button"
              className={`ghost-button view-toggle-button ${showAdvanced ? "is-active" : ""}`}
              onClick={() => setShowAdvanced((currentValue) => !currentValue)}
              aria-pressed={showAdvanced}
            >
              {showAdvanced ? "Vista general" : "Vista avanzada"}
            </button>

            <button type="button" className="modal-close-icon" onClick={onClose} aria-label="Cerrar modal final">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="review-focus-bar">
          <span className="pill">{reviewedVideoIds.length} videos revisados</span>
          <span className="pill">{changedCount} videos con cambios</span>
          <span className="pill">Duracion total: {liveTotals.estimatedDuration}</span>
          {validationReport?.provider ? <span className="pill">{validationReport.provider}</span> : null}
        </div>

        {showAdvanced ? (
          <section className="signal-grid modal-signal-grid">
            <article className={`metric-card tone-${documentConfidence.tone}`}>
              <span className="metric-label">Confianza de lectura</span>
              <strong>
                {documentConfidence.label}
                {documentConfidence.score !== null ? ` (${documentConfidence.score}%)` : ""}
              </strong>
              <p>{documentConfidence.note}</p>
            </article>

            <article className={`metric-card tone-${repetitionReport.tone}`}>
              <span className="metric-label">Detector de repeticiones</span>
              <strong>{repetitionReport.repeatedVideosCount}</strong>
              <p>{repetitionReport.note}</p>
            </article>

            <article className={`metric-card tone-${balanceReport.tone}`}>
              <span className="metric-label">Equilibrio por video</span>
              <strong>{balanceReport.outlierCount}</strong>
              <p>{balanceReport.note}</p>
            </article>
          </section>
        ) : (
          <div className="notes-box compact-overview-box">
            <h4>Resumen rapido antes de descargar</h4>
            <div className="issue-summary-list">
              <article className="issue-summary">
                <span className={`status-chip ${documentConfidence.tone === "success" ? "is-success" : documentConfidence.tone === "warning" ? "is-warning" : "is-error"}`}>
                  Lectura {documentConfidence.label}
                </span>
                <div>
                  <strong>Documento</strong>
                  <p>{documentConfidence.note}</p>
                </div>
              </article>

              <article className="issue-summary">
                <span className={`status-chip ${repetitionReport.tone === "success" ? "is-success" : "is-warning"}`}>
                  {repetitionReport.repeatedVideosCount} repeticiones
                </span>
                <div>
                  <strong>Guion</strong>
                  <p>{repetitionReport.note}</p>
                </div>
              </article>

              <article className="issue-summary">
                <span className={`status-chip ${balanceReport.tone === "success" ? "is-success" : "is-warning"}`}>
                  {balanceReport.outlierCount} por equilibrar
                </span>
                <div>
                  <strong>Duracion</strong>
                  <p>{balanceReport.note}</p>
                </div>
              </article>
            </div>
          </div>
        )}

        <div className="final-preview-list">
          {videos.map((video, index) => (
            <FinalPreviewCard
              key={video.id}
              video={video}
              index={index}
              originalVideo={originalVideos.find((candidate) => candidate.id === video.id)}
              isReviewed={reviewedVideoIds.includes(video.id)}
              showAdvanced={showAdvanced}
            />
          ))}
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
