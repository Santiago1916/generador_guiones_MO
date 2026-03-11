"use client";

import { getStatusChipClass } from "@/lib/script-generator";

function getPanelTone(state, isReady) {
  if (!isReady) return "";
  if (state === "done") return "success";
  if (state === "current") return "warning";
  return "";
}

function getPanelLabel(state, labels) {
  if (state === "done") return labels.done;
  if (state === "current") return labels.current;
  return labels.pending;
}

export default function StepPanel({
  step,
  eyebrow,
  isOpen,
  isDisabled = false,
  statusLabels,
  className = "",
  onToggle,
  children,
}) {
  return (
    <section
      className={`step-panel ${isOpen ? "is-open" : ""} ${isDisabled ? "is-disabled" : ""} ${className}`.trim()}
    >
      <button type="button" className="step-panel-header" onClick={onToggle} disabled={isDisabled}>
        <div className="step-panel-copy">
          <span className="eyebrow">{eyebrow}</span>
          <h2>{step?.title}</h2>
          <p>{step?.description}</p>
        </div>
        <span className={`status-chip ${getStatusChipClass(getPanelTone(step?.state, !isDisabled))}`}>
          {getPanelLabel(step?.state, statusLabels)}
        </span>
      </button>

      {isOpen ? <div className="step-panel-body">{children}</div> : null}
    </section>
  );
}
