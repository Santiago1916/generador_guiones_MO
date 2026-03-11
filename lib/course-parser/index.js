import { COURSE_LIMITS } from "../course-config.js";
import { resolveCourseCategory } from "../course-categories.js";
import { buildGenericVideos, buildSpecializedVideos } from "./builders.js";
import { buildGenericBlocks, countSpecializedHits, parseSectionBlocks } from "./outline.js";
import { formatDuration, limitWords, normalizeSourceText } from "./text.js";
import { buildGenericValidation, buildSpecializedValidation } from "./validation.js";

function buildModeResult(mode, payload) {
  const { sections, outline, extractionDiagnostics, normalizedText, courseCategory } = payload;

  if (mode === "generic") {
    return {
      videos: buildGenericVideos(outline, courseCategory),
      validation: buildGenericValidation(outline, normalizedText, extractionDiagnostics, courseCategory),
      extractedText: normalizedText,
      extractedPreview: limitWords(normalizedText, 260),
      documentDiagnostics: extractionDiagnostics || {},
      courseTitle: outline.courseTitle,
      courseCategory,
    };
  }

  return {
    videos: buildSpecializedVideos(sections),
    validation: buildSpecializedValidation(sections, normalizedText, extractionDiagnostics),
    extractedText: normalizedText,
    extractedPreview: limitWords(normalizedText, 260),
    documentDiagnostics: extractionDiagnostics || {},
    courseTitle: "",
    courseCategory,
  };
}

export function analyzeCourseText(rawText = "", context = {}) {
  const normalizedText = normalizeSourceText(rawText);
  const sections = parseSectionBlocks(normalizedText);
  const specializedHits = countSpecializedHits(sections);
  const provisionalMode = specializedHits >= 2 ? "specialized" : "generic";
  const courseCategory = resolveCourseCategory(context.preferredCourseType, normalizedText, provisionalMode);
  const genericOutline = buildGenericBlocks(normalizedText, courseCategory);
  const genericContentBlocks = genericOutline.blocks.filter((block) => block.kind !== "exam").length;
  const mode =
    specializedHits >= 2
      ? "specialized"
      : genericContentBlocks >= 2
        ? "generic"
        : specializedHits
          ? "specialized"
          : "generic";

  const result = buildModeResult(mode, {
    sections,
    outline: genericOutline,
    extractionDiagnostics: context.extractionDiagnostics || {},
    normalizedText,
    courseCategory,
  });

  const totalWords = result.videos.reduce((sum, video) => sum + video.wordCount, 0);
  const totalSeconds = result.videos.reduce((sum, video) => sum + video.estimatedSeconds, 0);
  const inTargetRange =
    totalSeconds >= COURSE_LIMITS.targetMinSeconds && totalSeconds <= COURSE_LIMITS.targetMaxSeconds;

  const recommendations = [];
  if (totalSeconds < COURSE_LIMITS.targetMinSeconds) {
    recommendations.push(
      "El curso queda corto para la meta definida. Conviene ampliar ejemplos, contexto o mensajes de cierre hasta acercarlo a 5 minutos."
    );
  }
  if (totalSeconds > COURSE_LIMITS.targetMaxSeconds) {
    recommendations.push(
      "El curso supera 8 minutos. Conviene recortar repeticiones o resumir modulos antes de producir el video."
    );
  }
  if (!result.videos.length) {
    recommendations.push("No se generaron videos porque no se detectaron secciones aprovechables.");
  }
  if (context.extractionDiagnostics?.ocrState === "required") {
    recommendations.unshift("Este PDF parece escaneado. Necesita OCR antes de intentar generar un guion confiable.");
  }
  if (courseCategory?.id && courseCategory.id !== "general" && courseCategory.id !== "auto") {
    recommendations.unshift(`Categoria usada para el analisis: ${courseCategory.label}.`);
  }

  return {
    extractedText: result.extractedText,
    extractedPreview: result.extractedPreview,
    validation: result.validation,
    videos: result.videos,
    documentDiagnostics: result.documentDiagnostics,
    courseTitle: result.courseTitle,
    courseCategory: result.courseCategory,
    totals: {
      wordCount: totalWords,
      estimatedSeconds: totalSeconds,
      estimatedDuration: formatDuration(totalSeconds),
      inTargetRange,
      targetWindow: `${formatDuration(COURSE_LIMITS.targetMinSeconds)} - ${formatDuration(
        COURSE_LIMITS.targetMaxSeconds
      )}`,
    },
    recommendations,
  };
}
