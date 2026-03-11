function getExtension(fileName = "") {
  const cleanedName = String(fileName).trim().toLowerCase();
  const lastDot = cleanedName.lastIndexOf(".");
  if (lastDot < 0) return "";
  return cleanedName.slice(lastDot);
}

function countWords(text = "") {
  return String(text)
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean).length;
}

function buildDiagnostics(extension, text = "") {
  const normalized = String(text).replace(/\s+/g, " ").trim();
  const wordCount = countWords(normalized);
  const charCount = normalized.length;
  let ocrState = "clear";
  let message = "";

  if (!normalized) {
    ocrState = extension === ".pdf" ? "required" : "unreadable";
    message =
      extension === ".pdf"
        ? "No se pudo extraer texto del PDF. Es muy probable que sea un documento escaneado o compuesto por imagenes. Necesita OCR antes de procesarlo."
        : "No se pudo extraer texto util del archivo cargado. Revisa si el documento tiene texto seleccionable.";
  } else if (extension === ".pdf" && wordCount < 45) {
    ocrState = "suggested";
    message =
      "Se extrajo muy poco texto del PDF. Puede ser un archivo escaneado o con baja calidad de lectura. Conviene pasarlo por OCR para mejorar la deteccion.";
  }

  return {
    charCount,
    wordCount,
    hasUsableText: Boolean(normalized),
    ocrState,
    message,
  };
}

async function extractPdfText(buffer) {
  const { PDFParse } = await import("pdf-parse");
  const parser = new PDFParse({ data: buffer });

  try {
    const result = await parser.getText();
    return result?.text || "";
  } finally {
    await parser.destroy().catch(() => {});
  }
}

async function extractDocxText(buffer) {
  const mammoth = await import("mammoth");
  const result = await mammoth.extractRawText({ buffer });
  return result?.value || "";
}

async function extractWordText(buffer) {
  const wordExtractorModule = await import("word-extractor");
  const WordExtractor = wordExtractorModule.default || wordExtractorModule;
  const extractor = new WordExtractor();
  const document = await extractor.extract(buffer);

  return [
    document?.getBody?.() || "",
    document?.getFootnotes?.() || "",
    document?.getEndnotes?.() || "",
  ]
    .filter(Boolean)
    .join("\n\n");
}

export async function extractTextFromUpload(file) {
  const extension = getExtension(file?.name);
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  let text = "";

  if (extension === ".pdf") {
    text = await extractPdfText(buffer);
  } else if (extension === ".docx") {
    text = await extractDocxText(buffer);
  } else if (extension === ".doc") {
    text = await extractWordText(buffer);
  } else {
    throw new Error("Formato no soportado. Usa PDF, DOC o DOCX.");
  }

  return {
    extension,
    text,
    diagnostics: buildDiagnostics(extension, text),
  };
}
