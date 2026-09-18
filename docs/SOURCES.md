# Fuentes de contenido, fichero a fichero

Este documento es el índice de trazabilidad: qué carpeta de contenido viene
de qué fuente y bajo qué condición. El razonamiento completo está en
`docs/research/`; las condiciones de uso, en `CONTENT-LICENSE.md`.

| Contenido | Ubicación prevista | Fuente | Condición de uso |
|---|---|---|---|
| Texto normativo citado en el temario | `src/content/legal/` (AUT-TSK-0003) | API de datos abiertos del BOE (`boe.es/datosabiertos`) | Copiable con cita de fuente, aviso de texto consolidado informativo y fecha de actualización |
| Catálogo de señales (imágenes) | `public/signs/` (AUT-TSK-0006) | Wikimedia Commons, `Category:SVG road signs in Spain` | Licencia por fichero, ver `ATTRIBUTIONS.md` |
| Temario (texto) | `src/content/topics/` (AUT-TSK-0005) | Redacción propia sobre el Anexo V.B.1 del RD 818/2009 | MIT (redacción propia) |
| Preguntas de la revista DGT | `src/content/questions/revista-dgt.json` (AUT-TSK-0007) | `revista.dgt.es/es/test/` (solo texto) | Copiable con cita de la revista; sin imágenes |
| Preguntas propias | `src/content/questions/propias.json` (AUT-TSK-0009) | Redacción propia, estilo documentado en `docs/research/formato-examen-y-preguntas.md` | MIT (redacción propia) |
| Fichas de repaso | `src/content/flashcards/` (AUT-TSK-0016) | Redacción propia | MIT (redacción propia) |

## Explícitamente excluido de este repositorio

- `~/Downloads/Documentos/PDF_Otros/autoescuela_san_cristobal-LIBRO.pdf`
  (Ediciones Matfer, con copyright) y cualquier texto o imagen derivada de él.
  Se usa solo en local, bajo `private/` (gitignored), para contrastar huecos
  de contenido — ver AUT-TSK-0008. Nunca entra en el repo público.
- Cualquier extracción del simulador oficial de examen de la DGT.
- Contenido de webs o manuales comerciales de autoescuela.

## Schema del contenido

Las colecciones `topics`, `questions` y `signs` (definidas en
`src/content.config.js`) validan su forma automáticamente en `astro build` /
`astro check`: un campo mal formado hace fallar el build señalando el
fichero y el campo exactos. Los ficheros con prefijo `_ejemplo-` son
fixtures que ejercitan el schema, no contenido final.

## Cómo se comprueba

- `scripts/guard-content.mjs` bloquea en pre-commit cualquier fichero bajo
  `private/` y cualquier email personal (`@gmail.com`, `@tribbuapp.com`) que
  se intente añadir al índice de git.
- El pie de página de la app (`src/components/SiteFooter.astro`) recuerda en
  cada pantalla que el proyecto no es oficial.
