import { NextResponse } from "next/server";
import { analyzeCourseText } from "@/lib/course-parser";
import { COURSE_LIMITS, SUPPORTED_EXTENSIONS } from "@/lib/course-config";
import { extractTextFromUpload } from "@/lib/document-text";

export const runtime = "nodejs";

function getExtension(fileName = "") {
  const normalizedName = String(fileName).toLowerCase();
  const lastDot = normalizedName.lastIndexOf(".");
  return lastDot >= 0 ? normalizedName.slice(lastDot) : "";
}

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Debes subir un archivo del curso." }, { status: 400 });
    }

    const extension = getExtension(file.name);
    if (!SUPPORTED_EXTENSIONS.includes(extension)) {
      return NextResponse.json(
        {
          error: `Formato no soportado. Usa ${SUPPORTED_EXTENSIONS.join(", ")}.`,
        },
        { status: 400 }
      );
    }

    if (file.size > COURSE_LIMITS.maxFileSizeBytes) {
      return NextResponse.json(
        {
          error: "El archivo supera el limite permitido de 15 MB.",
        },
        { status: 400 }
      );
    }

    const extracted = await extractTextFromUpload(file);
    const analysis = analyzeCourseText(extracted.text, {
      extractionDiagnostics: extracted.diagnostics,
    });

    return NextResponse.json({
      file: {
        name: file.name,
        size: file.size,
        type: file.type || extension,
        extension: extracted.extension,
      },
      ...analysis,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error?.message || "No fue posible procesar el documento.",
      },
      { status: 500 }
    );
  }
}
