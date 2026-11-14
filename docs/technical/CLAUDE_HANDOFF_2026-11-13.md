# EVALUXIA — DOCUMENTO DE TRANSFERENCIA TÉCNICA A CLAUDE
**Fecha de corte:** 13 de noviembre de 2026  
**Autor:** Antigravity (Google DeepMind Agent)  
**Destinatario:** Claude (Próximo Agente a cargo de la estabilización final)  
**Objetivo de la transferencia:** Proporcionar una radiografía técnica, empírica y rigurosa del estado real del sistema EvalUXIA para culminar las correcciones indispensables previo a las 20 evaluaciones académicas del Anexo B.

---

## 1. CONTEXTO GENERAL DEL PROYECTO

### 1.1 Qué es EvalUXIA
EvalUXIA es una plataforma integral de auditoría automatizada y asistida por inteligencia artificial que evalúa interfaces de usuario bajo dos dimensiones metodológicas:
1. **Usabilidad UX:** Las 10 heurísticas fundamentales de Jakob Nielsen (N-01 a N-10).
2. **Accesibilidad Digital:** Criterios seleccionados de las Pautas de Accesibilidad para el Contenido Web (WCAG 2.1 y 2.2, niveles A y AA).

### 1.2 Objetivo Funcional y Académico
El sistema combina análisis determinísticos de código/DOM (vía Playwright y selectores CSS/atributos ARIA) con capacidades de razonamiento multimodal y estructurado provistas por Modelos de Lenguaje Grande (LLMs, específicamente la familia Google Gemini). El objetivo de investigación académica es contrastar la calidad diagnóstica, solidez de evidencias, veracidad y reproducibilidad de las auditorías automatizadas frente a oráculos humanos y metodologías de referencia (Anexo B y Anexo C).

### 1.3 Arquitectura General y Tecnologías
- **Frontend:** SPA desarrollada en React 18, TypeScript, Tailwind CSS, Lucide Icons, Vite y Vitest para pruebas unitarias de UI.
- **Backend:** API REST desarrollada en Node.js, Express, TypeScript, Zod (validación estricta de esquemas), Mongoose / MongoDB (persistencia documental) y Playwright (automatización y telemetría de navegadores reales headless).
- **IA / LLM:** Integración mediante el SDK `@google/genai` (v1.3.0), configurado actualmente con el modelo `gemini-3.8-flash`.

### 1.4 Módulos Principales y Responsabilidades
- **Exploración Web (`AutomationService` / `EvaluationService`):** Orquesta la navegación paso a paso mediante un bucle de exploración (Fase 1) y posterior consolidación/auditoría (Fase 2).
- **Evaluación de Prototipos (`PrototypeEvaluationService`):** Proceso *one-shot* estático donde una imagen de diseño (PNG/JPG) es analizada visualmente por Gemini multimodal contra los 13 criterios aplicables a interfaces estáticas.
- **Motor Determinista (`RuleEngine` / `DeterministicAnalyzerService`):** Detecta violaciones estructurales directas (ausencia de `alt`, problemas de contraste cromático calculable, orden de encabezados, etc.) y ejecuta reglas de recuperación operativa en la navegación.
- **Motor de Auditoría y Métricas (`AuditEngineService`, `AuditMetricsService`, `PrototypeMetricsService`):** Consolida hallazgos, aplica filtros de protección metodológica (Gates), resuelve cardinalidad y calcula puntuaciones cuantitativas (0–100) y coberturas.

### 1.5 Flujos de Evaluación: Web vs Prototipos
| Dimensión | Flujo WEB | Flujo PROTOTIPOS |
| :--- | :--- | :--- |
| **Naturaleza** | Dinámica, interactiva, multi-página | Estática, *one-shot*, imagen única |
| **Criterios Evaluables** | Espacio fijo de 20 criterios (10 Nielsen + 10 WCAG) | 13 criterios aplicables (7 WCAG + 6 Nielsen; 6 fuera de cobertura) |
| **Fases** | Fase 1 (Exploración DOM en bucle) + Fase 2 (Auditoría global) | Fase única directa con Gemini multimodal |
| **Evidencia Base** | DOM interactivo, estilos computados, snapshots Playwright | Coordenadas visuales, regiones de pantalla, textos visibles |

### 1.6 Papel de Gemini y del Perfil Evaluador
- **Gemini:** Opera como motor de decisión táctico durante la exploración (Decision Engine en Fase 1) y como auditor analítico en la evaluación heurística y síntesis cualitativa (Fase 2 WEB y Prototipos).
- **Perfil Evaluador (`EvaluatorProfile`):** Define el arquetipo de persona usuaria (objetivo de navegación, limitaciones de accesibilidad, paciencia, tolerancia a la fricción) que guía las decisiones tácticas del modelo en la navegación interactiva.

