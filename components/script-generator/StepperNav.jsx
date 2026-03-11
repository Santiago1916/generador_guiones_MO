"use client";

export default function StepperNav({ processSteps, openStepId, result, reviewConfirmed, onOpenStep }) {
  const currentStepIndex = processSteps.findIndex((step) => step.state === "current");

  return (
    <nav className="stepper-nav tour-stepper" aria-label="Paso a paso del flujo">
      {processSteps.map((step, index) => {
        const isLocked =
          (step.id === "review" && !result) || (step.id === "export" && (!result || !reviewConfirmed));
        const isOpen = openStepId === step.id;
        const connectorIsActive = index < (currentStepIndex >= 0 ? currentStepIndex : processSteps.length - 1);

        return (
          <div key={step.id} className={`stepper-segment is-${step.state} ${isOpen ? "is-open" : ""}`}>
            <button
              type="button"
              className="stepper-button"
              onClick={() => onOpenStep(step.id)}
              disabled={isLocked}
              aria-current={isOpen ? "step" : undefined}
              title={step.description}
            >
              <span className="stepper-marker-row" aria-hidden="true">
                <span className={`stepper-marker ${isLocked ? "is-locked" : ""}`}>
                  <span className="sr-only">Paso {step.number}</span>
                </span>
                {index < processSteps.length - 1 ? (
                  <span className={`stepper-connector ${connectorIsActive ? "is-active" : ""}`} />
                ) : null}
              </span>

              <span className="stepper-node-copy">
                <strong>{step.title}</strong>
              </span>
            </button>
          </div>
        );
      })}
    </nav>
  );
}
