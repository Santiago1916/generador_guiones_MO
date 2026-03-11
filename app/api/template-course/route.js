import { NextResponse } from "next/server";
import {
  AlignmentType,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  TextRun,
} from "docx";

export const runtime = "nodejs";

const TEMPLATE_SECTIONS = [
  {
    title: "1. NOMBRE DEL CURSO O CAPACITACION",
    paragraphs: [
      "Escribe aqui el nombre general del curso. Puede ser Seguridad Vial, Copasst, Inspecciones de Seguridad, Liderazgo, Primeros Auxilios o cualquier otro tema.",
    ],
  },
  {
    title: "2. INTRODUCCION U OBJETIVO",
    paragraphs: [
      "Explica brevemente por que este tema es importante, que busca el curso y como se relaciona con el trabajo o con la vida diaria del colaborador.",
    ],
  },
  {
    title: "3. MODULOS O SUBTEMAS",
    paragraphs: [
      "Separa cada modulo con subtitulos claros.",
      "Ejemplo:",
      "Modulo 1. Contexto general del tema",
      "Modulo 2. Riesgos, responsabilidades o conceptos clave",
      "Modulo 3. Recomendaciones practicas, prevencion o cierre tecnico",
      "Si tu curso tiene apartados como Examen, Conclusion o Mensaje final, tambien puedes dejarlos con subtitulos independientes.",
    ],
  },
  {
    title: "4. CIERRE O CONCLUSION (OPCIONAL)",
    paragraphs: [
      "Agrega un mensaje final, una conclusion o una idea de cierre para que el guion tenga una despedida mas redonda y humana.",
    ],
  },
  {
    title: "5. EXAMEN (OPCIONAL)",
    paragraphs: [
      "Si el curso incluye examen, puedes dejarlo al final con un subtitulo claro. El sistema lo reconocera como evaluacion y no lo sumara al tiempo del guion.",
    ],
  },
  {
    title: "RECOMENDACIONES DE FORMATO",
    paragraphs: [
      "Usa subtitulos cortos y claros.",
      "Evita mezclar muchos temas distintos dentro del mismo parrafo.",
      "Si hay listas o responsabilidades, enumera los puntos para mejorar la deteccion.",
      "Si el archivo es PDF, procura que tenga texto seleccionable. Si es un escaneo, pasalo por OCR antes de cargarlo.",
    ],
  },
];

export async function GET() {
  const children = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 220 },
      children: [
        new TextRun({
          text: "Mundo Ocupacional",
          bold: true,
          size: 28,
          color: "2B1B80",
        }),
      ],
    }),
    new Paragraph({
      text: "Formato recomendado general para documentos base de curso",
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 220 },
    }),
    new Paragraph({
      spacing: { after: 220 },
      children: [
        new TextRun({
          text: "Usa esta plantilla para estructurar cualquier curso o capacitacion. No esta amarrada a un solo tema: funciona para SG-SST, seguridad vial, Copasst, acoso, liderazgo, primeros auxilios y otros contenidos similares.",
          size: 22,
        }),
      ],
    }),
  ];

  for (const section of TEMPLATE_SECTIONS) {
    children.push(
      new Paragraph({
        text: section.title,
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 120 },
      })
    );

    for (const paragraph of section.paragraphs) {
      children.push(
        new Paragraph({
          spacing: { after: 120 },
          children: [
            new TextRun({
              text: paragraph,
              size: 22,
            }),
          ],
        })
      );
    }
  }

  const document = new Document({
    sections: [
      {
        properties: {},
        children,
      },
    ],
  });

  const buffer = await Packer.toBuffer(document);

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": 'attachment; filename="formato-general-cursos-mundo-ocupacional.docx"',
      "Cache-Control": "no-store",
    },
  });
}
