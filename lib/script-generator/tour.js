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
    prevBtnText: "Anterior",
    nextBtnText: "Siguiente",
    doneBtnText: "Finalizar",
    progressText: "{{current}} de {{total}}",
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

  if (!result) {
    pushStep(steps, {
      element: ".tour-stepper",
      popover: {
        title: "Asi funciona el proceso",
        description:
          "La herramienta esta pensada en 3 pasos claros: cargar el documento, revisar el borrador y validar antes de descargar el PDF final.",
        side: "bottom",
      },
    });

    pushStep(steps, {
      element: ".tour-upload-panel",
      popover: {
        title: "Paso 1: cargar el documento",
        description:
          "Aqui eliges el tipo de curso, subes el archivo base y haces clic en analizar. Si el archivo aun no tiene una estructura clara, puedes apoyarte en la plantilla de ejemplo.",
        side: "right",
      },
    });

    pushStep(steps, {
      element: ".tour-review-step-panel",
      popover: {
        title: "Paso 2: revisar el borrador",
        description:
          "Cuando termines el analisis, aqui se habilita el workspace para revisar cada video, editar el texto y marcar lo que ya quedo listo.",
        side: "top",
      },
    });

    pushStep(steps, {
      element: ".tour-export-step-panel",
      popover: {
        title: "Paso 3: validar y descargar",
        description:
          "Despues de confirmar la revision, aqui abres el preview final, corres la validacion de escritura y descargas el PDF solo cuando todo pase.",
        side: "top",
      },
    });

    tour.setSteps(steps);
    return tour;
  }

  pushStep(steps, {
    element: ".tour-upload-panel",
    popover: {
      title: "Paso 1: cargar el documento",
      description:
        "Este bloque ya cumplio su funcion: desde aqui se eligio el tipo de curso, se subio el archivo y se genero el borrador automaticamente.",
      side: "right",
    },
  });

  pushStep(steps, {
    element: ".tour-open-review",
    popover: {
      title: "Paso 2: revisar el borrador",
      description:
        "Con este boton entras al workspace donde revisas los videos uno por uno, editas y marcas lo que ya quedo listo.",
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
    element: ".tour-review-editor",
    popover: {
      title: "Paso 3: ajustar y confirmar",
      description:
        "Este editor es el corazon del proceso. Aqui ajustas el texto y, cuando termines cada video, lo marcas como revisado para habilitar el paso final.",
      side: "left",
    },
  });

  pushStep(steps, {
    element: reviewConfirmed ? ".tour-open-final-preview" : ".tour-complete-review",
    popover: {
      title: "Paso 4: validar y descargar",
      description: reviewConfirmed
        ? "Desde aqui abres el preview final y haces la validacion definitiva antes de descargar el PDF."
        : "Cuando termines de revisar todos los videos, este boton cierra el paso 2 y te lleva al preview final para validar y descargar.",
      side: "top",
      ...(reviewConfirmed
        ? {
            onNextClick: async (_element, _step, { driver: activeDriver }) => {
              onOpenStep?.("export");
              onCloseReviewModal?.();
              onOpenFinalPreview?.();
              await waitForUi();
              activeDriver.moveNext();
            },
          }
        : {}),
    },
  });

  tour.setSteps(steps);
  return tour;
}