---

## 2. ESTADO REAL DE LA ARQUITECTURA

A continuación se detallan las rutas absolutas y relativas del backend donde residen los componentes centrales auditados:

```
evaluxia_backend/
├── src/
│   ├── config/
│   │   └── env.ts                                           # Validación de variables de entorno y modelo Gemini por defecto
│   ├── infrastructure/
│   │   ├── database/mongodb.ts                              # Conexión persistente Mongoose
│   │   └── gemini/gemini.client.ts                          # Cliente oficial SDK @google/genai (v1.3.0)
│   ├── modules/
│   │   ├── ai/
│   │   │   ├── ai.service.ts                                # Decision Engine, prompts V2 y llamadas Gemini
│   │   │   ├── contracts/                                   # Schemas Zod: v2-decision, prototype, etc.
│   │   │   └── prompts/                                     # Definiciones de prompts base y arquetipos
│   │   ├── automation/
│   │   │   └── automation.service.ts                        # Sesión Playwright, getInteractiveElements(), snapshots
│   │   ├── evaluations/
│   │   │   ├── evaluation.service.ts                        # Orquestador del flujo WEB (Fase 1 bucle y Fase 2 llamada)
│   │   │   ├── services/
│   │   │   │   ├── rule-engine.service.ts                   # Reglas deterministas y Rule 0 (Recuperación)
│   │   │   │   ├── audit-engine.service.ts                  # Orquestador de Fase 2 WEB (Consolidación y Reporte)
│   │   │   │   ├── audit-metrics.service.ts                 # Cálculo determinista de métricas, scores y cumplimiento WEB
│   │   │   │   ├── prototype-evaluation.service.ts          # Orquestador del flujo de prototipos
│   │   │   │   ├── prototype-metrics.service.ts             # Cálculo de métricas sobre los 13 criterios de prototipo
│   │   │   │   ├── visual-evidence-gate.service.ts          # Gates V0, V1, V2, V4 y V5 para hallazgos visuales
│   │   │   │   ├── visual-evidence-consistency.service.ts   # Validación de consistencia de afirmaciones visuales
│   │   │   │   ├── evidence-gate.service.ts                 # Gates de evidencia WEB (antiespeculación, DOM)
│   │   │   │   └── deterministic-analyzer.service.ts        # Reglas WCAG directas (1.1.1, 1.4.3, 2.4.4, etc.)
│   │   │   ├── evaluation.model.ts                          # Modelo Mongoose IEvaluation
│   │   │   └── evaluation.repository.ts                     # Repositorio de evaluaciones
│   │   ├── findings/                                        # Modelo y repositorio de hallazgos persistidos
│   │   ├── reports/                                         # Modelo IReport y repositorio de reportes finales
│   │   └── ai-interactions/                                 # Telemetría de tokens, latencias y llamadas LLM
│   └── shared/
│       ├── infrastructure/metrics-tracker.ts                # Conteo y trazabilidad pre-MongoDB
│       └── testing/                                         # Utilidades de oráculo y taxonomía de señales
```

---

## 3. HISTORIAL DE LAS ÚLTIMAS MEJORAS IMPLEMENTADAS

### A. Rule 0 — Recuperación Segura de Acciones Fallidas
- **Comportamiento previo auditado:** Cuando una acción interactiva fallaba en Playwright (p. ej. timeout de 10 s al buscar un campo o botón), Rule 0 intentaba recuperar el flujo seleccionando ciegamente botones primarios genéricos (`.btn-primary`, `button[type="submit"]`) o buscando cualquier elemento que contuviera palabras como `"next"`, `"continue"` o `"submit"`. Esto generaba pulsaciones accidentales sobre botones destructivos o de pago ("Pagar ahora", "Eliminar cuenta", "Confirmar compra").
- **Comportamiento eliminado:** Se eliminó por completo el fallback a selectores genéricos de clase o tipo.
- **Reglas de equivalencia semántica incorporadas (`rule-engine.service.ts`):**
  - Se crearon las funciones privadas `extractFieldToken` y `extractNavigationTarget`.
  - Diferenciación estricta por tipo de interacción:
    1. Si falló `TYPE` / `CLEAR`: Solo se buscan campos `input` o `textarea` cuyo `id` o `name` comparta raíz léxica con el campo fallido.
    2. Si falló `CHECK` / `UNCHECK`: Solo se buscan controles `checkbox` o `switch` con correspondencia semántica.
    3. Si falló filtro (`CLICK` en filtro): Solo se buscan controles con atributos de filtro/categoría equivalentes.
    4. Si falló navegación: Solo se buscan enlaces o botones con el mismo destino semántico explícito, excluyendo de forma terminante palabras de riesgo: `"eliminar"`, `"delete"`, `"pagar"`, `"comprar"`, `"checkout"`.
