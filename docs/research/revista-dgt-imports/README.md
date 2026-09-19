# Borradores importados de la revista DGT (AUT-TSK-0008)

Salida de `scripts/import-revista-dgt.mjs`: texto de los tests de la revista
*Tráfico y Seguridad Vial* (revista.dgt.es/es/test/), reutilizable bajo
CONTENT-LICENSE.md §2 (solo texto, citando test y URL; nunca imágenes).

Cada `test-{n}.json` es un borrador, **no contenido publicado**. Para pasar
una pregunta a `src/content/questions/` hace falta completar a mano, con
investigación legal real (nunca inventada):

- `explanation`: por qué esa es la respuesta correcta.
- `legalReference`: norma y artículo exactos que la sustentan (ver
  `src/content/legal/` para los bloques ya descargados con
  `scripts/fetch-legal.mjs`; si el artículo necesario no está, hay que
  añadirlo a `BLOCKS` en ese script y volver a ejecutarlo).
- `subject`: revisar `subjectGuess` (heurística por palabras clave, puede
  ser `null` o estar equivocada) contra el Anexo V.B.1
  (`docs/research/formato-examen-y-preguntas.md` §5).

Estado a 2026-09-19: 148 preguntas importadas (tests 268, 270-278), 1
promovida a `src/content/questions/velocidad-ciclomotor-revista-278.json`
como prueba end-to-end del pipeline. El resto queda pendiente de revisión
por lotes, igual que el banco de preguntas propias (AUT-TSK-0009).

Para importar tests nuevos: añadir su número a `TEST_NUMBERS` en
`scripts/import-revista-dgt.mjs` y ejecutar `node scripts/import-revista-dgt.mjs`.
