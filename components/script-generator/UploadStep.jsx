"use client";

import { FileCog, FolderOpen, ScanSearch, WandSparkles } from "lucide-react";
import { ACCEPTED_TYPES, formatFileSize } from "@/lib/script-generator";

export default function UploadStep({
  inputRef,
  selectedFile,
  dragActive,
  error,
  isProcessing,
  onSubmit,
  onChooseFile,
  onSelectFile,
  onDragEnter,
  onDragOver,
  onDragLeave,
  onDrop,
  onDownloadTemplate,
}) {
  return (
    <section className="workspace-grid">
      <form className="composer-card tour-upload-panel" onSubmit={onSubmit}>
        <div className="card-intro">
          <span className="eyebrow">Paso 1</span>
          <h2>Carga el documento base del curso</h2>
          <p className="supporting-text">
            Puede ser un curso SG-SST o un tema general por modulos y subtemas.
          </p>
        </div>

        <div
          className={`dropzone ${dragActive ? "is-dragging" : ""} ${selectedFile ? "has-file" : ""}`}
          onDragEnter={onDragEnter}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={onChooseFile}
          role="button"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              onChooseFile();
            }
          }}
        >
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED_TYPES}
            className="sr-only"
            onChange={(event) => onSelectFile(event.target.files?.[0])}
          />

          <span className="dropzone-badge">Zona de carga</span>
          <h2>{selectedFile ? selectedFile.name : "Arrastra aqui el documento del curso"}</h2>
          <p>
            {selectedFile
              ? `${formatFileSize(selectedFile.size)} listo para analisis, validacion y construccion del guion.`
              : "Tambien puedes hacer clic para buscar el archivo en tu equipo."}
          </p>
          <div className="dropzone-footer">
            <span>Formatos: PDF, DOC, DOCX</span>
            <span>Maximo: 15 MB</span>
          </div>
        </div>

        {selectedFile ? (
          <div className="selected-file-card">
            <div>
              <span className="metric-label">Archivo seleccionado</span>
              <strong>{selectedFile.name}</strong>
              <p>
                {formatFileSize(selectedFile.size)} |{" "}
                {selectedFile.name.split(".").pop()?.toUpperCase() || "Archivo"}
              </p>
            </div>
            <button type="button" className="ghost-button change-file-button" onClick={onChooseFile}>
              <span className="button-content">
                <FolderOpen size={18} />
                Cambiar archivo
              </span>
            </button>
          </div>
        ) : null}

        {error ? <p className="feedback error-text">{error}</p> : null}

        <div className="action-row">
          <button type="submit" className="primary-button" disabled={isProcessing}>
            <span className="button-content">
              <WandSparkles size={18} />
              {isProcessing ? "Analizando documento..." : "Analizar documento y crear borrador"}
            </span>
          </button>
        </div>
      </form>

      <aside className="sidebar-card">
        <div className="usage-card">
          <strong>Como usarlo sin perderte</strong>
          <ol className="guide-list">
            <li>Sube el documento base del curso.</li>
            <li>Revisa el semaforo y el bloque de validacion.</li>
            <li>Abre los videos que necesiten ajuste.</li>
            <li>Valida escritura y descarga el PDF final.</li>
          </ol>
        </div>

        <h3>Que hace esta version</h3>
        <ul className="checklist">
          <li>Que el archivo sea PDF, DOC o DOCX.</li>
          <li>Que el documento tenga una estructura clara por secciones, modulos o subtemas.</li>
          <li>Que cada documento genere un dialogo distinto segun el contenido detectado.</li>
          <li>Que el sistema marque si un PDF parece escaneado y necesita OCR.</li>
          <li>Que puedas comparar el texto original contra el guion en un modal editable.</li>
          <li>Que haya correcciones rapidas con un clic cuando la revision encuentre sugerencias aplicables.</li>
          <li>Que el PDF final solo se descargue si pasa la validacion de escritura y ortografia.</li>
        </ul>

        <div className="formula-card">
          <span className="formula-label">Formula base</span>
          <code>palabras / 140 * 60 + 20 segundos por video</code>
        </div>

        <div className="template-card tour-template-card">
          <strong>Plantilla de documento ejemplo</strong>
          <p>
            Descarga un formato recomendado general para cursos, capacitaciones y temas distintos,
            no solo para una estructura fija de SG-SST.
          </p>
          <button type="button" className="ghost-button full-button" onClick={onDownloadTemplate}>
            <span className="button-content">
              <FileCog size={18} />
              Descargar formato recomendado
            </span>
          </button>
        </div>

        <div className="notes-box onboarding-note">
          <h4>Atajo recomendado</h4>
          <p className="supporting-text">
            Si es la primera vez que un asesor usa esta herramienta, puede iniciar la guia
            interactiva desde la parte superior y seguirla con clics simples.
          </p>
          <span className="pill">
            <ScanSearch size={14} />
            Tour explicado paso a paso
          </span>
        </div>
      </aside>
    </section>
  );
}
