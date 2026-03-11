import { SECTION_DEFINITIONS } from "../course-config.js";
import { getCourseCategoryPreset } from "../course-categories.js";
import { countWords, normalizeHeading, normalizeParagraph, normalizeSourceText } from "./text.js";

export function parseSectionBlocks(rawText = "") {
  const lines = normalizeSourceText(rawText)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const sectionPositions = SECTION_DEFINITIONS.map((definition) => {
    const index = lines.findIndex((line) =>
      definition.headingMatchers.some((matcher) => matcher.test(normalizeHeading(line)))
    );

    return {
      ...definition,
      index,
    };
  })
    .filter((definition) => definition.index >= 0)
    .sort((left, right) => left.index - right.index);

  const sections = {};

  for (let index = 0; index < sectionPositions.length; index += 1) {
    const current = sectionPositions[index];
    const next = sectionPositions[index + 1];
    const contentLines = lines.slice(current.index + 1, next ? next.index : lines.length);
    const content = normalizeSourceText(contentLines.join("\n"));

    sections[current.id] = {
      id: current.id,
      label: current.label,
      required: current.required,
      found: true,
      heading: lines[current.index],
      content,
      wordCount: countWords(content),
    };
  }

  for (const definition of SECTION_DEFINITIONS) {
    if (sections[definition.id]) continue;
    sections[definition.id] = {
      id: definition.id,
      label: definition.label,
      required: definition.required,
      found: false,
      heading: "",
      content: "",
      wordCount: 0,
    };
  }

  return sections;
}

export function parseResponsibilities(sectionText = "") {
  const matches = [...sectionText.matchAll(/(?:^|\n)\s*(\d+)\s*[\.\)]\s+([\s\S]*?)(?=(?:\n\s*\d+\s*[\.\)])|$)/g)];
  if (!matches.length) {
    return {
      lead: "",
      items: normalizeSourceText(sectionText)
        .split(/\n+/)
        .map((paragraph) => normalizeParagraph(paragraph))
        .filter(Boolean),
    };
  }

  const firstMatchIndex = matches[0]?.index ?? 0;
  const lead = normalizeParagraph(sectionText.slice(0, firstMatchIndex));
  const items = matches.map((match) => normalizeParagraph(match[2])).filter(Boolean);

  return { lead, items };
}

export function parsePolicies(sectionText = "") {
  const lines = normalizeSourceText(sectionText)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const blocks = [];
  let current = null;

  for (const line of lines) {
    const normalized = normalizeHeading(line);
    const looksLikePolicyTitle =
      normalized.startsWith("politica ") ||
      normalized.startsWith("politica de ") ||
      normalized.includes(" politica de ");

    if (looksLikePolicyTitle) {
      if (current) blocks.push(current);
      current = { title: line, body: [] };
      continue;
    }

    if (current) {
      current.body.push(line);
    }
  }

  if (current) blocks.push(current);

  return blocks.map((block) => ({
    title: normalizeParagraph(block.title),
    summary: normalizeSourceText(block.body.join("\n")),
  }));
}

export function countSpecializedHits(sections) {
  return SECTION_DEFINITIONS.filter((definition) => sections[definition.id]?.found).length;
}

function hasMostlyUppercase(line = "") {
  const letters = String(line).replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/g, "");
  if (!letters.length) return false;
  const uppercaseLetters = String(line).replace(/[^A-ZÁÉÍÓÚÜÑ]/g, "");
  return uppercaseLetters.length / letters.length >= 0.68;
}

function detectGenericBlockKind(normalizedHeading = "") {
  if (/^examen\b/.test(normalizedHeading)) return "exam";
  if (/(conclusion|cierre|mensaje final|despedida)/.test(normalizedHeading)) return "closing";
  if (/(introduccion|objetivo|contexto|presentacion|bienvenida)/.test(normalizedHeading)) return "intro";
  return "topic";
}

