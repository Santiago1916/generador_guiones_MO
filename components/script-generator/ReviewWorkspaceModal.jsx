"use client";

import { ArrowLeft, ArrowRight, CheckCheck, RotateCcw, X } from "lucide-react";
import { APPROVED_SCRIPT_LIBRARY } from "@/lib/course-config";
import {
  correctionMatchesIssue,
  getStatusChipClass,
  getVideoDurationStatus,
} from "@/lib/script-generator";

export default function ReviewWorkspaceModal({
  isOpen,
  videos,
  currentVideoId,
  reviewedVideoIds,
  validationMap,
  correctionHistory,
  liveTotals,
  isValidatingScripts,
  onClose,
  onSelectVideo,
  onScriptChange,
  onApplyLibraryPhrase,
  onApplyIssueSuggestion,
  onRestoreVideo,
  onMarkReviewed,
  onPreviousVideo,
  onNextVideo,
  onCompleteReview,
}) {
  if (!isOpen || !videos.length) return null;

  const currentIndex = videos.findIndex((video) => video.id === currentVideoId);
  const safeIndex = currentIndex >= 0 ? currentIndex : 0;
  const currentVideo = videos[safeIndex];
  const currentValidation = validationMap.get(currentVideo.id) || null;
  const currentCorrections = correctionHistory[currentVideo.id] || [];
  const currentDuration = getVideoDurationStatus(currentVideo, videos);
  const isReviewed = reviewedVideoIds.includes(currentVideo.id);
  const allReviewed = videos.length > 0 && videos.every((video) => reviewedVideoIds.includes(video.id));

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
        className="modal-card review-modal tour-review-workspace"
        role="dialog"
        aria-modal="true"
        aria-labelledby="review-workspace-title"
      >
        <div className="modal-top">
          <div>
            <span className="eyebrow modal-eyebrow">Paso 2</span>
            <h2 id="review-workspace-title">Tomar revision del guion</h2>
            <p className="supporting-text">
              Revisa todos los videos dentro de un solo preview. Puedes navegar uno a uno, editar,
              aplicar sugerencias y marcar cada video como revisado.
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
          <span className="pill">
            {reviewedVideoIds.length} de {videos.length} videos revisados
          </span>
          <span className={`status-chip ${getStatusChipClass(currentDuration.tone)}`}>{currentDuration.label}</span>
          <span className={`status-chip ${isReviewed ? "is-success" : "is-warning"}`}>
            {isReviewed ? "Video revisado" : "Pendiente por revisar"}
          </span>
        </div>

        <div className="review-layout">
          <aside className="review-sidebar tour-review-sidebar">
            <h3>Videos del curso</h3>
            <div className="review-sidebar-list">
              {videos.map((video, index) => {
                const videoValidation = validationMap.get(video.id);
                const videoReviewed = reviewedVideoIds.includes(video.id);

                return (
                  <button
                    key={video.id}
                    type="button"
                  className={`review-sidebar-item ${video.id === currentVideo.id ? "is-active" : ""}`}
                  onClick={() => onSelectVideo(video.id)}
                >
                    <div>
                      <strong>Video {index + 1}</strong>
                      <span>{video.title}</span>
                    </div>
                    <div className="review-sidebar-status">
                      <span className={`status-chip ${videoReviewed ? "is-success" : "is-warning"}`}>
                        {videoReviewed ? "Revisado" : "Pendiente"}
                      </span>
                      {videoValidation ? (
                        <span className={`status-chip ${videoValidation.passed ? "is-success" : "is-error"}`}>
                          {videoValidation.passed ? "Sin errores" : `${videoValidation.issueCount} errores`}
                        </span>
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>
          </aside>

          <div className="review-main">
            <div className="stats-row">
              <span className="pill">
                Video {safeIndex + 1} de {videos.length}
              </span>
              <span className="pill">Guion: {currentVideo.wordCount} palabras</span>
              <span className="pill">Duracion estimada: {currentVideo.estimatedDuration}</span>
              <span className="pill">Rango total: {liveTotals.targetWindow}</span>
            </div>

            <div className="modal-guide">
              <article className="guide-tip">
                <strong>1. Lee</strong>
                <p>Confirma que la idea del video se mantenga clara y natural.</p>
              </article>
              <article className="guide-tip">
                <strong>2. Ajusta</strong>
                <p>Edita el texto o usa frases aprobadas para mejorar el tono.</p>
              </article>
              <article className="guide-tip">
                <strong>3. Marca</strong>
                <p>Cuando el video ya quede bien, marcalo como revisado.</p>
              </article>
            </div>

            <div className="compare-grid">
              <article className="compare-panel">
                <div className="compare-heading">
                  <h3>Texto detectado del documento</h3>
                  <span className="pill">{currentVideo.sourceHeading || "Seccion detectada"}</span>
                </div>
                <p className="supporting-text">
                  Este bloque sirve para contrastar el contenido fuente con el guion final.
                </p>
                <pre className="source-text-block">
                  {currentVideo.sourceText || "No se detecto texto fuente para esta seccion."}
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
                  className="modal-textarea tour-review-editor"
                  value={currentVideo.scriptText}
                  onChange={(event) => onScriptChange(currentVideo.id, event.target.value)}
                />
              </article>
            </div>

            <div className="notes-box library-box">
              <h4>Biblioteca de frases aprobadas</h4>

              <div className="library-group">
                <strong>Aperturas</strong>
                <div className="library-actions">
                  {APPROVED_SCRIPT_LIBRARY.openings.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className="ghost-button library-button"
                      onClick={() => onApplyLibraryPhrase(currentVideo.id, "opening", item.text, item.label)}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="library-group">
                <strong>Transiciones</strong>
                <div className="library-actions">
                  {APPROVED_SCRIPT_LIBRARY.transitions.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className="ghost-button library-button"
                      onClick={() => onApplyLibraryPhrase(currentVideo.id, "transition", item.text, item.label)}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="library-group">
                <strong>Cierres</strong>
                <div className="library-actions">
                  {APPROVED_SCRIPT_LIBRARY.closings.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className="ghost-button library-button"
                      onClick={() => onApplyLibraryPhrase(currentVideo.id, "closing", item.text, item.label)}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {currentValidation?.issues?.length ? (
              <div className="notes-box issues-box">
                <h4>Observaciones del video actual</h4>
                <div className="issue-list">
                  {currentValidation.issues.map((issue, index) => {
                    const matchingHistory = currentCorrections.find((entry) =>
                      correctionMatchesIssue(entry, issue)
                    );

                    return (
                      <article key={`${currentValidation.id}-${index}`} className="issue-card">
                        <strong>{issue.message}</strong>
                        {matchingHistory ? (
                          <span
                            className={`status-chip ${
                              matchingHistory.status === "resuelta" ? "is-success" : "is-warning"
                            }`}
                          >
                            {matchingHistory.status === "resuelta"
                              ? "Ya aplicada y resuelta"
                              : "Ya aplicada, revisar"}
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
                                onClick={() => onApplyIssueSuggestion(currentVideo.id, issue, suggestion)}
                                disabled={isValidatingScripts}
                              >
                                Aplicar: {suggestion}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <p className="issue-suggestion">Esta observacion requiere ajuste manual dentro del guion.</p>
                        )}
                      </article>
                    );
                  })}
                </div>
              </div>
            ) : currentValidation ? (
              <div className="notes-box issues-box success-box">
                <h4>Revision del video</h4>
                <p>Este video ya no tiene observaciones pendientes en la revision actual.</p>
              </div>
            ) : null}

            {currentCorrections.length ? (
              <div className="notes-box correction-history-box">
                <h4>Correcciones aplicadas en esta sesion</h4>
                <div className="history-list">
                  {currentCorrections.map((entry) => (
                    <article key={entry.id} className="history-card">
                      <div className="history-card-head">
                        <strong>{entry.message}</strong>
                        <span
                          className={`status-chip ${
                            entry.status === "resuelta" ? "is-success" : "is-warning"
                          }`}
                        >
                          {entry.status === "resuelta"
                            ? "Resuelta"
                            : entry.status === "revisar"
                              ? "Revisar"
                              : "Comprobando"}
                        </span>
                      </div>
                      <p className="history-note">Sugerencia aplicada: {entry.suggestion}</p>
                    </article>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <div className="modal-actions">
          <button type="button" className="ghost-button" onClick={() => onRestoreVideo(currentVideo.id)}>
            <span className="button-content">
              <RotateCcw size={18} />
              Restaurar original
            </span>
          </button>
          <button type="button" className="ghost-button" onClick={() => onPreviousVideo(currentVideo.id)}>
            <span className="button-content">
              <ArrowLeft size={18} />
              Video anterior
            </span>
          </button>
          <button type="button" className="ghost-button" onClick={() => onNextVideo(currentVideo.id)}>
            <span className="button-content">
              <ArrowRight size={18} />
              Siguiente video
            </span>
          </button>
          <button
            type="button"
            className={`ghost-button tour-mark-reviewed ${isReviewed ? "is-reviewed-toggle" : ""}`}
            onClick={() => onMarkReviewed(currentVideo.id)}
          >
            <span className="button-content">
              <CheckCheck size={18} />
              {isReviewed ? "Video revisado" : "Marcar como revisado"}
            </span>
          </button>
          <button
            type="button"
            className="primary-button modal-primary tour-complete-review"
            onClick={onCompleteReview}
            disabled={!allReviewed}
          >
            <span className="button-content">
              <ArrowRight size={18} />
              Finalizar paso 2
            </span>
          </button>
        </div>
      </section>
    </div>
  );
}
