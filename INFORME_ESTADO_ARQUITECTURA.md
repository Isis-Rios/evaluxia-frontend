# Informe de Estado y Arquitectura — EvalUXIA

**Fecha de auditoría:** 2026-09-15
**Repositorios auditados:**
- Frontend: `evaluxia` (React 19 + TypeScript + Vite) — `/Users/isisrios/Proyectos/React/evaluxia`
- Backend: `evaluxia_backend` (Node.js + Express 5 + TypeScript) — `/Users/isisrios/Proyectos/Node/evaluxia_backend`

---

## 1. Arquitectura del Sistema

EvalUXIA sigue una arquitectura cliente-servidor desacoplada, con un pipeline de evaluación asíncrono de dos fases orquestado enteramente en el backend.

### 1.1 Componentes y su rol

- **Frontend (React 19 + TS + Vite)**: SPA en capas `Página → Hook → Servicio (axios) → Backend`. Gestiona sesión (JWT) con Redux Toolkit + redux-persist, formularios con react-hook-form + Yup, y UI con MUI v7 + Tailwind. No contiene lógica de negocio ni llamadas directas a IA: es un consumidor puro de la API REST.
- **Backend (Node/Express 5)**: expone la API REST bajo `/api/v1` y concentra toda la lógica del dominio: autenticación, gestión de perfiles evaluadores (personas UX simuladas), y el motor de evaluación.
- **Playwright (Chromium headless)**: motor de automatización web. Navega el sitio objetivo, extrae snapshots estructurados del DOM (headings, imágenes, enlaces, botones, formularios, landmarks ARIA, estilos computados para contraste), toma capturas de pantalla y ejecuta acciones (click, type, select, etc.) para simular la navegación de un usuario real.
- **Google Gemini (`@google/genai` SDK)**: único proveedor LLM integrado (no hay OpenAI ni otro). Se invoca en dos momentos distintos del pipeline (ver 1.2), nunca en el frontend.
- **MongoDB (Mongoose)**: persistencia de usuarios, perfiles evaluadores, evaluaciones, evidencia por iteración (`SnapshotEvidence`), hallazgos (`Finding`), reportes consolidados (`Report`) y bitácora de interacciones con IA (`AiInteraction`, para trazabilidad de tokens/costo).

### 1.2 Flujo de información (pipeline de dos fases)

1. El usuario crea una evaluación desde el frontend (`POST /api/v1/evaluations` con `title` + `url` + perfil evaluador activo). El backend responde `202` de inmediato y encola un job en memoria (`job-runner.ts`, un `setImmediate` explícitamente documentado como placeholder de MVP para una futura migración a BullMQ).
2. **Fase 1 — Exploración en vivo (Playwright + Gemini como "piloto")**: en un bucle acotado dinámicamente (3–8 iteraciones, calculado según densidad de elementos interactivos), el backend abre una sesión Playwright aislada, extrae el snapshot del DOM, y decide la siguiente acción. Esta decisión pasa primero por un **motor de reglas determinístico** (`rule-engine.service.ts`) que resuelve los casos obvios sin gastar tokens (único botón habilitado, patrón "type→submit", detección de bucles); solo si el motor de reglas no puede decidir, se invoca a Gemini (`makeDecision`) para elegir la acción. Cada acción se ejecuta realmente en el navegador y se registra (éxito/fallo, capturas, evidencia) en MongoDB.
3. **Fase 2 — Auditoría especializada (asíncrona, tras cerrar la sesión Playwright)**: se recopila toda la evidencia capturada, se aplican verificaciones **determinísticas puras** (fórmula real de contraste WCAG 1.4.3 sobre luminancia sRGB, alt-text, nombre accesible, propósito de enlaces, ausencia de `<h1>`), se deduplica y prioriza la evidencia, y se envía a Gemini con un prompt que evalúa explícitamente las 10 heurísticas de Nielsen y 7 criterios WCAG 2.2. Un componente propio, el **"Evidence Gate"** (`evidence-gate.service.ts`), aplica la regla "sin evidencia no hay FAIL": degrada a `NOT_EVALUABLE` cualquier hallazgo cuyo selector no sea trazable a la evidencia realmente enviada a Gemini, o que use lenguaje especulativo, o tenga baja confianza. El score final es **100% calculado por el backend** (determinístico); el score que pudiera devolver Gemini se ignora explícitamente.
4. El frontend hace *polling* (sin WebSockets/SSE) sobre `GET /evaluations/:id` hasta que `status` (Fase 1) y `auditStatus` (Fase 2) terminan, y luego consulta en paralelo `findings`, `reports` y `snapshots` para renderizar hallazgos, timeline de iteraciones (con capturas reales) y panel de costos/tokens de IA.

