"use client";

export default function StepperNav({ processSteps, openStepId, result, reviewConfirmed, onOpenStep }) {
  return (
    <nav className="stepper-nav tour-stepper" aria-label="Paso a paso del flujo">
      {processSteps.map((step) => {
        const isLocked =
          (step.id === "review" && !result) || (step.id === "export" && (!result || !reviewConfirmed));
        const isOpen = openStepId === step.id;

        return (
          <button
            key={step.id}
            type="button"
            className={`stepper-node is-${step.state} ${isOpen ? "is-open" : ""}`}
            onClick={() => onOpenStep(step.id)}
            disabled={isLocked}
          >
            <span className="stepper-node-number">{step.number}</span>
            <span className="stepper-node-copy">
              <strong>{step.title}</strong>
              <small>{step.description}</small>
            </span>
          </button>
        );
      })}
    </nav>
  );
}
