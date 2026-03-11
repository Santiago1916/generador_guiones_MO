# Generador de guiones de cursos | Mundo Ocupacional

Aplicacion en Next.js para Mundo Ocupacional que recibe documentos de cursos y capacitaciones (`PDF`, `DOC`, `DOCX`), valida la estructura del contenido y genera guiones en primera persona con un tono mas cercano, editable y listo para revision.

## Que hace

- Recibe archivos por `drop zone`.
- Extrae texto desde `PDF`, `DOC` y `DOCX`.
- Detecta si un `PDF` parece escaneado y avisa cuando necesita `OCR`.
- Valida si el documento incluye las secciones esperadas del curso.
- Explica exactamente que falta cuando el formato viene incompleto.
- Genera un dialogo distinto segun el contenido real detectado en cada documento.
- Reescribe el contenido en tono mas cercano, calido y explicativo.
- Genera guiones por video para:
  - `Introduccion`
  - `Responsabilidades especificas en SST`
  - `Politicas del sistema de gestion de SST`
  - `Reglamento de higiene y seguridad industrial` (si existe)
- Muestra cada video en un modal tipo preview con comparacion `texto original vs guion`.
- Permite editar el guion por video antes de exportarlo.
- Incluye biblioteca de frases aprobadas para aperturas, transiciones y cierres.
- Valida escritura y ortografia antes de permitir la descarga del PDF final.
- Permite aplicar algunas sugerencias con un clic.
- Descarga un PDF consolidado del guion solo cuando la revision pasa correctamente.
- Ofrece una plantilla `DOCX` de formato recomendado general para distintos tipos de curso.

## Formula de duracion

La estimacion usa esta logica:

```txt
palabras_por_minuto = 140
segundos_extra_por_video = 20
```

Para cada video:

```txt
duracion_seg = (palabras / 140) * 60 + 20
```

El total del curso se valida sin examen, solo con los videos generados.

## Secciones esperadas

Recomendadas:

- `Titulo del curso`
- `Introduccion u objetivo`
- `Modulos o subtemas claros`

Opcionales:

- `Cierre o conclusion`
- `Examen`

## Flujo de trabajo

1. Cargar el documento del curso o de la capacitacion.
2. Revisar el semaforo general, la validacion de formato y los avisos de OCR si existen.
3. Abrir cada video en el modal para comparar el texto detectado con el guion generado.
4. Editar el guion, aplicar frases aprobadas o usar correcciones con un clic.
5. Ejecutar la validacion final de escritura y ortografia.
6. Descargar el PDF consolidado del guion validado.

## Revision ortografica

La validacion previa a la descarga combina:

- Reglas locales de escritura.
- Revision ortografica y gramatical con `LanguageTool Public API`.

Si la revision externa no responde, la descarga del PDF se bloquea para evitar exportar un guion sin validar.

## Stack

- `Next.js 14`
- `React 18`
- `mammoth` para `DOCX`
- `word-extractor` para `DOC`
- `pdf-parse` para `PDF`
- `docx` para generar la plantilla recomendada
- `jspdf` para exportar el guion final en PDF
- `zod` para validaciones

## Ejecutar en desarrollo

```bash
cd generador_guiones_MO
npm install
npm run dev
```

Abrir en:

- `http://localhost:3000`

## Build de produccion

```bash
npm run build
npm start
```

## Endpoints internos

- `POST /api/process-course`
- `POST /api/validate-scripts`
- `GET /api/template-course`

Campos esperados:

- `file` para procesar el curso.
- `videos[]` con `id`, `title` y `scriptText` para la validacion final.

## Estado actual

La version actual funciona sin servicios externos de IA para generar el guion base. La transformacion del contenido a guion se hace con reglas y plantillas para mantener el flujo rapido, consistente y editable. El sistema puede trabajar tanto con documentos tipo SG-SST como con formatos generales por modulos y subtemas. Si mas adelante se necesita un tono todavia mas natural o adaptar estilos por cliente, se puede sumar una capa de IA encima de esta base, pero para pruebas y produccion inicial no es obligatoria.
