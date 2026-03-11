import { APPROVED_SCRIPT_LIBRARY } from "@/lib/course-config";
import { getCourseCategoryPreset } from "@/lib/course-categories";

export default function ReviewPhraseLibrary({ currentVideoId, courseCategory, onApplyLibraryPhrase }) {
  const categoryPreset = getCourseCategoryPreset(courseCategory?.id || courseCategory || "general");
  const openings = [...APPROVED_SCRIPT_LIBRARY.openings, ...(categoryPreset.library?.openings || [])];
  const transitions = [...APPROVED_SCRIPT_LIBRARY.transitions, ...(categoryPreset.library?.transitions || [])];
  const closings = [...APPROVED_SCRIPT_LIBRARY.closings, ...(categoryPreset.library?.closings || [])];

  return (
    <div className="notes-box library-box">
      <h4>Biblioteca de frases aprobadas</h4>

      <div className="library-group">
        <strong>Aperturas</strong>
        <div className="library-actions">
          {openings.map((item) => (
            <button
              key={item.id}
              type="button"
              className="ghost-button library-button"
              onClick={() => onApplyLibraryPhrase(currentVideoId, "opening", item.text, item.label)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="library-group">
        <strong>Transiciones</strong>
        <div className="library-actions">
          {transitions.map((item) => (
            <button
              key={item.id}
              type="button"
              className="ghost-button library-button"
              onClick={() => onApplyLibraryPhrase(currentVideoId, "transition", item.text, item.label)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="library-group">
        <strong>Cierres</strong>
        <div className="library-actions">
          {closings.map((item) => (
            <button
              key={item.id}
              type="button"
              className="ghost-button library-button"
              onClick={() => onApplyLibraryPhrase(currentVideoId, "closing", item.text, item.label)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