### 1.3 Diagrama textual del flujo

```
[Usuario] → [Frontend React] --POST /evaluations--> [Backend Express]
                                                          │
                                                   [Job en memoria]
                                                          │
                                       ┌──────────────────┴──────────────────┐
                                       │ FASE 1: Exploración (Playwright)     │
                                       │  RuleEngine → (si no decide) Gemini  │
                                       │  ejecuta acción → snapshot → Mongo   │
                                       └──────────────────┬──────────────────┘
                                                          │ (bucle 3-8 iter.)
                                       ┌──────────────────┴──────────────────┐
                                       │ FASE 2: Auditoría (async)            │
                                       │  Análisis determinístico (contraste, │
                                       │  alt-text, etc.) + Gemini (Nielsen/  │
                                       │  WCAG) + Evidence Gate               │
                                       └──────────────────┬──────────────────┘
                                                          │
                                              [Finding / Report en Mongo]
                                                          │
[Frontend] <--polling GET /evaluations/:id-- [Backend] <-┘
[Frontend] --GET findings/reports/snapshots--> [Backend] → [MongoDB]
```

---

## 2. Alcance Técnico Actual (Delimitación del MVP)

### 2.1 Qué SÍ hace el sistema hoy (verificado en código)

- **Autenticación real** con JWT (access/refresh), registro/login/logout, hash de contraseñas con bcrypt.
- **Gestión de perfiles evaluadores** (personas UX simuladas: arquetipo, necesidades de accesibilidad, dispositivo preferido, objetivos/frustraciones) que alimentan el contexto enviado a Gemini.
- **Evaluación automática de sitios web públicos por URL**, con:
  - Navegación real y autónoma vía Playwright, con motor de reglas determinístico + decisión por IA cuando es necesario.
  - Extracción estructurada del DOM: headings, imágenes, enlaces, formularios (con resolución de labels), landmarks ARIA, estilos computados, árbol de accesibilidad nativo de Playwright.
  - Verificación **determinística real** de contraste de color (fórmula W3C de luminancia relativa), alt-text de imágenes, nombre accesible de botones/enlaces y presencia de `<h1>`.
  - Auditoría especializada por IA contra **10 heurísticas de Nielsen y 7 criterios WCAG 2.2** (1.1.1, 1.3.1, 1.4.3, 2.1.1, 2.4.4, 3.3.2, 4.1.2), con mecanismo anti-alucinación ("Evidence Gate": sin evidencia trazable no hay FAIL).
  - Persistencia completa de evidencia por iteración (capturas de pantalla, snapshots DOM) y de hallazgos con severidad/status/confianza.
  - Reporte consolidado con score determinístico, % de cumplimiento por dominio (Nielsen/WCAG), cobertura de auditoría, y **panel de consumo de IA** (modelo, tokens, costo estimado en USD, costo acumulado histórico).
  - Protección SSRF real (bloqueo de rangos IP privados/metadata cloud, re-verificado en cada redirección) — relevante para exponer el sistema a URLs arbitrarias de terceros con seguridad.
  - Manejo endurecido de estructuras DOM complejas: existen fixtures y pruebas dedicadas para **acordeones, tabs con contenido inactivo, dropdowns por hover y modales** (distinción explícita entre "presente en el DOM" y "visible"), además de pruebas de estrés para DOM profundamente anidado y con muchos estilos computados. No se encontró un fixture específico para *sliders/carruseles* — es una brecha identificada, no una funcionalidad ya cubierta.
