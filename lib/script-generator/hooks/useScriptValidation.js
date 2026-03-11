"use client";

import { useState } from "react";
import {
  applyIssueSuggestionToScript,
  buildCorrectionEntry,
  buildEditableVideo,
  downloadScriptsPdf,
  normalizeDictionaryEntry,
  syncCorrectionHistory,
} from "@/lib/script-generator";

function buildIgnoredIssuesPayload(ignoredState = {}) {
  return Object.entries(ignoredState)
    .map(([videoId, issueKeys]) => ({
      videoId,
      issueKeys: Array.from(new Set(issueKeys || [])).filter(Boolean),
    }))
    .filter((entry) => entry.issueKeys.length > 0);
}

export function useScriptValidation({
  editableVideos,
  setEditableVideos,
  originalVideos,
  customDictionary,
  setCustomDictionary,
  invalidateVideoReview,
}) {
  const [validationReport, setValidationReport] = useState(null);
  const [correctionHistory, setCorrectionHistory] = useState({});
  const [ignoredIssueKeysByVideo, setIgnoredIssueKeysByVideo] = useState({});
  const [isValidatingScripts, setIsValidatingScripts] = useState(false);
  const [actionError, setActionError] = useState("");
  const [actionMessage, setActionMessage] = useState("");

  function resetActionFeedback() {
    setActionError("");
    setActionMessage("");
    setValidationReport(null);
  }

  function resetValidationSession() {
    setValidationReport(null);
    setCorrectionHistory({});
    setIgnoredIssueKeysByVideo({});
    setActionError("");
    setActionMessage("");
  }

  async function requestValidation(videos, options = {}) {
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
        customDictionary: options.customDictionary ?? customDictionary,
        ignoredIssues: buildIgnoredIssuesPayload(options.ignoredIssueKeysByVideo ?? ignoredIssueKeysByVideo),
      }),
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload?.error || "No fue posible validar la escritura de los guiones.");
    }

    return payload;
  }

  async function runValidation(videos, options = {}) {
    const payload = await requestValidation(videos, options);
    setValidationReport(payload);
    setCorrectionHistory((currentHistory) => syncCorrectionHistory(currentHistory, payload));
    return payload;
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

  async function handleValidateAndDownload({
    reviewConfirmed,
    liveTotals,
    sourceFileName,
    onBlocked,
    onValidationFailure,
  }) {
    if (!reviewConfirmed) {
      setActionError("Debes confirmar la revision del paso 2 antes de validar y descargar.");
      setActionMessage("");
      onBlocked?.();
      return false;
    }

    if (!editableVideos.length) {
      setActionError("Primero debes generar al menos un guion.");
      setActionMessage("");
      return false;
    }

    try {
      setIsValidatingScripts(true);
      setActionError("");
      setActionMessage("");

      const payload = await runValidation(editableVideos);

      if (!payload.passed) {
        const firstVideoWithIssues = payload.videos.find((video) => !video.passed);
        onValidationFailure?.(firstVideoWithIssues?.id || "");
        setActionError(
          "Hay observaciones pendientes. Puedes corregirlas, ignorarlas o agregar terminos validos al diccionario antes de descargar el PDF."
        );
        return false;
      }

      await downloadScriptsPdf({
        videos: editableVideos,
        totals: liveTotals,
        sourceFileName,
        provider: payload.provider,
      });

      setActionMessage("El PDF se descargo despues de pasar la validacion de escritura y ortografia.");
      return true;
    } catch (requestError) {
      setActionError(requestError?.message || "No fue posible validar y descargar el PDF.");
      return false;
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

      const payload = await runValidation(nextVideos);
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

  async function handleIgnoreIssue(videoId, issue) {
    const issueKey = issue?.issueKey;
    if (!issueKey) {
      setActionError("No pude identificar esa observacion para ignorarla.");
      setActionMessage("");
      return;
    }

    try {
      setIsValidatingScripts(true);
      setActionError("");
      setActionMessage("");

      const nextIgnoredIssueKeysByVideo = {
        ...ignoredIssueKeysByVideo,
        [videoId]: Array.from(new Set([...(ignoredIssueKeysByVideo[videoId] || []), issueKey])),
      };

      setIgnoredIssueKeysByVideo(nextIgnoredIssueKeysByVideo);
      const payload = await runValidation(editableVideos, {
        ignoredIssueKeysByVideo: nextIgnoredIssueKeysByVideo,
      });

      invalidateVideoReview(videoId);
      setActionMessage(
        payload.passed
          ? "La observacion se ignoro y el curso ya no queda bloqueado por esa revision."
          : "La observacion se ignoro. Si aun ves bloqueos, quedan otras revisiones pendientes."
      );
    } catch (requestError) {
      setActionError(requestError?.message || "No fue posible ignorar esa observacion.");
      setActionMessage("");
    } finally {
      setIsValidatingScripts(false);
    }
  }

  async function handleAddToDictionary(videoId, issue) {
    const dictionaryCandidate = normalizeDictionaryEntry(issue?.dictionaryCandidate || issue?.matchText || "");
    if (!dictionaryCandidate) {
      setActionError("No encontre una palabra o termino valido para agregar al diccionario.");
      setActionMessage("");
      return;
    }

    try {
      setIsValidatingScripts(true);
      setActionError("");
      setActionMessage("");

      const nextDictionary = Array.from(new Set([...customDictionary, dictionaryCandidate])).slice(0, 300);
      setCustomDictionary(nextDictionary);

      const payload = await runValidation(editableVideos, {
        customDictionary: nextDictionary,
      });

      invalidateVideoReview(videoId);
      setActionMessage(
        payload.passed
          ? `"${issue.dictionaryCandidate || dictionaryCandidate}" se agrego al diccionario y ya no bloquea la descarga.`
          : `"${issue.dictionaryCandidate || dictionaryCandidate}" se agrego al diccionario. Aun quedan otras observaciones por revisar.`
      );
    } catch (requestError) {
      setActionError(requestError?.message || "No fue posible agregar ese termino al diccionario.");
      setActionMessage("");
    } finally {
      setIsValidatingScripts(false);
    }
  }

  return {
    validationReport,
    setValidationReport,
    correctionHistory,
    ignoredIssueKeysByVideo,
    isValidatingScripts,
    actionError,
    actionMessage,
    setActionError,
    setActionMessage,
    resetActionFeedback,
    resetValidationSession,
    requestValidation,
    runValidation,
    handleRestoreVideo,
    handleValidateAndDownload,
    handleApplyIssueSuggestion,
    handleIgnoreIssue,
    handleAddToDictionary,
  };
}
