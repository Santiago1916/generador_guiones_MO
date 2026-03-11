"use client";

import { useEffect, useState } from "react";
import { ArrowRight, ChevronDown, ClipboardCheck, Eye } from "lucide-react";
import { formatFileSize, summarizeIssuesBySeverity } from "@/lib/script-generator";

const VALIDATION_ACCORDION_STORAGE_KEY = "mo-script-generator-validation-accordion-open";

export default function ReviewStep({
  result,
  nextAction,
  editableVideos,
  reviewedVideoIds,
  reviewConfirmed,
  readyVideosCount,
  videosWithIssuesCount,
  pendingValidationCount,
  repetitionReport,
  balanceReport,
  documentConfidence,
  onOpenReviewModal,
  onOpenExportStep,
}) {
  const [isValidationOpen, setIsValidationOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const storedValue = window.localStorage.getItem(VALIDATION_ACCORDION_STORAGE_KEY);
    if (storedValue === "true") {
      setIsValidationOpen(true);
    }
  }, []);

  const severitySummary = summarizeIssuesBySeverity(result.validation.issues);

  function handleValidationToggle(nextValue) {
    setIsValidationOpen(nextValue);

    if (typeof window !== "undefined") {
      window.localStorage.setItem(VALIDATION_ACCORDION_STORAGE_KEY, String(nextValue));
    }
  }

  if (!result) {
    return (
      <div className="panel-card step-placeholder-card">
        <p className="supporting-text">
          Primero completa el paso 1 para generar el borrador del curso. Cuando exista un resultado,
          aqui apareceran el analisis y la revision general.
        </p>
      </div>
    );
  }

  return (
    <>
      <section className="coach-grid">
        <article className={`panel-card next-step-card tone-${nextAction.tone} tour-review-card`}>
          <div className="next-step-copy">
            <span className="metric-label">Que sigue ahora</span>
            <h2>{nextAction.title}</h2>
            <p>{nextAction.description}</p>
            <p className="supporting-text">{nextAction.helper}</p>
          </div>

          <div className="next-step-actions">
            <button type="button" className="primary-button tour-open-review" onClick={onOpenReviewModal}>
              <span className="button-content">
                <ClipboardCheck size={18} />
                Tomar revision
              </span>
            </button>
            <button
              type="button"
              className="ghost-button"
              onClick={onOpenExportStep}
              disabled={!reviewConfirmed}
            >
              <span className="button-content">
                <ArrowRight size={18} />
                Ir al paso 3
              </span>
            </button>
          </div>
        </article>

        <article className="panel-card quick-stats-card">
          <span className="metric-label">Estado de la revision</span>
          <div className="quick-stats-grid">
            <div className="quick-stat">
              <strong>{editableVideos.length}</strong>
              <p>Total de videos</p>
            </div>
            <div className="quick-stat">
              <strong>{reviewedVideoIds.length}</strong>
              <p>Marcados como revisados</p>
            </div>
            <div className="quick-stat">
              <strong>{videosWithIssuesCount}</strong>
              <p>Con observaciones</p>
            </div>
            <div className="quick-stat">
              <strong>{pendingValidationCount}</strong>
              <p>Pendientes de validacion</p>
            </div>
          </div>
        </article>
      </section>

      <article className="panel-card compact-overview-card">
        <div className="panel-heading panel-heading-tight">
          <h3>Resumen rapido</h3>
        </div>
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
              {balanceReport.outlierCount} por ajustar
            </span>
            <div>
              <strong>Duracion por video</strong>
              <p>{balanceReport.note}</p>
            </div>
          </article>
        </div>
      </article>

      <section className="analysis-grid">
        <details
          className="panel-card accordion-card review-accordion"
          open={isValidationOpen}
          onToggle={(event) => handleValidationToggle(event.currentTarget.open)}
        >
          <summary className="accordion-summary">
            <div className="accordion-summary-copy">
              <h3>Validacion del documento</h3>
              <p>
                Abre esta seccion solo si quieres revisar faltantes, bloques detectados y
                recomendaciones del archivo.
              </p>
            </div>

            <div className="accordion-summary-meta">
              <span className="pill">
                {result.file.name} | {formatFileSize(result.file.size)}
              </span>
              <span className="pill">{result.validation.profileLabel}</span>
              {result.courseCategory?.label ? <span className="pill">{result.courseCategory.label}</span> : null}
              {severitySummary.blocking ? <span className="status-chip is-error">{severitySummary.blocking} bloqueantes</span> : null}
              {severitySummary.important ? <span className="status-chip is-warning">{severitySummary.important} importantes</span> : null}
              {severitySummary.suggested ? <span className="status-chip is-success">{severitySummary.suggested} sugeridas</span> : null}
            </div>
            <ChevronDown size={18} className="accordion-summary-indicator" />
          </summary>

          <div className="accordion-content">
            <div className="section-list">
              {result.validation.sections.map((section) => (
                <div key={section.id} className={`section-chip is-${section.severity}`}>
                  <strong>{section.label}</strong>
                  <span>{section.found ? `${section.wordCount} palabras detectadas` : "No encontrada"}</span>
                  <small>{section.detail}</small>
                  <small>{section.hint}</small>
                </div>
              ))}
            </div>

            {result.validation.issues.length ? (
              <div className="notes-box">
                <h4>Exactamente que revisar</h4>
                <div className="issue-summary-list">
                  {result.validation.issues.map((issue) => (
                    <article key={issue.id} className={`issue-summary issue-${issue.level}`}>
                      <span className={`status-chip ${issue.severity === "blocking" ? "is-error" : issue.severity === "important" ? "is-warning" : "is-success"}`}>
                        {issue.severity === "blocking"
                          ? "Bloqueante"
                          : issue.severity === "important"
                            ? "Importante"
                            : "Sugerida"}
                      </span>
                      <div>
                        <strong>{issue.title}</strong>
                        <p>{issue.detail}</p>
                        <p>{issue.hint}</p>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            ) : null}

            {result.recommendations.length ? (
              <div className="notes-box">
                <h4>Recomendaciones</h4>
                <ul className="compact-list">
                  {result.recommendations.map((note) => (
                    <li key={note}>{note}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="notes-box">
              <h4>Calidad de lectura del archivo</h4>
              <div className="issue-summary-list">
                <article className="issue-summary">
                  <span className={`status-chip ${documentConfidence.tone === "success" ? "is-success" : documentConfidence.tone === "warning" ? "is-warning" : "is-error"}`}>
                    {documentConfidence.label}
                  </span>
                  <div>
                    <strong>Confianza de extraccion</strong>
                    <p>{documentConfidence.note}</p>
                  </div>
                </article>
              </div>
            </div>
          </div>
        </details>

        <article className="panel-card panel-stack">
          <div>
            <div className="panel-heading">
              <h3>Resumen del borrador</h3>
              <span className="pill">{editableVideos.length} videos</span>
            </div>
            <p className="preview-text">
              La revision se hace dentro de un solo preview guiado. Ahi puedes navegar video por
              video, editar, aplicar sugerencias y marcar lo que ya revisaste.
            </p>
            <button type="button" className="ghost-button inline-action-button" onClick={onOpenReviewModal}>
              <span className="button-content">
                <Eye size={18} />
                Abrir workspace de revision
              </span>
            </button>
          </div>

          <div className="notes-box">
            <h4>Estado del paso 2</h4>
            <div className="issue-summary-list">
              <article className="issue-summary">
                <span className={`status-chip ${reviewConfirmed ? "is-success" : "is-warning"}`}>
                  {reviewConfirmed ? "Confirmado" : "Pendiente"}
                </span>
                <div>
                  <strong>Revision del usuario</strong>
                  <p>
                    {reviewConfirmed
                      ? "El usuario ya confirmo el paso 2 y puede pasar al preview final."
                      : "Cuando todos los videos esten revisados, se habilitara el paso 3."}
                  </p>
                </div>
              </article>

              <article className="issue-summary">
                <span className={`status-chip ${readyVideosCount ? "is-success" : "is-warning"}`}>
                  {readyVideosCount} listos
                </span>
                <div>
                  <strong>Validacion tecnica actual</strong>
                  <p>
                    Este contador refleja cuantos videos ya pasan la validacion disponible hasta el
                    momento.
                  </p>
                </div>
              </article>

            </div>
          </div>
        </article>
      </section>
    </>
  );
}