- **Qué ocurre cuando no existe alternativa:** Rule 0 retorna de forma estricta y limpia `null`.
- **Intervención del Decision Engine:** Cuando `ruleEngine.evaluate()` devuelve `null`, `evaluation.service.ts` invoca `aiService.makeDecision(context)` inyectándole la directiva:
  `⚠️ BLOCKING ERROR IN LAST ACTION: "${blockingError}". Pick an alternative element or STOP_FLOW.`
- **Guarda contra reincidencia en selectores fallidos (`isRepeatingFailedSelector`):**
  En `evaluation.service.ts`, si Gemini insiste en proponer el selector exacto que acaba de fallar, el código intercepta la acción antes de enviarla a Playwright, desactiva `flowCanContinue` y finaliza la sesión sin reintentos ciegos.
- **Cuándo se ejecuta `STOP_FLOW`:**
  1. Si `consecutiveFailures >= 2` (límite estricto de reintentos).
  2. Si el fallo es catalogado como fatal o irrecuperable.
  3. Si la lista de alternativas seguras visibles en el DOM está vacía.
- **Pruebas de respaldo:** `src/modules/evaluations/tests/rule-engine-recovery.test.ts` (8/8 escenarios superados).

### B. N-08 — Calibración de Evaluación en Prototipos
- **Comportamiento previo en el prompt:** El prompt de prototipos exigía literalmente que el desorden visual fuera `"severe visual clutter"` para emitir un veredicto `FAIL`.
- **Modificación realizada (`src/modules/ai/ai.service.ts`):**
  - Se eliminó el requisito de gravedad `"severe"`.
  - Se alineó directamente con el criterio metodológico **CRI-33 del Anexo C** ("Diseño estético y minimalista"): evalúa si existen elementos visuales o informativos superfluos que compitan innecesariamente con el contenido principal.
- **Comportamientos esperados por estado:**
  - `FAIL`: Cuando existe desorden visual objetivo, elementos decorativos excesivos que distraigan o compitan con las tareas primarias, o redundancias injustificadas que obstruyan la comprensión.
  - `PASS`: Cuando la interfaz presenta una jerarquía clara, orden estructural y ausencia de ruido visual innecesario, aportando evidencia visual concreta.
  - `NOT_EVALUABLE`: Cuando la captura estática no permite evaluar la jerarquía visual con suficiente claridad.
- **Protecciones incorporadas contra falsos positivos:**
  - Una interfaz con alta densidad de datos (p. ej. tablas financieras o dashboards) **no** debe marcarse automáticamente como `FAIL` si preserva orden y jerarquía.
  - La presencia simultánea de `label` superior y `placeholder` de formato no constituye por sí sola una violación de N-08.
  - Se prohíbe explícitamente penalizar decisiones estéticas subjetivas o preferencias de diseño sin sustento objetivo.
- **Diferencia entre N-08 Prototipo y N-08 Web:** En Web (CRI-18), N-08 evalúa elementos dinámicos que compiten (banners emergentes, modales invasivos, elementos flotantes superpuestos en scroll). En Prototipo (CRI-33), la evaluación es puramente compositiva y espacial dentro del lienzo visible.
- **Pruebas de respaldo:** `src/modules/ai/tests/n08-calibration-prompt.test.ts` (7/7 escenarios superados).

---

## 4. PRUEBAS TÉCNICAS EJECUTADAS

A continuación se presenta la matriz completa de validación técnica ejecutada:

