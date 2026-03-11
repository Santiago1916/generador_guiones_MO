// La exportacion PDF queda aislada para que la pagina no cargue con detalles de maquetacion.
function getPdfFileName(sourceName = "curso-sst") {
  const baseName = String(sourceName || "curso-sst")
    .replace(/\.[^.]+$/, "")
    .trim()
    .replace(/[^a-zA-Z0-9-_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return `${baseName || "curso-sst"}-guion-validado.pdf`;
}

export async function downloadScriptsPdf({ videos, totals, sourceFileName, provider }) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 48;
  const marginBottom = 52;
  const maxWidth = pageWidth - marginX * 2;
  let cursorY = 58;

  const ensureSpace = (requiredHeight = 18) => {
    if (cursorY + requiredHeight <= pageHeight - marginBottom) return;
    doc.addPage();
    cursorY = 58;
  };

  const writeParagraph = ({ text = "", fontSize = 12, lineHeight = 18, color = [16, 35, 72], style = "normal" }) => {
    const safeText = String(text);
    const lines = safeText ? doc.splitTextToSize(safeText, maxWidth) : [""];
    ensureSpace(lines.length * lineHeight + 8);
    doc.setFont("helvetica", style);
    doc.setFontSize(fontSize);
    doc.setTextColor(...color);

    for (const line of lines) {
      ensureSpace(lineHeight + 4);
      doc.text(line || " ", marginX, cursorY);
      cursorY += lineHeight;
    }

    cursorY += 4;
  };

  doc.setProperties({
    title: "Guion validado del curso SST",
    subject: "Guion de curso SST",
    author: "Mundo Ocupacional",
    keywords: "sst, curso, guion",
  });

  writeParagraph({ text: "Mundo Ocupacional", fontSize: 12, style: "bold", color: [43, 27, 128] });
  writeParagraph({ text: "Guion validado del curso SST", fontSize: 22, style: "bold", color: [31, 19, 99], lineHeight: 26 });
  writeParagraph({
    text: `Documento base: ${sourceFileName || "Archivo cargado"} | Duracion estimada: ${totals.estimatedDuration} | Palabras: ${totals.wordCount}`,
    fontSize: 10,
    color: [91, 111, 146],
    lineHeight: 16,
  });
  writeParagraph({
    text: `Revision previa de escritura y ortografia: ${provider || "Reglas locales + revision ortografica"}`,
    fontSize: 10,
    color: [91, 111, 146],
    lineHeight: 16,
  });

  cursorY += 8;
  doc.setDrawColor(207, 217, 243);
  doc.line(marginX, cursorY, pageWidth - marginX, cursorY);
  cursorY += 22;

  videos.forEach((video, index) => {
    if (index > 0) {
      ensureSpace(28);
      doc.setDrawColor(222, 229, 247);
      doc.line(marginX, cursorY, pageWidth - marginX, cursorY);
      cursorY += 22;
    }

    writeParagraph({ text: video.title, fontSize: 16, style: "bold", color: [43, 27, 128], lineHeight: 20 });
    writeParagraph({
      text: `${video.wordCount} palabras | Duracion estimada: ${video.estimatedDuration}`,
      fontSize: 10,
      color: [91, 111, 146],
      lineHeight: 15,
    });

    String(video.scriptText)
      .split("\n")
      .forEach((paragraph) => {
        writeParagraph({ text: paragraph, fontSize: 12, lineHeight: 18, color: [16, 35, 72] });
      });
  });

  doc.save(getPdfFileName(sourceFileName));
}
