import {
  COURSE_LIMITS,
  RESPONSIBILITY_CONNECTORS,
  SECTION_DEFINITIONS,
  VIDEO_BLUEPRINTS,
} from "./course-config.js";

function stripAccents(value = "") {
  return String(value).normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function normalizeHeading(line = "") {
  return stripAccents(line)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeSourceText(text = "") {
  return String(text)
    .replace(/\r/g, "\n")
    .replace(/\u0000/g, " ")
    .replace(/\t/g, " ")
    .replace(/[ ]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function normalizeParagraph(text = "") {
  return String(text)
    .replace(/\s+/g, " ")
    .replace(/\s+([,.;:!?])/g, "$1")
    .trim();
}

function splitParagraphs(text = "") {
  return normalizeSourceText(text)
    .split(/\n+/)
    .map((paragraph) => normalizeParagraph(paragraph))
    .filter(Boolean);
}

function splitSentences(text = "") {
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

function limitWords(text = "", maxWords = 120) {
  const words = normalizeParagraph(text).split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return words.join(" ");
  return `${words.slice(0, maxWords).join(" ")}...`;
}

function fitParagraphsToBudget(paragraphs = [], maxWords = 180) {
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

function shortenSentence(text = "", maxWords = 28) {
  const sentences = splitSentences(text);
  const source = sentences[0] || text;
  return limitWords(source, maxWords);
}

function formatDuration(seconds = 0) {
  const safeSeconds = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const remaining = safeSeconds % 60;
  return `${minutes}:${String(remaining).padStart(2, "0")}`;
}

function estimateDurationForText(text = "", extraSeconds = COURSE_LIMITS.extraSecondsPerVideo) {
  const words = countWords(text);
  const minutes = words / COURSE_LIMITS.wordsPerMinute;
  const totalSeconds = minutes * 60 + extraSeconds;

  return {
    words,
    seconds: Math.round(totalSeconds),
    label: formatDuration(totalSeconds),
  };
}

function toPresenterVoice(text = "") {
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

function buildBodyWithOptionalLead(lead = "", paragraphs = [], maxWords = 180) {
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

function buildSourceSnapshot(section) {
  return {
    sourceHeading: section.heading || section.label,
    sourceText: section.content || "",
    sourcePreview: limitWords(section.content || "", 180),
    sourceWordCount: countWords(section.content || ""),
  };
}

function parseSectionBlocks(rawText = "") {
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

function parseResponsibilities(sectionText = "") {
  const matches = [...sectionText.matchAll(/(?:^|\n)\s*(\d+)\s*[\.\)]\s+([\s\S]*?)(?=(?:\n\s*\d+\s*[\.\)])|$)/g)];
  if (!matches.length) {
    return {
      lead: "",
      items: splitParagraphs(sectionText),
    };
  }

  const firstMatchIndex = matches[0]?.index ?? 0;
  const lead = normalizeParagraph(sectionText.slice(0, firstMatchIndex));
  const items = matches.map((match) => normalizeParagraph(match[2])).filter(Boolean);

  return { lead, items };
}

function parsePolicies(sectionText = "") {
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
    summary: fitParagraphsToBudget(splitParagraphs(block.body.join("\n")), 75),
  }));
}

function countSpecializedHits(sections) {
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

function isLikelyGenericHeading(line = "", nextLine = "", courseTitle = "") {
  const trimmed = String(line).trim();
  const normalized = normalizeHeading(trimmed);
  const words = normalized.split(" ").filter(Boolean);

  if (!trimmed || !normalized || trimmed.length > 90 || words.length > 10) return false;
  if (courseTitle && normalizeHeading(courseTitle) === normalized) return false;
  if (!/[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/.test(trimmed)) return false;

  const isNumbered = /^\d+\s*[\.\)\-]/.test(trimmed);
  const isModule = /^(modulo|modulos|unidad|tema|capitulo|bloque)\s+\d+/i.test(trimmed);
  const isKeywordHeading =
    /^(introduccion|objetivos?|responsabilidades|conclusion|cierre|examen|plan de|tipos de|politica|politicas|sectores|riesgos|normatividad|funciones|sanciones|lesiones|autocuidado|primeros auxilios|copasst|acoso|seguridad vial|inspecciones|liderazgo|empatia|riesgo|riesgos|elementos de proteccion personal|epp|pausas activas|manipulacion de cargas|identidad de genero|orientacion sexual)/i.test(
      trimmed
    );
  const noEndingPunctuation = !/[.:;!?]$/.test(trimmed);

  return (
    isNumbered ||
    isModule ||
    isKeywordHeading ||
    hasMostlyUppercase(trimmed) ||
    (words.length <= 7 && noEndingPunctuation && Boolean(nextLine))
  );
}

function buildGenericBlocks(rawText = "") {
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

    if (isLikelyGenericHeading(line, nextLine, courseTitle)) {
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

function buildIntroVideo(section) {
  const blueprint = VIDEO_BLUEPRINTS.intro;
  const introLine =
    "Estoy aqui para acompanarte durante este recorrido y explicarte, paso a paso, como este sistema protege tu bienestar fisico, mental y social dentro del trabajo.";
  const staticWords = countWords(`${blueprint.opening} ${introLine} ${blueprint.closing}`);
  const bodyBudget = Math.max(90, blueprint.maxWords - staticWords);
  const body = buildBodyWithOptionalLead(
    introLine,
    splitParagraphs(section.content).map((paragraph) => toPresenterVoice(paragraph)),
    bodyBudget
  );

  return {
    id: blueprint.id,
    sectionId: section.id,
    title: blueprint.title,
    opening: blueprint.opening,
    body:
      body ||
      "Quiero compartir contigo los fundamentos del sistema de gestion y el compromiso que asumimos para crear un entorno de trabajo seguro y saludable.",
    closing: blueprint.closing,
    ...buildSourceSnapshot(section),
  };
}

function buildResponsibilitiesVideo(section) {
  const blueprint = VIDEO_BLUEPRINTS.responsibilities;
  const parsed = parseResponsibilities(section.content);
  const leadText =
    toPresenterVoice(parsed.lead) ||
    "Quiero mostrarte que las responsabilidades dentro del Sistema de Gestion de Seguridad y Salud en el Trabajo orientan la forma en que cuidamos nuestro bienestar y el de todo el equipo.";

  const itemPrefixes = [
    "Quiero empezar por recordarte que",
    "Tambien es muy importante que",
    "Otro punto clave es que",
    "Necesito contarte ademas que",
    "Quiero que tengas presente que",
    "Y finalmente, quiero invitarte a que",
    "Ademas,",
    "Por ultimo,",
  ];

  const itemLines = parsed.items.slice(0, 8).map((item, index) => {
    const connector = RESPONSIBILITY_CONNECTORS[index] || "Ademas,";
    const prefix = itemPrefixes[index] || "Ademas,";
    const content = toPresenterVoice(shortenSentence(item, 26)).replace(/^\W+/, "");
    return `${connector} ${prefix} ${content}`.replace(/\s+/g, " ").trim();
  });

  const staticWords = countWords(`${blueprint.opening} ${leadText} ${blueprint.closing}`);
  const availableBodyWords = Math.max(100, blueprint.maxWords - staticWords);
  const body = buildBodyWithOptionalLead("", [leadText, ...itemLines], availableBodyWords);

  return {
    id: blueprint.id,
    sectionId: section.id,
    title: blueprint.title,
    opening: blueprint.opening,
    body,
    closing: blueprint.closing,
    ...buildSourceSnapshot(section),
  };
}

function buildPoliciesVideo(section) {
  const blueprint = VIDEO_BLUEPRINTS.policies;
  const policyBlocks = parsePolicies(section.content);
  const introLine =
    "Quiero presentarte estas politicas como una guia practica para entender como actuamos, como nos relacionamos y como prevenimos situaciones que pueden afectar a las personas.";

  const summaries = policyBlocks.slice(0, 6).map((policy, index) => {
    const policyTitle = policy.title.replace(/^\d+\s*[\.\)]\s*/, "");
    const summary = toPresenterVoice(shortenSentence(policy.summary || policy.title, 30));
    return `${index + 1}. ${policyTitle}. Quiero resumirtela asi: ${summary}`;
  });

  const staticWords = countWords(`${blueprint.opening} ${introLine} ${blueprint.closing}`);
  const availableBodyWords = Math.max(110, blueprint.maxWords - staticWords);
  const body = buildBodyWithOptionalLead("", [introLine, ...summaries], availableBodyWords);

  return {
    id: blueprint.id,
    sectionId: section.id,
    title: blueprint.title,
    opening: blueprint.opening,
    body,
    closing: blueprint.closing,
    ...buildSourceSnapshot(section),
  };
}

function buildRegulationVideo(section) {
  const blueprint = VIDEO_BLUEPRINTS.regulation;
  const regulationLead =
    "Quiero que veas este reglamento como una herramienta cercana que nos ayuda a reconocer peligros, entender riesgos y actuar con mayor criterio en cada actividad.";
  const body = buildBodyWithOptionalLead(
    regulationLead,
    splitParagraphs(section.content).map((paragraph) => toPresenterVoice(paragraph)),
    Math.max(90, blueprint.maxWords - countWords(`${blueprint.opening} ${blueprint.closing}`))
  );

  return {
    id: blueprint.id,
    sectionId: section.id,
    title: blueprint.title,
    opening: blueprint.opening,
    body:
      body ||
      "Este documento menciona el reglamento, los controles de riesgo y las obligaciones que sostienen un entorno de trabajo seguro.",
    closing: blueprint.closing,
    ...buildSourceSnapshot(section),
  };
}

function buildGenericVideo(block, index) {
  const normalizedTitle = stripAccents(block.title || block.heading || `Tema ${index + 1}`)
    .toUpperCase()
    .replace(/\s+/g, " ")
    .trim();
  const opening =
    index === 0
      ? "Hola, me alegra acompanarte en este espacio. Quiero darte una mirada clara y cercana de este tema para que puedas llevarlo a la practica con mayor seguridad y criterio."
      : `Ahora quiero entrar contigo en ${normalizeParagraph(block.title || block.heading || "este bloque")}, para aterrizar las ideas mas importantes de una manera clara y facil de recordar.`;
  const closing =
    block.kind === "closing"
      ? "Quiero cerrar recordandote que estas ideas tienen valor cuando las llevamos a la practica con constancia, criterio y compromiso."
      : "Quiero que te quedes con este mensaje: cuando entendemos bien este tema, tambien fortalecemos la forma en que prevenimos riesgos y actuamos con mayor conciencia.";
  const lead =
    block.kind === "intro"
      ? "Quiero usar este inicio para darte contexto y ayudarte a entender por que este curso es importante dentro del trabajo diario."
      : `Quiero resumirte este bloque desde lo mas importante, para que te resulte facil de explicar y tambien de aplicar.`;
  const body = buildBodyWithOptionalLead(
    lead,
    splitParagraphs(block.content || block.heading).map((paragraph) => toPresenterVoice(paragraph)),
    210
  );

  return {
    id: `video-${index + 1}`,
    sectionId: block.id,
    title: `VIDEO ${index + 1}: ${normalizedTitle}`,
    opening,
    body: body || `Quiero contarte los puntos principales de ${normalizeParagraph(block.title || block.heading || "este tema")}.`,
    closing,
    ...buildSourceSnapshot(block),
  };
}

function buildScriptText(video) {
  return [
    video.title,
    "",
    "Frase inicial",
    video.opening,
    "",
    "Desarrollo",
    video.body,
    "",
    "Frase final",
    video.closing,
  ].join("\n");
}

function finalizeVideos(videos) {
  return videos.map((video) => {
    const scriptText = buildScriptText(video);
    const timing = estimateDurationForText(scriptText);

    return {
      ...video,
      scriptText,
      wordCount: timing.words,
      estimatedSeconds: timing.seconds,
      estimatedDuration: timing.label,
    };
  });
}

function buildSpecializedVideos(sections) {
  const videos = [];

  if (sections.intro?.found) {
    videos.push(buildIntroVideo(sections.intro));
  }

  if (sections.responsibilities?.found) {
    videos.push(buildResponsibilitiesVideo(sections.responsibilities));
  }

  if (sections.policies?.found) {
    videos.push(buildPoliciesVideo(sections.policies));
  }

  if (sections.regulation?.found) {
    videos.push(buildRegulationVideo(sections.regulation));
  }

  return finalizeVideos(videos);
}

function buildGenericVideos(outline) {
  const usableBlocks = outline.blocks.filter((block) => block.kind !== "exam");
  return finalizeVideos(usableBlocks.map((block, index) => buildGenericVideo(block, index)));
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

function buildSpecializedValidation(sections, rawText, extractionDiagnostics = {}) {
  const responsibilities = parseResponsibilities(sections.responsibilities?.content || "");
  const policies = parsePolicies(sections.policies?.content || "");
  const missingRequiredSections = SECTION_DEFINITIONS.filter(
    (definition) => definition.required && !sections[definition.id]?.found
  ).map((definition) => definition.label);

  const notes = [];
  const issues = [];

  if (!rawText.trim()) {
    issues.push({
      id: "no-usable-text",
      level: "error",
      title: "No se pudo leer el contenido del documento",
      detail: "No se extrajo texto util para construir el guion.",
      hint: "Verifica que el archivo tenga texto seleccionable antes de volver a cargarlo.",
    });
  }

  if (extractionDiagnostics?.ocrState === "required") {
    issues.push({
      id: "ocr-required",
      level: "error",
      title: "Este PDF necesita OCR antes de procesarse",
      detail: extractionDiagnostics.message,
      hint: "Convierte el PDF con OCR y vuelve a cargarlo para que el sistema pueda leer los encabezados y el contenido.",
    });
  } else if (extractionDiagnostics?.ocrState === "suggested") {
    issues.push({
      id: "ocr-suggested",
      level: "warning",
      title: "El PDF parece venir con lectura limitada",
      detail: extractionDiagnostics.message,
      hint: "Si notas secciones faltantes o texto raro, pasa el documento por OCR para mejorar la deteccion.",
    });
  }

  for (const definition of SECTION_DEFINITIONS) {
    if (sections[definition.id]?.found) continue;

    issues.push({
      id: `missing-${definition.id}`,
      level: definition.required ? "error" : "warning",
      title: `No se encontro la seccion ${definition.label}`,
      detail: `No encontre un encabezado parecido a ${definition.examples[0]}.`,
      hint: `Prueba usando un titulo como: ${definition.examples.join(" o ")}.`,
    });
  }

  if (responsibilities.items.length > 0 && responsibilities.items.length < 4) {
    issues.push({
      id: "low-responsibilities",
      level: "warning",
      title: "Se detectaron pocas responsabilidades",
      detail: `Solo detecte ${responsibilities.items.length} responsabilidades numeradas dentro de la seccion de SST.`,
      hint: "Si el documento tiene mas puntos, procura numerarlos para que el sistema pueda separarlos mejor.",
    });
  }

  if (policies.length > 0 && policies.length < 3) {
    issues.push({
      id: "low-policies",
      level: "warning",
      title: "Se detectaron pocas politicas",
      detail: `Solo detecte ${policies.length} politicas individuales dentro del bloque de politicas.`,
      hint: "Usa subtitulos claros para cada politica y separa sus parrafos para mejorar el reconocimiento.",
    });
  }

  if (!policies.length && sections.policies?.found) {
    issues.push({
      id: "policies-not-split",
      level: "warning",
      title: "No pude separar las politicas individualmente",
      detail: "Encontre la seccion de politicas, pero no logre identificar subtitulos claros para cada politica.",
      hint: "Agrega subtitulos como Politica de Seguridad y Salud en el Trabajo o Politica de Seguridad Vial.",
    });
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

function buildGenericValidation(outline, rawText, extractionDiagnostics = {}) {
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
    issues.push({
      id: "missing-title",
      level: "error",
      title: "No detecte un titulo claro del curso",
      detail: "Necesito una primera linea que sirva como nombre general del curso o de la capacitacion.",
      hint: "Usa un titulo inicial como Seguridad Vial, Copasst, Acoso Laboral o el nombre del curso que corresponda.",
    });
  }

  if (contentBlocks.length < 2) {
    missingRequiredSections.push("Bloques o modulos tematicos");
    issues.push({
      id: "few-topic-blocks",
      level: "error",
      title: "Se detectaron muy pocos bloques tematicos",
      detail: `Solo detecte ${contentBlocks.length} bloque${contentBlocks.length === 1 ? "" : "s"} con estructura aprovechable para el guion.`,
      hint: "Conviene separar el documento por modulos, subtemas o apartados con subtitulos claros.",
    });
  }

  if (!introBlock) {
    issues.push({
      id: "missing-generic-intro",
      level: "warning",
      title: "No detecte una introduccion u objetivo claro",
      detail: "El documento puede procesarse, pero tendra mejor contexto si abre con una breve introduccion o con el objetivo del curso.",
      hint: "Puedes usar un bloque llamado Introduccion, Objetivo del curso o Contexto.",
    });
  }

  if (!closingBlock) {
    issues.push({
      id: "missing-generic-closing",
      level: "warning",
      title: "No detecte cierre o conclusion",
      detail: "El documento puede procesarse, pero un cierre mejora la despedida y la consistencia del guion.",
      hint: "Puedes cerrar con un bloque llamado Conclusion, Cierre o Mensaje final.",
    });
  }

  if (topicBlocks.length > 0 && topicBlocks.length < 3) {
    issues.push({
      id: "few-generic-topics",
      level: "warning",
      title: "Se detectaron pocos subtemas",
      detail: `Solo detecte ${topicBlocks.length} subtema${topicBlocks.length === 1 ? "" : "s"} dentro del cuerpo del curso.`,
      hint: "Si el curso realmente tiene mas apartados, separalos con subtitulos claros para mejorar la conversion a guion.",
    });
  }

  if (examBlocks.length) {
    notes.push(`Se detectaron ${examBlocks.length} bloque${examBlocks.length === 1 ? "" : "s"} marcados como examen. No se usan para el tiempo estimado del guion.`);
  }

  if (extractionDiagnostics?.ocrState === "required") {
    issues.push({
      id: "ocr-required",
      level: "error",
      title: "Este PDF necesita OCR antes de procesarse",
      detail: extractionDiagnostics.message,
      hint: "Convierte el PDF con OCR y vuelve a cargarlo para que el sistema pueda leer mejor los subtemas del curso.",
    });
  } else if (extractionDiagnostics?.ocrState === "suggested") {
    issues.push({
      id: "ocr-suggested",
      level: "warning",
      title: "El PDF parece venir con lectura limitada",
      detail: extractionDiagnostics.message,
      hint: "Si notas subtemas faltantes o texto raro, pasa el documento por OCR para mejorar la deteccion.",
    });
  }

  if (!rawText.trim()) {
    issues.push({
      id: "no-usable-text",
      level: "error",
      title: "No se pudo leer el contenido del documento",
      detail: "No se extrajo texto util para construir el guion.",
      hint: "Verifica que el archivo tenga texto seleccionable antes de volver a cargarlo.",
    });
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

function buildModeResult(mode, payload) {
  if (mode === "generic") {
    const { outline, extractionDiagnostics, normalizedText } = payload;
    return {
      videos: buildGenericVideos(outline),
      validation: buildGenericValidation(outline, normalizedText, extractionDiagnostics),
      extractedText: normalizedText,
      extractedPreview: limitWords(normalizedText, 260),
      documentDiagnostics: extractionDiagnostics || {},
      courseTitle: outline.courseTitle,
    };
  }

  const { sections, extractionDiagnostics, normalizedText } = payload;
  return {
    videos: buildSpecializedVideos(sections),
    validation: buildSpecializedValidation(sections, normalizedText, extractionDiagnostics),
    extractedText: normalizedText,
    extractedPreview: limitWords(normalizedText, 260),
    documentDiagnostics: extractionDiagnostics || {},
    courseTitle: "",
  };
}

export function analyzeCourseText(rawText = "", context = {}) {
  const normalizedText = normalizeSourceText(rawText);
  const sections = parseSectionBlocks(normalizedText);
  const genericOutline = buildGenericBlocks(normalizedText);
  const specializedHits = countSpecializedHits(sections);
  const genericContentBlocks = genericOutline.blocks.filter((block) => block.kind !== "exam").length;
  const mode = specializedHits >= 2 ? "specialized" : genericContentBlocks >= 2 ? "generic" : specializedHits ? "specialized" : "generic";

  const result = buildModeResult(mode, {
    sections,
    outline: genericOutline,
    extractionDiagnostics: context.extractionDiagnostics || {},
    normalizedText,
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

  return {
    extractedText: result.extractedText,
    extractedPreview: result.extractedPreview,
    validation: result.validation,
    videos: result.videos,
    documentDiagnostics: result.documentDiagnostics,
    courseTitle: result.courseTitle,
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