| Suite / Archivo de Pruebas | N.º Pruebas | Resultado | Alcance y Cobertura | Qué demuestra | Qué NO demuestra |
| :--- | :---: | :---: | :--- | :--- | :--- |
| **`rule-engine-recovery.test.ts`** | 8 | ✅ 8/8 PASS | Recuperación determinista de Rule 0 ante fallos de Playwright | Demuestra que Rule 0 no pulsa botones destructivos y retorna `null` o `STOP_FLOW` ante fallos sin alternativa segura. | No demuestra el comportamiento de Gemini en Fase 1 si Rule 0 delega la decisión devolviendo `null`. |
| **`n08-calibration-prompt.test.ts`** | 7 | ✅ 7/7 PASS | Textos de prompt para N-08 en Prototipos (CRI-33) y Web (CRI-18) | Demuestra que los prompts contienen las directrices calibradas y no exigen desorden "severe". | No demuestra la tasa empírica de fallos o aciertos que Gemini 3.8 emitirá ante imágenes no probadas. |
| **`contracts.test.ts`** | 28 | ✅ 28/28 PASS | Validación de contratos Zod, esquemas de entrada/salida y ContextBuilder | Demuestra consistencia de tipos y tolerancia a campos nulos u omitidos por el LLM. | No demuestra el comportamiento dinámico de red o fallos de conexión del SDK de Gemini. |
| **Backend Playwright (`run-playwright-tests.sh`)** | 22 suites | ✅ 22/22 PASS | Automatización con navegadores Chromium reales (modales, tabs, selectores) | Demuestra que el driver de Playwright y las rutinas de captura funcionan en el entorno local. | No garantiza la visibilidad de elementos fuera del viewport o con posicionamiento absoluto anómalo en sitios externos. |
| **Backend Regresión General** | 113 archivos | ✅ 113/113 PASS | Pruebas unitarias e integración de todos los módulos del backend | Demuestra integridad completa del backend (0 regresiones en suites existentes). | No sustituye las evaluaciones completas con el servidor web en ejecución interactiva. |
| **Frontend Vitest (`npm test -- --run`)** | 7 suites (50 tests) | ✅ 50/50 PASS | Componentes UI: Summary, Accordion, Notices, PrototypeForm, Hooks | Demuestra que la interfaz React renderiza correctamente los estados de auditoría y no colapsa ante datos parciales. | No demuestra la comunicación de red con el backend en tiempo real. |
| **TypeScript Typecheck (`tsc --noEmit`)** | 2 repos | ✅ 0 errores | Frontend y Backend completos | Demuestra coherencia estricta de tipos e interfaces en todo el código base. | No detecta errores lógicos en tiempo de ejecución o respuestas inesperadas del modelo. |

---

## 5. RESULTADOS DE LAS ÚLTIMAS PRUEBAS MANUALES

Se compararon dos rondas de pruebas reales ejecutadas con `gemini-3.8-flash`: la ronda anterior (previa a las correcciones) y la ronda posterior (tras las correcciones).

### 5.1 Evaluaciones de Prototipo (Misma Imagen)

> **Verificación empírica de capturas:**  
> Se verificó el hash criptográfico SHA-256 de los dos archivos físicos almacenados en `evaluxia_backend/uploads/prototypes/`:  
> - `prototype_b722dbed-7bfd-41d6-b3ad-c4e625e74111.jpg` (Evaluación anterior)  
> - `prototype_bf067812-e265-4c8f-9155-dd81032b3120.jpg` (Evaluación posterior)  
> **Resultado:** Ambos archivos son **100% idénticos byte a byte** (`SHA-256: 4f3a19a507dac24bd9a2b48dbb54255efb943b903e58406a93c98145d242e427`, 205.224 bytes).

| Parámetro | Prototipo Anterior | Prototipo Posterior | Análisis Comparativo |
| :--- | :--- | :--- | :--- |
| **Evaluation ID** | `6af65aa82a119bed787b8f10` | `6af78f42a00b92c0fb92a6fe` | Ejecuciones separadas en MongoDB |
| **Modelo** | `gemini-3.8-flash` | `gemini-3.8-flash` | Mismo modelo |
| **Criterios Aplicables / Evaluados** | 13 aplicables / 3 evaluados | 13 aplicables / 2 evaluados | Se redujo en 1 el número de evaluados |
| **Criterios NOT_EVALUABLE** | 10 | 11 | Aumentó en 1 por N-04 degradado |
| **Fuera de Cobertura** | 6 | 6 | Constante (definición metodológica) |
| **Desglose de Hallazgos** | 3 FAIL, 3 NOT_EVALUABLE | 1 FAIL, 1 PASS, 3 NOT_EVALUABLE | N-02 FAIL; WCAG 2.4.6 PASS; N-04 degradado |
| **Comportamiento N-04** | **FAIL** (Yakarta vs Londres) | **NOT_EVALUABLE** (Misma evidencia) | **Degradación determinista por Gate V0** |
| **Comportamiento N-02** | **FAIL** (Texto de relleno en latín) | **FAIL** (Texto de relleno en latín) | Consistente entre ambas corridas |
| **Comportamiento N-08** | **FAIL** (Redundancia label/placeholder) | **Omitido** (No figura en findings) | Calibración evitó el falso positivo |
| **Tiempo / Tokens / Costo** | 44.369 ms / 10.199 tok / $0,027596 USD | 45.031 ms / 10.096 tok / $0,030927 USD | Rendimiento y consumo estables |

