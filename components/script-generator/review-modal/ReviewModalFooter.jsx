import { ArrowLeft, ArrowRight, CheckCheck, RotateCcw } from "lucide-react";

export default function ReviewModalFooter({
  safeIndex,
  totalVideos,
  currentVideoId,
  isReviewed,
  allReviewed,
  onPreviousVideo,
  onNextVideo,
  onRestoreVideo,
  onMarkReviewed,
  onCompleteReview,
}) {
  return (
    <div className="modal-actions">
      <div className="modal-actions-group">
        <button type="button" className="ghost-button" onClick={onPreviousVideo} disabled={safeIndex === 0}>
          <span className="button-content">
            <ArrowLeft size={18} />
            Video anterior
          </span>
        </button>
        <button
          type="button"
          className="ghost-button"
          onClick={onNextVideo}
          disabled={safeIndex === totalVideos - 1}
        >
          <span className="button-content">
            Siguiente video
            <ArrowRight size={18} />
          </span>
        </button>
      </div>

      <div className="modal-actions-group">
        <button type="button" className="ghost-button" onClick={() => onRestoreVideo(currentVideoId)}>
          <span className="button-content">
            <RotateCcw size={18} />
            Restaurar video actual
          </span>
        </button>

        <button
          type="button"
          className={`ghost-button is-reviewed-toggle tour-mark-reviewed ${isReviewed ? "is-active" : ""}`}
          onClick={() => onMarkReviewed(currentVideoId)}
          aria-pressed={isReviewed}
        >
          <span className="button-content">
            <CheckCheck size={18} />
            {isReviewed ? "Ya revisado" : "Marcar como revisado"}
          </span>
        </button>

        <button
          type="button"
          className="primary-button modal-primary tour-complete-review"
          onClick={onCompleteReview}
          disabled={!allReviewed}
        >
          Confirmar paso 2
        </button>
      </div>
    </div>
  );
}
