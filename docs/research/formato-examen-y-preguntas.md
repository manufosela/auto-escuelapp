# Formato del examen teórico y fuentes de preguntas

Investigación realizada el 2026-09-18. `[V]` = verificado abriendo la fuente ese día. `[NV]` = no verificado en fuente oficial.

## 1. Formato real del examen (permiso B)

Base legal: RD 818/2009, Reglamento General de Conductores, texto consolidado — https://www.boe.es/buscar/act.php?id=BOE-A-2009-9481

- **Preguntas**: Anexo VI.B.1 — prueba común, mínimo 30 y máximo 50; en la práctica el permiso B usa **30**.
- **Opciones por pregunta**: 3, una sola correcta.
- **Tiempo**: Anexo VI.B.2 — 1 minuto por pregunta ⇒ **30 minutos**, ampliable si hay vídeos.
- **Aprobado**: Anexo VI.B.3 — errores ≤ 10% del total ⇒ **máximo 3 fallos** sobre 30 preguntas.
- **Vigencia del apto**: 2 años (art. 53).
- **Convocatorias**: 2 por tasa (3 en recuperación de permiso).
- **Idiomas** (simulador oficial): castellano, catalán, valenciano, gallego, euskera, alemán, inglés, francés.
- **Lectura Fácil**: disponible para el permiso B desde 09/2024, a solicitar antes del examen.

Interfaz observada en el simulador oficial (sedeweb.dgt.gob.es):
- Una pregunta por pantalla, botones «Anterior» / «Siguiente».
- Rejilla 01–30 con solo dos estados: **contestada** / **no contestada** (no existe «marcar dudosa»).
- Se puede dejar en blanco y volver.
- Cabecera con tiempo restante.
- Corrección navegable al finalizar.

## 2. Cambios normativos 2024-2026 relevantes para el examen

- **RD 465/2025** (BOE-A-2025-12199, en vigor 01/07/2025): nuevo catálogo de señales. La propia DGT indica un plazo mínimo de 3 meses antes de incluir los cambios en el examen.
- **Vídeos de percepción del riesgo**: habilitados legalmente desde el RD 971/2020 (Anexo VI.B.1: «las preguntas podrán estar precedidas de vídeos»). Previstos por la DGT para finales de 2025, sin fecha confirmada a 2026-09-18 `[NV para la fecha exacta]`. Diseñar el modelo de datos con soporte opcional de vídeo por pregunta.
- **RD 518/2026** (BOE-A-2026-13889, en vigor 01/10/2026): usuarios vulnerables (VMP, ciclistas, motoristas, adelantamientos). Afecta directamente a varias materias del temario.
- **Baliza V16** obligatoria desde 01/01/2026 en sustitución de los triángulos.

## 3. Fuentes de preguntas: qué se puede y qué no se puede usar

| Fuente | Reutilizable en repo público | Motivo |
|---|---|---|
| Simulador DGT (sedeweb.dgt.gob.es) | **No** | Aviso legal de dgt.es: uso personal y privado únicamente. |
| Tests de la revista *Tráfico y Seguridad Vial* (revista.dgt.es/es/test/) | **Sí, solo el texto**, citando la fuente | Aviso legal: «se autoriza la reproducción total o parcial de los textos... siempre que se cite la revista como fuente». Las imágenes están expresamente prohibidas. |
| Datasets de GitHub con ~2.900 preguntas (donmerendolo, derivados) | **No** | Origen sin documentar; indicios de extracción de portales comerciales. |
| Bancos de todotest/practicatest y libros comerciales (Etrasa, Matfer, AEOL, CNAE, Pons) | **No** | Copyright activo, gestionado vía CEDRO. |
| Preguntas de redacción propia | **Sí** | Sin restricción, siempre que no reproduzcan literalmente ninguna de las anteriores. |

**Conclusión**: el banco de preguntas de este proyecto se construye a partir de (a) el texto de los tests de la revista DGT con atribución, y (b) preguntas propias con estilo fiel al examen real (ver estilo abajo). Nunca desde el simulador ni desde datasets de origen dudoso.

## 4. Estilo de redacción de las preguntas reales (para las preguntas propias)

- Tratamiento de usted, presente. Enunciados de 8–30 palabras.
- Moldes habituales:
  1. Sí/no con inciso: «El conductor de una motocicleta, ¿tiene permitido...?».
  2. Frase truncada con opciones que la completan.
  3. Deíctico apoyado en imagen: «En esta vía, ¿a qué velocidad...?».
  4. Situación + «¿qué debe hacer?».
- Opciones típicas: «Sí. / No. / Solo si...»; tríos numéricos cercanos (90/80/100 km/h).
- Trampas típicas: absolutos («únicamente», «siempre»), condición inventada plausible, confusión obligatorio/aconsejable, parada/estacionamiento.
- Ortografía: «Solo» sin tilde (grafía DGT), decimales con coma («1,6 milímetros»).
- La opción correcta se reparte entre las tres posiciones, sin patrón fijo.

## 5. Distribución temática (Anexo V.B.1, RD 818/2009)

16 materias de la prueba común — usar como columna `subject` (1-16) en el schema de preguntas:

1. Disposiciones legales (señalización, prioridad, velocidad)
2. Accidentes: factores y causas
3. Vigilancia y actitudes hacia otros usuarios
4. Percepción, tiempo de reacción, alcohol, drogas, fármacos, fatiga
5. Distancias de seguridad y de frenado, estabilidad
6. Riesgos según estado de la calzada y meteorología; túneles
7. La vía
8. Usuarios vulnerables
9. Riesgos según tipo de vehículo y visibilidad
10. Documentos administrativos
11. Comportamiento en caso de accidente y primeros auxilios
12. Carga y personas transportadas
13. Precauciones al abandonar el vehículo
14. Elementos mecánicos de seguridad
15. Equipos de seguridad (cinturón, reposacabezas, SRI)
16. Medio ambiente y conducción eficiente

No hay información oficial sobre cuántas preguntas de cada bloque entra en un examen concreto `[NV]`.