- **Historial de evaluaciones** paginado en el frontend con detalle expandible por evaluación.

### 2.2 Qué queda explícitamente FUERA del alcance de este MVP

- **Evaluación de prototipos por imagen**: NO implementada. Existe únicamente un valor de enum reservado (`type: 'prototype' | 'website'`) tanto en el modelo de MongoDB como en el DTO Zod del backend, pero el flujo de creación de evaluación **exige una URL válida sin importar el `type`** — no hay endpoint de carga de archivos (no hay `multer` ni middleware de upload), no hay integración de visión/multimodal con Gemini, y en el frontend la tarjeta "Evaluar prototipo" está deshabilitada (`active:false`, badge "Próximamente"). Es, en el mejor de los casos, un placeholder de UI + un campo de esquema reservado para el futuro.
- **Pruebas de usabilidad con usuarios reales (escala SUS)**: NO existe ningún rastro en el código (ni frontend ni backend) de un módulo de encuestas, cuestionario SUS, ni captura de puntuaciones de usabilidad humanas. La "evaluación de usabilidad" actual del sistema es enteramente automática (Playwright + IA), no un instrumento administrado a usuarios.
- **Ejecución de "flujos" guiados por descripción textual libre** (`/evaluate/flow` en el frontend): también deshabilitada (`active:false`), aunque el backend ya modela parcialmente `flowDefinition`/`flowState` como reutilización del motor de exploración de Fase 1.
- **Cola de trabajos distribuida real**: el "job runner" actual es en memoria (`setImmediate`), documentado explícitamente en el propio código como solución temporal de MVP a reemplazar por BullMQ u otra cola distribuida antes de escalar a múltiples instancias/usuarios concurrentes.
- **Refresh automático de token en el frontend**: interceptor con TODO explícito, no implementado (actualmente el usuario debe reautenticarse tras expirar el access token).
- **CI/CD y despliegue en la nube**: no hay pipeline de integración continua ni configuración para Vercel/Render/Railway/AWS; el despliegue actual es vía Docker/docker-compose local/self-hosted.

---

## 3. Rastro de Metodología de Desarrollo

El código evidencia, de forma directa y citable, un desarrollo iterativo e incremental por fases — un insumo metodológico sólido para la tesis:

### 3.1 Nomenclatura explícita de fases/etapas en commits y comentarios

El historial de git y los comentarios de código usan consistentemente una nomenclatura de fases:
`Add initial layouts → Refactor modelos según análisis → auth JWT real → perfiles evaluadores → motor de evaluación v2 → pipeline de auditoría 3A–3D → visualización de evidencia/métricas (3E) → timeline de simulación (3F) → "Stage 2 + Phase A" → "Phase C.1"`.

En el backend, esta nomenclatura se profundiza con un ciclo completo de "hardening" posterior, con sub-fases rotuladas explícitamente en el código y respaldadas por baterías de pruebas dedicadas:
- **Fase C** (t2–t7): deduplicación de evidencia, costo de selectores.
- **Fase D** (d1–d3): aislamiento de señales de automatización, trazabilidad de selectores.
- **Fase E** (e1–e4): fixtures de widgets complejos (modal, acordeón, tabs, dropdown).
- **Fase F** (f1–f8): pruebas de estrés/escalamiento.
- **Fase G** (g1–g7): comportamiento de Gemini (acuerdo, contradicción, alucinación, abstención, reintentos, presupuesto crítico).
- **Fase H**: validación con Gemini real (no mockeado) contra 6 fixtures curados (`h-fixtures-manifest.ts`), cada uno documentando explícitamente qué brecha específica busca cerrar (p. ej. "¿Gemini se abstiene honestamente o fabrica un dato que nunca capturamos?").
- **Post-Fase H ("Hardening")**: sub-iteraciones **J1** (gate de trazabilidad selector→evidencia), **J2** (bloqueo de llamadas a Gemini por presupuesto de payload crítico), **J3** (consistencia de conteo de tokens), **J4** (ampliación del pool de estilos computados evaluados), cada una con su propio archivo de test de regresión.

