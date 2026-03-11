import { SECTION_DEFINITIONS } from "../course-config.js";
import { getCourseCategoryPreset } from "../course-categories.js";
import { parsePolicies, parseResponsibilities } from "./outline.js";
import { countWords } from "./text.js";

function createValidationIssue({ id, level = "warning", title, detail, hint, blocksProgress = false }) {
  const severity = level === "error" ? "blocking" : blocksProgress ? "important" : "suggested";
  return {
    id,
    level,
    severity,
    blocksProgress,
    title,
    detail,
    hint,
  };
}

function buildSpecializedSectionValidation(definition, section, details) {
  if (!section?.found) {
    return {
      id: definition.id,
      label: definition.label,
      required: definition.required,
      found: false,
      wordCount: 0,
      heading: "",
      severity: definition.required ? "error" : "warning",
      detail: `No encontre un encabezado que se parezca a ${definition.examples[0]}.`,
      hint: `Usa un titulo claro como: ${definition.examples.join(" o ")}.`,
    };
  }

  return {
    id: definition.id,
    label: definition.label,
    required: definition.required,
    found: true,
    wordCount: section.wordCount,
    heading: section.heading,
    severity: "success",
    detail: `Encabezado detectado: ${section.heading}.`,
    hint: details || "Se detecto correctamente este bloque del documento.",
  };
}

export function buildSpecializedValidation(sections, rawText, extractionDiagnostics = {}) {
  const responsibilities = parseResponsibilities(sections.responsibilities?.content || "");
  const policies = parsePolicies(sections.policies?.content || "");
  const missingRequiredSections = SECTION_DEFINITIONS.filter(
    (definition) => definition.required && !sections[definition.id]?.found
  ).map((definition) => definition.label);

  const notes = [];
  const issues = [];

  if (!rawText.trim()) {
    issues.push(
      createValidationIssue({
        id: "no-usable-text",
        level: "error",
        title: "No se pudo leer el contenido del documento",
        detail: "No se extrajo texto util para construir el guion.",
        hint: "Verifica que el archivo tenga texto seleccionable antes de volver a cargarlo.",
        blocksProgress: true,
      })
    );
  }

  if (extractionDiagnostics?.ocrState === "required") {
    issues.push(
      createValidationIssue({
        id: "ocr-required",
        level: "error",
        title: "Este PDF necesita OCR antes de procesarse",
        detail: extractionDiagnostics.message,
        hint: "Convierte el PDF con OCR y vuelve a cargarlo para que el sistema pueda leer los encabezados y el contenido.",
        blocksProgress: true,
      })
    );
  } else if (extractionDiagnostics?.ocrState === "suggested") {
    issues.push(
      createValidationIssue({
        id: "ocr-suggested",
        title: "El PDF parece venir con lectura limitada",
        detail: extractionDiagnostics.message,
        hint: "Si notas secciones faltantes o texto raro, pasa el documento por OCR para mejorar la deteccion.",
        blocksProgress: true,
      })
    );
  }

  for (const definition of SECTION_DEFINITIONS) {
    if (sections[definition.id]?.found) continue;

    issues.push(
      createValidationIssue({
        id: `missing-${definition.id}`,
        level: definition.required ? "error" : "warning",
        title: `No se encontro la seccion ${definition.label}`,
        detail: `No encontre un encabezado parecido a ${definition.examples[0]}.`,
        hint: `Prueba usando un titulo como: ${definition.examples.join(" o ")}.`,
        blocksProgress: definition.required,
      })
    );
  }

  if (responsibilities.items.length > 0 && responsibilities.items.length < 4) {
    issues.push(
      createValidationIssue({
        id: "low-responsibilities",
        title: "Se detectaron pocas responsabilidades",
        detail: `Solo detecte ${responsibilities.items.length} responsabilidades numeradas dentro de la seccion de SST.`,
        hint: "Si el documento tiene mas puntos, procura numerarlos para que el sistema pueda separarlos mejor.",
        blocksProgress: true,
      })
    );
  }

  if (policies.length > 0 && policies.length < 3) {
    issues.push(
      createValidationIssue({
        id: "low-policies",
        title: "Se detectaron pocas politicas",
        detail: `Solo detecte ${policies.length} politicas individuales dentro del bloque de politicas.`,
        hint: "Usa subtitulos claros para cada politica y separa sus parrafos para mejorar el reconocimiento.",
        blocksProgress: true,
      })
    );
  }

  if (!policies.length && sections.policies?.found) {
    issues.push(
      createValidationIssue({
        id: "policies-not-split",
        title: "No pude separar las politicas individualmente",
        detail: "Encontre la seccion de politicas, pero no logre identificar subtitulos claros para cada politica.",
        hint: "Agrega subtitulos como Politica de Seguridad y Salud en el Trabajo o Politica de Seguridad Vial.",
      })
    );
  }

  if (!rawText.trim()) {
    notes.push("No se pudo extraer texto util del documento.");
  }
  if (missingRequiredSections.length) {
    notes.push(`Faltan secciones obligatorias: ${missingRequiredSections.join(", ")}.`);
  }
  if (responsibilities.items.length > 0 && responsibilities.items.length < 4) {
    notes.push("La seccion de responsabilidades tiene pocas obligaciones detectadas. Revisa si el formato viene completo.");
  }
  if (policies.length > 0 && policies.length < 3) {
    notes.push("Se detectaron menos de 3 politicas. Puede que el documento este resumido o tenga encabezados distintos.");
  }
  if (!policies.length && sections.policies?.found) {
    notes.push("Se encontro la seccion de politicas, pero no fue posible separar cada politica individual.");
  }
  if (extractionDiagnostics?.message) {
    notes.unshift(extractionDiagnostics.message);
  }

  return {
    profile: "specialized",
    profileLabel: "Formato SG-SST estructurado",
    passesFormatCheck: missingRequiredSections.length === 0,
    missingRequiredSections,
    responsibilitiesCount: responsibilities.items.length,
    policiesCount: policies.length,
    sections: SECTION_DEFINITIONS.map((definition) =>
      buildSpecializedSectionValidation(
        definition,
        sections[definition.id],
        definition.id === "responsibilities"
          ? `Responsabilidades detectadas: ${responsibilities.items.length || 0}.`
          : definition.id === "policies"
            ? `Politicas detectadas: ${policies.length || 0}.`
            : undefined
      )
    ),
    issues,
    notes,
  };
}

