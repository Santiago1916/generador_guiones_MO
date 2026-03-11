"use client";

import Image from "next/image";
import { CircleHelp, FileDown, MousePointerClick } from "lucide-react";

export default function HeroSection({ onStartTour, onDownloadTemplate, onJumpToUpload }) {
  return (
    <section className="hero-panel tour-hero">
      <div className="hero-copy">
        <div className="brand-wrap">
          <Image
            src="/img/logo-claro.png"
            alt="Logo Mundo Ocupacional"
            width={220}
            height={62}
            priority
            className="brand-mark"
          />
        </div>

        <h2>Validador y generador de guiones para cursos y capacitaciones</h2>
        <p className="hero-text">
          Sube el documento del curso, revisa el borrador por videos y descarga el PDF final solo
          cuando ya haya pasado la revision de escritura. La idea es que el asesor sepa siempre en
          que paso va y que debe hacer despues.
        </p>

        <div className="hero-actions tour-hero-actions">
          <button type="button" className="primary-button hero-action-button" onClick={onStartTour}>
            <span className="button-content">
              <CircleHelp size={18} />
              Ver guia interactiva
            </span>
          </button>
          <button type="button" className="ghost-button hero-action-button" onClick={onJumpToUpload}>
            <span className="button-content">
              <MousePointerClick size={18} />
              Ir al paso 1
            </span>
          </button>
          <button type="button" className="ghost-button hero-action-button" onClick={onDownloadTemplate}>
            <span className="button-content">
              <FileDown size={18} />
              Descargar formato
            </span>
          </button>
        </div>
      </div>

      <div className="hero-note">
        <strong>Formato esperado</strong>
        <p>
          Titulo del curso, introduccion u objetivo, modulos o subtemas claros y, si aplica, cierre
          o examen. Si el documento viene con estructura SG-SST, tambien se aprovecha.
        </p>
      </div>
    </section>
  );
}