### 3.2 Evidencia de estabilización activa

- Bloques de código explícitamente marcados como **"TEMPORARY diagnostic instrumentation"**, fechados (p. ej. "2026-09-10 payload/quota audit") y declarados "meant to be removed once the audit is complete" — documentan un esfuerzo de depuración/optimización en curso al momento de esta auditoría, consistente con la fase de estabilización que describes.
- Un bug real documentado y corregido: selectores CSS "ingenuos" que colisionaban entre 5 elementos `<a>` distintos, resuelto con un algoritmo de verificación de unicidad (`getCssSelector` valida con `querySelectorAll` que el selector generado matchee exactamente 1 elemento).
- Un archivo `.bak` (`audit-metrics.service.ts.bak`) dejado como rastro de un refactor in-place (versión anterior sin la normalización canónica de códigos WCAG/Nielsen usada hoy para deduplicar hallazgos).
- Comentarios de fixes puntuales con nomenclatura de prioridad tipo ticket: `P-02` (paso de error bloqueante al contexto de IA), `P0-3` (fuga de polling tras desmontaje de componente en el frontend, con test de regresión dedicado).
- Campos deprecados mantenidos explícitamente por compatibilidad (`Finding.heuristic`, comentado como "legacy field").

### 3.3 Separación de responsabilidades como decisión de diseño documentada

Tanto frontend como backend documentan explícitamente en comentarios el patrón de capas elegido:
- Backend: `controller → service → repository → model`, por módulo de dominio (auth, evaluations, findings, reports, snapshots, evaluator-profiles), con DTOs Zod como única fuente de verdad de validación.
- Frontend: `página → hook (orquestación) → servicio (HTTP puro) → apiClient`, con comentarios explícitos justificando la separación (SRP) y patrones DRY (p. ej. sincronización de perfil activo vía Redux para evitar llamadas HTTP duplicadas entre `Topbar` y las páginas).

### 3.4 Código legado convive con el activo (reemplazo, no eliminación)

Múltiples componentes/prompts "V1" conviven con su reemplazo "V2" activo (p. ej. `analyzeUx`/`buildUxAnalysisPrompt` marcado "[V1 Legacy]" junto al pipeline V2 de decisión/auditoría; un `EvaluationForm.tsx` genérico huérfano junto al simplificado realmente usado; un `AgentPanel.tsx` de chat completo pero no cableado, con comentario explícito "oculto (futura integración)"). Esto es evidencia de iteración por sustitución progresiva, no de reescrituras desde cero.

---

## 4. Stack Tecnológico y Recursos

### 4.1 Frontend (`evaluxia`)

| Categoría | Tecnología | Versión |
|---|---|---|
| Framework UI | React / React DOM | ^19.1.0 |
| Enrutamiento | React Router DOM | ^7.6.2 |
| Componentes UI | MUI (Material/Icons) + Emotion | ^7.1.x / ^11.14 |
| Utilidades CSS | Tailwind CSS | ^4.1.10 |
| Estado global | Redux Toolkit + React-Redux + redux-persist | ^2.8/^9.2/^6.0 |
| Formularios | react-hook-form + Yup + @hookform/resolvers | ^7.58/^1.6/^5.1 |
| HTTP | axios | ^1.17.0 |
| Animaciones (declaradas, sin uso activo confirmado) | framer-motion, lottie-react | ^12.18/^2.4 |
| Build/dev | Vite + @vitejs/plugin-react | ^6.3.5/^4.4.1 |
| Lenguaje | TypeScript | ~5.8.3 |
| Testing | Vitest + jsdom + Testing Library | ^5.0/^30/^16.3 |
| Linting | ESLint + typescript-eslint | — |

