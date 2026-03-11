export const SUPPORTED_EXTENSIONS = [".pdf", ".doc", ".docx"];

export const COURSE_LIMITS = {
  maxFileSizeBytes: 15 * 1024 * 1024,
  wordsPerMinute: 140,
  extraSecondsPerVideo: 20,
  targetMinSeconds: 5 * 60,
  targetMaxSeconds: 8 * 60,
};

export const VIDEO_DURATION_GUIDE = {
  shortRatio: 0.6,
  longRatio: 1.6,
  minGapSeconds: 25,
  absoluteMinSeconds: 45,
  absoluteMaxSeconds: 210,
};

export const SECTION_DEFINITIONS = [
  {
    id: "intro",
    label: "Introduccion",
    required: true,
    examples: ["1. INTRODUCCION", "INTRODUCCION"],
    headingMatchers: [/^(?:\d+\s*[\.\):\-]?\s*)?introduccion\b/],
  },
  {
    id: "responsibilities",
    label: "Responsabilidades especificas en SST",
    required: true,
    examples: [
      "2. RESPONSABILIDADES ESPECIFICAS EN SEGURIDAD Y SALUD EN EL TRABAJO",
      "RESPONSABILIDADES ESPECIFICAS EN SST",
    ],
    headingMatchers: [/^(?:\d+\s*[\.\):\-]?\s*)?responsabilidades especificas\b/],
  },
  {
    id: "policies",
    label: "Politicas del sistema de gestion de SST",
    required: true,
    examples: [
      "3. POLITICAS DEL SISTEMA DE GESTION DE SEGURIDAD Y SALUD EN EL TRABAJO",
      "POLITICAS DEL SISTEMA DE GESTION DE SST",
    ],
    headingMatchers: [/^(?:\d+\s*[\.\):\-]?\s*)?politicas del sistema de gestion\b/],
  },
  {
    id: "regulation",
    label: "Reglamento de higiene y seguridad industrial",
    required: false,
    examples: ["4. REGLAMENTO DE HIGIENE Y SEGURIDAD INDUSTRIAL"],
    headingMatchers: [/^(?:\d+\s*[\.\):\-]?\s*)?reglamento de higiene y seguridad industrial\b/],
  },
];

export const VIDEO_BLUEPRINTS = {
  intro: {
    id: "video-1",
    title: "VIDEO 1: INTRODUCCION",
    opening:
      "Hola, me alegra acompanarte en este espacio. Quiero darte la bienvenida y contarte de forma cercana como funciona nuestro sistema de seguridad y salud en el trabajo.",
    closing:
      "Quiero que te quedes con esta idea: cuando cuidamos la seguridad y la salud en el trabajo, tambien cuidamos nuestro bienestar y el de todo el equipo.",
    maxWords: 260,
  },
  responsibilities: {
    id: "video-2",
    title: "VIDEO 2: RESPONSABILIDADES ESPECIFICAS EN SST",
    opening:
      "Ahora quiero hablar contigo sobre algo clave: las responsabilidades que asumimos cada dia para trabajar con mas seguridad, confianza y tranquilidad.",
    closing:
      "Cada una de estas acciones hace una diferencia real. Cuando asumimos nuestro rol con compromiso, prevenimos riesgos y protegemos a quienes nos rodean.",
    maxWords: 250,
  },
  policies: {
    id: "video-3",
    title: "VIDEO 3: POLITICAS DEL SISTEMA DE GESTION DE SST",
    opening:
      "En esta parte quiero contarte cuales son las politicas que nos orientan y por que son tan importantes para construir un ambiente de trabajo sano, respetuoso y seguro.",
    closing:
      "Conocer estas politicas nos ayuda a actuar con coherencia y a fortalecer una cultura de cuidado que se vive todos los dias.",
    maxWords: 270,
  },
  regulation: {
    id: "video-4",
    title: "VIDEO 4: REGLAMENTO DE HIGIENE Y SEGURIDAD INDUSTRIAL",
    opening:
      "Antes de cerrar, quiero explicarte por que el reglamento de higiene y seguridad industrial es una guia practica para prevenir incidentes y tomar mejores decisiones en el trabajo.",
    closing:
      "Cuando conocemos el reglamento y lo llevamos a la practica, protegemos nuestra salud y contribuimos a un entorno mucho mas seguro para todos.",
    maxWords: 220,
  },
};

export const RESPONSIBILITY_CONNECTORS = [
  "Primero,",
  "Segundo,",
  "Tercero,",
  "Cuarto,",
  "Quinto,",
  "Sexto,",
  "Ademas,",
  "Por ultimo,",
];

export const APPROVED_SCRIPT_LIBRARY = {
  openings: [
    {
      id: "opening-welcome",
      label: "Apertura cercana",
      text: "Hola, me alegra acompanarte en este espacio. Quiero compartir contigo este contenido de una forma clara, cercana y facil de aplicar en tu trabajo.",
    },
    {
      id: "opening-purpose",
      label: "Apertura con proposito",
      text: "Quiero darte la bienvenida y explicarte por que este tema es tan importante para tu bienestar, tu seguridad y la del equipo que te acompana cada dia.",
    },
    {
      id: "opening-action",
      label: "Apertura dinamica",
      text: "Hoy quiero conversar contigo sobre acciones concretas que nos ayudan a trabajar con mas seguridad, confianza y sentido de cuidado compartido.",
    },
  ],
  transitions: [
    {
      id: "transition-bridge",
      label: "Transicion suave",
      text: "Con esta base clara, quiero dar el siguiente paso contigo para aterrizar estas ideas en acciones concretas dentro de nuestro entorno laboral.",
    },
    {
      id: "transition-focus",
      label: "Transicion de enfoque",
      text: "Ahora que tenemos este contexto, vale la pena detenernos en los puntos que realmente marcan la diferencia en la practica diaria.",
    },
    {
      id: "transition-team",
      label: "Transicion de equipo",
      text: "Todo esto cobra mas sentido cuando entendemos que la prevencion y el cuidado no dependen de una sola persona, sino del compromiso de todos.",
    },
  ],
  closings: [
    {
      id: "closing-thanks",
      label: "Cierre agradecido",
      text: "Gracias por acompanarme en este recorrido. Confio en que este contenido te ayude a tomar decisiones mas seguras y conscientes en tu trabajo.",
    },
    {
      id: "closing-commitment",
      label: "Cierre de compromiso",
      text: "Quiero invitarte a llevar estas ideas a la practica, porque cada accion preventiva fortalece tu bienestar y el de las personas que te rodean.",
    },
    {
      id: "closing-culture",
      label: "Cierre cultural",
      text: "Cuando convertimos estos principios en habitos, construimos una cultura de cuidado mucho mas fuerte, humana y sostenible para todos.",
    },
  ],
};