### 5.2 Evaluaciones Web (`https://opencart-demo.smartfront.io/`)

| Parámetro | Web Anterior | Web Posterior | Análisis Comparativo |
| :--- | :--- | :--- | :--- |
| **Evaluation ID** | `6af65b502a119bed787b8f69` | `6af78ffba00b92c0fb92a770` | Misma URL objetivo |
| **Modelo** | `gemini-3.8-flash` | `gemini-3.8-flash` | Mismo modelo |
| **Criterios Evaluados** | 5 (4 PASS, 1 FAIL) | 8 (4 PASS, 4 FAIL) | **Aumento significativo de cobertura (25% → 40%)** |
| **Criterios NOT_EVALUABLE** | 15 | 12 | Se logró evaluar mayor número de criterios |
| **Iteraciones Ejecutadas** | 4 iteraciones | 7 iteraciones | Exploración un 75% más profunda |
| **Terminación** | `ACTION_FAILED` | `ACTION_FAILED` | Ambas interrumpidas por timeout de Playwright |
| **Tiempo / Tokens / Costo** | 88.692 ms / 92.617 tok / $0,109518 USD | 80.178 ms / 87.192 tok / $0,104311 USD | Mayor eficiencia relativa en la posterior |

---

## 6. INVESTIGACIÓN EXHAUSTIVA DE RIESGOS PENDIENTES

Esta sección contiene los hallazgos forenses derivados de la inspección directa del código y los registros de MongoDB:

### RIESGO 1: Recuperación Semántica Anómala en Web Posterior
- **Registro observado:**
  `Deterministic Rule (Semantic Recovery): Navigation to 'section' failed on previous selector. Attempting semantically equivalent alternative 'Sign in to leave a review'.`
- **Acción original:** En la iteración 4, Playwright intentó hacer clic en un enlace de producto:  
  `section:nth-of-type(1) > section > div > div > section > div > div > a:nth-of-type(1)` y falló por timeout de 10.000 ms.
- **Causa raíz descubierta en el código (`rule-engine.service.ts` líneas 490–501):**
  La función `extractNavigationTarget` utiliza la siguiente expresión regular:
  ```typescript
  const match = raw.match(/(?:navegar\s+a\s+|goto\s+|secci[oó]n\s+|tab\s+|enlace\s+|locator\(['"]?[#.]?|selector\s*['"]?[#.]?)([a-z0-9_-]+)/i);
  ```
  Al fallar Playwright, la descripción del error contenía: `locator('section:nth-of-type(1)...')`. La regex capturó el tag HTML `"section"` y lo consideró el **destino conceptual de navegación** (`navTarget = 'section'`).
- **Cómo se seleccionó la alternativa (líneas 452–454):**
  ```typescript
  const selectorMatches =
    elSelector.includes(targetLower) ||
    (targetLower.length >= 4 && elSelector.includes(targetStem));
  ```
  Como `targetLower` era `"section"`, el algoritmo buscó cualquier elemento en la página cuyo selector CSS contuviera la subcadena `"section"`. El enlace *"Sign in to leave a review"* tenía el selector `section > section > p > a`, por lo que `selectorMatches` retornó `true`.
- **Veredicto:** **No existe ninguna equivalencia semántica real.** La regla confundió el nombre de una etiqueta HTML con la intención semántica del usuario. Aunque el clic resultó físicamente exitoso en Playwright (avanzó a la iteración 5), la recuperación se produjo por una coincidencia accidental de selectores CSS.  
  *Acción requerida para Claude:* Depurar `extractNavigationTarget` para que ignore etiquetas HTML comunes (`section`, `div`, `span`, `p`, `a`, `button`) y solo extraiga identificadores de negocio genuinos.

---

### RIESGO 2: Degradación de N-04 en Prototipos (De FAIL a NOT_EVALUABLE)
- **Pregunta:** ¿Por qué la contradicción geográfica Yakarta vs Londres pasó de FAIL a NOT_EVALUABLE si la evidencia se conservó?
- **Hallazgo forense en MongoDB (`finding` en `6af78f42a00b92c0fb92a6fe`):**
  ```json
  {
    "heuristicCode": "N-04",
    "status": "NOT_EVALUABLE",
    "confidence": "low",
    "recommendation": null,
    "affectedElement": {
      "visualReference": {
        "description": "sección de mapa interactivo inferior y bloque Head Office",
        "region": "center"
      }
    },
    "evidence": [
      {
        "property": "visibleText",
        "value": "Jalan Cempaka Wangi No 22 Jakarta - Indonesia",
        "region": "middle-left"
      },
      {
        "property": "visibleText",
        "value": "lastminute.com London Eye Riverside Building...",
        "region": "bottom-left"
      }
    ]
  }
  ```
