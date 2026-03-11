"use client";

import { useCallback, useState } from "react";

export function useReviewFlow() {
  const [reviewedVideoIds, setReviewedVideoIds] = useState([]);
  const [reviewConfirmed, setReviewConfirmed] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [finalPreviewOpen, setFinalPreviewOpen] = useState(false);
  const [currentReviewVideoId, setCurrentReviewVideoId] = useState("");

  function resetReviewFlow(nextVideos = []) {
    setReviewedVideoIds([]);
    setReviewConfirmed(false);
    setReviewModalOpen(false);
    setFinalPreviewOpen(false);
    setCurrentReviewVideoId(nextVideos[0]?.id || "");
  }

  function invalidateVideoReview(videoId) {
    if (!videoId) return;
    setReviewedVideoIds((currentIds) => currentIds.filter((currentId) => currentId !== videoId));
    setReviewConfirmed(false);
    setFinalPreviewOpen(false);
  }

  function markVideoReviewed(videoId) {
    setReviewedVideoIds((currentIds) =>
      currentIds.includes(videoId) ? currentIds : [...currentIds, videoId]
    );
  }

  const openReviewModal = useCallback((videos = [], videoId = "") => {
    const targetId = videoId || videos[0]?.id || "";
    if (!targetId) return;

    setCurrentReviewVideoId(targetId);
    setReviewModalOpen(true);
    setFinalPreviewOpen(false);
  }, []);

  const openFinalPreview = useCallback(({ onBlocked } = {}) => {
    if (!reviewConfirmed) {
      onBlocked?.();
      return false;
    }

    setFinalPreviewOpen(true);
    setReviewModalOpen(false);
    return true;
  }, [reviewConfirmed]);

  function moveReviewCursor(videos = [], direction) {
    const currentIndex = videos.findIndex((video) => video.id === currentReviewVideoId);
    if (currentIndex < 0) return;

    const nextIndex = direction === "next" ? currentIndex + 1 : currentIndex - 1;
    if (nextIndex < 0 || nextIndex >= videos.length) return;
    setCurrentReviewVideoId(videos[nextIndex].id);
  }

  function completeReviewStep(videos = [], { onBlocked, onCompleted } = {}) {
    const allReviewed = videos.length > 0 && videos.every((video) => reviewedVideoIds.includes(video.id));
    if (!allReviewed) {
      onBlocked?.();
      return false;
    }

    setReviewConfirmed(true);
    setReviewModalOpen(false);
    setFinalPreviewOpen(true);
    onCompleted?.();
    return true;
  }

  const closeAllGuidedOverlays = useCallback(() => {
    setReviewModalOpen(false);
    setFinalPreviewOpen(false);
  }, []);

  return {
    reviewedVideoIds,
    setReviewedVideoIds,
    reviewConfirmed,
    setReviewConfirmed,
    reviewModalOpen,
    setReviewModalOpen,
    finalPreviewOpen,
    setFinalPreviewOpen,
    currentReviewVideoId,
    setCurrentReviewVideoId,
    resetReviewFlow,
    invalidateVideoReview,
    markVideoReviewed,
    openReviewModal,
    openFinalPreview,
    moveReviewCursor,
    completeReviewStep,
    closeAllGuidedOverlays,
  };
}
