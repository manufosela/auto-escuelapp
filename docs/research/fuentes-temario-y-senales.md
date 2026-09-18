# Fuentes de contenido: temario y señales

Investigación realizada el 2026-09-18. `[V]` = verificado abriendo la fuente ese día. `[NV]` = no verificado en fuente oficial.

## 1. Temario

No existe un manual oficial de la DGT con licencia libre. El único manual gratuito de la DGT (Lectura Fácil) está basado en contenido de ETRASA con copyright y remite a CEDRO — **no reutilizable**, solo enlazable.

**Base usable para redactar el temario propio**: el Anexo V.B.1 del RD 818/2009 (texto legal, no sujeto a propiedad intelectual según el art. 13 LPI). Ver `docs/research/formato-examen-y-preguntas.md` para las 16 materias.

**Fuente de la normativa**: API de datos abiertos del BOE, `https://www.boe.es/datosabiertos/api/legislacion-consolidada/id/{ID}/...`. Normas base:

| Norma | ID BOE |
|---|---|
| Ley sobre Tráfico | BOE-A-2015-11722 |
| Reglamento General de Circulación | BOE-A-2003-23514 |
| Reglamento General de Conductores | BOE-A-2009-9481 |
| Reglamento General de Vehículos | BOE-A-1999-1826 |
| Catálogo de señales (RD 465/2025) | BOE-A-2025-12199 |
| RD 518/2026 (usuarios vulnerables, vigente 01/10/2026) | BOE-A-2026-13889 |

Licencia BOE (aviso legal, https://www.boe.es/informacion/aviso_legal/index.php): permite reutilización comercial y no comercial, incluidas obras derivadas, citando: *«Basado en datos de la Agencia Estatal Boletín Oficial del Estado»* + enlace + fecha de última actualización + aviso de que es «texto consolidado de carácter meramente informativo».

**Prohibido**: copiar temario de manuales o webs comerciales de autoescuela (Matfer, Etrasa, AEOL, CNAE, Pons, etc.) — tienen copyright activo. El libro escaneado de referencia de este proyecto (Ediciones Matfer, catálogo de señales de la autoescuela San Cristóbal) se usa **solo en local, fuera del repo**, para detectar huecos de contenido — ver AUT-TSK-0008.

## 2. Señales de tráfico

- **Catálogo vigente**: RD 465/2025, en vigor desde el 01/07/2025 (BOE-A-2025-12199). Nomenclatura: `P-` peligro, `R-` reglamentación (prioridad, prohibición, obligación...), `S-` indicación.
- **Imágenes libres**: Wikimedia Commons, categoría `Category:SVG road signs in Spain` y subcategorías (warning/prohibitory/mandatory/priority/indication/service/temporary/additional). Predomina licencia dominio público (plantilla PD Spain government, art. 13 LPI) y CC0; algunas señales solo están en CC BY-SA (exige atribución). **Cada SVG se descarga con su licencia y autor vía la API `extmetadata`** y se registra en `ATTRIBUTIONS.md` — ver AUT-TSK-0006.
- **Alternativa para señales que falten**: pictogramas vectoriales oficiales del Ministerio de Transportes en formato DXF (`normativa-tecnica/equipamiento-vial`), sin licencia explícita pero basados en la disposición reglamentaria; redibujar a SVG.
- Marcas viales y señales de agentes: poca cobertura en Commons; puede requerir ilustración propia siguiendo el anexo del BOE.

## 3. Licencias — resumen operativo

| Se puede copiar literal | Solo enlazar | Redactar con palabras propias |
|---|---|---|
| Texto de leyes y reglamentos del BOE (con cita y aviso de texto consolidado) | dgt.es, simulador de examen, infografías y fotos de la revista DGT, manuales de autoescuela | Explicaciones del temario, preguntas propias, mecánica, primeros auxilios |
| Texto de los tests de revista.dgt.es (sin imágenes) citando la fuente | Vídeos oficiales de la DGT | — |
| SVG de Wikimedia Commons, respetando la licencia de cada fichero | — | — |

Cita literal del aviso legal de dgt.es: *«La reproducción, distribución, comercialización o transformación no autorizadas de dichas obras, a no ser que sea para uso personal y privado, constituye una infracción de los derechos de propiedad intelectual»*. Por eso el simulador y las páginas de dgt.es no se reproducen, solo se enlazan.

El pie de la app y el «Acerca de» deben dejar claro que **no es un proyecto oficial** y que no hay afiliación con la DGT ni con el BOE.