- **Causa raíz descubierta en `visual-evidence-gate.service.ts` (Gate Rule V0 parte 2, líneas 217–227):**
  ```typescript
  const ownRegion = finding.affectedElement?.visualReference?.region;
  const itemsWithRegion = evidence.filter((item) => !!item.region);
  if (ownRegion && itemsWithRegion.length > 0) {
    const anyAgrees =
      ownRegion === 'full-screen' ? true : itemsWithRegion.some((item) => item.region === ownRegion);
    if (!anyAgrees) {
      foreignEvidenceCount++;
      status = 'NOT_EVALUABLE';
      confidence = 'low';
    }
  }
  ```
- **Explicación:** Gemini identificó correctamente la contradicción y asignó `affectedElement.region: "center"`. Sin embargo, los dos ítems de evidencia estaban ubicados en `"middle-left"` (el bloque de texto) y `"bottom-left"` (el marcador del mapa). Al no coincidir `"center"` con ninguna de las regiones de las evidencias individuales, Gate Rule V0 clasificó la evidencia como "ajena" (`foreignEvidenceCount++`) y degradó automáticamente el hallazgo a `NOT_EVALUABLE`.  
  *Veredicto:* Gemini 3.8 Flash razonó correctamente, pero el gate determinista lo penalizó por un desajuste espacial en hallazgos que comparan múltiples regiones.

---

### RIESGO 3: Estado Real del Criterio N-08 en Prototipos
- **Pregunta:** ¿Se está evaluando N-08 o simplemente dejó de producir hallazgos?
- **Hallazgo:** En la corrida posterior, Gemini **no emitió ningún hallazgo para N-08** (ni FAIL ni PASS).
- **Causa en la arquitectura:**
  1. Al eliminarse la directiva restrictiva que antes generaba falsos positivos sobre duplicidad de labels/placeholders, Gemini consideró que la interfaz no violaba N-08.
  2. Debido a la regla de *Positive Compliance* (Gate V4), Gemini no puede emitir un `PASS` sin aportar evidencia estructurada explícita con propiedades observables. Al no emitirlo, el criterio quedó no mencionado.
  3. En `prototype-metrics.service.ts` (línea 99), los criterios que no reciben hallazgos se calculan como:
     `notEvaluableCriteria = applicable.length - evaluatedCriteria`.
- **Veredicto:** El criterio se evaluó conceptualmente, pero la ausencia de hallazgos se traduce matemáticamente en `NOT_EVALUABLE` en la cobertura. No existe un mecanismo en el prompt para obligar a Gemini a reportar un `PASS` justificado si no detecta infracciones.

---

### RIESGO 4: Discrepancia Numérica en Métricas Web (`failCount: 4` vs `metricsAudit.FAIL: 5`)
- **Pregunta:** ¿Por qué el reporte indica `failCount: 4` pero `metricsAudit.consolidatedByStatus.FAIL` indica `5`?
- **Causa raíz descubierta en `audit-metrics.service.ts`:**
  - `report.failCount` (líneas 636 y 698) cuenta la cantidad de **CRITERIOS ÚNICOS REPROBADOS** en la matriz fija de 20 criterios (`totalFail = nFail + wFail`). En esa ejecución reprobaron 4 criterios únicos.
  - `metricsAudit.consolidatedByStatus.FAIL` (y `report.totalFindings`) cuenta la cantidad de **DOCUMENTOS DE HALLAZGO INDIVIDUALES PERSISTIDOS** con estado `FAIL` en la colección `findings`. En esa ejecución existieron 5 hallazgos de falla (un criterio acumuló 2 fallas en distintos selectores).
- **Veredicto:** **No hay corrupción de datos ni cálculo erróneo.** Se trata de una distinción entre *Criterios Incumplidos* (4) y *Hallazgos Detectados* (5). Sin embargo, esto genera confusión visual en la UI si no se presentan con etiquetas diferenciadas.

---

