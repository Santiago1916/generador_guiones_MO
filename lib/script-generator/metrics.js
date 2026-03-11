import { COURSE_LIMITS, VIDEO_DURATION_GUIDE } from "@/lib/course-config";

const REPETITION_STOPWORDS = new Set([
  "a",
  "al",
  "ante",
  "bajo",
  "con",
  "contra",
  "de",
  "del",
  "desde",
  "durante",
  "el",
  "ella",
  "en",
  "entre",
  "es",
  "esta",
  "este",
  "esto",
  "hacia",
  "la",
  "las",
  "lo",
  "los",
  "me",
  "mi",
  "nos",
  "para",
  "por",
  "que",
  "se",
  "sin",
  "su",
  "sus",
  "te",
  "tu",
  "un",
  "una",
  "uno",
  "y",
]);

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

function normalizeAnalysisText(text = "") {
  return String(text)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function buildPhraseWindows(scriptText = "", windowSize = 7) {
  const tokens = normalizeAnalysisText(scriptText).split(" ").filter(Boolean);
  const phrases = new Set();

  for (let index = 0; index <= tokens.length - windowSize; index += 1) {
    const windowTokens = tokens.slice(index, index + windowSize);
    const meaningfulTokens = windowTokens.filter((token) => !REPETITION_STOPWORDS.has(token));
    const uniqueMeaningful = new Set(meaningfulTokens);

    if (meaningfulTokens.length < 4 || uniqueMeaningful.size < 4) {
      continue;
    }

    const phrase = windowTokens.join(" ");
    if (phrase.length < 34) {
      continue;
    }

    phrases.add(phrase);
  }

  return phrases;
}

function formatPhrasePreview(phrase = "") {
  const cleanedPhrase = String(phrase).trim();
  if (cleanedPhrase.length <= 88) return cleanedPhrase;
  return `${cleanedPhrase.slice(0, 85)}...`;
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

export function buildVideoBalanceSummary(videos = []) {
  const details = videos.map((video) => {
    const status = getVideoDurationStatus(video, videos);
    return {
      videoId: video.id,
      title: video.title,
      ...status,
    };
  });

  const outliers = details.filter((detail) => detail.tone === "warning");

  return {
    tone: outliers.length ? "warning" : "success",
    label: outliers.length ? "Revisar equilibrio" : "Equilibrio estable",
    note: outliers.length
      ? `Detecte ${outliers.length} video${outliers.length === 1 ? "" : "s"} por fuera del balance sugerido frente al resto del curso.`
      : "La duracion por video se ve bien repartida frente al resto del curso.",
    outlierCount: outliers.length,
    details,
    outliers,
  };
}

export function buildRepetitionReport(videos = []) {
  const videosById = new Map(videos.map((video) => [video.id, video]));
  const phraseIndex = new Map();

  videos.forEach((video) => {
    const phrases = buildPhraseWindows(video.scriptText);
    phrases.forEach((phrase) => {
      const relatedIds = phraseIndex.get(phrase) || new Set();
      relatedIds.add(video.id);
      phraseIndex.set(phrase, relatedIds);
    });
  });

  const repeatedEntries = Array.from(phraseIndex.entries())
    .map(([phrase, ids]) => ({
      phrase,
      videoIds: Array.from(ids),
    }))
    .filter((entry) => entry.videoIds.length > 1)
    .sort((left, right) => right.videoIds.length - left.videoIds.length || right.phrase.length - left.phrase.length);

  const matchesByVideoId = new Map(videos.map((video) => [video.id, []]));

  repeatedEntries.forEach((entry) => {
    entry.videoIds.forEach((videoId) => {
      const relatedTitles = entry.videoIds
        .filter((currentId) => currentId !== videoId)
        .map((currentId) => videosById.get(currentId)?.title)
        .filter(Boolean);

      matchesByVideoId.get(videoId)?.push({
        phrase: formatPhrasePreview(entry.phrase),
        relatedTitles,
      });
    });
  });

  const details = videos.map((video) => {
    const matches = (matchesByVideoId.get(video.id) || [])
      .sort((left, right) => right.relatedTitles.length - left.relatedTitles.length)
      .slice(0, 3);

    const relatedTitles = Array.from(new Set(matches.flatMap((match) => match.relatedTitles)));

    if (!matches.length) {
      return {
        videoId: video.id,
        title: video.title,
        tone: "success",
        label: "Sin repeticiones relevantes",
        note: "No detecte frases largas repetidas de forma relevante frente a otros videos.",
        matches: [],
      };
    }

    return {
      videoId: video.id,
      title: video.title,
      tone: "warning",
      label: "Ideas repetidas",
      note: `Este video comparte frases largas con ${relatedTitles.join(", ")}. Conviene variar el enfoque o resumir para evitar sensacion de repeticion.`,
      matches,
    };
  });

  const repeatedVideos = details.filter((detail) => detail.matches.length > 0);

  return {
    tone: repeatedVideos.length ? "warning" : "success",
    label: repeatedVideos.length ? "Revisar repeticiones" : "Sin repeticiones relevantes",
    note: repeatedVideos.length
      ? `Detecte ${repeatedVideos.length} video${repeatedVideos.length === 1 ? "" : "s"} con frases o ideas repetidas frente a otros bloques del curso.`
      : "No detecte repeticiones largas que valga la pena corregir entre videos.",
    repeatedVideosCount: repeatedVideos.length,
    repeatedPhraseCount: repeatedEntries.length,
    details,
    repeatedPhrases: repeatedEntries.slice(0, 6).map((entry) => ({
      phrase: formatPhrasePreview(entry.phrase),
      videos: entry.videoIds
        .map((videoId) => videosById.get(videoId)?.title)
        .filter(Boolean),
    })),
  };
}

export function getDocumentConfidenceState(documentDiagnostics = {}) {
  const tone = documentDiagnostics?.confidenceTone || "neutral";
  const label = documentDiagnostics?.confidenceLabel || "Sin datos";
  const score = Number.isFinite(documentDiagnostics?.confidenceScore)
    ? documentDiagnostics.confidenceScore
    : null;

  return {
    tone,
    label,
    score,
    note:
      documentDiagnostics?.confidenceMessage ||
      "Aun no hay informacion suficiente para medir la calidad de lectura del documento.",
  };
}
