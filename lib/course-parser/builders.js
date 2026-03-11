import {
  COURSE_LIMITS,
  RESPONSIBILITY_CONNECTORS,
  VIDEO_BLUEPRINTS,
} from "../course-config.js";
import { getCourseCategoryPreset } from "../course-categories.js";
import { parsePolicies, parseResponsibilities } from "./outline.js";
import {
  buildBodyWithOptionalLead,
  buildSourceSnapshot,
  countWords,
  estimateDurationForText,
  fitParagraphsToBudget,
  normalizeParagraph,
  shortenSentence,
  splitParagraphs,
  stripAccents,
  toPresenterVoice,
} from "./text.js";

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
    const summary = toPresenterVoice(shortenSentence(fitParagraphsToBudget(splitParagraphs(policy.summary || policy.title), 75), 30));
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

function buildGenericVideo(block, index, courseCategory) {
  const category = getCourseCategoryPreset(courseCategory?.id || courseCategory || "general");
  const normalizedTitle = stripAccents(block.title || block.heading || `Tema ${index + 1}`)
    .toUpperCase()
    .replace(/\s+/g, " ")
    .trim();
  const opening =
    index === 0
      ? `Hola, me alegra acompanarte en este espacio. ${category.openingTone}`
      : `Ahora quiero entrar contigo en ${normalizeParagraph(block.title || block.heading || "este bloque")}, para aterrizar las ideas mas importantes de una manera clara y facil de recordar.`;
  const closing =
    block.kind === "closing"
      ? "Quiero cerrar recordandote que estas ideas tienen valor cuando las llevamos a la practica con constancia, criterio y compromiso."
      : "Quiero que te quedes con este mensaje: cuando entendemos bien este tema, tambien fortalecemos la forma en que prevenimos riesgos y actuamos con mayor conciencia.";
  const lead = block.kind === "intro" ? category.voiceLead : category.blockLead;
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
    const timing = estimateDurationForText(scriptText, COURSE_LIMITS.extraSecondsPerVideo);

    return {
      ...video,
      scriptText,
      wordCount: timing.words,
      estimatedSeconds: timing.seconds,
      estimatedDuration: timing.label,
    };
  });
}

export function buildSpecializedVideos(sections) {
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

export function buildGenericVideos(outline, courseCategory) {
  const usableBlocks = outline.blocks.filter((block) => block.kind !== "exam");
  return finalizeVideos(usableBlocks.map((block, index) => buildGenericVideo(block, index, courseCategory)));
}