export function buildGenericValidation(outline, rawText, extractionDiagnostics = {}, courseCategory) {
  const category = getCourseCategoryPreset(courseCategory?.id || courseCategory || "general");
  const introBlock = outline.blocks.find((block) => block.kind === "intro");
  const closingBlock = outline.blocks.find((block) => block.kind === "closing");
  const examBlocks = outline.blocks.filter((block) => block.kind === "exam");
  const topicBlocks = outline.blocks.filter((block) => block.kind === "topic");
  const contentBlocks = outline.blocks.filter((block) => block.kind !== "exam");
  const missingRequiredSections = [];
  const issues = [];
  const notes = [];

  if (!outline.courseTitle) {
    missingRequiredSections.push("Titulo del curso");
    issues.push(
      createValidationIssue({
        id: "missing-title",
        level: "error",
        title: "No detecte un titulo claro del curso",
        detail: "Necesito una primera linea que sirva como nombre general del curso o de la capacitacion.",
        hint: "Usa una primera linea con el nombre del curso o de la capacitacion.",
        blocksProgress: true,
      })
    );
  }

  if (contentBlocks.length < 2) {
    missingRequiredSections.push("Bloques o modulos tematicos");
    issues.push(
      createValidationIssue({
        id: "few-topic-blocks",
        level: "error",
        title: "Se detectaron muy pocos bloques tematicos",
        detail: `Solo detecte ${contentBlocks.length} bloque${contentBlocks.length === 1 ? "" : "s"} con estructura aprovechable para el guion.`,
        hint: "Conviene separar el documento por modulos, subtemas o apartados con subtitulos claros.",
        blocksProgress: true,
      })
    );
  }

  if (!introBlock) {
    issues.push(
      createValidationIssue({
        id: "missing-generic-intro",
        title: "No detecte una introduccion u objetivo claro",
        detail: "El documento puede procesarse, pero tendra mejor contexto si abre con una breve introduccion o con el objetivo del curso.",
        hint: "Puedes usar un bloque llamado Introduccion, Objetivo del curso o Contexto.",
      })
    );
  }

  if (!closingBlock) {
    issues.push(
      createValidationIssue({
        id: "missing-generic-closing",
        title: "No detecte cierre o conclusion",
        detail: "El documento puede procesarse, pero un cierre mejora la despedida y la consistencia del guion.",
        hint: "Puedes cerrar con un bloque llamado Conclusion, Cierre o Mensaje final.",
      })
    );
  }

  if (topicBlocks.length > 0 && topicBlocks.length < 3) {
    issues.push(
      createValidationIssue({
        id: "few-generic-topics",
        title: "Se detectaron pocos subtemas",
        detail: `Solo detecte ${topicBlocks.length} subtema${topicBlocks.length === 1 ? "" : "s"} dentro del cuerpo del curso.`,
        hint: "Si el curso realmente tiene mas apartados, separalos con subtitulos claros para mejorar la conversion a guion.",
        blocksProgress: true,
      })
    );
  }

  const hasCategoryHits = category.headingKeywords.length
    ? category.headingKeywords.some((keyword) => normalizeText(rawText).includes(normalizeText(keyword)))
    : true;

  if (!hasCategoryHits && category.id !== "general") {
    issues.push(
      createValidationIssue({
        id: "category-keywords-low",
        title: `Se detectaron pocas referencias claras a ${category.label}`,
        detail: "El documento se puede procesar, pero no encontre suficientes palabras clave del tipo de curso seleccionado.",
        hint: "Si la categoria elegida no coincide con el contenido, vuelve al paso 1 y cambia el tipo de curso. Si si coincide, agrega subtitulos mas claros en el documento.",
        blocksProgress: true,
      })
    );
  }

  if (examBlocks.length) {
    notes.push(`Se detectaron ${examBlocks.length} bloque${examBlocks.length === 1 ? "" : "s"} marcados como examen. No se usan para el tiempo estimado del guion.`);
  }

  if (extractionDiagnostics?.ocrState === "required") {
    issues.push(
      createValidationIssue({
        id: "ocr-required",
        level: "error",
        title: "Este PDF necesita OCR antes de procesarse",
        detail: extractionDiagnostics.message,
        hint: "Convierte el PDF con OCR y vuelve a cargarlo para que el sistema pueda leer mejor los subtemas del curso.",
        blocksProgress: true,
      })
    );
  } else if (extractionDiagnostics?.ocrState === "suggested") {
    issues.push(
      createValidationIssue({
        id: "ocr-suggested",
        title: "El PDF parece venir con lectura limitada",
        detail: extractionDiagnostics.message,
        hint: "Si notas subtemas faltantes o texto raro, pasa el documento por OCR para mejorar la deteccion.",
        blocksProgress: true,
      })
    );
  }

  if (!rawText.trim()) {
    issues.push(
      createValidationIssue({
        id: "no-usable-text",
        level: "error",
        title: "No se pudo leer el contenido del documento",
        detail: "No se extrajo texto util para construir el guion.",
        hint: "Verifica que el archivo tenga texto seleccionable antes de volver a cargarlo.",
        blocksProgress: true,
      })
    );
  }

  return {
    profile: "generic",
    profileLabel: "Formato general por modulos y subtemas",
    passesFormatCheck: Boolean(outline.courseTitle) && contentBlocks.length >= 2 && Boolean(rawText.trim()),
    missingRequiredSections,
    responsibilitiesCount: 0,
    policiesCount: 0,
    sections: [
      {
        id: "course-title",
        label: "Titulo del curso",
        required: true,
        found: Boolean(outline.courseTitle),
        wordCount: countWords(outline.courseTitle),
        heading: outline.courseTitle,
        severity: outline.courseTitle ? "success" : "error",
        detail: outline.courseTitle
          ? `Titulo detectado: ${outline.courseTitle}.`
          : "No detecte un titulo claro del curso al inicio del documento.",
        hint: outline.courseTitle
          ? "El titulo sirve como punto de partida para contextualizar el guion."
          : "Usa una primera linea con el nombre del curso o de la capacitacion.",
      },
      {
        id: "course-intro",
        label: "Introduccion u objetivo",
        required: false,
        found: Boolean(introBlock),
        wordCount: introBlock?.wordCount || 0,
        heading: introBlock?.heading || "",
        severity: introBlock ? "success" : "warning",
        detail: introBlock
          ? `Bloque detectado: ${introBlock.heading}.`
          : "No detecte una introduccion u objetivo como bloque independiente.",
        hint: introBlock
          ? "Ayuda a dar contexto y a que la apertura del guion suene mejor."
          : "Puedes usar un bloque llamado Introduccion, Objetivo del curso o Contexto.",
      },
      {
        id: "course-topics",
        label: "Bloques o subtemas",
        required: true,
        found: contentBlocks.length >= 1,
        wordCount: contentBlocks.reduce((sum, block) => sum + (block.wordCount || 0), 0),
        heading: topicBlocks[0]?.heading || introBlock?.heading || "",
        severity: contentBlocks.length >= 2 ? "success" : contentBlocks.length ? "warning" : "error",
        detail: `Detecte ${contentBlocks.length} bloque${contentBlocks.length === 1 ? "" : "s"} aprovechable${contentBlocks.length === 1 ? "" : "s"} para el guion.`,
        hint: "Mientras mas claros sean los subtitulos de cada modulo o subtema, mejor sera la construccion de los videos.",
      },
      {
        id: "course-closing",
        label: "Cierre o conclusion",
        required: false,
        found: Boolean(closingBlock),
        wordCount: closingBlock?.wordCount || 0,
        heading: closingBlock?.heading || "",
        severity: closingBlock ? "success" : "warning",
        detail: closingBlock
          ? `Bloque detectado: ${closingBlock.heading}.`
          : "No detecte un bloque de cierre o conclusion.",
        hint: closingBlock
          ? "Sirve para construir un mensaje final mas solido."
          : "Puedes agregar un apartado de Conclusion, Cierre o Mensaje final.",
      },
      {
        id: "course-exam",
        label: "Examen",
        required: false,
        found: Boolean(examBlocks.length),
        wordCount: examBlocks.reduce((sum, block) => sum + (block.wordCount || 0), 0),
        heading: examBlocks[0]?.heading || "",
        severity: examBlocks.length ? "success" : "warning",
        detail: examBlocks.length
          ? `Detecte ${examBlocks.length} bloque${examBlocks.length === 1 ? "" : "s"} de examen o evaluacion.`
          : "No detecte un bloque de examen. Esto no bloquea el proceso.",
        hint: "Los examenes se reconocen como bloque informativo y no entran en la duracion estimada del guion.",
      },
    ],
    issues,
    notes,
  };
}

function normalizeText(value = "") {
  return String(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