### RIESGO 5: Exploración Web Interrumpida con `ACTION_FAILED`
- **Pregunta:** ¿Por qué ambas evaluaciones Web terminaron en `ACTION_FAILED`?
- **Hallazgo forense en `flowState` de la evaluación `6af78ffba00b92c0fb92a770`:**
  - En la iteración 6, Playwright falló al intentar clicar un botón de formulario (timeout de 10 s).
  - En la iteración 7, Gemini seleccionó el selector `div:nth-of-type(3) > div > a`.
  - Este elemento correspondía al enlace de accesibilidad:  
    `<a href="#main" class="sf-skip-link">Skip to main content</a>`.
  - El log interno de Playwright reportó:
    ```
    element is visible, enabled and stable -> scrolling into view if needed -> done scrolling -> element is outside of the viewport
    retrying click action... Timeout 10000ms exceeded.
    ```
  - Los enlaces de salto de contenido (*Skip links*) están típicamente posicionados fuera de la pantalla (p. ej. `top: -9999px`) y solo se hacen visibles al recibir el foco mediante teclado. Playwright intentó hacerle scroll y clic como si fuera un elemento estándar en pantalla y falló por timeout.
  - Al acumular 2 fallos consecutivos (iteración 6 e iteración 7), Rule 0 activó `consecutiveFailures >= 2` y terminó ordenadamente el flujo con `terminationReason: 'ACTION_FAILED'`.
- **Veredicto:** La causa raíz son enlaces ocultos fuera de la pantalla (*Skip links*) que son reportados como interactuables en `getInteractiveElements()` a pesar de no estar en el área visible.

---

## 7. ESTADO DE GIT

### 7.1 Repositorio Backend (`evaluxia_backend`)
- **Rama actual:** `feature/v2-architecture-optimizations` (actualizada con `origin`).
- **Archivos modificados (rastreados por git):**
  - `.env.example`, `.gitignore`, `docker-compose.yml`, `src/config/env.ts`
  - `src/infrastructure/gemini/gemini.client.ts`
  - `src/modules/ai-interactions/ai-interaction.model.ts`, `ai-interaction.service.ts`
  - `src/modules/ai/ai.service.ts` *(Calibración N-08)*
  - `src/modules/automation/automation.service.ts`
  - `src/modules/evaluations/evaluation.service.ts`
  - `src/modules/evaluations/services/audit-engine.service.ts`, `audit-metrics.service.ts`, `evidence-gate.service.ts`, `prototype-evaluation.service.ts`
  - `src/modules/evaluations/services/rule-engine.service.ts` *(Rule 0 semántica)*
  - Tests unitarios de gates y modelos de reporte en `src/modules/evaluations/tests/` y `src/shared/testing/tests/`
- **Archivos nuevos sin seguimiento (untracked):**
  - `src/modules/ai/tests/n08-calibration-prompt.test.ts`
  - `src/modules/evaluations/tests/rule-engine-recovery.test.ts`
  - Scripts auxiliares de inspección en `src/modules/evaluations/tests/inspect_*.ts`
- **Confirmación:** Durante esta auditoría **no se alteró ningún archivo de código** ni se ejecutaron commits.

### 7.2 Repositorio Frontend (`evaluxia`)
- **Rama actual:** `feature/structure` (adelantada por 2 commits locales frente a `origin`).
- **Archivos modificados:** Componentes y hooks de evaluaciones (`EvaluationSummary.tsx`, `FindingsAccordion.tsx`, `useEvaluations.ts`, `EvaluateWebPage.tsx`, etc.).
- **Archivos sin seguimiento:** Documentos markdown de análisis y componentes de prototipos previamente desarrollados (`PrototypeEvaluationForm.tsx`, `IncompleteExplorationNotice.tsx`).
- **Confirmación:** El frontend se encuentra en estado limpio y estable (0 errores de TypeScript y 50/50 tests pasando).

---

## 8. RECOMENDACIÓN DE CONTINUIDAD PARA CLAUDE

A continuación se priorizan las intervenciones necesarias para estabilizar EvalUXIA antes de las evaluaciones académicas:

### Nivel 1: Correcciones Bloqueantes (Imprescindibles antes de iniciar)
1. **Sanitización de `extractNavigationTarget` en Rule 0 (`rule-engine.service.ts`):**  
   Excluir nombres de etiquetas HTML (`section`, `div`, `nav`, `header`, `footer`, `a`, `button`, `span`) de la captura de destino de navegación para impedir recuperaciones semánticamente falsas como la ocurrida con *"Sign in to leave a review"*.
