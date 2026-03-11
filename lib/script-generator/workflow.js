export const ACCEPTED_TYPES = ".pdf,.doc,.docx";

export function getOverallSemaphore(result, totals, validationReport, scriptSignals = {}) {
  const validationIssues = result?.validation?.issues || [];
  const hasBlockingFormatErrors = validationIssues.some((issue) => issue.severity === "blocking");
  const hasWarnings = validationIssues.some((issue) => issue.severity === "important");
  const hasSuggestions = validationIssues.some((issue) => issue.severity === "suggested");
  const hasWritingErrors = validationReport?.videos?.some((video) => !video.passed) || false;
  const needsFinalReview = !validationReport;
  const hasLowExtractionConfidence = scriptSignals?.documentConfidence?.tone === "danger";
  const hasMediumExtractionConfidence = scriptSignals?.documentConfidence?.tone === "warning";
  const hasRepetitionWarnings = (scriptSignals?.repetitionReport?.repeatedVideosCount || 0) > 0;
  const hasBalanceWarnings = (scriptSignals?.balanceReport?.outlierCount || 0) > 0;

  if (hasBlockingFormatErrors || hasWritingErrors || hasLowExtractionConfidence) {
    return {
      tone: "danger",
      label: "Rojo",
      title: "Accion requerida",
      description:
        hasWritingErrors
          ? "Hay observaciones de escritura u ortografia por corregir antes de descargar el PDF."
          : hasLowExtractionConfidence
            ? "La lectura del documento es poco confiable. Conviene revisar el preview y, si aplica, pasar el archivo por OCR."
            : "El documento todavia tiene faltantes o alertas criticas de estructura.",
    };
  }

  if (
    !totals?.inTargetRange ||
    hasWarnings ||
    hasSuggestions ||
    needsFinalReview ||
    hasMediumExtractionConfidence ||
    hasRepetitionWarnings ||
    hasBalanceWarnings
  ) {
    return {
      tone: "warning",
      label: "Amarillo",
      title: "Revisar antes de cerrar",
      description: needsFinalReview
        ? "La estructura ya se genero, pero aun falta correr la revision final de escritura y ortografia."
        : !totals?.inTargetRange
          ? "El contenido existe, pero la duracion total aun no cae dentro de la ventana ideal."
          : hasRepetitionWarnings
            ? "El curso ya esta armado, pero detecte repeticiones entre videos que conviene pulir."
            : hasBalanceWarnings
              ? "El curso ya esta armado, pero algunos videos quedaron muy largos o muy cortos frente a los demas."
              : hasMediumExtractionConfidence
                ? "La lectura del documento fue usable, pero vale la pena revisar que no haya bloques incompletos."
          : "Hay observaciones menores que conviene ajustar para mejorar el resultado final.",
    };
  }

  return {
    tone: "success",
    label: "Verde",
    title: "Listo para descargar",
    description: "El formato, la duracion y la revision de escritura quedaron en buen estado para exportar el guion.",
  };
}

export function getCurrentStepId({ result, reviewConfirmed }) {
  if (!result) return "upload";
  if (!reviewConfirmed) return "review";
  return "export";
}

export function getProcessSteps({ selectedFile, result, editableVideos, validationReport, reviewConfirmed }) {
  const hasDrafts = editableVideos.length > 0;
  const currentStepId = getCurrentStepId({ result, reviewConfirmed });

  return [
    {
      id: "upload",
      number: "1",
      title: "Cargar documento",
      description: result
        ? `Documento procesado: ${selectedFile?.name || "archivo cargado"}`
        : selectedFile
          ? `Archivo listo: ${selectedFile.name}`
          : "Sube un PDF, DOC o DOCX del curso.",
      state: result ? "done" : "current",
    },
    {
      id: "review",
      number: "2",
      title: "Revisar borrador",
      description: hasDrafts
        ? `${editableVideos.length} videos listos para revisar y editar.`
        : "El sistema armara un borrador por cada bloque o tema detectado.",
      state: !hasDrafts ? "upcoming" : reviewConfirmed ? "done" : "current",
    },
    {
      id: "export",
      number: "3",
      title: "Validar y descargar",
      description: validationReport?.passed
        ? "La revision final paso y el PDF esta listo."
        : reviewConfirmed
          ? "Abre el preview final y corre la validacion antes de exportar."
          : hasDrafts
            ? "Se habilita cuando el usuario confirme la revision del paso 2."
          : "La descarga se habilita cuando existan videos generados.",
      state: !hasDrafts ? "upcoming" : currentStepId === "export" ? "current" : "upcoming",
    },
  ];
}

