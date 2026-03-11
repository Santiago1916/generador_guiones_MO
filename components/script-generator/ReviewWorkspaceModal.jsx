"use client";

import { useEffect, useMemo, useState } from "react";
import ReviewComparePanels from "@/components/script-generator/review-modal/ReviewComparePanels";
import ReviewIssuesPanel from "@/components/script-generator/review-modal/ReviewIssuesPanel";
import ReviewModalFooter from "@/components/script-generator/review-modal/ReviewModalFooter";
import ReviewModalHeader from "@/components/script-generator/review-modal/ReviewModalHeader";
import ReviewPhraseLibrary from "@/components/script-generator/review-modal/ReviewPhraseLibrary";
import ReviewVideoNavigator from "@/components/script-generator/review-modal/ReviewVideoNavigator";
import {
  getIssueSeverityLabel,
  getIssueSeverityTone,
  getPriorityIssues,
  getStatusChipClass,
  getVideoDurationStatus,
  summarizeIssuesBySeverity,
} from "@/lib/script-generator";

function getSourcePreview(text = "", limit = 72) {
  const normalized = String(text).replace(/\s+/g, " ").trim();
  if (!normalized) return "No se detecto texto fuente para esta seccion.";

  const words = normalized.split(" ");
  if (words.length <= limit) return normalized;
  return `${words.slice(0, limit).join(" ")}...`;
}

function getSuggestionButtonLabel(suggestion = "") {
  const compactSuggestion = String(suggestion).trim();
  if (!compactSuggestion) return "Aplicar sugerencia";
  if (compactSuggestion.length <= 3) return `Reemplazar por "${compactSuggestion}"`;
  return `Aplicar: ${compactSuggestion}`;
}

function getToneChipClass(tone = "") {
  if (tone === "success") return "is-success";
  if (tone === "warning") return "is-warning";
  if (tone === "danger") return "is-error";
  return "";
}

function buildPriorityAlerts({ currentValidation, currentDuration, currentRepetition, documentConfidence }) {
  const alerts = [];
  const topIssues = getPriorityIssues(currentValidation?.issues || [], 2);

  topIssues.forEach((issue) => {
    alerts.push({
      label: getIssueSeverityLabel(issue),
      title: issue.message,
      note: issue.context || "Conviene revisar este punto antes de cerrar el video.",
      tone: issue.severity === "blocking" ? "danger" : issue.severity === "important" ? "warning" : "success",
    });
  });

  if (!topIssues.length && currentDuration?.tone === "warning") {
    alerts.push({
      tone: "warning",
      label: currentDuration.label,
      title: "Duracion del video",
      note: currentDuration.note,
    });
  }

  if (!topIssues.length && currentRepetition?.tone === "warning") {
    alerts.push({
      tone: "warning",
      label: "Ideas repetidas",
      title: "Repeticion del contenido",
      note: currentRepetition.note,
    });
  }

  if (!topIssues.length && documentConfidence?.tone !== "success") {
    alerts.push({
      tone: documentConfidence.tone,
      label: `Lectura ${documentConfidence.label}`,
      title: "Lectura del documento",
      note: documentConfidence.note,
    });
  }

  if (!alerts.length) {
    alerts.push({
      tone: "success",
      label: "Todo en orden",
      title: "Sin alertas prioritarias",
      note: "Este video se ve estable en la revision rapida y ya puedes enfocarte en el tono final.",
    });
  }

  return alerts.slice(0, 2);
}

