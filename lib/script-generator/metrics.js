import { COURSE_LIMITS, VIDEO_DURATION_GUIDE } from "@/lib/course-config";

export function formatFileSize(bytes = 0) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 KB";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatDuration(seconds = 0) {
  const safeSeconds = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;
  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
}

export function countWords(text = "") {
  return String(text)
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean).length;
}

export function buildVideoMetrics(scriptText = "") {
  const wordCount = countWords(scriptText);
  const estimatedSeconds = Math.round(
    (wordCount / COURSE_LIMITS.wordsPerMinute) * 60 + COURSE_LIMITS.extraSecondsPerVideo
  );

  return {
    wordCount,
    estimatedSeconds,
    estimatedDuration: formatDuration(estimatedSeconds),
  };
}

export function buildEditableVideo(video) {
  return {
    ...video,
    ...buildVideoMetrics(video.scriptText),
  };
}

export function buildTotals(videos = []) {
  const wordCount = videos.reduce((sum, video) => sum + (video.wordCount || 0), 0);
  const estimatedSeconds = videos.reduce((sum, video) => sum + (video.estimatedSeconds || 0), 0);
  const inTargetRange =
    estimatedSeconds >= COURSE_LIMITS.targetMinSeconds && estimatedSeconds <= COURSE_LIMITS.targetMaxSeconds;

  return {
    wordCount,
    estimatedSeconds,
    estimatedDuration: formatDuration(estimatedSeconds),
    inTargetRange,
    averageSeconds: videos.length ? estimatedSeconds / videos.length : 0,
    targetWindow: `${formatDuration(COURSE_LIMITS.targetMinSeconds)} - ${formatDuration(
      COURSE_LIMITS.targetMaxSeconds
    )}`,
  };
}

export function getRangeTone(totals) {
  if (!totals) return "neutral";
  return totals.inTargetRange ? "success" : "warning";
}

export function getRangeMessage(totals) {
  if (!totals?.estimatedSeconds) return "Aun no hay un guion generado para medir la duracion.";
  if (totals.inTargetRange) {
    return "La duracion actual del guion se mantiene dentro de la ventana ideal para el curso.";
  }
  if (totals.estimatedSeconds < COURSE_LIMITS.targetMinSeconds) {
    return "El guion esta corto. Conviene ampliar ejemplos o explicaciones antes de producirlo.";
  }
  return "El guion esta largo. Conviene resumir o dividir algunas partes para no superar 8 minutos.";
}

export function getScriptExcerpt(scriptText = "") {
  return String(scriptText)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(2, 5)
    .join(" ");
}

export function getVideoDurationStatus(video, videos) {
  if (!videos.length) {
    return {
      tone: "neutral",
      label: "Sin medir",
      note: "Aun no hay suficiente informacion para comparar este video.",
    };
  }

  const totalSeconds = videos.reduce((sum, currentVideo) => sum + (currentVideo.estimatedSeconds || 0), 0);
  const averageSeconds = totalSeconds / videos.length;
  const minRecommended = Math.max(
    VIDEO_DURATION_GUIDE.absoluteMinSeconds,
    Math.round(averageSeconds * VIDEO_DURATION_GUIDE.shortRatio)
  );
  const maxRecommended = Math.min(
    VIDEO_DURATION_GUIDE.absoluteMaxSeconds,
    Math.round(averageSeconds * VIDEO_DURATION_GUIDE.longRatio)
  );

  if (
    video.estimatedSeconds < minRecommended &&
    averageSeconds - video.estimatedSeconds >= VIDEO_DURATION_GUIDE.minGapSeconds
  ) {
    return {
      tone: "warning",
      label: "Mas corto de lo ideal",
      note: `Este video quedo por debajo del rango sugerido (${formatDuration(minRecommended)} - ${formatDuration(
        maxRecommended
      )}) frente al balance general del curso.`,
    };
  }

  if (
    video.estimatedSeconds > maxRecommended &&
    video.estimatedSeconds - averageSeconds >= VIDEO_DURATION_GUIDE.minGapSeconds
  ) {
    return {
      tone: "warning",
      label: "Mas largo de lo ideal",
      note: `Este video quedo por encima del rango sugerido (${formatDuration(minRecommended)} - ${formatDuration(
        maxRecommended
      )}) frente al balance general del curso.`,
    };
  }

  return {
    tone: "success",
    label: "Duracion equilibrada",
    note: `Este video se mantiene dentro del rango sugerido (${formatDuration(minRecommended)} - ${formatDuration(
      maxRecommended
    )}) frente a los demas.`,
  };
}
