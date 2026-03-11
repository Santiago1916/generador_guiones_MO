import { COURSE_LIMITS } from "../course-config.js";

export function stripAccents(value = "") {
  return String(value).normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export function normalizeHeading(line = "") {
  return stripAccents(line)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeSourceText(text = "") {
  return String(text)
    .replace(/\r/g, "\n")
    .replace(/\u0000/g, " ")
    .replace(/\t/g, " ")
    .replace(/[ ]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function normalizeParagraph(text = "") {
  return String(text)
    .replace(/\s+/g, " ")
    .replace(/\s+([,.;:!?])/g, "$1")
    .trim();
}

export function splitParagraphs(text = "") {
  return normalizeSourceText(text)
    .split(/\n+/)
    .map((paragraph) => normalizeParagraph(paragraph))
    .filter(Boolean);
}

export function splitSentences(text = "") {
  return normalizeParagraph(text)
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

export function countWords(text = "") {
  return normalizeParagraph(text)
    .split(/\s+/)
    .filter(Boolean).length;
}

export function limitWords(text = "", maxWords = 120) {
  const words = normalizeParagraph(text).split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return words.join(" ");
  return `${words.slice(0, maxWords).join(" ")}...`;
}

export function fitParagraphsToBudget(paragraphs = [], maxWords = 180) {
  const picked = [];
  let usedWords = 0;

  for (const paragraph of paragraphs) {
    const nextWords = countWords(paragraph);
    if (!nextWords) continue;

    if (!picked.length && nextWords > maxWords) {
      picked.push(limitWords(paragraph, maxWords));
      break;
    }

    if (usedWords + nextWords > maxWords) break;
    picked.push(paragraph);
    usedWords += nextWords;
  }

  return picked.join("\n\n");
}

export function shortenSentence(text = "", maxWords = 28) {
  const sentences = splitSentences(text);
  const source = sentences[0] || text;
  return limitWords(source, maxWords);
}

export function formatDuration(seconds = 0) {
  const safeSeconds = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const remaining = safeSeconds % 60;
  return `${minutes}:${String(remaining).padStart(2, "0")}`;
}

export function estimateDurationForText(text = "", extraSeconds = COURSE_LIMITS.extraSecondsPerVideo) {
  const words = countWords(text);
  const minutes = words / COURSE_LIMITS.wordsPerMinute;
  const totalSeconds = minutes * 60 + extraSeconds;

  return {
    words,
    seconds: Math.round(totalSeconds),
    label: formatDuration(totalSeconds),
  };
}

export function toPresenterVoice(text = "") {
  return normalizeParagraph(text)
    .replace(/\bLa empresa\b/gi, "Nuestra empresa")
    .replace(/\bla empresa\b/g, "nuestra empresa")
    .replace(
      /\bEl equipo de seguridad y salud en el trabajo tiene la funcion de\b/gi,
      "Desde el equipo de seguridad y salud en el trabajo trabajamos para"
    )
    .replace(/\bSe implementa y mantiene\b/gi, "Implementamos y mantenemos")
    .replace(/\bEs importante que sepas que\b/gi, "Quiero que tengas presente que")
    .replace(/\bHoy hablaremos de\b/gi, "Hoy quiero contarte sobre")
    .replace(/\bNuestro objetivo con esta politica es\b/gi, "Con esta politica buscamos")
    .replace(
      /\bTodos los colaboradores deben contribuir activamente\b/gi,
      "Todos los colaboradores debemos contribuir activamente"
    )
    .replace(/\bEs un sistema logico y por etapas\b/gi, "Quiero explicarte que este es un sistema logico y por etapas")
    .replace(
      /\bLas responsabilidades en el sistema de gestion\b/gi,
      "Quiero que revisemos las responsabilidades dentro del sistema de gestion"
    )
    .replace(/\bLas politicas establecen\b/gi, "Quiero contarte que las politicas establecen");
}

export function buildBodyWithOptionalLead(lead = "", paragraphs = [], maxWords = 180) {
  const merged = [];

  if (lead) {
    merged.push(normalizeParagraph(lead));
  }

  for (const paragraph of paragraphs) {
    if (!paragraph) continue;
    merged.push(normalizeParagraph(paragraph));
  }

  return fitParagraphsToBudget(merged, maxWords);
}

export function buildSourceSnapshot(section) {
  return {
    sourceHeading: section.heading || section.label,
    sourceText: section.content || "",
    sourcePreview: limitWords(section.content || "", 180),
    sourceWordCount: countWords(section.content || ""),
  };
}
