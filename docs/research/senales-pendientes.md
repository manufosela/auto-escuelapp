# Señales pendientes de incorporar al catálogo

`scripts/fetch-signs.mjs` solo incluye señales cuyo código y significado se
han verificado manualmente (Commons + fuente secundaria). A propósito, **no
rellena el catálogo a partir del nombre de fichero**: los nombres de Commons
no son un campo estructurado (mezclan códigos con y sin guion, calificadores
como "2023 set" o "(2025)", variantes históricas...) y asumir que el nombre
de fichero es el código oficial sin comprobarlo señal a señal introduciría
errores en un contenido cuyo principio rector es que nada esté inventado.

## Estado actual

Incorporadas (AUT-TSK-0006): R-1, R-2 (grupo *priority*), R-101 (grupo
*prohibitory*). Las tres en dominio público.

## Pendiente, por grupo (cobertura aproximada en Commons a 2026-09-18)

| Grupo | Categoría de Commons | Ficheros aprox. |
|---|---|---|
| warning | `Category:SVG warning road signs of Spain` | 59 |
| prohibitory (resto) | `Category:SVG prohibitory road signs of Spain` | ~101 |
| mandatory | `Category:SVG mandatory road signs of Spain` | 80 |
| priority (resto: R-3 a R-6) | `Category:SVG priority road signs of Spain` | 4 |
| indication | `Category:SVG indication road signs of Spain` | 118 |
| service | `Category:SVG service road signs of Spain` | 61 |
| temporary | `Category:SVG temporary road signs of Spain` | 79 |
| additional | `Category:SVG additional road signs of Spain` | 25 |

Para cada una, incorporar siguiendo el mismo patrón que `SIGNS` en
`scripts/fetch-signs.mjs`: código, grupo, nombre y significado verificados
antes de añadir la entrada — no en lote automático.

## Señales del catálogo 2025 (RD 465/2025) a vigilar especialmente

Señales nuevas o modificadas por el RD 465/2025 vistas en Commons pero sin
verificar aún su significado exacto contra el anexo del BOE:

- R-118, R-119, R-120 (prohibición de entrada, variantes VMP)
- P-20c y variantes "(2025)"

Antes de incorporarlas, contrastar contra el PDF del BOE
(`https://www.boe.es/boe/dias/2025/06/17/pdfs/BOE-A-2025-12199.pdf`), que
contiene las imágenes oficiales del catálogo.

## Fuera de alcance de Commons

- **Marcas viales**: cobertura pobre en Commons (`Category:Road markings in
  Spain`, ~13 ficheros). Probablemente haya que ilustrarlas a mano siguiendo
  el anexo del BOE.
- **Señales y órdenes de los agentes**: sin cobertura en Commons como SVG.
  Redactar/ilustrar de forma independiente si se necesitan.

## Alternativa para señales sin cobertura libre

El Ministerio de Transportes publica el catálogo en formato DXF
(`normativa-tecnica/equipamiento-vial`, ZIP
"Senales_Pictogramas_formato_dxf.zip"). Convertirlo a SVG es la vía para
cubrir señales del catálogo 2025 que aún no estén en Commons con licencia
libre — pendiente, no abordado en AUT-TSK-0006.
