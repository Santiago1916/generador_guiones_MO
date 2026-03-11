"use client";

import { useState } from "react";
import { buildEditableVideo } from "@/lib/script-generator";

export function useCourseProcessing() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [editableVideos, setEditableVideos] = useState([]);
  const [originalVideos, setOriginalVideos] = useState([]);

  function clearProcessingState() {
    setResult(null);
    setEditableVideos([]);
    setOriginalVideos([]);
    setError("");
  }

  function selectFile(file) {
    if (!file) return;
    setSelectedFile(file);
    clearProcessingState();
  }

  function handleDrop(event) {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(false);
    selectFile(event.dataTransfer?.files?.[0]);
  }

  async function processSelectedFile({ preferredCourseType = "auto", onBefore, onSuccess, onError } = {}) {
    if (!selectedFile) {
      setError("Sube un archivo antes de procesar el curso.");
      return null;
    }

    try {
      setIsProcessing(true);
      setError("");
      onBefore?.();

      const formData = new FormData();
      formData.set("file", selectedFile);
      formData.set("courseType", preferredCourseType);

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
      onSuccess?.(payload, nextVideos);
      return { payload, nextVideos };
    } catch (requestError) {
      clearProcessingState();
      setError(requestError?.message || "No fue posible procesar el documento.");
      onError?.(requestError);
      return null;
    } finally {
      setIsProcessing(false);
    }
  }

  return {
    selectedFile,
    setSelectedFile,
    dragActive,
    setDragActive,
    isProcessing,
    error,
    setError,
    result,
    setResult,
    editableVideos,
    setEditableVideos,
    originalVideos,
    setOriginalVideos,
    clearProcessingState,
    selectFile,
    handleDrop,
    processSelectedFile,
  };
}
