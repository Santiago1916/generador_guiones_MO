function normalizeCategoryText(value = "") {
  return String(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export const COURSE_CATEGORY_OPTIONS = [
  {
    id: "auto",
    label: "Deteccion automatica",
    description: "El sistema intenta reconocer el tipo de curso segun el documento.",
  },
  {
    id: "sg-sst",
    label: "SG-SST",
    description: "Inducciones, reinducciones y temas de seguridad y salud en el trabajo.",
  },
  {
    id: "seguridad-vial",
    label: "Seguridad vial",
    description: "Cursos sobre actores viales, normas y prevencion en la via.",
  },
  {
    id: "psicosocial",
    label: "Psicosocial y bienestar",
    description: "Estres, burnout, salud mental, autocuidado y primeros auxilios psicologicos.",
  },
  {
    id: "liderazgo",
    label: "Liderazgo y habilidades blandas",
    description: "Liderazgo, comunicacion, trabajo en equipo, servicio y cultura.",
  },
  {
    id: "primeros-auxilios",
    label: "Primeros auxilios y emergencias",
    description: "Primeros auxilios, brigadas, extintores, simulacros y emergencias.",
  },
  {
    id: "inclusion",
    label: "Inclusion y diversidad",
    description: "Identidad de genero, orientacion sexual, convivencia y no discriminacion.",
  },
  {
    id: "inspecciones",
    label: "Inspecciones y control",
    description: "Inspecciones de seguridad, actos inseguros y seguimiento.",
  },
  {
    id: "riesgos",
    label: "Riesgos ocupacionales",
    description: "Riesgo biomecanico, quimico, biologico, electrico, locativo y afines.",
  },
  {
    id: "general",
    label: "General / otro",
    description: "Cualquier curso que no encaje claramente en una categoria anterior.",
  },
];

export const COURSE_CATEGORY_PRESETS = {
  auto: {
    id: "auto",
    label: "Deteccion automatica",
    keywords: [],
    headingKeywords: [],
    voiceLead:
      "Quiero darte contexto de una forma clara y cercana, para que este contenido se sienta facil de entender y util para la practica diaria.",
    blockLead:
      "Quiero resumirte este bloque de una forma practica, para que puedas explicarlo con seguridad y llevarlo a acciones concretas.",
    openingTone:
      "Hoy quiero acompanarte con un recorrido claro, cercano y facil de seguir sobre este contenido.",
    library: {
      openings: [],
      transitions: [],
      closings: [],
    },
  },
  "sg-sst": {
    id: "sg-sst",
    label: "SG-SST",
    keywords: [
      "sg sst",
      "seguridad y salud en el trabajo",
      "copasst",
      "politica de seguridad y salud en el trabajo",
      "accidente laboral",
      "enfermedad laboral",
      "reglamento de higiene y seguridad industrial",
    ],
    headingKeywords: ["responsabilidades", "politicas", "reglamento", "copasst", "autocuidado"],
    voiceLead:
      "Quiero ayudarte a entender como este contenido fortalece la prevencion, el autocuidado y la forma en que trabajamos con seguridad cada dia.",
    blockLead:
      "Quiero aterrizar este bloque en acciones concretas de prevencion, cuidado y cumplimiento dentro del trabajo.",
    openingTone:
      "Hoy quiero explicarte este tema desde la prevencion y el cuidado, para que lo puedas llevar a la practica con criterio y confianza.",
    library: {
      openings: [
        {
          id: "sst-opening-context",
          label: "Apertura SST",
          text: "Quiero acompanar este recorrido con un enfoque practico, para que cada idea te ayude a prevenir riesgos y fortalecer una cultura de cuidado en el trabajo.",
        },
      ],
      transitions: [
        {
          id: "sst-transition-prevention",
          label: "Transicion SST",
          text: "Con esta base, quiero llevarte al siguiente punto para que veamos como estas decisiones se traducen en prevencion y cuidado dentro de la jornada laboral.",
        },
      ],
      closings: [
        {
          id: "sst-closing-care",
          label: "Cierre SST",
          text: "Cada accion preventiva cuenta. Cuando aplicamos estas ideas, protegemos nuestra salud, la del equipo y la sostenibilidad de nuestro entorno laboral.",
        },
      ],
    },
  },
  "seguridad-vial": {
    id: "seguridad-vial",
    label: "Seguridad vial",
    keywords: ["seguridad vial", "peatones", "ciclistas", "motociclistas", "conductor", "transito", "movilidad"],
    headingKeywords: ["peatones", "ciclistas", "motociclistas", "conductor", "normatividad"],
    voiceLead:
      "Quiero que este tema te ayude a tomar decisiones mas seguras en la via y a reconocer como cada accion impacta tu bienestar y el de los demas.",
    blockLead:
      "Quiero aterrizar este bloque desde situaciones reales de movilidad, para que el mensaje sea facil de recordar y aplicar.",
    openingTone:
      "En este recorrido quiero hablarte de movilidad segura, responsabilidad y prevencion para actuar mejor en cada desplazamiento.",
    library: {
      openings: [
        {
          id: "road-opening",
          label: "Apertura vial",
          text: "Quiero invitarte a mirar este tema desde la prevencion en la via, porque una decision oportuna puede marcar la diferencia entre llegar bien o exponernos a un riesgo innecesario.",
        },
      ],
      transitions: [],
      closings: [],
    },
  },
  psicosocial: {
    id: "psicosocial",
    label: "Psicosocial y bienestar",
    keywords: ["riesgo psicosocial", "estres", "burnout", "ansiedad", "salud mental", "primeros auxilios psicologicos"],
    headingKeywords: ["estres", "burnout", "ansiedad", "bienestar", "salud mental"],
    voiceLead:
      "Quiero abordar este tema con cercania y humanidad, para que puedas reconocer senales, cuidarte mejor y acompanarte tambien en tu dia a dia.",
    blockLead:
      "Quiero resumir este bloque de una forma clara y calmada, para que el mensaje se sienta humano, util y facil de aplicar.",
    openingTone:
      "Hoy quiero hablar contigo de bienestar, autocuidado y herramientas practicas para afrontar mejor las exigencias del entorno laboral.",
    library: {
      openings: [
        {
          id: "psy-opening",
          label: "Apertura bienestar",
          text: "Quiero acompanarte en este tema desde una mirada cercana, porque entender nuestro bienestar emocional tambien es una forma concreta de prevenir riesgos.",
        },
      ],
      transitions: [],
      closings: [],
    },
  },
  liderazgo: {
    id: "liderazgo",
    label: "Liderazgo y habilidades blandas",
    keywords: ["liderazgo", "comunicacion asertiva", "trabajo en equipo", "servicio al cliente", "empatia", "resolucion de conflictos"],
    headingKeywords: ["liderazgo", "comunicacion", "equipo", "servicio", "empatia"],
    voiceLead:
      "Quiero que este contenido se sienta cercano y accionable, para que puedas convertirlo en mejores conversaciones, mejores decisiones y mejores relaciones de trabajo.",
    blockLead:
      "Quiero aterrizar este bloque en comportamientos concretos que se puedan vivir dentro del equipo y no se queden solo en teoria.",
    openingTone:
      "En este recorrido quiero hablarte de habilidades humanas que hacen mas fuerte al equipo y mas clara la forma en que trabajamos juntos.",
    library: {
      openings: [],
      transitions: [],
      closings: [
        {
          id: "leadership-closing",
          label: "Cierre liderazgo",
          text: "Cuando convertimos estas ideas en habitos diarios, fortalecemos la confianza, la colaboracion y el impacto positivo que tenemos sobre los demas.",
        },
      ],
    },
  },
  "primeros-auxilios": {
    id: "primeros-auxilios",
    label: "Primeros auxilios y emergencias",
    keywords: ["primeros auxilios", "extintores", "emergencias", "simulacro", "brigada", "evacuacion"],
    headingKeywords: ["primeros auxilios", "emergencias", "simulacro", "extintores", "evacuacion"],
    voiceLead:
      "Quiero explicarte este tema con orden y claridad, para que en una situacion real tengas mas criterio, serenidad y capacidad de respuesta.",
    blockLead:
      "Quiero convertir este bloque en pasos claros y faciles de recordar para que el aprendizaje sirva cuando realmente se necesite.",
    openingTone:
      "Hoy quiero acompanarte con un tema clave para la respuesta oportuna y el cuidado de las personas ante una eventualidad.",
    library: { openings: [], transitions: [], closings: [] },
  },
  inclusion: {
    id: "inclusion",
    label: "Inclusion y diversidad",
    keywords: ["identidad de genero", "orientacion sexual", "inclusion", "diversidad", "discriminacion", "cero tolerancia"],
    headingKeywords: ["identidad de genero", "orientacion sexual", "inclusion", "diversidad"],
    voiceLead:
      "Quiero compartir este contenido desde el respeto y la cercania, para que podamos entender mejor como construir espacios laborales mas seguros, dignos e inclusivos.",
    blockLead:
      "Quiero resumir este bloque con un enfoque claro y respetuoso, para que el mensaje se sienta humano, directo y facil de aplicar.",
    openingTone:
      "En este recorrido quiero invitarte a mirar este tema desde el respeto, la inclusion y la responsabilidad que tenemos en la convivencia diaria.",
    library: { openings: [], transitions: [], closings: [] },
  },
  inspecciones: {
    id: "inspecciones",
    label: "Inspecciones y control",
    keywords: ["inspecciones de seguridad", "tipos de inspecciones", "actos inseguros", "condiciones inseguras"],
    headingKeywords: ["inspecciones", "actos inseguros", "condiciones inseguras"],
    voiceLead:
      "Quiero mostrarte este tema desde la observacion preventiva y la mejora continua, para que puedas detectar riesgos con mas criterio.",
    blockLead:
      "Quiero aterrizar este bloque en acciones de observacion, reporte y correccion que realmente ayuden a prevenir incidentes.",
    openingTone:
      "Hoy quiero conversar contigo sobre como una buena inspeccion puede convertirse en una herramienta practica de prevencion.",
    library: { openings: [], transitions: [], closings: [] },
  },
  riesgos: {
    id: "riesgos",
    label: "Riesgos ocupacionales",
    keywords: ["riesgo biomecanico", "riesgo quimico", "riesgo biologico", "riesgo electrico", "riesgo locativo", "epp"],
    headingKeywords: ["riesgo", "riesgos", "epp", "biomecanico", "quimico", "biologico", "electrico", "locativo"],
    voiceLead:
      "Quiero explicarte este tema para que puedas reconocer mejor los peligros del entorno y actuar con prevencion antes de que el riesgo se materialice.",
    blockLead:
      "Quiero resumir este bloque de manera practica, para que te resulte mas sencillo identificar el riesgo y relacionarlo con acciones preventivas.",
    openingTone:
      "En este espacio quiero ayudarte a reconocer los riesgos mas importantes del entorno y las medidas que fortalecen la prevencion.",
    library: { openings: [], transitions: [], closings: [] },
  },
  general: {
    id: "general",
    label: "General / otro",
    keywords: [],
    headingKeywords: [],
    voiceLead:
      "Quiero darte contexto de una forma clara y cercana, para que este contenido se sienta facil de entender y util para la practica diaria.",
    blockLead:
      "Quiero resumirte este bloque de una forma practica, para que puedas explicarlo con seguridad y llevarlo a acciones concretas.",
    openingTone:
      "Hoy quiero acompanarte con un recorrido claro, cercano y facil de seguir sobre este contenido.",
    library: { openings: [], transitions: [], closings: [] },
  },
};

export function getCourseCategoryPreset(categoryId = "auto") {
  return COURSE_CATEGORY_PRESETS[categoryId] || COURSE_CATEGORY_PRESETS.general;
}

export function normalizeCourseCategoryId(categoryId = "auto") {
  const normalized = String(categoryId).trim().toLowerCase();
  return COURSE_CATEGORY_PRESETS[normalized] ? normalized : "auto";
}

export function resolveCourseCategory(preferredCategory = "auto", rawText = "", mode = "generic") {
  const normalizedPreferred = normalizeCourseCategoryId(preferredCategory);
  if (normalizedPreferred !== "auto") {
    return getCourseCategoryPreset(normalizedPreferred);
  }

  if (mode === "specialized") {
    return getCourseCategoryPreset("sg-sst");
  }

  const normalizedText = normalizeCategoryText(rawText);
  let bestCategory = "general";
  let bestScore = 0;

  for (const category of Object.values(COURSE_CATEGORY_PRESETS)) {
    if (category.id === "auto" || category.id === "general") continue;

    const score = category.keywords.reduce((sum, keyword) => {
      const normalizedKeyword = normalizeCategoryText(keyword);
      return normalizedText.includes(normalizedKeyword) ? sum + 1 : sum;
    }, 0);

    if (score > bestScore) {
      bestScore = score;
      bestCategory = category.id;
    }
  }

  return getCourseCategoryPreset(bestScore > 0 ? bestCategory : "general");
}