### 4.2 Backend (`evaluxia_backend`)

| Categoría | Tecnología | Versión |
|---|---|---|
| Framework web | Express | ^5.1.0 |
| Automatización web | Playwright (Chromium headless) | ^1.60.0 |
| IA / LLM | @google/genai (Gemini) | ^1.3.0 |
| Base de datos | MongoDB + Mongoose (ODM) | ^8.0.0 |
| Validación | Zod | ^3.23.8 |
| Autenticación | jsonwebtoken + bcryptjs | ^9.0.3/^3.0.3 |
| Seguridad HTTP | helmet, cors | ^8.0.0/^2.8.5 |
| Logging | morgan (custom middleware) | ^1.10.0 |
| Lenguaje | TypeScript + ts-node-dev | ^5.8.3 |
| Config | dotenv + validación Zod al arranque | ^17.2.3 |

### 4.3 APIs y servicios externos

- **Google Gemini API** (vía `@google/genai`): modelo por defecto `gemini-2.5-flash` (configurable por variable de entorno `GEMINI_MODEL`); requiere `GEMINI_API_KEY`. Tarifas por token registradas en el propio código para cálculo de costo ($0.30/$2.50 por millón de tokens entrada/salida para `gemini-2.5-flash`).
- **Google Fonts** (Quicksand): dependencia de red en runtime del frontend.

### 4.4 Infraestructura / despliegue

- **Docker** (multi-stage: build TS → runtime `node:20-slim` con Playwright/Chromium instalado, usuario no-root).
- **docker-compose** para entorno de desarrollo: servicios `api`, `mongo:7` (con healthcheck), `mongo-express` (UI de administración de BD).
- Sin CI/CD configurado (no hay `.github/workflows`); sin configuración de nube (Vercel/Render/AWS) — despliegue actual manual/self-hosted.
- Colección Postman (`EvalUXIA_Demo_v2.postman_collection.json`) documentando la superficie de API como referencia de demo.

### 4.5 Recursos de hardware/software necesarios para operar el sistema

- Servidor con soporte para **Chromium headless vía Playwright** (requiere las dependencias de sistema instaladas por `playwright install --with-deps`), con RAM suficiente para sesiones de navegador concurrentes.
- Instancia de **MongoDB** (local vía Docker en desarrollo, o Atlas/gestionado en producción).
- **API key de Google AI Studio (Gemini)** con cuota/presupuesto vigente — el propio backend implementa un circuit-breaker de presupuesto de payload para evitar llamadas que agoten la cuota.
- Node.js 20 (según Dockerfile) tanto para frontend (build) como backend (runtime).

---

## 5. Hoja de Ruta Técnica (Roadmap a 6 meses)

Se plantea en 4 hitos secuenciales, alineados con el orden que ya definiste (estabilización URL → prototipos por imagen → integración → pruebas de usabilidad SUS).

### Hito 1 — Estabilización del módulo de evaluación por URL (Mes 1–1.5)
- Cerrar la brecha identificada de estructuras DOM complejas sin cobertura: **agregar fixtures y pruebas dedicadas para sliders/carruseles** (siguiendo el mismo patrón ya usado para acordeón/tabs/dropdown/modal en `src/shared/testing/`), y para otros patrones ARIA comunes no cubiertos aún (p. ej. combobox, tooltips, disclosure widgets anidados).
- Completar el ciclo de "hardening" en curso: retirar la instrumentación de diagnóstico marcada como temporal una vez cerrado el audit de payload/cuota de Gemini (J1–J4), y consolidar sus hallazgos en documentación permanente para la tesis.
- Formalizar el test runner: migrar la actual colección de ~61 scripts `*.test.ts` (ejecutados manualmente vía `ts-node`) a un framework estándar (Vitest/Jest) con un comando único `npm test` que corra toda la suite y produzca un reporte de cobertura — esto es también evidencia metodológica valiosa para la tesis (trazabilidad de calidad).
- Cerrar TODOs pendientes de autenticación (refresh automático de token en el frontend) para que la estabilización no quede acoplada a sesiones cortas durante las pruebas.