export function getNextActionCard({ result, validationReport, totals, recommendedVideo, scriptSignals = {} }) {
  if (result?.documentDiagnostics?.ocrState === "required") {
    return {
      tone: "danger",
      title: "Antes de seguir, este archivo necesita OCR",
      description:
        "El PDF parece escaneado. Conviene aplicar OCR o volver a subir una version con texto seleccionable para evitar un guion incompleto.",
      helper: "Cuando el texto del PDF no se puede leer bien, el sistema puede perder encabezados o subtemas.",
    };
  }

  if (scriptSignals?.documentConfidence?.tone === "danger") {
    return {
      tone: "danger",
      title: "Conviene revisar la lectura del documento antes de seguir",
      description:
        scriptSignals.documentConfidence.note,
      helper: "Si ves frases cortadas o bloques vacios, aplica OCR o vuelve a cargar una version con texto seleccionable.",
    };
  }

  if (result?.validation?.issues?.some((issue) => issue.severity === "blocking")) {
    return {
      tone: "danger",
      title: "Primero revisa los faltantes del documento",
      description:
        "Ve al bloque de validacion y revisa la seccion 'Exactamente que revisar'. Ahi ya se listan los encabezados o bloques que no se encontraron.",
      helper: recommendedVideo
        ? `Puedes empezar por ${recommendedVideo.title} para revisar como se armo el borrador con lo detectado.`
        : "Cuando el documento tenga lo minimo necesario, el guion saldra mucho mas estable.",
    };
  }

  if (scriptSignals?.repetitionReport?.repeatedVideosCount) {
    return {
      tone: "warning",
      title: "Hay ideas repetidas entre algunos videos",
      description:
        "Antes de cerrar el paso 2, revisa las frases repetidas que el sistema detecto entre videos para que el curso suene mas dinamico.",
      helper: recommendedVideo
        ? `Empieza por ${recommendedVideo.title} y ajusta el enfoque o los ejemplos para diferenciarlo mejor.`
        : "Con pequenos cambios de enfoque suele bastar para romper la repeticion.",
    };
  }

  if (scriptSignals?.balanceReport?.outlierCount) {
    return {
      tone: "warning",
      title: "Hay videos desbalanceados frente al resto del curso",
      description:
        "Algunos videos quedaron mucho mas largos o mas cortos que los demas. Conviene equilibrarlos antes de pasar al preview final.",
      helper: recommendedVideo
        ? `Empieza por ${recommendedVideo.title} para repartir mejor el tiempo total.`
        : "Ajusta primero el video mas corto o el mas largo para estabilizar el ritmo del curso.",
    };
  }

  if (!validationReport) {
    return {
      tone: "warning",
      title: "Siguiente paso: abre el borrador y haz una revision rapida",
      description:
        "Empieza por comparar el texto original con el guion. Si algo suena muy corto, muy largo o poco natural, ajustalo antes de validar ortografia.",
      helper: recommendedVideo
        ? `Te recomiendo comenzar por ${recommendedVideo.title}.`
        : "Cuando revises el primer video, el resto del flujo se vuelve mucho mas rapido.",
    };
  }

  if (!validationReport.passed) {
    return {
      tone: "danger",
      title: "Aun hay observaciones por corregir",
      description:
        "Usa los botones de aplicar sugerencia o corrige manualmente desde el editor. El PDF final se habilita cuando todos los videos pasen la revision.",
      helper: recommendedVideo
        ? `El video con mas prioridad ahora es ${recommendedVideo.title}.`
        : "Corrige las observaciones marcadas en rojo para cerrar el proceso.",
    };
  }

  if (!totals?.inTargetRange) {
    return {
      tone: "warning",
      title: "La escritura ya paso, pero conviene ajustar la duracion",
      description:
        "El curso todavia esta por fuera de la ventana ideal de 5 a 8 minutos. Puedes resumir o ampliar algunos videos antes de descargar.",
      helper: recommendedVideo
        ? `Empieza por ${recommendedVideo.title} para equilibrar mejor el tiempo total.`
        : "Un pequeno ajuste en el video mas corto o mas largo suele ser suficiente.",
    };
  }

  return {
    tone: "success",
    title: "Todo quedo listo para descargar",
    description:
      "La estructura se detecto bien, la revision de escritura paso y la duracion del curso se mantiene dentro del rango sugerido.",
    helper: "Si quieres, aun puedes abrir cualquier video y hacer un ultimo ajuste fino antes de exportar.",
  };
}

export function getStatusChipClass(tone = "") {
  if (tone === "success") return "is-success";
  if (tone === "warning") return "is-warning";
  if (tone === "danger") return "is-error";
  return "";
}