export default function ReviewWorkspaceModal({
  modalRef,
  isOpen,
  videos,
  currentVideoId,
  reviewedVideoIds,
  validationMap,
  correctionHistory,
  customDictionary,
  liveTotals,
  repetitionReport,
  balanceReport,
  documentConfidence,
  courseCategory,
  isValidatingScripts,
  onClose,
  onSelectVideo,
  onScriptChange,
  onApplyLibraryPhrase,
  onApplyIssueSuggestion,
  onIgnoreIssue,
  onAddToDictionary,
  onRestoreVideo,
  onMarkReviewed,
  onPreviousVideo,
  onNextVideo,
  onCompleteReview,
}) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShowAdvanced(false);
    }
  }, [isOpen]);

  const currentIndex = videos.findIndex((video) => video.id === currentVideoId);
  const safeIndex = currentIndex >= 0 ? currentIndex : 0;
  const currentVideo = videos[safeIndex];

  const currentValidation = useMemo(
    () => (currentVideo ? validationMap.get(currentVideo.id) || null : null),
    [currentVideo, validationMap]
  );
  const currentCorrections = currentVideo ? correctionHistory[currentVideo.id] || [] : [];
  const currentDuration = currentVideo ? getVideoDurationStatus(currentVideo, videos) : null;
  const currentRepetition = currentVideo
    ? repetitionReport?.details?.find((detail) => detail.videoId === currentVideo.id) || null
    : null;
  const isReviewed = currentVideo ? reviewedVideoIds.includes(currentVideo.id) : false;
  const allReviewed = videos.length > 0 && videos.every((video) => reviewedVideoIds.includes(video.id));
  const sourcePreview = currentVideo ? getSourcePreview(currentVideo.sourceText) : "";
  const priorityAlerts = buildPriorityAlerts({
    currentValidation,
    currentDuration,
    currentRepetition,
    documentConfidence,
  });
  const visibleIssues = showAdvanced
    ? currentValidation?.issues || []
    : getPriorityIssues(currentValidation?.issues || [], 2);
  const issueSummary = summarizeIssuesBySeverity(currentValidation?.issues || []);

  if (!isOpen || !videos.length || !currentVideo) return null;

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
        className="modal-card review-modal tour-review-workspace"
        role="dialog"
        aria-modal="true"
        aria-labelledby="review-workspace-title"
        tabIndex={-1}
      >
        <ReviewModalHeader
          showAdvanced={showAdvanced}
          onToggleAdvanced={() => setShowAdvanced((currentValue) => !currentValue)}
          onClose={onClose}
        />

        <ReviewVideoNavigator
          videos={videos}
          currentVideoId={currentVideo.id}
          reviewedVideoIds={reviewedVideoIds}
          validationMap={validationMap}
          repetitionReport={repetitionReport}
          balanceReport={balanceReport}
          onSelectVideo={onSelectVideo}
        />

        <div className="review-main">
          <div className="review-focus-bar">
            <span className="pill">Video {safeIndex + 1} de {videos.length}</span>
            <span className="pill">Guion: {currentVideo.wordCount} palabras</span>
            <span className="pill">Duracion estimada: {currentVideo.estimatedDuration}</span>
            <span className={`status-chip ${getStatusChipClass(currentDuration?.tone)}`}>{currentDuration?.label}</span>
            <span className={`status-chip ${getToneChipClass(documentConfidence.tone)}`}>
              Lectura {documentConfidence.label}
            </span>
          </div>

          {showAdvanced ? (
            <>
              <section className="signal-grid modal-signal-grid">
                <article className={`metric-card tone-${documentConfidence.tone}`}>
                  <span className="metric-label">Confianza de extraccion</span>
                  <strong>
                    {documentConfidence.label}
                    {documentConfidence.score !== null ? ` (${documentConfidence.score}%)` : ""}
                  </strong>
                  <p>{documentConfidence.note}</p>
                </article>

                <article className={`metric-card tone-${currentDuration?.tone || "success"}`}>
                  <span className="metric-label">Equilibrio del video actual</span>
                  <strong>{currentDuration?.label}</strong>
                  <p>{currentDuration?.note}</p>
                </article>

                <article className={`metric-card tone-${currentRepetition?.tone || "success"}`}>
                  <span className="metric-label">Repeticion del video actual</span>
                  <strong>{currentRepetition?.label || "Sin repeticiones relevantes"}</strong>
                  <p>
                    {currentRepetition?.note ||
                      "No detecte frases largas repetidas frente a otros videos del curso."}
                  </p>
                </article>
              </section>

              <div className="notes-box review-severity-box">
                <h4>Severidad de observaciones</h4>
                <div className="review-severity-list">
                  <span className="status-chip is-error">{issueSummary.blocking} bloqueantes</span>
                  <span className="status-chip is-warning">{issueSummary.important} importantes</span>
                  <span className="status-chip is-success">{issueSummary.suggested} sugeridas</span>
                </div>
              </div>
            </>
          ) : (
            <div className="notes-box compact-overview-box compact-priority-box">
              <div className="compact-overview-head">
                <h4>Alertas prioritarias</h4>
                <p className="supporting-text">Solo te muestro lo clave para que avances sin ruido.</p>
              </div>
              <div className="issue-summary-list compact-priority-list">
                {priorityAlerts.map((alert) => (
                  <article key={`${currentVideo.id}-${alert.title}`} className="issue-summary compact-priority-item">
                    <span className={`status-chip ${getToneChipClass(alert.tone)}`}>{alert.label}</span>
                    <div>
                      <strong>{alert.title}</strong>
                      <p>{alert.note}</p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}

          <ReviewComparePanels
            currentVideo={currentVideo}
            showAdvanced={showAdvanced}
            sourcePreview={sourcePreview}
            onScriptChange={onScriptChange}
          />

          {showAdvanced && currentRepetition?.matches?.length ? (
            <div className="notes-box signal-detail-box">
              <h4>Detector de repeticiones</h4>
              <div className="repetition-list">
                {currentRepetition.matches.map((match) => (
                  <article key={`${currentVideo.id}-${match.phrase}`} className="repetition-card">
                    <strong>&quot;{match.phrase}&quot;</strong>
                    <p>Tambien aparece en: {match.relatedTitles.join(", ")}</p>
                  </article>
                ))}
              </div>
            </div>
          ) : null}

          <ReviewIssuesPanel
            issues={visibleIssues}
            currentValidation={currentValidation}
            currentCorrections={currentCorrections}
            currentVideoId={currentVideo.id}
            customDictionary={customDictionary}
            isValidatingScripts={isValidatingScripts}
            showAdvanced={showAdvanced}
            onApplyIssueSuggestion={onApplyIssueSuggestion}
            onIgnoreIssue={onIgnoreIssue}
            onAddToDictionary={onAddToDictionary}
            getSuggestionButtonLabel={getSuggestionButtonLabel}
          />

          {showAdvanced && currentCorrections.length ? (
            <div className="notes-box correction-history-box">
              <h4>Sugerencias aplicadas en este video</h4>
              <div className="issue-summary-list">
                {currentCorrections.map((entry) => (
                  <article key={entry.id} className="issue-summary">
                    <span className={`status-chip ${entry.status === "resuelta" ? "is-success" : "is-warning"}`}>
                      {entry.status === "resuelta" ? "Resuelta" : "Pendiente"}
                    </span>
                    <div>
                      <strong>{entry.message}</strong>
                      <p>{entry.suggestion}</p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          ) : null}

          {showAdvanced ? (
            <ReviewPhraseLibrary
              currentVideoId={currentVideo.id}
              courseCategory={courseCategory}
              onApplyLibraryPhrase={onApplyLibraryPhrase}
            />
          ) : null}
        </div>

        <ReviewModalFooter
          safeIndex={safeIndex}
          totalVideos={videos.length}
          currentVideoId={currentVideo.id}
          isReviewed={isReviewed}
          allReviewed={allReviewed}
          onPreviousVideo={onPreviousVideo}
          onNextVideo={onNextVideo}
          onRestoreVideo={onRestoreVideo}
          onMarkReviewed={onMarkReviewed}
          onCompleteReview={onCompleteReview}
        />
      </section>
    </div>
  );
}
