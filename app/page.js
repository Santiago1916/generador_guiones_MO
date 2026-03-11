"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ExportStep from "@/components/script-generator/ExportStep";
import FinalPreviewModal from "@/components/script-generator/FinalPreviewModal";
import HeroSection from "@/components/script-generator/HeroSection";
import ReviewStep from "@/components/script-generator/ReviewStep";
import ReviewWorkspaceModal from "@/components/script-generator/ReviewWorkspaceModal";
import StepPanel from "@/components/script-generator/StepPanel";
import StepperNav from "@/components/script-generator/StepperNav";
import UploadStep from "@/components/script-generator/UploadStep";
import {
  applyIssueSuggestionToScript,
  applyLibraryPhraseToScript,
  buildCorrectionEntry,
  buildEditableVideo,
  buildTotals,
  createScriptGeneratorTour,
  downloadScriptsPdf,
  getCurrentStepId,
  getNextActionCard,
  getOverallSemaphore,
  getProcessSteps,
  syncCorrectionHistory,
} from "@/lib/script-generator";

export default function Home() {
  const inputRef = useRef(null);
  const tourRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isValidatingScripts, setIsValidatingScripts] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [editableVideos, setEditableVideos] = useState([]);
  const [originalVideos, setOriginalVideos] = useState([]);
  const [validationReport, setValidationReport] = useState(null);
  const [correctionHistory, setCorrectionHistory] = useState({});
  const [actionError, setActionError] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [reviewedVideoIds, setReviewedVideoIds] = useState([]);
  const [reviewConfirmed, setReviewConfirmed] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [finalPreviewOpen, setFinalPreviewOpen] = useState(false);
  const [currentReviewVideoId, setCurrentReviewVideoId] = useState("");

  const currentStepId = getCurrentStepId({ result, reviewConfirmed });
  const [openStepId, setOpenStepId] = useState(currentStepId);

  const liveTotals = useMemo(() => buildTotals(editableVideos), [editableVideos]);
  const validationMap = useMemo(
    () => new Map((validationReport?.videos || []).map((video) => [video.id, video])),
    [validationReport]
  );
  const recommendedVideo = useMemo(() => {
    const firstVideoWithIssues = editableVideos.find((video) => validationMap.get(video.id)?.passed === false);
    const firstPendingReview = editableVideos.find((video) => !reviewedVideoIds.includes(video.id));
    return firstVideoWithIssues || firstPendingReview || editableVideos[0] || null;
  }, [editableVideos, reviewedVideoIds, validationMap]);
  const processSteps = useMemo(
    () =>
      getProcessSteps({
        selectedFile,
        result,
        editableVideos,
        validationReport,
        reviewConfirmed,
      }),
    [editableVideos, result, reviewConfirmed, selectedFile, validationReport]
  );
  const nextAction = useMemo(
    () =>
      getNextActionCard({
        result,
        validationReport,
        totals: liveTotals,
        recommendedVideo,
      }),
    [liveTotals, recommendedVideo, result, validationReport]
  );
  const overallStatus = useMemo(
    () => getOverallSemaphore(result, liveTotals, validationReport),
    [liveTotals, result, validationReport]
  );

  const readyVideosCount = validationReport?.videos?.filter((video) => video.passed).length || 0;
  const videosWithIssuesCount = validationReport?.videos?.filter((video) => !video.passed).length || 0;
  const pendingValidationCount = validationReport
    ? Math.max(0, editableVideos.length - validationReport.videos.length)
    : editableVideos.length;
  const uploadStep = processSteps.find((step) => step.id === "upload");
  const reviewStep = processSteps.find((step) => step.id === "review");
  const exportStep = processSteps.find((step) => step.id === "export");

  useEffect(() => {
    if (!reviewModalOpen && !finalPreviewOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setReviewModalOpen(false);
        setFinalPreviewOpen(false);
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [finalPreviewOpen, reviewModalOpen]);

  useEffect(() => {
    setOpenStepId(currentStepId);
  }, [currentStepId]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const hasSeenTour = window.localStorage.getItem("mo-script-generator-tour-seen");
    if (hasSeenTour) return undefined;

    const timer = window.setTimeout(() => {
      handleStartTour();
    }, 700);

    return () => window.clearTimeout(timer);
  }, []);

  function resetActionFeedback() {
    setActionError("");
    setActionMessage("");
    setValidationReport(null);
  }

  function resetReviewFlow(nextVideos = []) {
    setReviewedVideoIds([]);
    setReviewConfirmed(false);
    setReviewModalOpen(false);
    setFinalPreviewOpen(false);
    setCurrentReviewVideoId(nextVideos[0]?.id || "");
  }

  function handleChooseFile() {
    inputRef.current?.click();
  }

  function closeAllGuidedOverlays() {
    setReviewModalOpen(false);
    setFinalPreviewOpen(false);
  }

  const handleStartTour = useCallback(() => {
    tourRef.current?.destroy();
    const tour = createScriptGeneratorTour({
      result,
      reviewConfirmed,
      onOpenStep: handleOpenStep,
      onOpenReviewModal: () => openReviewModal(),
      onOpenFinalPreview: openFinalPreview,
      onCloseReviewModal: () => setReviewModalOpen(false),
      onCloseFinalPreview: () => setFinalPreviewOpen(false),
      onTourFinished: () => {
        if (typeof window !== "undefined") {
          window.localStorage.setItem("mo-script-generator-tour-seen", "true");
        }
      },
    });

    tourRef.current = tour;
    closeAllGuidedOverlays();
    tour.drive();
  }, [result, reviewConfirmed]);

  function handleOpenStep(stepId) {
    if (stepId === "upload") {
      setOpenStepId("upload");
      return;
    }

    if (stepId === "review" && result) {
      setOpenStepId("review");
      return;
    }

    if (stepId === "export" && result && reviewConfirmed) {
      setOpenStepId("export");
    }
  }

  function selectFile(file) {
    if (!file) return;
    setSelectedFile(file);
    setResult(null);
    setEditableVideos([]);
    setOriginalVideos([]);
    setError("");
    setCorrectionHistory({});
    resetActionFeedback();
    resetReviewFlow();
    setOpenStepId("upload");
  }

  function handleDrop(event) {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(false);
    selectFile(event.dataTransfer?.files?.[0]);
  }

  function invalidateVideoReview(videoId) {
    if (!videoId) return;
    setReviewedVideoIds((currentIds) => currentIds.filter((currentId) => currentId !== videoId));
    setReviewConfirmed(false);
    setFinalPreviewOpen(false);
  }

  function updateVideoScript(videoId, nextScriptText, options = {}) {
    const nextVideos = editableVideos.map((video) =>
      video.id === videoId ? buildEditableVideo({ ...video, scriptText: nextScriptText }) : video
    );

    setEditableVideos(nextVideos);
    invalidateVideoReview(videoId);

    if (options.clearValidation !== false) {
      resetActionFeedback();
    }

    return nextVideos;
  }

  function markVideoReviewed(videoId) {
    setReviewedVideoIds((currentIds) =>
      currentIds.includes(videoId) ? currentIds : [...currentIds, videoId]
    );
  }

  function openReviewModal(videoId = recommendedVideo?.id || editableVideos[0]?.id || "") {
    if (!videoId) return;
    setCurrentReviewVideoId(videoId);
    setOpenStepId("review");
    setReviewModalOpen(true);
    setFinalPreviewOpen(false);
  }

  function openFinalPreview() {
    if (!reviewConfirmed) {
      setActionError("Primero debes completar y confirmar la revision del paso 2.");
      setActionMessage("");
      return;
    }

    setOpenStepId("export");
    setFinalPreviewOpen(true);
    setReviewModalOpen(false);
  }

  function moveReviewCursor(direction) {
    const currentIndex = editableVideos.findIndex((video) => video.id === currentReviewVideoId);
    if (currentIndex < 0) return;

    const nextIndex = direction === "next" ? currentIndex + 1 : currentIndex - 1;
    if (nextIndex < 0 || nextIndex >= editableVideos.length) return;
    setCurrentReviewVideoId(editableVideos[nextIndex].id);
  }

  function completeReviewStep() {
    const allReviewed = editableVideos.length > 0 && editableVideos.every((video) => reviewedVideoIds.includes(video.id));
    if (!allReviewed) {
      setActionError("Debes revisar todos los videos antes de cerrar el paso 2.");
      setActionMessage("");
      return;
    }

    setReviewConfirmed(true);
    setReviewModalOpen(false);
    setOpenStepId("export");
    setActionError("");
    setActionMessage("La revision del paso 2 quedo confirmada. Ya puedes abrir el preview final.");
    setFinalPreviewOpen(true);
  }

  async function requestValidation(videos) {
    const response = await fetch("/api/validate-scripts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        videos: videos.map((video) => ({
          id: video.id,
          title: video.title,
          scriptText: video.scriptText,
        })),
      }),
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload?.error || "No fue posible validar la escritura de los guiones.");
    }

    return payload;
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!selectedFile) {
      setError("Sube un archivo antes de procesar el curso.");
      return;
    }

    try {
      setIsProcessing(true);
      setError("");
      resetActionFeedback();

      const formData = new FormData();
      formData.set("file", selectedFile);

      const response = await fetch("/api/process-course", {
        method: "POST",
        body: formData,
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.error || "No fue posible procesar el documento.");
      }

      const nextVideos = (payload.videos || []).map(buildEditableVideo);
      setResult(payload);
      setEditableVideos(nextVideos);
      setOriginalVideos(nextVideos);
      setCorrectionHistory({});
      resetReviewFlow(nextVideos);
      setActionMessage("Documento procesado. El siguiente paso es tomar la revision del borrador.");
    } catch (requestError) {
      setResult(null);
      setEditableVideos([]);
      setOriginalVideos([]);
      setCorrectionHistory({});
      resetReviewFlow();
      setError(requestError?.message || "No fue posible procesar el documento.");
    } finally {
      setIsProcessing(false);
    }
  }

  function handleRestoreVideo(videoId) {
    const originalVideo = originalVideos.find((video) => video.id === videoId);
    if (!originalVideo) return;

    setEditableVideos((currentVideos) =>
      currentVideos.map((video) => (video.id === videoId ? buildEditableVideo(originalVideo) : video))
    );
    setCorrectionHistory((currentHistory) => ({
      ...currentHistory,
      [videoId]: [],
    }));
    invalidateVideoReview(videoId);
    setActionError("");
    setActionMessage("Se restauro el guion original de ese video.");
    setValidationReport(null);
  }

  async function handleValidateAndDownload() {
    if (!reviewConfirmed) {
      setActionError("Debes confirmar la revision del paso 2 antes de validar y descargar.");
      setActionMessage("");
      setOpenStepId("review");
      return;
    }

    if (!editableVideos.length) {
      setActionError("Primero debes generar al menos un guion.");
      setActionMessage("");
      return;
    }

    try {
      setIsValidatingScripts(true);
      setActionError("");
      setActionMessage("");

      const payload = await requestValidation(editableVideos);
      setValidationReport(payload);
      setCorrectionHistory((currentHistory) => syncCorrectionHistory(currentHistory, payload));

      if (!payload.passed) {
        const firstVideoWithIssues = payload.videos.find((video) => !video.passed);
        if (firstVideoWithIssues) {
          setCurrentReviewVideoId(firstVideoWithIssues.id);
        }

        setOpenStepId("review");
        setFinalPreviewOpen(false);
        setReviewModalOpen(true);
        setActionError("Hay observaciones de escritura u ortografia por corregir antes de descargar el PDF.");
        return;
      }

      await downloadScriptsPdf({
        videos: editableVideos,
        totals: liveTotals,
        sourceFileName: result?.file?.name || selectedFile?.name,
        provider: payload.provider,
      });

      setActionMessage("El PDF se descargo despues de pasar la validacion de escritura y ortografia.");
    } catch (requestError) {
      setActionError(requestError?.message || "No fue posible validar y descargar el PDF.");
    } finally {
      setIsValidatingScripts(false);
    }
  }

  async function handleApplyIssueSuggestion(videoId, issue, suggestion) {
    try {
      const currentVideo = editableVideos.find((video) => video.id === videoId);
      if (!currentVideo) return;

      const correctionEntry = buildCorrectionEntry(issue, suggestion);
      const nextScriptText = applyIssueSuggestionToScript(currentVideo.scriptText, issue, suggestion);

      if (nextScriptText === currentVideo.scriptText) {
        setActionError("No pude aplicar automaticamente esa sugerencia. Puedes ajustarla manualmente en el guion.");
        setActionMessage("");
        return;
      }

      const nextVideos = editableVideos.map((video) =>
        video.id === videoId ? buildEditableVideo({ ...video, scriptText: nextScriptText }) : video
      );

      setEditableVideos(nextVideos);
      setCorrectionHistory((currentHistory) => ({
        ...currentHistory,
        [videoId]: [correctionEntry, ...(currentHistory[videoId] || [])].slice(0, 12),
      }));
      invalidateVideoReview(videoId);
      setActionError("");
      setActionMessage("Sugerencia aplicada. Estoy actualizando la revision del guion.");
      setIsValidatingScripts(true);

      const payload = await requestValidation(nextVideos);
      setValidationReport(payload);
      setCorrectionHistory((currentHistory) => syncCorrectionHistory(currentHistory, payload));

      setActionMessage(
        payload.passed
          ? "La sugerencia se aplico y el video quedo limpio en la validacion actual. Recuerda marcarlo otra vez como revisado."
          : "La sugerencia se aplico. Aun quedan observaciones por corregir en este u otros videos."
      );
    } catch (requestError) {
      setActionError(requestError?.message || "No fue posible aplicar la sugerencia automaticamente.");
      setActionMessage("");
    } finally {
      setIsValidatingScripts(false);
    }
  }

  function handleApplyLibraryPhrase(videoId, slot, phraseText, label) {
    const currentVideo = editableVideos.find((video) => video.id === videoId);
    if (!currentVideo) return;

    const nextScriptText = applyLibraryPhraseToScript(currentVideo.scriptText, slot, phraseText);
    updateVideoScript(videoId, nextScriptText);
    setActionError("");
    setActionMessage(`Se aplico "${label}" al guion de ${currentVideo.title}.`);
  }

  function handleDownloadTemplate() {
    window.open("/api/template-course", "_self");
  }

  return (
    <main className="app-shell">
      <HeroSection
        onStartTour={handleStartTour}
        onDownloadTemplate={handleDownloadTemplate}
        onJumpToUpload={() => handleOpenStep("upload")}
      />

      <section className="stepper-shell">
        <StepperNav
          processSteps={processSteps}
          openStepId={openStepId}
          result={result}
          reviewConfirmed={reviewConfirmed}
          onOpenStep={handleOpenStep}
        />

        <StepPanel
          step={uploadStep}
          eyebrow="Paso 1"
          isOpen={openStepId === "upload"}
          statusLabels={{ done: "Completado", current: "En curso", pending: "Pendiente" }}
          onToggle={() => handleOpenStep("upload")}
        >
          <UploadStep
            inputRef={inputRef}
            selectedFile={selectedFile}
            dragActive={dragActive}
            error={error}
            isProcessing={isProcessing}
            onSubmit={handleSubmit}
            onChooseFile={handleChooseFile}
            onSelectFile={selectFile}
            onDragEnter={(event) => {
              event.preventDefault();
              setDragActive(true);
            }}
            onDragOver={(event) => {
              event.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={(event) => {
              event.preventDefault();
              setDragActive(false);
            }}
            onDrop={handleDrop}
            onDownloadTemplate={handleDownloadTemplate}
          />
        </StepPanel>

        <StepPanel
          step={reviewStep}
          eyebrow="Paso 2"
          isOpen={openStepId === "review"}
          isDisabled={!result}
          statusLabels={{ done: "Revisado", current: "En revision", pending: "Pendiente" }}
          onToggle={() => handleOpenStep("review")}
        >
          <ReviewStep
            result={result}
            nextAction={nextAction}
            editableVideos={editableVideos}
            reviewedVideoIds={reviewedVideoIds}
            reviewConfirmed={reviewConfirmed}
            readyVideosCount={readyVideosCount}
            videosWithIssuesCount={videosWithIssuesCount}
            pendingValidationCount={pendingValidationCount}
            onOpenReviewModal={() => openReviewModal()}
            onOpenExportStep={() => handleOpenStep("export")}
          />
        </StepPanel>

        <StepPanel
          step={exportStep}
          eyebrow="Paso 3"
          isOpen={openStepId === "export"}
          isDisabled={!result || !reviewConfirmed}
          statusLabels={{ done: "Listo", current: "Pendiente", pending: "Bloqueado" }}
          onToggle={() => handleOpenStep("export")}
        >
          <ExportStep
            result={result}
            overallStatus={overallStatus}
            liveTotals={liveTotals}
            reviewConfirmed={reviewConfirmed}
            reviewedVideoIds={reviewedVideoIds}
            editableVideos={editableVideos}
            validationReport={validationReport}
            actionError={actionError}
            actionMessage={actionMessage}
            onOpenFinalPreview={openFinalPreview}
          />
        </StepPanel>
      </section>

      <ReviewWorkspaceModal
        isOpen={reviewModalOpen}
        videos={editableVideos}
        currentVideoId={currentReviewVideoId}
        reviewedVideoIds={reviewedVideoIds}
        validationMap={validationMap}
        correctionHistory={correctionHistory}
        liveTotals={liveTotals}
        isValidatingScripts={isValidatingScripts}
        onClose={() => setReviewModalOpen(false)}
        onSelectVideo={setCurrentReviewVideoId}
        onScriptChange={(videoId, nextScriptText) => updateVideoScript(videoId, nextScriptText)}
        onApplyLibraryPhrase={handleApplyLibraryPhrase}
        onApplyIssueSuggestion={handleApplyIssueSuggestion}
        onRestoreVideo={handleRestoreVideo}
        onMarkReviewed={markVideoReviewed}
        onPreviousVideo={() => moveReviewCursor("previous")}
        onNextVideo={() => moveReviewCursor("next")}
        onCompleteReview={completeReviewStep}
      />

      <FinalPreviewModal
        isOpen={finalPreviewOpen}
        videos={editableVideos}
        originalVideos={originalVideos}
        reviewedVideoIds={reviewedVideoIds}
        validationReport={validationReport}
        liveTotals={liveTotals}
        isValidatingScripts={isValidatingScripts}
        onClose={() => setFinalPreviewOpen(false)}
        onBackToReview={() => {
          setFinalPreviewOpen(false);
          openReviewModal(currentReviewVideoId || recommendedVideo?.id || editableVideos[0]?.id);
          setOpenStepId("review");
        }}
        onValidateAndDownload={handleValidateAndDownload}
      />
    </main>
  );
}