function isLikelyGenericHeading(line = "", nextLine = "", courseTitle = "", courseCategory) {
  const trimmed = String(line).trim();
  const normalized = normalizeHeading(trimmed);
  const words = normalized.split(" ").filter(Boolean);
  const category = getCourseCategoryPreset(courseCategory?.id || courseCategory || "general");

  if (!trimmed || !normalized || trimmed.length > 90 || words.length > 10) return false;
  if (courseTitle && normalizeHeading(courseTitle) === normalized) return false;
  if (!/[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/.test(trimmed)) return false;

  const isNumbered = /^\d+\s*[\.\)\-]/.test(trimmed);
  const isModule = /^(modulo|modulos|unidad|tema|capitulo|bloque)\s+\d+/i.test(trimmed);
  const isKeywordHeading =
    /^(introduccion|objetivos?|responsabilidades|conclusion|cierre|examen|plan de|tipos de|politica|politicas|sectores|riesgos|normatividad|funciones|sanciones|lesiones|autocuidado|primeros auxilios|copasst|acoso|seguridad vial|inspecciones|liderazgo|empatia|riesgo|riesgos|elementos de proteccion personal|epp|pausas activas|manipulacion de cargas|identidad de genero|orientacion sexual)/i.test(
      trimmed
    );
  const isCategoryKeyword = category.headingKeywords.some((keyword) => normalized.includes(normalizeHeading(keyword)));
  const noEndingPunctuation = !/[.:;!?]$/.test(trimmed);

  return (
    isNumbered ||
    isModule ||
    isKeywordHeading ||
    isCategoryKeyword ||
    hasMostlyUppercase(trimmed) ||
    (words.length <= 7 && noEndingPunctuation && Boolean(nextLine))
  );
}

export function buildGenericBlocks(rawText = "", courseCategory) {
  const lines = normalizeSourceText(rawText)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (!lines.length) {
    return {
      courseTitle: "",
      blocks: [],
    };
  }

  const courseTitle = lines[0];
  const blocks = [];
  const introBuffer = [];
  let current = null;

  for (let index = 1; index < lines.length; index += 1) {
    const line = lines[index];
    const nextLine = lines[index + 1] || "";

    if (isLikelyGenericHeading(line, nextLine, courseTitle, courseCategory)) {
      if (!current && introBuffer.length) {
        const introContent = normalizeSourceText(introBuffer.join("\n"));
        if (introContent) {
          blocks.push({
            id: `generic-${blocks.length + 1}`,
            label: "Introduccion",
            heading: "Introduccion",
            title: "Introduccion",
            kind: "intro",
            content: introContent,
            found: true,
            wordCount: countWords(introContent),
          });
        }
      }

      if (current) {
        const content = normalizeSourceText(current.contentLines.join("\n"));
        blocks.push({
          id: `generic-${blocks.length + 1}`,
          label: current.heading,
          heading: current.heading,
          title: current.heading,
          kind: current.kind,
          content,
          found: true,
          wordCount: countWords(content),
        });
      }

      current = {
        heading: line,
        kind: detectGenericBlockKind(normalizeHeading(line)),
        contentLines: [],
      };
      continue;
    }

    if (current) {
      current.contentLines.push(line);
    } else {
      introBuffer.push(line);
    }
  }

  if (!current && introBuffer.length) {
    const content = normalizeSourceText(introBuffer.join("\n"));
    if (content) {
      blocks.push({
        id: `generic-${blocks.length + 1}`,
        label: "Introduccion",
        heading: "Introduccion",
        title: "Introduccion",
        kind: "intro",
        content,
        found: true,
        wordCount: countWords(content),
      });
    }
  }

  if (current) {
    const content = normalizeSourceText(current.contentLines.join("\n"));
    blocks.push({
      id: `generic-${blocks.length + 1}`,
      label: current.heading,
      heading: current.heading,
      title: current.heading,
      kind: current.kind,
      content,
      found: true,
      wordCount: countWords(content),
    });
  }

  if (!blocks.length && lines.length > 1) {
    const content = normalizeSourceText(lines.slice(1).join("\n"));
    blocks.push({
      id: "generic-1",
      label: "Contenido principal",
      heading: "Contenido principal",
      title: "Contenido principal",
      kind: "topic",
      content,
      found: true,
      wordCount: countWords(content),
    });
  }

  return {
    courseTitle,
    blocks,
  };
}
