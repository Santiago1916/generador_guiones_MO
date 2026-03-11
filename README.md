# Generador de guiones de cursos | Mundo Ocupacional

Aplicacion en `Next.js` para Mundo Ocupacional que recibe documentos de cursos y capacitaciones (`PDF`, `DOC`, `DOCX`), valida la estructura del contenido y genera guiones en primera persona con un tono mas cercano, editable y listo para revision.

## Que hace

- Recibe archivos por `drop zone`.
- Extrae texto desde `PDF`, `DOC` y `DOCX`.
- Detecta si un `PDF` parece escaneado y avisa cuando necesita `OCR`.
- Permite elegir un `tipo de curso` antes de procesar:
  - `Deteccion automatica`
  - `SG-SST`
  - `Seguridad vial`
  - `Psicosocial y bienestar`
  - `Liderazgo y habilidades blandas`
  - `Primeros auxilios y emergencias`
  - `Inclusion y diversidad`
  - `Inspecciones y control`
  - `Riesgos ocupacionales`
  - `General / otro`
- Usa esa categoria para mejorar deteccion, tono, frases y validaciones del guion.
- Explica exactamente que falta cuando el formato viene incompleto.
- Genera un dialogo distinto segun el contenido real detectado en cada documento.
- Reescribe el contenido en tono mas cercano, calido y explicativo.
- Soporta tanto documentos tipo `SG-SST` como formatos generales por modulos y subtemas.
- Muestra el borrador en un `workspace de revision` donde se revisa video por video dentro de un solo modal.
- Permite editar el guion por video antes de exportarlo.
- Incluye biblioteca de frases aprobadas para aperturas, transiciones y cierres, incluyendo variaciones segun el tipo de curso.
- Valida escritura y ortografia antes de permitir la descarga del PDF final.
- Segmenta observaciones por severidad:
  - `bloqueantes`
  - `importantes`
  - `sugeridas`
- Permite aplicar sugerencias con un clic.
- Permite `ignorar` una observacion puntual o `agregar al diccionario` cuando una palabra esta bien escrita pero el corrector la marca.
- Muestra en el preview final un `diff visual` de cambios aceptados frente al borrador original.
- Descarga un PDF consolidado del guion solo cuando la revision pasa correctamente.
- Ofrece una plantilla `DOCX` de formato recomendado general para distintos tipos de curso.
- Incluye una `guia interactiva` corta con 4 pasos para onboarding del usuario.
- Tiene mejoras de accesibilidad en modales:
  - cierre con `Escape`
  - `focus trap`
  - restauracion de foco al cerrar
  - navegacion entre videos con `Alt + Flecha izquierda/derecha`

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

1. Elegir el tipo de curso o dejar `Deteccion automatica`.
2. Cargar el documento del curso o de la capacitacion.
3. Revisar el semaforo general, la validacion de formato y los avisos de OCR si existen.
4. Abrir el workspace de revision y recorrer los videos uno a uno.
5. Editar el guion, aplicar frases aprobadas, usar sugerencias, ignorar observaciones validas o agregar terminos al diccionario.
6. Confirmar la revision del paso 2.
7. Abrir el preview final, revisar el diff de cambios y ejecutar la validacion final.
8. Descargar el PDF consolidado del guion validado.

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
- `driver.js` para la guia interactiva
- `zod` para validaciones

## Arquitectura actual

### Parser

La logica del parser ya esta dividida por responsabilidad en `lib/course-parser/`:

- `text.js`: normalizacion, conteo de palabras y utilidades de lenguaje.
- `outline.js`: deteccion de encabezados, bloques y estructura del documento.
- `builders.js`: construccion de videos y guiones.
- `validation.js`: validaciones del documento y faltantes.
- `index.js`: orquestacion final del analisis.

### Hooks del flujo

La pagina principal delega la mayor parte del estado en `lib/script-generator/hooks/`:

- `useCourseProcessing`
- `useReviewFlow`
- `useScriptValidation`
- `useLocalDrafts`
- `useAccessibleModal`

### UI de revision

El modal de revision se divide en componentes pequenos dentro de `components/script-generator/review-modal/`.

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
- `courseType` para sugerir el tipo de curso.
- `videos[]` con `id`, `title` y `scriptText` para la validacion final.
- `customDictionary[]` para terminos aprobados por el usuario.
- `ignoredIssues[]` para observaciones que el usuario decide no bloquear.

## Estado actual

La version actual funciona sin servicios externos de IA para generar el guion base. La transformacion del contenido a guion se hace con reglas y plantillas para mantener el flujo rapido, consistente y editable. Si mas adelante se necesita un tono todavia mas natural o adaptar estilos por cliente, se puede sumar una capa de IA encima de esta base, pero para pruebas y produccion inicial no es obligatoria.
