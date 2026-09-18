# Licencia del contenido

El código de este repositorio se publica bajo MIT (ver `LICENSE`). El
**contenido de estudio** (temario, preguntas, catálogo de señales, citas
legales) sigue reglas distintas según su origen, porque no todo el contenido
tiene el mismo dueño. Este documento fija qué se puede hacer con cada parte.
El detalle de la investigación que sustenta estas reglas está en
`docs/research/` y el listado de ficheros con su fuente exacta en
`docs/SOURCES.md`.

## 1. Normativa (BOE)

Los textos legales (leyes, reglamentos, anexos) no son objeto de propiedad
intelectual (art. 13 de la Ley de Propiedad Intelectual, RDL 1/1996). Se
reutilizan bajo la licencia de reutilización de boe.es, que permite copia,
distribución y obras derivadas con estas condiciones:

- Citar: *"Basado en datos de la Agencia Estatal Boletín Oficial del Estado"*,
  con enlace a https://www.boe.es.
- Indicar que es un **texto consolidado de carácter meramente informativo**.
- Indicar la **fecha de la última actualización** del bloque citado.

Estas tres condiciones se cumplen automáticamente en cada vista de normativa
de la app (ver `AUT-TSK-0004` / ingesta BOE en `AUT-TSK-0003`).

## 2. Texto de los tests de la revista "Tráfico y Seguridad Vial" (DGT)

Reutilizable **solo el texto**, citando la fuente, según su aviso legal:
*"Se autoriza la reproducción total o parcial de los textos que contiene esta
revista [...] siempre que se cite a la revista 'Tráfico y Seguridad Vial' como
fuente"*. Cada pregunta importada de esta fuente lleva el número de test y la
URL de origen. **Las imágenes de la revista no se reproducen nunca**: su aviso
legal lo prohíbe expresamente.

## 3. Imágenes de señales (Wikimedia Commons)

Cada SVG se distribuye con la licencia que declara su página en Commons
(dominio público, CC0 o CC BY-SA según el fichero). `ATTRIBUTIONS.md` lista
autor, licencia y URL de origen por fichero, generado automáticamente por el
script de `AUT-TSK-0006`. Un fichero CC BY-SA conserva su atribución y su
licencia; no se relicencia como MIT.

## 4. Contenido de redacción propia

El resto del contenido (explicaciones del temario, preguntas propias, fichas
de repaso) es de autoría propia y se publica bajo la misma licencia MIT que el
código.

## 5. Qué NO está ni estará en este repositorio

- Preguntas o imágenes del simulador oficial de examen de la DGT
  (sedeweb.dgt.gob.es): su aviso legal limita el uso a personal y privado.
- Contenido de manuales, tests o imágenes de autoescuelas o editoriales
  comerciales (p. ej. Ediciones Matfer, ETRASA, AEOL, CNAE, Pons): tienen
  copyright activo, gestionado en muchos casos por CEDRO.
- Cualquier dato personal (emails, nombres completos, teléfonos) de personas
  usuarias de la app. El progreso de cada persona vive en su cuenta de
  Firestore, nunca en este repositorio — ver `firestore.rules`.

## Aviso de no afiliación

Este proyecto **no está afiliado, patrocinado ni avalado** por la Dirección
General de Tráfico (DGT) ni por la Agencia Estatal Boletín Oficial del Estado
(BOE). No usa sus logotipos ni se presenta como fuente oficial.
