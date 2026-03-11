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
import { COURSE_CATEGORY_OPTIONS } from "@/lib/course-categories";
import {
  applyLibraryPhraseToScript,
  buildEditableVideo,
  buildRepetitionReport,
  buildTotals,
  buildVideoBalanceSummary,
  createScriptGeneratorTour,
  getCurrentStepId,
  getDocumentConfidenceState,
  getNextActionCard,
  getOverallSemaphore,
  getProcessSteps,
} from "@/lib/script-generator";
import { useAccessibleModal } from "@/lib/script-generator/hooks/useAccessibleModal";
import { useCourseProcessing } from "@/lib/script-generator/hooks/useCourseProcessing";
import { useLocalDrafts } from "@/lib/script-generator/hooks/useLocalDrafts";
import { useReviewFlow } from "@/lib/script-generator/hooks/useReviewFlow";
import { useScriptValidation } from "@/lib/script-generator/hooks/useScriptValidation";

export default function Home() {
  const inputRef = useRef(null);
  const tourRef = useRef(null);
  const processing = useCourseProcessing();
  const reviewFlow = useReviewFlow();
  const { customDictionary, setCustomDictionary, selectedCourseType, setSelectedCourseType } = useLocalDrafts();
  const validation = useScriptValidation({
    editableVideos: processing.editableVideos,
    setEditableVideos: processing.setEditableVideos,
    originalVideos: processing.originalVideos,
    customDictionary,
    setCustomDictionary,
    invalidateVideoReview: reviewFlow.invalidateVideoReview,
  });

  const currentStepId = getCurrentStepId({
    result: processing.result,
    reviewConfirmed: reviewFlow.reviewConfirmed,
  });
  const [openStepId, setOpenStepId] = useState(currentStepId);

  const liveTotals = useMemo(() => buildTotals(processing.editableVideos), [processing.editableVideos]);
  const repetitionReport = useMemo(
    () => buildRepetitionReport(processing.editableVideos),
    [processing.editableVideos]
  );
  const balanceReport = useMemo(
    () => buildVideoBalanceSummary(processing.editableVideos),
    [processing.editableVideos]
  );
  const documentConfidence = useMemo(
    () => getDocumentConfidenceState(processing.result?.documentDiagnostics),
    [processing.result]
  );
  const validationMap = useMemo(
    () => new Map((validation.validationReport?.videos || []).map((video) => [video.id, video])),
    [validation.validationReport]
  );
  const recommendedVideo = useMemo(() => {
    const firstVideoWithIssues = processing.editableVideos.find(
      (video) => validationMap.get(video.id)?.passed === false
    );
    const firstPendingReview = processing.editableVideos.find(
      (video) => !reviewFlow.reviewedVideoIds.includes(video.id)
    );
    const firstBalanceOutlier = processing.editableVideos.find(
      (video) => balanceReport.details.find((detail) => detail.videoId === video.id)?.tone === "warning"
    );
    const firstRepeatedVideo = processing.editableVideos.find(
      (video) => repetitionReport.details.find((detail) => detail.videoId === video.id)?.tone === "warning"
    );

    return (
      firstVideoWithIssues ||
      firstPendingReview ||
      firstBalanceOutlier ||
      firstRepeatedVideo ||
      processing.editableVideos[0] ||
      null
    );
  }, [balanceReport.details, processing.editableVideos, repetitionReport.details, reviewFlow.reviewedVideoIds, validationMap]);
  const processSteps = useMemo(
    () =>
      getProcessSteps({
        selectedFile: processing.selectedFile,
        result: processing.result,
        editableVideos: processing.editableVideos,
        validationReport: validation.validationReport,
        reviewConfirmed: reviewFlow.reviewConfirmed,
      }),
    [processing.selectedFile, processing.result, processing.editableVideos, validation.validationReport, reviewFlow.reviewConfirmed]
  );
  const nextAction = useMemo(
    () =>
      getNextActionCard({
        result: processing.result,
        validationReport: validation.validationReport,
        totals: liveTotals,
        recommendedVideo,
        scriptSignals: {
          repetitionReport,
          balanceReport,
          documentConfidence,
        },
      }),
    [processing.result, validation.validationReport, liveTotals, recommendedVideo, repetitionReport, balanceReport, documentConfidence]
  );
  const overallStatus = useMemo(
    () =>
      getOverallSemaphore(processing.result, liveTotals, validation.validationReport, {
        repetitionReport,
        balanceReport,
        documentConfidence,
      }),
    [processing.result, liveTotals, validation.validationReport, repetitionReport, balanceReport, documentConfidence]
  );

  const readyVideosCount = validation.validationReport?.videos?.filter((video) => video.passed).length || 0;
  const videosWithIssuesCount = validation.validationReport?.videos?.filter((video) => !video.passed).length || 0;
  const pendingValidationCount = validation.validationReport
    ? Math.max(0, processing.editableVideos.length - validation.validationReport.videos.length)
    : processing.editableVideos.length;
  const uploadStep = processSteps.find((step) => step.id === "upload");
  const reviewStep = processSteps.find((step) => step.id === "review");
  const exportStep = processSteps.find((step) => step.id === "export");

  useEffect(() => {
    setOpenStepId(currentStepId);
  }, [currentStepId]);

  const closeAllGuidedOverlays = reviewFlow.closeAllGuidedOverlays;

  const handleOpenStep = useCallback(
    (stepId) => {
      if (stepId === "upload") {
        setOpenStepId("upload");
        return;
      }

      if (stepId === "review" && processing.result) {
        setOpenStepId("review");
        return;
      }

      if (stepId === "export" && processing.result && reviewFlow.reviewConfirmed) {
        setOpenStepId("export");
      }
    },
    [processing.result, reviewFlow.reviewConfirmed]
  );

  const handleChooseFile = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const handleSelectFile = useCallback(
    (file) => {
      if (!file) return;
      processing.selectFile(file);
      validation.resetValidationSession();
      reviewFlow.resetReviewFlow();
      setOpenStepId("upload");
    },
    [processing, validation, reviewFlow]
  );

  const handleDrop = useCallback(
    (event) => {
      event.preventDefault();
      event.stopPropagation();
      processing.setDragActive(false);
      handleSelectFile(event.dataTransfer?.files?.[0]);
    },
    [handleSelectFile, processing]
  );

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();

      const response = await processing.processSelectedFile({
        preferredCourseType: selectedCourseType,
        onBefore: () => {
          validation.resetValidationSession();
        },
        onSuccess: (_payload, nextVideos) => {
          reviewFlow.resetReviewFlow(nextVideos);
          validation.setActionMessage("Documento procesado. El siguiente paso es tomar la revision del borrador.");
        },
        onError: () => {
          reviewFlow.resetReviewFlow();
        },
      });

      if (response) {
        setOpenStepId("review");
      }
    },
    [processing, reviewFlow, selectedCourseType, validation]
  );

  const openReviewModal = useCallback(
    (videoId = recommendedVideo?.id || processing.editableVideos[0]?.id || "") => {
      reviewFlow.openReviewModal(processing.editableVideos, videoId);
      setOpenStepId("review");
    },
    [processing.editableVideos, recommendedVideo, reviewFlow]
  );

  const openFinalPreview = useCallback(() => {
    const isOpen = reviewFlow.openFinalPreview({
      onBlocked: () => {
        validation.setActionError("Primero debes completar y confirmar la revision del paso 2.");
        validation.setActionMessage("");
      },
    });

    if (isOpen) {
      setOpenStepId("export");
    }
  }, [reviewFlow, validation]);

  const handleStartTour = useCallback(() => {
    tourRef.current?.destroy();
    const tour = createScriptGeneratorTour({
      result: processing.result,
      reviewConfirmed: reviewFlow.reviewConfirmed,
      onOpenStep: handleOpenStep,
      onOpenReviewModal: () => openReviewModal(),
      onOpenFinalPreview: openFinalPreview,
      onCloseReviewModal: () => reviewFlow.setReviewModalOpen(false),
      onCloseFinalPreview: () => reviewFlow.setFinalPreviewOpen(false),
      onTourFinished: () => {
        if (typeof window !== "undefined") {
          window.localStorage.setItem("mo-script-generator-tour-seen", "true");
        }
      },
    });

    tourRef.current = tour;
    closeAllGuidedOverlays();
    tour.drive();
  }, [processing.result, reviewFlow, handleOpenStep, openReviewModal, openFinalPreview, closeAllGuidedOverlays]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const hasSeenTour = window.localStorage.getItem("mo-script-generator-tour-seen");
    if (hasSeenTour) return undefined;

    const timer = window.setTimeout(() => {
      handleStartTour();
    }, 700);

    return () => window.clearTimeout(timer);
  }, [handleStartTour]);

  function handleApplyLibraryPhrase(videoId, slot, phraseText, label) {
    const currentVideo = processing.editableVideos.find((video) => video.id === videoId);
    if (!currentVideo) return;

    const nextScriptText = applyLibraryPhraseToScript(currentVideo.scriptText, slot, phraseText);
    processing.setEditableVideos((currentVideos) =>
      currentVideos.map((video) =>
        video.id === videoId ? buildEditableVideo({ ...video, scriptText: nextScriptText }) : video
      )
    );
    reviewFlow.invalidateVideoReview(videoId);
    validation.resetActionFeedback();
    validation.setActionMessage(`Se aplico "${label}" al guion de ${currentVideo.title}.`);
  }

  function handleDownloadTemplate() {
    window.open("/api/template-course", "_self");
  }

  function handleCompleteReviewStep() {
    reviewFlow.completeReviewStep(processing.editableVideos, {
      onBlocked: () => {
        validation.setActionError("Debes revisar todos los videos antes de cerrar el paso 2.");
        validation.setActionMessage("");
      },
      onCompleted: () => {
        setOpenStepId("export");
        validation.setActionError("");
        validation.setActionMessage("La revision del paso 2 quedo confirmada. Ya puedes abrir el preview final.");
      },
    });
  }

  const reviewModalRef = useAccessibleModal({
    isOpen: reviewFlow.reviewModalOpen,
    onClose: () => reviewFlow.setReviewModalOpen(false),
    onPrevious: () => reviewFlow.moveReviewCursor(processing.editableVideos, "previous"),
    onNext: () => reviewFlow.moveReviewCursor(processing.editableVideos, "next"),
    enableVideoNavigation: true,
  });

  const finalPreviewRef = useAccessibleModal({
    isOpen: reviewFlow.finalPreviewOpen,
    onClose: () => reviewFlow.setFinalPreviewOpen(false),
  });

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
          result={processing.result}
          reviewConfirmed={reviewFlow.reviewConfirmed}
          onOpenStep={handleOpenStep}
        />

        <StepPanel
          step={uploadStep}
          eyebrow="Paso 1"
          className="tour-upload-step-panel"
          isOpen={openStepId === "upload"}
          statusLabels={{ done: "Completado", current: "En curso", pending: "Pendiente" }}
          onToggle={() => handleOpenStep("upload")}
        >
          <UploadStep
            inputRef={inputRef}
            selectedFile={processing.selectedFile}
            dragActive={processing.dragActive}
            error={processing.error}
            isProcessing={processing.isProcessing}
            selectedCourseType={selectedCourseType}
            courseTypeOptions={COURSE_CATEGORY_OPTIONS}
            onSubmit={handleSubmit}
            onChooseFile={handleChooseFile}
            onSelectFile={handleSelectFile}
            onCourseTypeChange={setSelectedCourseType}
            onDragEnter={(event) => {
              event.preventDefault();
              processing.setDragActive(true);
            }}
            onDragOver={(event) => {
              event.preventDefault();
              processing.setDragActive(true);
            }}
            onDragLeave={(event) => {
              event.preventDefault();
              processing.setDragActive(false);
            }}
            onDrop={handleDrop}
            onDownloadTemplate={handleDownloadTemplate}
          />
        </StepPanel>

        <StepPanel
          step={reviewStep}
          eyebrow="Paso 2"
          className="tour-review-step-panel"
          isOpen={openStepId === "review"}
          isDisabled={!processing.result}
          statusLabels={{ done: "Revisado", current: "En revision", pending: "Pendiente" }}
          onToggle={() => handleOpenStep("review")}
        >
          <ReviewStep
            result={processing.result}
            nextAction={nextAction}
            editableVideos={processing.editableVideos}
            reviewedVideoIds={reviewFlow.reviewedVideoIds}
            reviewConfirmed={reviewFlow.reviewConfirmed}
            readyVideosCount={readyVideosCount}
            videosWithIssuesCount={videosWithIssuesCount}
            pendingValidationCount={pendingValidationCount}
            repetitionReport={repetitionReport}
            balanceReport={balanceReport}
            documentConfidence={documentConfidence}
            onOpenReviewModal={() => openReviewModal()}
            onOpenExportStep={() => handleOpenStep("export")}
          />
        </StepPanel>

        <StepPanel
          step={exportStep}
          eyebrow="Paso 3"
          className="tour-export-step-panel"
          isOpen={openStepId === "export"}
          isDisabled={!processing.result || !reviewFlow.reviewConfirmed}
          statusLabels={{ done: "Listo", current: "Pendiente", pending: "Bloqueado" }}
          onToggle={() => handleOpenStep("export")}
        >
          <ExportStep
            result={processing.result}
            overallStatus={overallStatus}
            liveTotals={liveTotals}
            reviewConfirmed={reviewFlow.reviewConfirmed}
            reviewedVideoIds={reviewFlow.reviewedVideoIds}
            editableVideos={processing.editableVideos}
            validationReport={validation.validationReport}
            repetitionReport={repetitionReport}
            balanceReport={balanceReport}
            documentConfidence={documentConfidence}
            actionError={validation.actionError}
            actionMessage={validation.actionMessage}
            onOpenFinalPreview={openFinalPreview}
          />
        </StepPanel>
      </section>

      <ReviewWorkspaceModal
        modalRef={reviewModalRef}
        isOpen={reviewFlow.reviewModalOpen}
        videos={processing.editableVideos}
        currentVideoId={reviewFlow.currentReviewVideoId}
        reviewedVideoIds={reviewFlow.reviewedVideoIds}
        validationMap={validationMap}
        correctionHistory={validation.correctionHistory}
        customDictionary={customDictionary}
        courseCategory={processing.result?.courseCategory}
        liveTotals={liveTotals}
        repetitionReport={repetitionReport}
        balanceReport={balanceReport}
        documentConfidence={documentConfidence}
        isValidatingScripts={validation.isValidatingScripts}
        onClose={() => reviewFlow.setReviewModalOpen(false)}
        onSelectVideo={reviewFlow.setCurrentReviewVideoId}
        onScriptChange={(videoId, nextScriptText) => {
          processing.setEditableVideos((currentVideos) =>
            currentVideos.map((video) =>
              video.id === videoId ? buildEditableVideo({ ...video, scriptText: nextScriptText }) : video
            )
          );
          reviewFlow.invalidateVideoReview(videoId);
          validation.resetActionFeedback();
        }}
        onApplyLibraryPhrase={handleApplyLibraryPhrase}
        onApplyIssueSuggestion={validation.handleApplyIssueSuggestion}
        onIgnoreIssue={validation.handleIgnoreIssue}
        onAddToDictionary={validation.handleAddToDictionary}
        onRestoreVideo={validation.handleRestoreVideo}
        onMarkReviewed={reviewFlow.markVideoReviewed}
        onPreviousVideo={() => reviewFlow.moveReviewCursor(processing.editableVideos, "previous")}
        onNextVideo={() => reviewFlow.moveReviewCursor(processing.editableVideos, "next")}
        onCompleteReview={handleCompleteReviewStep}
      />

      <FinalPreviewModal
        modalRef={finalPreviewRef}
        isOpen={reviewFlow.finalPreviewOpen}
        videos={processing.editableVideos}
        originalVideos={processing.originalVideos}
        reviewedVideoIds={reviewFlow.reviewedVideoIds}
        validationReport={validation.validationReport}
        liveTotals={liveTotals}
        repetitionReport={repetitionReport}
        balanceReport={balanceReport}
        documentConfidence={documentConfidence}
        isValidatingScripts={validation.isValidatingScripts}
        onClose={() => reviewFlow.setFinalPreviewOpen(false)}
        onBackToReview={() => {
          reviewFlow.setFinalPreviewOpen(false);
          openReviewModal(
            reviewFlow.currentReviewVideoId || recommendedVideo?.id || processing.editableVideos[0]?.id
          );
          setOpenStepId("review");
        }}
        onValidateAndDownload={() =>
          validation.handleValidateAndDownload({
            reviewConfirmed: reviewFlow.reviewConfirmed,
            liveTotals,
            sourceFileName: processing.result?.file?.name || processing.selectedFile?.name,
            onBlocked: () => setOpenStepId("review"),
            onValidationFailure: (videoId) => {
              if (videoId) {
                reviewFlow.setCurrentReviewVideoId(videoId);
              }
              setOpenStepId("review");
              reviewFlow.setFinalPreviewOpen(false);
              reviewFlow.setReviewModalOpen(true);
            },
          })
        }
      />
    </main>
  );
}
