# auto-escuelapp

App web mobile-first para estudiar el temario y practicar tests del examen teórico del permiso de conducir B en España.

> **Proyecto no oficial.** No está afiliado, patrocinado ni avalado por la Dirección General de Tráfico (DGT) ni por la Agencia Estatal Boletín Oficial del Estado.

## Qué ofrece

- **Modo examen** con el formato real: 30 preguntas, 30 minutos, máximo 3 fallos, 3 opciones por pregunta, una pregunta por pantalla y rejilla de navegación con estados «contestada / no contestada».
- **Práctica por tema** con corrección inmediata, explicación y cita del artículo aplicable.
- **Temario** propio organizado por temas y **catálogo de señales** vigente.
- **Seguimiento**: historial, acierto por tema y repaso priorizado de fallos.

## Stack

Astro (salida estática) + Lit + Firebase (Hosting, Auth, Firestore). Tests con Vitest y Playwright.

## Contenido y fuentes

Todo el contenido público de este repo procede de fuentes reutilizables o es de redacción propia:

- Normativa: textos consolidados del BOE. *Basado en datos de la Agencia Estatal Boletín Oficial del Estado* (https://www.boe.es). Los textos consolidados tienen carácter meramente informativo.
- Texto de preguntas de los tests de la revista «Tráfico y Seguridad Vial» (DGT), citada como fuente en cada pregunta.
- Imágenes de señales de Wikimedia Commons, con licencia y autoría por fichero en `ATTRIBUTIONS.md`.
- Temario, explicaciones y el resto de preguntas: redacción propia.

No se incluyen preguntas del simulador de la DGT, ni contenido de manuales o webs comerciales de autoescuela.

## Desarrollo

```sh
npm ci
npm run dev
npm test
npm run build
```