### Hito 2 — Módulo de evaluación de prototipos por imagen (Mes 1.5–3.5)
- Definir el contrato de datos: endpoint de carga (`multer` o equivalente) para imágenes de prototipo, con almacenamiento (local `/uploads` o bucket externo) y validación de tipo/tamaño.
- Diseñar el pipeline de análisis visual: dado que Gemini soporta entrada multimodal, evaluar el uso de `@google/genai` con contenido de imagen (en vez de solo texto/JSON como hoy) para heurísticas de UX visual (jerarquía, contraste, affordance de elementos, consistencia) — esto reutiliza el mismo modelo de "Evidence Gate" (no aceptar hallazgos sin evidencia visual trazable a la imagen enviada).
- Adaptar el modelo de datos existente: el campo `Evaluation.type: 'prototype'` ya existe a nivel de esquema — extender el DTO (`CreateEvaluationSchema`) para que `url` sea opcional cuando `type === 'prototype'` y se provea imagen, y crear el análogo del pipeline de Fase 2 (auditoría) sin la Fase 1 de exploración (no aplica navegación Playwright a una imagen estática).
- Extender el frontend: habilitar la tarjeta "Evaluar prototipo" (hoy deshabilitada), construir el formulario de carga (reutilizando el input de archivos ya existente pero no cableado en el componente legado `EvaluationForm.tsx`), y adaptar las vistas de resultados (Findings/Summary) para el caso "sin timeline de iteraciones".

### Hito 3 — Integración y consolidación (Mes 3.5–4.5)
- Unificar la experiencia de usuario entre evaluación por URL y por prototipo (historial combinado, filtros por tipo, comparación de resultados si aplica).
- Migrar el job runner en memoria a una cola persistente (BullMQ + Redis, o equivalente) si se prevé carga concurrente real durante las pruebas de usabilidad con usuarios (Hito 4) — actualmente el propio código señala esto como paso pendiente antes de escalar.
- Pruebas de integración end-to-end (API + Playwright + Gemini) cubriendo ambos flujos (URL y prototipo) y endurecer manejo de errores/timeouts de Gemini para cargas de imagen.
- Preparar entorno de despliegue reproducible para las pruebas con usuarios (Docker Compose de producción o despliegue gestionado), dado que actualmente no existe pipeline de CI/CD ni configuración cloud.

### Hito 4 — Pruebas de usabilidad con usuarios (escala SUS) (Mes 4.5–6)
- Diseñar e implementar el instrumento SUS: cuestionario estándar de 10 ítems (escala Likert 1–5), que hoy no existe en ninguna parte del código — requiere un nuevo módulo completo (modelo de datos, endpoint de envío de respuestas, cálculo de puntuación SUS, y UI de encuesta en el frontend).
- Reclutar la muestra de usuarios y definir el protocolo (tareas guiadas usando el propio EvalUXIA como sistema bajo prueba, o evaluando sitios ya auditados por el sistema, según el diseño metodológico de la tesis).
- Ejecutar las pruebas, recolectar puntuaciones SUS y cruzarlas contra los hallazgos automáticos (URL y prototipo) para el análisis de validez de la herramienta — esta comparación (evaluación automática vs. percepción humana) es previsiblemente el aporte central del capítulo de resultados de la tesis.
- Consolidar conclusiones y cerrar documentación técnica final (arquitectura, limitaciones, trabajo futuro) para el documento de tesis.

---

*Informe generado mediante auditoría automatizada del código fuente de ambos repositorios (frontend y backend) a la fecha indicada. Todas las afirmaciones están respaldadas por rutas de archivo, nombres de función/servicio y comentarios verificados directamente en el código.*
