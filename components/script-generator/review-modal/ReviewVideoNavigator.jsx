import { getStatusChipClass } from "@/lib/script-generator";

export default function ReviewVideoNavigator({
  videos,
  currentVideoId,
  reviewedVideoIds,
  validationMap,
  repetitionReport,
  balanceReport,
  onSelectVideo,
}) {
  const currentIsReviewed = reviewedVideoIds.includes(currentVideoId);

  return (
    <section className="review-strip-card tour-review-sidebar" aria-label="Lista de videos del curso">
      <div className="review-strip-head review-strip-head-compact">
        <h3>Videos del curso</h3>
        <div className="review-strip-meta">
          <span className="pill">
            {reviewedVideoIds.length}/{videos.length} revisados
          </span>
          <span className={`status-chip ${currentIsReviewed ? "is-success" : "is-warning"}`}>
            {currentIsReviewed ? "Actual revisado" : "Actual pendiente"}
          </span>
        </div>
      </div>

      <div className="review-video-strip" role="tablist" aria-label="Videos disponibles para revision">
        {videos.map((video, index) => {
          const videoValidation = validationMap.get(video.id);
          const videoReviewed = reviewedVideoIds.includes(video.id);
          const videoRepetition = repetitionReport.details.find((detail) => detail.videoId === video.id);
          const videoBalance = balanceReport.details.find((detail) => detail.videoId === video.id);
          const isActive = video.id === currentVideoId;

          return (
            <button
              key={video.id}
              type="button"
              className={`review-strip-item ${isActive ? "is-active" : ""}`}
              onClick={() => onSelectVideo(video.id)}
              role="tab"
              aria-selected={isActive}
              aria-current={isActive ? "step" : undefined}
              aria-label={`Abrir ${video.title}`}
            >
              <div>
                <strong>Video {index + 1}</strong>
                <span>{video.title}</span>
              </div>

              <div className="review-sidebar-status">
                <span className={`status-chip ${videoReviewed ? "is-success" : "is-warning"}`}>
                  {videoReviewed ? "Revisado" : "Pendiente"}
                </span>

                {videoValidation ? (
                  <span className={`status-chip ${getStatusChipClass(videoValidation.passed ? "success" : "danger")}`}>
                    {videoValidation.passed ? "Sin bloqueos" : `${videoValidation.blockingIssueCount || videoValidation.issueCount} por revisar`}
                  </span>
                ) : null}

                {videoBalance?.tone === "warning" ? <span className="status-chip is-warning">Tiempo a revisar</span> : null}
                {videoRepetition?.tone === "warning" ? <span className="status-chip is-warning">Ideas repetidas</span> : null}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
