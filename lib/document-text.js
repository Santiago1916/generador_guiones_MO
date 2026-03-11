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

function getUnreadableCharacterRatio(text = "") {
  const cleanedText = String(text);
  const suspiciousCharacters = cleanedText.match(/[^a-zA-Z0-9\s.,;:()\-/%áéíóúüñÁÉÍÓÚÜÑ]/g) || [];
  return cleanedText.length ? suspiciousCharacters.length / cleanedText.length : 0;
}

function getOneLetterTokenRatio(text = "") {
  const tokens = String(text).split(/\s+/).filter(Boolean);
  if (!tokens.length) return 0;
  const shortTokens = tokens.filter((token) => token.length === 1).length;
  return shortTokens / tokens.length;
}

function buildConfidence(extension, normalizedText, wordCount, charCount, ocrState) {
  if (!normalizedText) {
    return {
      confidenceScore: extension === ".pdf" ? 8 : 18,
      confidenceLabel: "Muy baja",
      confidenceTone: "danger",
      confidenceMessage:
        extension === ".pdf"
          ? "No se pudo leer texto util del PDF. La confianza de extraccion es muy baja y el documento necesita OCR."
          : "No se pudo leer texto util del archivo. La confianza de extraccion es muy baja.",
    };
  }

  const unreadableRatio = getUnreadableCharacterRatio(normalizedText);
  const oneLetterRatio = getOneLetterTokenRatio(normalizedText);
  let confidenceScore = extension === ".pdf" ? 84 : 92;

  if (extension === ".pdf" && ocrState === "suggested") {
    confidenceScore -= 26;
  }

  if (wordCount < 45) {
    confidenceScore -= 18;
  } else if (wordCount < 120) {
    confidenceScore -= 8;
  }

  if (charCount < 260) {
    confidenceScore -= 12;
  }

  if (unreadableRatio > 0.08) {
    confidenceScore -= 20;
  } else if (unreadableRatio > 0.04) {
    confidenceScore -= 10;
  }

  if (oneLetterRatio > 0.22) {
    confidenceScore -= 16;
  } else if (oneLetterRatio > 0.14) {
    confidenceScore -= 8;
  }

  const safeScore = Math.max(0, Math.min(100, Math.round(confidenceScore)));

  if (safeScore >= 80) {
    return {
      confidenceScore: safeScore,
      confidenceLabel: "Alta",
      confidenceTone: "success",
      confidenceMessage: "La lectura del documento se ve estable y con texto suficientemente claro para generar el guion.",
    };
  }

  if (safeScore >= 60) {
    return {
      confidenceScore: safeScore,
      confidenceLabel: "Media",
      confidenceTone: "warning",
      confidenceMessage:
        "La lectura del documento es usable, pero conviene revisar el preview porque algunas partes podrian llegar incompletas.",
    };
  }

  return {
    confidenceScore: safeScore,
    confidenceLabel: "Baja",
    confidenceTone: "danger",
    confidenceMessage:
      extension === ".pdf"
        ? "La lectura del PDF es dudosa. Conviene aplicar OCR o revisar el archivo antes de confiar en todo el guion."
        : "La lectura del archivo es dudosa. Revisa con cuidado el contenido detectado antes de cerrar el guion.",
  };
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

  const confidence = buildConfidence(extension, normalized, wordCount, charCount, ocrState);

  return {
    charCount,
    wordCount,
    hasUsableText: Boolean(normalized),
    ocrState,
    message,
    ...confidence,
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
