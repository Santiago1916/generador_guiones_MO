import { driver } from "driver.js";

function waitForUi(ms = 220) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function pushStep(steps, config) {
  if (config.element && !document.querySelector(config.element)) return;
  steps.push(config);
}

export function createScriptGeneratorTour({
  result,
  reviewConfirmed,
  onOpenStep,
  onOpenReviewModal,
  onOpenFinalPreview,
  onCloseReviewModal,
  onCloseFinalPreview,
  onTourFinished,
}) {
  const tour = driver({
    showProgress: true,
    animate: true,
    allowClose: true,
    stagePadding: 12,
    stageRadius: 20,
    popoverClass: "mo-tour-popover",
    onDestroyed: () => {
      onCloseReviewModal?.();
      onCloseFinalPreview?.();
      onTourFinished?.();
    },
  });

  const steps = [];

  pushStep(steps, {
    element: ".tour-hero-actions",
    popover: {
      title: "Guia interactiva",
      description:
        "Desde aqui puedes arrancar una guia visual que te muestra el flujo real de la herramienta con simples clics.",
      side: "bottom",
      align: "start",
    },
  });

  pushStep(steps, {
    element: ".tour-stepper",
    popover: {
      title: "Flujo por pasos",
      description:
        "La pantalla esta dividida en 3 pasos para que el asesor siempre sepa si esta cargando, revisando o descargando.",
      side: "bottom",
    },
  });

  pushStep(steps, {
    element: ".tour-upload-panel",
    popover: {
      title: "Paso 1: cargar el documento",
      description:
        "Aqui solo necesitas subir el archivo base y hacer clic en analizar. El sistema arma el borrador automaticamente.",
      side: "right",
    },
  });

  pushStep(steps, {
    element: ".tour-template-card",
    popover: {
      title: "Formato recomendado",
      description:
        "Si el asesor tiene dudas sobre la estructura, puede descargar una plantilla general desde este boton.",
      side: "left",
    },
  });

  if (!result) {
    tour.setSteps(steps);
    return tour;
  }

  pushStep(steps, {
    element: ".tour-review-card",
    popover: {
      title: "Paso 2: revisar el borrador",
      description:
        "Cuando el documento ya fue procesado, aqui se ve el resumen del analisis y el acceso a la revision guiada.",
      side: "bottom",
    },
  });

  pushStep(steps, {
    element: ".tour-open-review",
    popover: {
      title: "Abrir la revision",
      description:
        "Con un clic entras al workspace donde revisas todos los videos uno por uno dentro de un solo preview.",
      side: "bottom",
      onNextClick: async (_element, _step, { driver: activeDriver }) => {
        onOpenStep?.("review");
        onOpenReviewModal?.();
        await waitForUi();
        activeDriver.moveNext();
      },
    },
  });

  pushStep(steps, {
    element: ".tour-review-workspace",
    popover: {
      title: "Workspace unico de revision",
      description:
        "Aqui ocurre casi todo: navegar entre videos, editar, aplicar sugerencias y marcar lo que ya quedo revisado.",
      side: "top",
      align: "center",
    },
  });

  pushStep(steps, {
    element: ".tour-review-sidebar",
    popover: {
      title: "Navegacion 1 a 1",
      description:
        "La columna izquierda te deja saltar rapidamente entre videos sin llenar la pantalla principal con muchos bloques.",
      side: "right",
    },
  });

  pushStep(steps, {
    element: ".tour-review-editor",
    popover: {
      title: "Edicion directa",
      description:
        "Este editor es el corazon del paso 2. Aqui puedes ajustar tono, estructura y respuesta final del video actual.",
      side: "left",
    },
  });

  pushStep(steps, {
    element: ".tour-mark-reviewed",
    popover: {
      title: "Marcar como revisado",
      description:
        "Cuando un video ya te convence, lo marcas como revisado. El paso 3 solo se habilita cuando todos queden chequeados.",
      side: "top",
    },
  });

  if (!reviewConfirmed) {
    pushStep(steps, {
      element: ".tour-complete-review",
      popover: {
        title: "Cerrar el paso 2",
        description:
          "Despues de revisar todos los videos, este boton confirma la revision humana y desbloquea el preview final del paso 3.",
        side: "top",
      },
    });
  }

  if (reviewConfirmed) {
    pushStep(steps, {
      element: ".tour-export-card",
      popover: {
        title: "Paso 3: preview final",
        description:
          "En este paso ya no editas. Solo revisas el resultado aceptado y decides si validas y descargas.",
        side: "top",
      },
    });

    pushStep(steps, {
      element: ".tour-open-final-preview",
      popover: {
        title: "Abrir preview final",
        description:
          "Este boton abre el modal final con los cambios aceptados para que hagas la validacion definitiva.",
        side: "bottom",
        onNextClick: async (_element, _step, { driver: activeDriver }) => {
          onOpenStep?.("export");
          onCloseReviewModal?.();
          onOpenFinalPreview?.();
          await waitForUi();
          activeDriver.moveNext();
        },
      },
    });

    pushStep(steps, {
      element: ".tour-final-preview",
      popover: {
        title: "Resultado consolidado",
        description:
          "Aqui puedes comparar la version original con la aceptada antes de correr la validacion final.",
        side: "top",
      },
    });

    pushStep(steps, {
      element: ".tour-download-pdf",
      popover: {
        title: "Ultimo clic",
        description:
          "Si la validacion de escritura pasa, desde aqui mismo se descarga el PDF final del guion.",
        side: "top",
      },
    });
  }

  tour.setSteps(steps);
  return tour;
}