2. **Filtrado de Skip Links y Elementos Off-Screen en `getInteractiveElements()` (`automation.service.ts`):**  
   Verificar no solo que el elemento exista y tenga dimensiones positivas, sino que sus coordenadas calculadas (`getBoundingClientRect`) se encuentren dentro del viewport real o descartar selectores con clases conocidas de salto accesible (`.sf-skip-link`, `a[href^="#"]` ocultos) para evitar el agotamiento de timeouts de 10 s.
3. **Ajuste de Gate V0 en Prototipos para Evaluaciones Multirregionales (`visual-evidence-gate.service.ts`):**  
   Permitir que un hallazgo comparativo (como N-04 que contrasta dos regiones) declare `region: "full-screen"` o que el gate acepte el hallazgo si sus ítems de evidencia son consistentes entre sí, impidiendo que la contradicción Yakarta/Londres sea degradada a `NOT_EVALUABLE`.

### Nivel 2: Importantes no Bloqueantes (Atendibles con bajo riesgo)
1. **Clarificación visual de Métricas en el Reporte:**  
   Etiquetar en la interfaz y en el JSON del reporte la diferencia entre `Criterios Fallidos` (4) y `Hallazgos de Incumplimiento` (5) para evitar confusión en la lectura del informe.
2. **Directiva de Evaluación Positiva para N-08 en el Prompt de Prototipos:**  
   Instruir a Gemini para que, si el prototipo presenta un diseño estético y minimalista ejemplar sin saturación visual, emita explícitamente un veredicto `PASS` respaldado por evidencia estructurada para que compute en la cobertura.

### Nivel 3: Mejoras Pospuestas (No tocar para no desestabilizar el MVP)
1. **Arquitectura Híbrida de Modelos:** No intentar alternar entre Gemini Flash-Lite en Fase 1 y Flash en Fase 2 en este momento; mantener `gemini-3.8-flash` global.
2. **Reescritura de Pipelines de Persistencia:** Mantener intacta la lógica de Mongoose y colecciones de MongoDB ya probada.

---

## 9. INSTRUCCIONES EXPLÍCITAS PARA CLAUDE

Si eres Claude y estás leyendo este documento para continuar la labor, procede en el siguiente orden estricto:

### Paso 1: Lectura Obligatoria de Archivos Clave
Antes de tocar una sola línea de código, lee estos archivos en este orden:
1. `docs/technical/CLAUDE_HANDOFF_2026-11-13.md` (este documento).
2. `evaluxia_backend/src/modules/evaluations/services/rule-engine.service.ts` (específicamente líneas 410–502).
3. `evaluxia_backend/src/modules/automation/automation.service.ts` (método `getInteractiveElements`).
4. `evaluxia_backend/src/modules/evaluations/services/visual-evidence-gate.service.ts` (Gate Rule V0, líneas 215–228).

### Paso 2: Ejecución de Pruebas de Línea Base
Ejecuta las siguientes pruebas para cerciorarte de que partes de un entorno 100% verde:
```bash
# En evaluxia_backend:
npm run lint
npm test
npx ts-node -r tsconfig-paths/register src/modules/evaluations/tests/rule-engine-recovery.test.ts
npx ts-node -r tsconfig-paths/register src/modules/ai/tests/n08-calibration-prompt.test.ts

# En evaluxia (frontend):
npm test -- --run
npx tsc --noEmit
```

### Paso 3: Resolución de los Bloqueantes
1. Modifica `extractNavigationTarget` en `rule-engine.service.ts` para que nunca retorne nombres de etiquetas HTML como destino semántico. Agrega una prueba unitaria en `rule-engine-recovery.test.ts` que demuestre que un fallo en un selector que contiene `section` no intenta navegar a `"Sign in to leave a review"`.
2. Corrige el filtrado en `automation.service.ts` para omitir enlaces con clase `.sf-skip-link` o enlaces fuera de pantalla en la lista de elementos interactivos visibles.
3. Ajusta Gate Rule V0 en `visual-evidence-gate.service.ts` para que hallazgos con evidencias en múltiples regiones no sean degradados falsamente si `ownRegion` abarca el contexto general.

### Paso 4: Criterio de Aceptación para Autorizar las 20 Evaluaciones
EvalUXIA estará formalmente lista para las 20 evaluaciones académicas cuando:
- Todas las pruebas unitarias y de integración sigan pasando (113/113 en backend y 7/7 en frontend).
- Una prueba de prototipo con la imagen de ContactPage conserve el veredicto `FAIL` en N-04 sin degradarlo.
- Una prueba de exploración en OpenCart no intente hacer clic en enlaces Skip Link y complete al menos 5 iteraciones limpias sin `ACTION_FAILED` prematuro.

