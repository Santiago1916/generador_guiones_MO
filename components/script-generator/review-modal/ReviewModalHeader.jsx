import { X } from "lucide-react";

export default function ReviewModalHeader({ showAdvanced, onToggleAdvanced, onClose }) {
  return (
    <div className="modal-top modal-top-compact">
      <div className="modal-title-block">
        <h2 id="review-workspace-title">Tomar revision del guion</h2>
        <p className="supporting-text">Revisa el curso video por video y marca cada uno cuando quede listo.</p>
      </div>

      <div className="modal-top-actions">
        <button
          type="button"
          className={`ghost-button view-toggle-button ${showAdvanced ? "is-active" : ""}`}
          onClick={onToggleAdvanced}
          aria-pressed={showAdvanced}
          aria-label={showAdvanced ? "Cambiar a vista general" : "Cambiar a vista avanzada"}
        >
          {showAdvanced ? "Vista general" : "Vista avanzada"}
        </button>

        <button type="button" className="modal-close-icon" onClick={onClose} aria-label="Cerrar modal de revision">
          <X size={18} />
        </button>
      </div>
    </div>
  );
}
