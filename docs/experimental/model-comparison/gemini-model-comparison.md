# Comparación de modelos Gemini en EvalUXIA — registro experimental

> Documento de registro permanente. Se añade una entrada por cada prueba real ejecutada; nunca se reescriben ni se borran entradas anteriores.
>
> **Convención de etiquetas** (igual criterio que `docs/fase3/analisis_validacion_metodologica_evaluxia_fase3.md`):
>
> | Etiqueta | Significado |
> |---|---|
> | **Observado** | Dato leído directamente de MongoDB/código, verificado, no inferido. |
> | **Problema identificado** | Defecto o inconsistencia confirmada contra el código, con evidencia. |
> | **Pendiente de validar** | Pregunta abierta, hipótesis o dato que requiere una próxima prueba real para confirmarse o refutarse. |

---

## 0. Contexto del cambio de modelo (11 de noviembre de 2026)

- Modelo configurado hasta esta fecha: `gemini-2.5-flash`.
- Modelo configurado a partir de esta fecha: `gemini-3.5-flash-lite` (ver `evaluxia_backend/src/config/env.ts`).
- El cambio es reversible por variable de entorno: `GEMINI_MODEL=gemini-2.5-flash` en `.env` restaura el modelo anterior sin tocar código.
- **Problema identificado (no resuelto en este cambio, documentado para seguimiento)**: la tabla de costos de `metrics-tracker.ts` (`MetricsTracker.calculateCost`) no tiene una fila propia para `gemini-3.5-flash-lite`. Cualquier modelo que no contenga `'2.0-flash'` ni `'2.5-flash'` en su nombre cae en el valor por defecto de la función, que hoy son los mismos números que `gemini-2.5-flash` ($0.30/$2.50 por millón de tokens). **El `estimatedCostUsd` que reporten las próximas evaluaciones con `gemini-3.5-flash-lite` es una tarifa NO verificada**, no necesariamente incorrecta, pero tampoco confirmada contra una fuente de precios real de Google para ese modelo. No se inventó una tarifa específica para "lite" sin evidencia.

---

## 1. Prueba WEB — Gemini 2.5 Flash

### Entrada 1

- **ID de evaluación**: `6af487aa0b91824dd68701e3`
- **Fecha**: 11 de noviembre de 2026
- **Tipo**: WEB
- **Modelo solicitado**: `gemini-2.5-flash`
- **Modelo efectivo**: `gemini-2.5-flash` (**Observado** — registrado en los 4 documentos `AiInteraction` reales de esta evaluación, campo `attempts[].modelVersionEffective`; sin redirección de Google detectada)
- **Sitio evaluado**: https://opencart-demo.smartfront.io/
- **Versión del código/prompts**: no identificada con precisión — esta evaluación se ejecutó antes de que el repositorio backend tuviera un commit que fijara el estado exacto del prompt de Phase 2 en ese momento (**Pendiente de validar** en pruebas futuras: registrar el hash de commit vigente al momento de cada evaluación real).
- **Parámetros de evaluación**: perfil evaluador real usado en la UI (no identificado por nombre en este documento); `maxIterations` dinámico, 8 por defecto.

**Resultados generales (Observado):**

| Métrica | Valor |
|---|---|
| Score global | 49/100 |
| Cumplimiento Nielsen | null (no evaluable) |
| Cumplimiento WCAG | 80% |
| Cobertura de auditoría | 25% |
| Criterios evaluados | 5/20 |
| PASS (por criterio) | 4 |
| FAIL (por criterio) | 1 |
| NOT_EVALUABLE (por criterio) | 15 |
| OUT_OF_COVERAGE | No aplica a WEB (concepto exclusivo de PROTOTIPO) |
| Cobertura WCAG | 50% |
| Cobertura Nielsen | 0% |

**Evidencias y exploración (Observado):**

| Métrica | Valor |
|---|---|
| Capturas (screenshots) | 4 |
| Evidencias (evidenceCount) | 273 |
| Iteraciones evaluadas | 4 |
| Fase 1 (llamadas) | 3 |
| Fase 2 (llamadas) | 1 |
| Estado de exploración | `ACTION_FAILED` |
| `explorationIntegrity.complete` | false |
| `evidenceFullyVerified` | true |
| Fallos de persistencia de snapshots | 0 |
| Causa de interrupción | Timeout (10000ms) de un selector Playwright posicional (`nth-of-type`) al navegar de una página de producto a una página de listado |

**Consumo y rendimiento (Observado, verificado aritméticamente contra los 4 documentos `AiInteraction` reales — coincide exactamente):**

| Métrica | Valor |
|---|---|
| Tokens de entrada | 90.093 (21.242 de Fase 1 + 68.851 de Fase 2) |
| Tokens de salida | 2.543 |
| Thinking tokens | 11.775 |
| Tiempo total | 69.083 ms |
| Coste estimado | USD 0.033385 |
| Estado del coste | `confirmed-excludes-unverified-thinking-cost` (excluye explícitamente el coste de los thinking tokens, cuya tarifa no está verificada en el código) |

**Número de hallazgos y evidencias (Observado, consolidación por hallazgo individual, distinta de la consolidación por criterio de arriba)**: 187 documentos `Finding` reales persistidos (181 PASS + 3 FAIL + 3 NOT_EVALUABLE); `metricsAudit.consolidatedByStatus` del Report coincide exactamente.

**Calidad y suficiencia de las evidencias / falsos positivos y negativos (Observado y Problema identificado, análisis forense ya realizado)**:

1. **Observado** — Los 3 hallazgos FAIL de severidad alta corresponden, los tres, a WCAG 1.4.3 (contraste), con ratios 1.37:1, 1.33:1 y 1.38:1 sobre enlaces de categoría. Son cálculos deterministas (no generados por IA), evidencia completa y trazable. Sin falsos positivos detectados en estos tres.
2. **Observado** — El hallazgo de jerarquía de encabezados (WCAG 1.3.1) tiene estado `NOT_EVALUABLE`, severidad alta, **no debe presentarse como incumplimiento confirmado**. Verificado independientemente contra el sitio real: existen efectivamente dos elementos `<h1>` en la portada, con `<h2>` intercalados de forma inconsistente — la observación de Gemini es real, pero su propio estado (`NOT_EVALUABLE`) ya refleja que no se demostró como incumplimiento formal.
3. **Observado** — El hallazgo del banner de cookies (Nielsen N-08) tiene estado `NOT_EVALUABLE`, severidad media. Verificado independientemente: el banner existe realmente ("We use cookies", con botones Accept all/Reject optional/Customise), presente en la carga inicial.
4. **Problema identificado** — Los enlaces de productos con textos extensos y concatenados (ej. `"Bestseller-25%Oxford Tailored Tee(142)€48.00€64.00"` como un único link, confirmado contra el HTML real del sitio) **no tienen ningún Finding registrado como incumplimiento**: las 81 observaciones de WCAG 2.4.4 en esta evaluación son, las 81, `PASS` ("tiene un propósito identificable" — un criterio que técnicamente no exige concisión). El resumen ejecutivo generado por IA, sin embargo, describe esto como un problema de verbosidad confirmado — una afirmación sin ningún Finding estructurado que la respalde. **Posible falso negativo de severidad** si se exigiera un criterio más estricto que 2.4.4 literal (p. ej. una lectura orientada a "nombre accesible conciso"), pero no es un falso negativo respecto al criterio WCAG tal como está definido y aplicado.
5. **Problema identificado** — El resumen ejecutivo presenta como defectos confirmados los tres temas anteriores (jerarquía de encabezados, banner de cookies, enlaces verbosos), incumpliendo la propia regla del prompt de Phase 2 ("EXECUTIVE SUMMARY RULE": un `NOT_EVALUABLE` debe presentarse como pregunta abierta, nunca como defecto confirmado). Confirmado por lectura directa del prompt (`ai.service.ts`) y del texto real generado.
6. **Problema identificado (bug de código, no de los datos)** — `metricsAudit.note` del Report afirma textualmente: *"PASS nunca se persiste"* y calcula `expectedPersistedFindingsCount: 6`, generando la advertencia *"posible fallo parcial de persistencia"* al compararlo contra los 187 reales. Esto es una política DESACTUALIZADA en `metrics-tracker.ts::buildMetricsAudit` — la política real vigente (`findingPersistencePolicy: "PASS_PERSISTED"`, confirmada en el mismo Report y en el código de `audit-engine.service.ts`) sí persiste PASS, FAIL y NOT_EVALUABLE. **No hay fallo de persistencia real**: los 187 documentos existen, están completos y coinciden exactamente con lo esperado bajo la política vigente. El error está únicamente en la expectativa desactualizada del auditor de métricas.
7. **Observado** — La exploración se interrumpió por un selector posicional (`nth-of-type`) frágil frente a un cambio de contexto DOM (de página de producto a página de listado), no por un cambio real del sitio.
8. **Observado** — El modelo efectivo quedó correctamente registrado como `gemini-2.5-flash` en las cuatro interacciones de IA reales de esta evaluación (primera verificación empírica de la trazabilidad por intento implementada en P1.7.4-A).

**Integridad de la exploración**: incompleta (4 de 8 iteraciones posibles), pero con evidencia completamente verificada (`evidenceFullyVerified: true`) para las iteraciones ejecutadas — los hallazgos persistidos siguen siendo válidos, la cobertura simplemente es parcial.

---

## 2. Prueba WEB — Gemini 3.5 Flash-Lite

### Entrada 1

- **ID de evaluación**: `6af48ff0c1d54382d38c576e`
- **Report ID**: `6af49008c1d54382d38c6568` (**Observado** — verificado por consulta directa, coincide con el ID indicado en el encargo)
- **Fecha**: 11 de noviembre de 2026 (`createdAt: 2026-11-11T15:55:28.356Z`)
- **Tipo**: WEB
- **Modelo solicitado**: `gemini-3.5-flash-lite`
- **Modelo efectivo**: `gemini-3.5-flash-lite` (**Observado** — `attempts[].modelVersionEffective` de los 4 documentos `AiInteraction` reales, coincide exactamente con lo solicitado; sin redirección de Google detectada)
- **Sitio evaluado**: https://opencart-demo.smartfront.io/ (mismo sitio que la Entrada 1 de Gemini 2.5 Flash)
- **Versión del código/prompts**: no identificada con precisión — misma limitación que la Entrada 1 (**Pendiente de validar**: registrar el hash de commit en próximas pruebas; entre ambas evaluaciones de este documento no hubo ningún cambio de código salvo la propia variable `GEMINI_MODEL`, confirmado porque ambas comparten exactamente el mismo bug de `metricsAudit`, ver Sección 3.6 más abajo).
- **Parámetros de evaluación**: mismo mecanismo que la Entrada 1 (perfil evaluador real vía UI, `maxIterations` dinámico).

**Resultados generales (Observado):**

| Métrica | Valor |
|---|---|
| Score global | 49/100 |
| Cumplimiento Nielsen | null (no evaluable) |
| Cumplimiento WCAG | 80% |
| Cobertura de auditoría | 25% |
| Criterios evaluados | 5/20 |
| PASS (por criterio) | 4 |
| FAIL (por criterio) | 1 |
| NOT_EVALUABLE (por criterio) | 15 |
| Cobertura WCAG | 50% |
| Cobertura Nielsen | 0% |

**Evidencias y exploración (Observado):**

| Métrica | Valor |
|---|---|
| Capturas | 4 |
| Evidencias (evidenceCount) | 258 |
| Iteraciones evaluadas | 4 |
| Fase 1 (llamadas) | 3 |
| Fase 2 (llamadas) | 1 |
| Estado de exploración | `ACTION_FAILED` |
| `explorationIntegrity.complete` | false |
| `evidenceFullyVerified` | true |
| Fallos de persistencia de snapshots | 0 |
| Causa de interrupción | Timeout (10000ms) de un selector Playwright — ver análisis detallado en Sección 3.5 |

**Consumo y rendimiento (Observado, verificado aritméticamente contra los 4 documentos `AiInteraction` reales):**

| Métrica | Valor |
|---|---|
| Tokens de entrada | 71.353 (21.189 de Fase 1 + 50.164 de Fase 2) |
| Tokens de salida | 958 |
| Thinking tokens | **0** (ninguno de los 4 intentos reales reportó `thoughtsTokenCount`) |
| Tiempo total | 6.796 ms |
| Coste estimado | USD 0.023801 |
| Estado del coste | `confirmed` — **Problema identificado, ver Sección 3.2**: este `costStatus` es engañoso para este modelo específico; "confirmed" aquí solo significa "no se excluyó ningún coste de thinking", no que la tarifa usada esté verificada para `gemini-3.5-flash-lite`. |

**Número de hallazgos y evidencias (Observado)**: 173 documentos `Finding` reales persistidos (168 PASS + 3 FAIL + 2 NOT_EVALUABLE); coincide exactamente con `metricsAudit.consolidatedByStatus`.

**Falsos positivos identificados**: ninguno detectado con evidencia suficiente en esta evaluación (los 3 FAIL son deterministas e idénticos a los de Gemini 2.5 Flash — ver Sección 3).

**Falsos negativos identificados**: **Problema identificado, con evidencia** — el hallazgo NOT_EVALUABLE de jerarquía de encabezados de esta evaluación afirma textualmente: *"The page structure uses proper heading hierarchy (h1 to h3) to organize content sections logically"* (heurístico N-04, severidad baja). Esto **contradice la estructura real del DOM**, verificada independientemente contra el sitio en vivo en el análisis anterior de este mismo documento: la portada tiene **dos elementos `<h1>`** con `<h2>` intercalados de forma inconsistente entre ellos. Gemini 2.5 Flash, sobre el mismo sitio, sí detectó este patrón (aunque también lo clasificó `NOT_EVALUABLE`, nunca como FAIL confirmado). Esto es un candidato razonable a falso negativo cualitativo de Gemini 3.5 Flash-Lite para esta observación específica — con la salvedad explícita de que ninguno de los dos modelos emitió un `FAIL` formal por este aspecto, por lo que no afecta el conteo de criterios ni el score.

**Calidad y suficiencia de las evidencias**: los 3 FAIL de contraste tienen evidencia idéntica, completa y trazable a la de Gemini 2.5 Flash (ver Sección 3). Las evidencias PASS muestran una caída notable en WCAG 4.1.2 (23 vs. 45 en Gemini 2.5 Flash, -49%) — ver Sección 3 para el análisis de esta diferencia.

**Integridad de la exploración**: incompleta (4 de 8 iteraciones posibles), igual que Gemini 2.5 Flash, con evidencia completamente verificada para las iteraciones ejecutadas.

**Errores, incidencias y observaciones**: el resumen ejecutivo de esta evaluación es notablemente más moderado en tono que el de Gemini 2.5 Flash — ver Sección 3 para el análisis cualitativo completo.

---

## 3. Comparación WEB

### 3.1. Verificación de que ambos registros corresponden a los IDs indicados

**Observado** — Ambos `evaluationId`/`reportId` fueron consultados directamente contra MongoDB (`evaluxia_dev`, solo lectura) y coinciden exactamente con los indicados en el encargo. Ambos documentos `Report` tienen `geminiModel` consistente con el modelo real registrado en sus `AiInteraction`.

### 3.2. Comparación cuantitativa (rendimiento y coste)

| Dimensión | Gemini 2.5 Flash (A) | Gemini 3.5 Flash-Lite (B) | Diferencia absoluta | Diferencia % |
|---|---|---|---|---|
| Tiempo total | 69.083 ms | 6.796 ms | -62.287 ms | **-90,2%** |
| Tiempo Fase 2 (la llamada más pesada) | 52.984 ms | 2.572 ms | -50.412 ms | **-95,1%** |
| Tokens de entrada | 90.093 | 71.353 | -18.740 | -20,8% |
| Tokens de salida | 2.543 | 958 | -1.585 | **-62,3%** |
| Thinking tokens | 11.775 | 0 | -11.775 | -100% |
| Tokens totales (Report, sin thinking) | 92.636 | 72.311 | -20.325 | -21,9% |
| Coste estimado reportado | USD 0.033385 | USD 0.023801 | -USD 0.009584 | -28,7% |

**Problema identificado (Sección 4 del encargo — "verifica que el coste se calculó con su tarifa correspondiente")**: **la comparación de coste en USD NO es económicamente válida tal como está calculada.** Verificado contra el código (`metrics-tracker.ts::calculateCost`): la función solo tiene tarifas confirmadas para cadenas que contienen `'2.0-flash'` o `'2.5-flash'`; `gemini-3.5-flash-lite` no coincide con ninguna de las dos y cae en el valor por defecto de la función, que son **los mismos números que `gemini-2.5-flash`** ($0.30/$2.50 por millón de tokens). Verificación aritmética: `71.353 × 0.30/1.000.000 + 958 × 2.50/1.000.000 = 0.023801` — coincide exactamente con el valor reportado, confirmando que se usó la tarifa de 2.5-flash para calcular el coste de 3.5-flash-lite. **La diferencia de "coste" de -28,7% observada es, en realidad, puramente una diferencia de conteo de tokens con la MISMA tarifa aplicada a ambos — no refleja ningún precio real distinto de Google para `gemini-3.5-flash-lite`,** que podría ser mayor, menor o igual. No se modifica el servicio de cálculo de costes en esta tarea (fuera de alcance explícito).

**Ausencia total de thinking tokens en B (Observado, no solo un dato aislado)**: los 4 intentos reales de la evaluación B no reportaron `thoughtsTokenCount` en absoluto (campo ausente, no cero-con-valor). Dos explicaciones posibles, ninguna confirmable sin documentación oficial de Google (**Pendiente de validar**): (a) `gemini-3.5-flash-lite` no usa/soporta razonamiento extendido por defecto (consistente con un modelo "lite" orientado a velocidad); (b) la API simplemente no expone ese campo para este modelo. Cualquiera de las dos explica, al menos parcialmente, la reducción drástica de tiempo de ejecución.

**Reducción de tokens de salida (-62,3%) y de hallazgos PASS totales (168 vs. 181, -7,2%)**: consistente con un modelo que produce respuestas más compactas — ver 3.3 para el desglose por criterio.

### 3.3. Comparación cualitativa de hallazgos

**Hallazgos FAIL — idénticos entre ambos modelos (Observado, verificación exacta)**: los 3 hallazgos FAIL de severidad alta son, en ambas evaluaciones, los MISMOS exactos: mismo criterio (WCAG 1.4.3), mismos selectores (`a:nth-of-type(1/2/3)` dentro de la misma sección de categorías), mismos ratios de contraste (1.37:1 / 1.33:1 / 1.38:1), misma evidencia `COMPUTED_STYLE` palabra por palabra. **Esto es la confirmación esperada**: estos hallazgos son deterministas (calculados por `computeContrastFailure`, no generados por el LLM) y, por diseño arquitectónico, no deberían variar según el modelo configurado — el dato real lo confirma.

**NOT_EVALUABLE — divergen cualitativamente entre modelos (Observado, Problema identificado como posible falso negativo)**:

| | Gemini 2.5 Flash | Gemini 3.5 Flash-Lite |
|---|---|---|
| Hallazgo de contraste indeterminado (fondo transparente) | Idéntico en ambos — mismo selector, misma descripción | Idéntico |
| Hallazgo de jerarquía de encabezados | "incorrect heading hierarchy... illogical nesting" (N-02, severidad alta) | "proper heading hierarchy (h1 to h3)... logically" (N-04, severidad baja) — **afirmación opuesta sobre el mismo DOM real** |
| Hallazgo del banner de cookies | Presente (N-08, severidad media, "covers a substantial portion of the viewport") | **Ausente** — Gemini 3.5 Flash-Lite no generó ningún hallazgo sobre el banner de cookies en absoluto |

Verificado contra el sitio real (fetch independiente ya realizado en el análisis anterior de este documento): la portada **sí** tiene dos elementos `<h1>` con anidación inconsistente de `<h2>`. La afirmación de Gemini 3.5 Flash-Lite ("jerarquía apropiada") es, por tanto, **incorrecta respecto al DOM real** — un candidato a falso negativo cualitativo, documentado con la evidencia que lo sustenta, no como una suposición.

**Distribución de PASS por criterio — diferencia notable en WCAG 4.1.2**:

| Criterio | PASS Gemini 2.5 Flash | PASS Gemini 3.5 Flash-Lite | Diferencia |
|---|---|---|---|
| WCAG 1.4.3 (Contraste) | 23 | 25 | +2 |
| WCAG 1.1.1 (Contenido no textual) | 30 | 33 | +3 |
| WCAG 4.1.2 (Nombre, función y valor) | 45 | 23 | **-22 (-49%)** |
| WCAG 2.4.4 (Propósito de los enlaces) | 79 | 82 | +3 |
| WCAG 3.3.2 (Etiquetas o instrucciones) | 4 | 5 | +1 |

**Problema identificado**: Gemini 3.5 Flash-Lite generó casi la mitad de observaciones PASS individuales para WCAG 4.1.2 (nombre/función/valor de controles) que Gemini 2.5 Flash, sobre el mismo sitio y una exploración con acciones previas equivalentes. Es consistente con la reducción del 62% en tokens de salida: el modelo "lite" parece enumerar menos exhaustivamente los elementos individuales para este criterio específico. **No hay evidencia suficiente para determinar si esto representa una cobertura real menor (un riesgo de falso negativo a nivel de criterio) o simplemente una respuesta más compacta sin pérdida de cobertura real** — Pendiente de validar con más pruebas.

**Duplicados en la persistencia**: Gemini 2.5 Flash tuvo 3 pares de PASS duplicados (mismo criterio+selector+status), todos WCAG 2.4.4 (3/187 ≈ 1,6%). Gemini 3.5 Flash-Lite tuvo 7 pares duplicados, en WCAG 1.1.1 y 2.4.4 (7/173 ≈ 4,0%) — proporcionalmente más, aunque el mecanismo de deduplicación del código es idéntico en ambas evaluaciones (no cambió entre una y otra). La diferencia proviene de cómo cada modelo repitió observaciones sobre los mismos elementos entre iteraciones, no de un cambio de código.

**Coherencia entre hallazgos y resumen ejecutivo**:

- Gemini 2.5 Flash (ya documentado en la Sección 1): el resumen narra como defectos confirmados tres temas (jerarquía de encabezados, banner de cookies, enlaces verbosos) que corresponden a hallazgos `NOT_EVALUABLE` o inexistentes — una violación clara de la regla del propio prompt ("EXECUTIVE SUMMARY RULE").
- Gemini 3.5 Flash-Lite: *"solid compliance across standard usability heuristics... navigation, search functionality, and product discovery paths are functional and responsive. However, minor accessibility and metadata details—such as contrast values and form labelling—require developer attention..."* — **Observado**: este resumen es notablemente más moderado y genérico; no nombra explícitamente la jerarquía de encabezados, el banner de cookies ni la verbosidad de enlaces como defectos confirmados. Sí menciona "contrast values" (correlaciona correctamente con los 3 FAIL reales) y "form labelling" (WCAG 3.3.2 — pero esta evaluación tiene 5 PASS y 0 FAIL/NOT_EVALUABLE para ese criterio, por lo que "requiere atención" tampoco está estrictamente respaldado por un hallazgo formal). **Conclusión cualitativa, con una sola muestra por modelo**: ambos modelos presentan cierto grado de desconexión entre el resumen narrativo y los hallazgos estructurados, pero la versión de Gemini 3.5 Flash-Lite es comparativamente más cautelosa/genérica que la de Gemini 2.5 Flash, que hace afirmaciones puntuales y categóricas sin respaldo. No se declara un ganador en este aspecto con una sola muestra por modelo.

**Comportamiento de la exploración**: ver análisis dedicado en Sección 3.5.

### 3.4. Hallazgos que coinciden, exclusivos, y no comparables

- **Coinciden exactamente**: los 3 FAIL de contraste WCAG 1.4.3; el hallazgo de contraste indeterminado (fondo transparente).
- **Exclusivo de Gemini 2.5 Flash**: el hallazgo NOT_EVALUABLE del banner de cookies (N-08).
- **Divergen en contenido, aunque ambos existen**: el hallazgo de jerarquía de encabezados (mismo criterio/selector, conclusión textual opuesta).
- **No comparables directamente**: el conteo bruto de PASS por criterio (181 vs. 168 total) no debe leerse como "más" o "menos" cumplimiento — ambas evaluaciones arrojan el mismo resultado consolidado por criterio (4 PASS / 1 FAIL / 15 NOT_EVALUABLE de 20), la diferencia está solo en cuántas observaciones individuales redundantes genera cada modelo para los criterios ya evaluados.

### 3.5. Análisis de exploración — causa de la interrupción (investigación detallada)

Ambas evaluaciones terminan con `terminationReason: ACTION_FAILED` y el **mismo texto literal de selector** en el error de timeout: `section:nth-of-type(4) > div > div > section > div > div:nth-of-type(1) > a`. Una lectura superficial sugeriría "el mismo bug en ambos modelos" — **la reconstrucción exacta de las decisiones de Fase 1, consultadas directamente de `AiInteraction.metadata.suggestedAction`, muestra que la causa real es distinta en cada caso**:

**Gemini 2.5 Flash (A)** — secuencia de decisiones reales:
1. `CLICK button:nth-of-type(3)` (aceptar cookies) → éxito.
2. `CLICK section:nth-of-type(1)...a:nth-of-type(1)` ("Shop new in", un ancla de la misma portada — el snapshot siguiente sigue siendo la portada) → éxito.
3. `CLICK section:nth-of-type(4)...a` ("clicking directly on a specific product like the 'Oxford Tailored Tee'") → **FALLA** (timeout). Este es el **primer y único intento** de este selector.

**Gemini 3.5 Flash-Lite (B)** — secuencia de decisiones reales:
1. `CLICK button:nth-of-type(3)` (aceptar cookies) → éxito.
2. `CLICK section:nth-of-type(4)...a` ("Selecting the first prominent featured product (Oxford Tailored Tee)") → **ÉXITO** — navega realmente a `/p/oxford-tailored-tee` (confirmado por la URL del snapshot de la iteración 4).
3. `CLICK section:nth-of-type(4)...a` otra vez ("Following the step objective to click the Oxford Tailored...") → **FALLA** (timeout) — el modelo **repite exactamente el mismo selector que ya había ejecutado con éxito un paso antes**, ahora sobre la página de detalle del producto (donde ese selector no corresponde a ningún elemento real).

**Respuestas a las preguntas del encargo**:
- **¿Mismo paso del flujo?** No semánticamente, aunque el texto del selector coincide: en A es el primer (y fallido) intento de alcanzar un producto; en B es un **segundo intento redundante** de un clic ya completado con éxito.
- **¿El selector lo genera Gemini o el sistema?** Gemini, en ambos casos — confirmado directamente en `metadata.suggestedAction.targetElement.value` de la decisión real, no inferido.
- **¿Llegó al mismo estado de navegación?** No: A nunca salió de la portada (su único intento de clic a producto falló). B sí llegó a la página de detalle del producto exitosamente, y falló en un paso posterior e innecesario.
- **¿Diferencia en acciones exitosas anteriores?** Sí — A tuvo 2 acciones exitosas (cookies + ancla de portada); B tuvo 2 acciones exitosas, pero la segunda fue una navegación real y completa al producto.
- **¿Atribuible al modelo, al selector, o a Playwright?** Para A: el selector propuesto no correspondía a ningún elemento alcanzable en 10s desde la portada — un fallo de generación de selector en un contexto nunca antes visitado. Para B: **un fallo distinto y más específico** — el modelo no reconoció, a partir del nuevo snapshot (ya en la página de producto) y de `completedSteps` (que ya registraba ese clic como completado), que el objetivo de ese paso ya estaba cumplido, y volvió a proponer la misma acción. Esto apunta a una posible debilidad de Gemini 3.5 Flash-Lite en el seguimiento de `currentStepObjective`/`completedSteps` dentro del prompt de Fase 1 — observación de una sola muestra, no generalizable sin más pruebas. No se implementa ninguna corrección en esta tarea.

### 3.6. Análisis de persistencia — la misma inconsistencia en ambas evaluaciones

**Confirmado: el mismo bug identificado en el análisis anterior de Gemini 2.5 Flash está presente, de forma idéntica en su mecanismo, en Gemini 3.5 Flash-Lite**:

| | Gemini 2.5 Flash | Gemini 3.5 Flash-Lite |
|---|---|---|
| `consolidatedByStatus` | FAIL 3 / PASS 181 / NOT_EVALUABLE 3 | FAIL 3 / PASS 168 / NOT_EVALUABLE 2 |
| `expectedPersistedFindingsCount` | 6 (= 3+3, FAIL+NOT_EVALUABLE) | 5 (= 3+2, FAIL+NOT_EVALUABLE) |
| `persistedFindingsCount` (real) | 187 | 173 |
| Documentos `Finding` reales verificados | 187 (181 PASS + 3 FAIL + 3 NOT_EVALUABLE) | 173 (168 PASS + 3 FAIL + 2 NOT_EVALUABLE) |
| `findingPersistencePolicy` | `PASS_PERSISTED` | `PASS_PERSISTED` |
| Nota del auditor | *"PASS nunca se persiste"* + advertencia de fallo parcial | Idéntica, palabra por palabra, con los números de esta evaluación |

**Diagnóstico (releído contra el código, `metrics-tracker.ts::buildMetricsAudit` y `audit-engine.service.ts`, sin corregir nada)**: es **un comentario/política desactualizada en el cálculo de la expectativa**, no un problema real de persistencia, y **no una combinación de ambos**. `expectedPersistedFindingsCount` se calcula con la fórmula de la política anterior (P1.5.2: FAIL+NOT_EVALUABLE), mientras que el bucle real de persistencia (`audit-engine.service.ts`, condición `cf.status === 'FAIL' || 'NOT_EVALUABLE' || 'PASS'`) ya implementa la política vigente (P1.7.2: las tres). En ambas evaluaciones, `persistedFindingsCount` coincide EXACTAMENTE con el conteo real de documentos `Finding` verificados en la base de datos — la persistencia funciona correctamente en los dos casos; la única falla es la expectativa desactualizada que genera una advertencia falsa. Confirmado que el bug es puramente estructural/determinista (se reproduce idéntico con cualquier conjunto de números, independientemente del modelo), no un artefacto de una evaluación en particular.

### 3.7. Coherencia del reporte — tres consolidaciones distintas, no equivalentes

Para ambas evaluaciones, `Report.totalFindings` (3) = `criticalCount`(0) + `highCount`(3) + `mediumCount`(0) + `lowCount`(0) — es decir, **`totalFindings` se calcula exclusivamente sobre los hallazgos con `status: FAIL`**, desglosados por severidad (`audit-metrics.service.ts`, bloque `failFindings`). Esto es una tercera consolidación, distinta de las otras dos ya explicadas:

| Consolidación | Qué cuenta | Valor (A / B) |
|---|---|---|
| Por criterio (`evaluatedCriteria`/`totalCriteria`) | 20 casillas fijas (10 Nielsen + 10 WCAG), 1 estado por casilla | 5/20 en ambas |
| Por hallazgo individual (`metricsAudit.consolidatedByStatus`) | Un hallazgo por cada combinación única de elemento DOM + criterio | 187 / 173 |
| Por severidad de FAIL (`totalFindings`/`criticalCount`/...) | Solo los hallazgos con `status: FAIL`, agrupados por severidad | 3 / 3 |

Las tres son correctas en su propio nivel y **no deben tratarse como medidas intercambiables** — un lector que compare "3 hallazgos" (totalFindings) contra "187 hallazgos" (persistedFindingsCount) sin esta distinción concluiría erróneamente que hay una contradicción en los datos.

### 3.8. Limitaciones de la comparación

- **n=1 por modelo**: toda conclusión cualitativa (Sección 3.3) se basa en una única ejecución por modelo sobre un único sitio — no permite generalizar a "Gemini 3.5 Flash-Lite es menos preciso" de forma universal, solo documentar lo observado en esta instancia concreta.
- **Coste no comparable económicamente** (Sección 3.2) — la tarifa usada para Gemini 3.5 Flash-Lite no está verificada; cualquier conclusión de "ahorro" basada en el campo `estimatedCostUsd` es inválida hasta que se corrija `calculateCost` (fuera de alcance de esta tarea).
- **Ausencia de thinking tokens en B no está explicada con certeza** (capacidad del modelo vs. comportamiento de la API) — Pendiente de validar contra documentación oficial de Google.
- **No se verificó código/prompts por commit exacto** en ninguna de las dos evaluaciones — no puede descartarse por completo que algún cambio de código entre ambas ejecuciones (aunque no se detectó ninguno) explique parte de la diferencia, más allá del propio modelo.
- **La exploración se interrumpió en ambos casos** antes de cubrir el sitio completo — ninguna de las dos evaluaciones permite comparar el comportamiento de los modelos sobre páginas de producto, carrito o checkout.

---

## 4. Prueba PROTOTIPO — Gemini 2.5 Flash

### PROTO-02

- **ID de evaluación**: `6af4a140f337ed352c4b9226`
- **Report ID**: `6af4a198f337ed352c4b927b` (**Observado**, verificado por consulta directa)
- **Fecha**: 11 de noviembre de 2026, `createdAt: 2026-11-11T17:09:20.580Z`
- **Tipo**: PROTOTIPO
- **Título de la evaluación**: `ContactPage 3 (2.5)`
- **Modelo solicitado**: `gemini-2.5-flash`
- **Modelo efectivo**: `gemini-2.5-flash` (**Observado** — `attempts[].modelVersionEffective` de los 2 intentos reales, coincide; sin redirección de Google)
- **Prototipo evaluado**: KassaPay Contact Page — **misma imagen exacta que PROTO-01** (ver verificación de comparabilidad, Sección 6.1)
- **Perfil evaluador**: `6a714bfd22b377d22d439c05` ("Laura Martínez", mismo perfil que PROTO-01)
- **Versión del código/prompts**: **idéntica a PROTO-01** — verificado que `ai.service.ts`, `prototype.contracts.ts`, `prototype-criteria-resolver.ts` y `prototype-metrics.service.ts` no se modificaron entre ambas ejecuciones (todas con fecha de modificación muy anterior a las 16:26/17:09 del 11 de noviembre)

**Resultados generales (Observado, verificado directamente contra `Report`/`Finding` reales)**:

| Métrica | Valor |
|---|---|
| Score global (`overallScore`) | 26/100 |
| Criterios aplicables | 13 |
| Criterios evaluados (reales, `coverage.evaluatedCriteria`) | 5 |
| Criterios fuera de alcance visual (`coverage.outOfCoverageCriteria`) | 6 |
| PASS / FAIL / NOT_EVALUABLE (por criterio, `passCount`/`failCount`/`notEvaluableCount` de Report) | 2 / 3 / 1 |
| `Report.totalFindings` (todos los documentos `Finding`, cualquier estado) | **14** — ver discrepancia crítica en 6.2 |

**Consumo y rendimiento (Observado, verificado contra los 2 intentos reales de `AiInteraction`)**:

| Métrica | Valor |
|---|---|
| Tokens de entrada | 6.787 |
| Tokens de salida | 6.543 (del intento final exitoso) |
| Thinking tokens | 6.131 |
| Tiempo total | 87.557 ms |
| Coste estimado | USD 0.018394 |
| Estado del coste | `confirmed-excludes-unverified-thinking-cost` |
| Intentos físicos | **2** — el primero terminó en `SCHEMA_MISMATCH` (el mismo tipo de incumplimiento de contrato "property/value" ya documentado en una evaluación fallida anterior de esta sesión), el segundo tuvo éxito |

**Número de hallazgos y evidencias**: 14 documentos `Finding` reales (7 FAIL + 1 NOT_EVALUABLE + 6 PASS, verificado directamente) — **pero solo 6 de esos 14 (3 FAIL + 2 PASS + 1 NOT_EVALUABLE) terminan contando en las métricas por criterio**, por el bug confirmado en 6.2.

---

## 5. Prueba PROTOTIPO — Gemini 3.5 Flash-Lite

### PROTO-01

> **Advertencia de nomenclatura**: la evaluación fue creada manualmente con el título `KassaPay Contact Page 1 (2.5)`, sugiriendo Gemini 2.5 Flash. **El modelo realmente registrado y usado es `gemini-3.5-flash-lite`** (`geminiModel` y `metrics.modelUsed` del Report, y `modelVersionEffective` del único `AiInteraction` real, los tres coincidentes). Esta ejecución se registra correctamente aquí, en la sección de 3.5 Flash-Lite, **nunca** en la Sección 4 (2.5 Flash) — ver investigación de la causa en 5.1.

- **ID de evaluación**: `6af49726c1d54382d38c6a12`
- **Report ID**: `6af4972cc1d54382d38c6a26` (**Observado**, verificado por consulta directa)
- **Fecha**: 11 de noviembre de 2026, `createdAt: 2026-11-11T16:26:14.641Z`
- **Tipo**: PROTOTIPO
- **Modelo solicitado por el título de la evaluación (engañoso)**: sugiere `gemini-2.5-flash`
- **Modelo realmente solicitado al proveedor**: `gemini-3.5-flash-lite`
- **Modelo efectivo**: `gemini-3.5-flash-lite` (**Observado** — `attempts[0].modelVersionEffective`, coincide con lo realmente solicitado; sin redirección de Google)
- **Prototipo evaluado**: KassaPay Contact Page (imagen estática; descripción real del prototipo: cabecera, módulo de contacto con formulario, mapa interactivo, pie de página con enlaces y boletín)
- **Perfil evaluador**: `6a714bfd22b377d22d439c05`
- **Versión del código/prompts**: no identificada con precisión (**Pendiente de validar**, misma limitación que las entradas WEB)

**Resultados generales (Observado, verificado directamente contra `Report`/`Finding` reales)**:

| Métrica | Valor |
|---|---|
| Score global (`overallScore`) | 0/100 — **verificado matemáticamente correcto, no un valor nulo/sentinel** (ver 5.2) |
| Criterios aplicables | 13 |
| Criterios evaluados (reales, `coverage.evaluatedCriteria`) | 1 |
| Criterios fuera de alcance visual (`coverage.outOfCoverageCriteria`) | 6 |
| PASS / FAIL / NOT_EVALUABLE (por criterio aplicable) | 0 / 1 / 12 |
| `Report.evaluatedCriteria`/`totalCriteria`/`auditCoverage`/`wcagCompliance`/`nielsenCompliance`/`wcagCoverage`/`nielsenCoverage` | 0 / 20 / 0 / null / null / 0 / 0 — **campos de la plantilla WEB nunca poblados para PROTOTIPO, ver 5.2** |

**Evidencias y exploración (Observado)**:

| Métrica | Valor |
|---|---|
| Capturas | 1 |
| Evidencias (`evidenceCount`) | 3 |
| Iteraciones evaluadas | 1 |
| Fase 1 (llamadas) | 0 (no aplica a prototipos — sin exploración) |
| Fase 2 (llamadas) | 1 |

**Consumo y rendimiento (Observado, verificado contra el único `AiInteraction` real)**:

| Métrica | Valor |
|---|---|
| Tokens de entrada | 7.637 |
| Tokens de salida | 1.170 |
| Thinking tokens | 0 |
| Tiempo total | 6.023 ms |
| Coste estimado (esta evaluación) | USD 0.005216 |
| `cumulativeCostUsd` (contador de proceso, NO de esta evaluación) | 0.029017 — **Observado**: coincide exactamente con 0.005216 (esta evaluación) + 0.023801 (Entrada 1 de la Sección 2, WEB 3.5 Flash-Lite) — confirma que ambas corrieron sobre la MISMA instancia del backend, y que este contador es acumulado por tiempo de vida del proceso, no por evaluación (se reinicia a 0 en cada reinicio del backend) |
| Estado del coste | `confirmed` — misma salvedad que en WEB: tarifa no verificada específicamente para `gemini-3.5-flash-lite` (ver Sección 0) |

**Número de hallazgos y evidencias**: 3 documentos `Finding` reales (1 FAIL + 2 NOT_EVALUABLE), verificados directamente — coincide con `consolidatedByStatus` implícito.

### 5.1. Investigación de la discrepancia de modelo (Sección A del encargo)

**Causa demostrada, no especulada** — reconstruida con evidencia de proceso:

1. El backend corre en modo desarrollo vía `ts-node-dev --respawn`, que solo reinicia el proceso cuando cambia un archivo `.ts` observado — **nunca cuando cambia `.env`**.
2. `dotenv.config()` (en `src/config/env.ts`) se ejecuta una única vez, al arrancar el proceso — el valor de `GEMINI_MODEL` queda fijado en memoria para toda la vida de ese proceso, sin importar cambios posteriores al archivo `.env` en disco.
3. Reconstrucción cronológica verificada: el proceso que generó esta evaluación llevaba corriendo desde una reconstrucción (`respawn`) anterior al momento en que `.env` fue restaurado a `gemini-2.5-flash` en una tarea previa de esta misma sesión. Es decir, el proceso capturó `GEMINI_MODEL=gemini-3.5-flash-lite` (vigente en `.env` en el momento de ese `respawn`) y siguió sirviendo ese valor **después** de que `.env` ya decía `gemini-2.5-flash` en disco.
4. **No hay ninguna sobrescritura por Docker**: verificado que el único contenedor en ejecución es `evaluxia-mongo` — el servicio `api` de `docker-compose.yml` no está corriendo, por lo que su fallback (`gemini-3.5-flash-lite`, igual al default actual de `env.ts`) no participa en absoluto en esta discrepancia.
5. **No es un bug de código**: el proceso hizo exactamente lo que se le pidió con el valor que tenía cargado en memoria; el reporte registró fielmente `gemini-3.5-flash-lite` porque eso fue, en efecto, lo que se usó.

**Distinción exacta solicitada**:

| Fuente | Valor en el momento de esta evaluación |
|---|---|
| `.env` en disco | `gemini-2.5-flash` (ya restaurado en una tarea previa) |
| `docker-compose.yml` (fallback, servicio `api` **no corriendo**) | `gemini-3.5-flash-lite` — irrelevante aquí, el servicio no estaba activo |
| Modelo efectivo del proceso que ejecutó esta evaluación | `gemini-3.5-flash-lite` (capturado en un arranque anterior a la restauración de `.env`) |
| Modelo registrado en la evaluación | `gemini-3.5-flash-lite` (fiel al modelo efectivo real) |

**Acción tomada para la Sección 6 del encargo**: se detuvo el proceso de desarrollo desactualizado y se reinició (`npm run dev`) **después** de confirmar que `.env` contenía `gemini-2.5-flash` — ver Sección 6 del reporte final para la verificación.

### 5.2. Auditoría de consistencia de métricas (Sección B del encargo)

Las cuatro discrepancias señaladas **son diferencias justificadas entre consolidaciones distintas y un problema de presentación — no un problema de agregación ni de persistencia**:

1. **"1 criterio evaluado" vs. `evaluatedCriteria: 0`**: son dos campos DIFERENTES. `coverage.evaluatedCriteria: 1` (dentro de `Report.coverage`) es el cálculo REAL y correcto de `PrototypeMetricsService.calculatePrototypeMetrics` — cuenta el único criterio (N-06) con al menos un hallazgo PASS o FAIL. El campo de nivel superior `Report.evaluatedCriteria: 0` es un campo **heredado del esquema compartido con WEB, que el flujo de prototipos nunca puebla** — queda en su valor por defecto de Mongoose (0), no en un cálculo real. **Problema identificado**: el esquema `Report` reutiliza nombres de campo entre dos flujos con semánticas de cobertura distintas, y el flujo de prototipos deja varios de ellos sin poblar en vez de omitirlos u ocultarlos.
2. **`auditCoverage: 0`**: misma causa exacta — es un campo WEB-only (`totalCriteria: 20` fijo, irrelevante para prototipos) que nunca se calcula para evaluaciones de prototipo; su valor es el default de esquema, no una medición real de 0% de cobertura.
3. **"12 no evaluables" vs. solo 2 hallazgos `NOT_EVALUABLE`**: `coverage.notEvaluableCriteria = applicableCriteria(13) - evaluated(1) = 12` cuenta **criterios aplicables que no tienen NINGÚN hallazgo** (ni PASS, ni FAIL, ni NOT_EVALUABLE — simple silencio de Gemini), tratándolos como "no evaluables por omisión". Solo 2 de esos 12 criterios silenciosos tienen además un documento `Finding` explícito con `status: NOT_EVALUABLE` (WCAG 1.4.3 y 3.3.2); los otros 10 criterios aplicables (de los 13) no tienen ningún hallazgo en absoluto. Es el mismo patrón de diseño que la consolidación por criterio de WEB (cada "casilla" empieza en NOT_EVALUABLE y solo cambia si llega un hallazgo real) — no es un error, es la misma arquitectura aplicada al espacio más pequeño de 13 criterios de prototipo.
4. **`overallScore: 0` y "compliance no evaluable"**: el score **SÍ se calculó, y 0 es el resultado matemáticamente correcto** de la fórmula real (`calculatePrototypeMetrics`), verificado paso a paso: `evaluated=1, pass=0, fail=1 → compliance=(0/1)×100=0`; penalización de severidad `low`=3, normalizada sobre 1 criterio evaluado=3; `baseQuality=max(0, 0-3)=0`; `gammaCoverage=0.5+0.5×(1/13)≈0.5385`; `overallScore=round(0×0.5385)=0`. **No es un valor nulo disfrazado de cero** — es el resultado honesto de que el único criterio evaluado fue un FAIL. Por separado, `nielsenCompliance`/`wcagCompliance` en `null` sí son, igual que los puntos 1-2, campos WEB-only nunca calculados para prototipos (el flujo de prototipos no separa cumplimiento por framework a nivel de Report) — su `null` es coherente con "no calculado", no con "no se pudo determinar un valor real".

**Diagnóstico global de esta sección**: **combinación de (a) un problema de presentación/reutilización de esquema** (varios campos de `Report` diseñados para WEB quedan en su valor por defecto, nunca explícitamente para PROTOTIPO, lo que invita a leerlos como mediciones reales cuando no lo son) **y (b) definiciones de `totalFindings` incompatibles entre flujos**: para WEB, `totalFindings` = conteo de hallazgos `FAIL` por severidad; para PROTOTIPO, `PrototypeMetricsService` define `totalFindings: findings.length` — **todos los hallazgos, de cualquier estado** (aquí, 3 = 1 FAIL + 2 NOT_EVALUABLE, mientras que `criticalCount+highCount+mediumCount+lowCount = 0+0+0+1 = 1`, no 3). **No hay ningún problema real de agregación, persistencia o cálculo del score** — los tres documentos `Finding` existen, están completos, y el score/`coverage` interno son correctos y verificables.

### 5.3. Evaluación técnica de los tres hallazgos (Sección C del encargo)

| | WCAG 1.4.3 (contraste) | WCAG 3.3.2 (etiquetas) | N-06 (FAIL) |
|---|---|---|---|
| Evidencia cumple el contrato | Sí — `property: visualContrast` (whitelisted), valor cualitativo `"appears-low"`, `region`/`elementDescription` presentes | Sí — `property: visualLabel` (whitelisted, confirmado en `prototype.contracts.ts`), con `context` que explica la ausencia | Sí — `property: visibleText` (whitelisted), valor `"Email"`, única evidencia pero suficiente para un FAIL (la regla de evidencia estructurada obligatoria aplica a PASS, no a FAIL) |
| Transición de estado coherente con las reglas | **Sí, correcta por diseño**: el prompt (`ai.service.ts`) exige explícitamente que WCAG 1.4.3 basado en impresión visual cualitativa quede `NOT_EVALUABLE` para fines de conformidad, nunca PASS/FAIL — exactamente lo ocurrido | **Sí, correcta por diseño**: WCAG 3.3.2 es uno de los 4 criterios (1.1.1/1.3.1/1.4.3/3.3.2) que el prompt fuerza a `NOT_EVALUABLE` en ambas direcciones (ni la presencia ni la ausencia de etiqueta visible demuestra la asociación programática) | N-06 no tiene esa restricción (es `DIRECTLY_EVALUABLE` por diseño en `prototype-criteria-resolver.ts`) — un FAIL aquí es legítimo |
| Evidencia suficiente | — | — | Sí — observación directa, concreta, con `confidence: high` justificado (evidencia directa visible, no inferencia) |
| Clasificación correcta | Sí | Sí | Sí |

**Conclusión de esta sección**: los tres hallazgos están **correctamente clasificados y respetan el contrato de evidencia visual y las reglas de los Gates** — ninguno requiere corrección. **No se convirtieron NOT_EVALUABLE en FAIL ni se interpretaron como incumplimientos confirmados**, conforme a la restricción del encargo.

**Coherencia del resumen ejecutivo (Observado, contraste positivo con la Entrada 1 de WEB)**: el resumen de esta evaluación frasea ambos temas NOT_EVALUABLE como necesidades/recomendaciones ("la necesidad de optimizar el contraste...", "asegurar que los campos... cuenten con etiquetas visibles permanentes"), nunca como defectos confirmados, y además incluye el disclaimer determinista automático (`appendNotEvaluableDisclaimer`, código, no generado por IA): *"Nota: los siguientes aspectos no pudieron verificarse con la imagen disponible: WCAG 1.4.3..., WCAG 3.3.2... nunca como un problema confirmado..."*. **A diferencia de la Entrada 1 de Gemini 2.5 Flash en WEB (Sección 1), que violaba la regla del prompt al narrar NOT_EVALUABLE como confirmados, este resumen de prototipo respeta correctamente los estados reales.** Observación de una sola muestra — no se generaliza a "el modelo mejoró" ni a "el flujo de prototipos es más seguro", dado que el mecanismo de disclaimer es determinista (no depende del modelo) y ya existía antes de esta prueba.

### 5.4. Limitaciones de interpretación

- n=1, un solo prototipo, un solo modelo realmente probado (3.5 Flash-Lite) — la Sección 4 (2.5 Flash en PROTOTIPO) sigue sin ninguna evaluación real.
- El título de la evaluación (`... (2.5)`) es una etiqueta manual del usuario al crearla, no un dato de sistema — confirma la importancia de verificar siempre `modelUsed`/`modelVersionEffective` contra la base de datos antes de clasificar cualquier ejecución, exactamente como pedía este encargo.
- `cumulativeCostUsd` no es utilizable per-evaluación sin conocer qué otras evaluaciones compartieron el mismo proceso backend — para esta y futuras entradas, usar siempre `metrics.estimatedCostUsd` (no `cumulativeCostUsd`) al comparar.
- La tarifa de coste sigue sin verificar para `gemini-3.5-flash-lite` (misma limitación que en WEB).

### 5.5. Observaciones para la futura comparación con Gemini 2.5 Flash

- La próxima evaluación de prototipo (ya preparada para `gemini-2.5-flash`, ver Sección 6 de este documento) deberá usar el **mismo prototipo KassaPay Contact Page** y, si es posible, el mismo perfil evaluador, para que la comparación sea válida.
- Verificar de inmediato, al recibir el próximo reporte, que `metrics.modelUsed`/`geminiModel`/`attempts[].modelVersionEffective` digan realmente `gemini-2.5-flash` — no asumirlo por el título que se le ponga a la evaluación.
- Prestar atención especial a si Gemini 2.5 Flash evalúa más o menos de los 13 criterios aplicables que esta ejecución (que solo llegó a 1), y si también degrada WCAG 1.4.3/3.3.2 a `NOT_EVALUABLE` de la misma forma (sería la confirmación de que ese comportamiento es del contrato/prompt, no del modelo).

---

## 6. Comparación PROTOTIPO

### 6.1. Verificación de comparabilidad (Sección 3 del encargo)

**Confirmado con evidencia binaria, no inferida**: se calculó el hash SHA-256 de ambos archivos de imagen en disco.

| | PROTO-01 (`prototype_498317c4-...jpg`) | PROTO-02 (`prototype_623b09a0-...jpg`) |
|---|---|---|
| SHA-256 | `4f3a19a507dac24bd9a2b48dbb54255efb943b903e58406a93c98145d242e427` | `4f3a19a507dac24bd9a2b48dbb54255efb943b903e58406a93c98145d242e427` |
| Tamaño | 205.224 bytes | 205.224 bytes |
| Dimensiones | 1199×1647 px | 1199×1647 px |

**Hash idéntico, tamaño idéntico, dimensiones idénticas — es, byte por byte, el mismo archivo de imagen**, subido dos veces bajo nombres distintos (la ruta/UUID es administrativa, generada por `prototype-image-upload.service.ts` en cada subida). Mismo perfil evaluador, mismos 13 criterios aplicables, mismo código/prompts (Sección 4, verificado por fecha de modificación de archivos).

**Veredicto: Opción A — es la misma imagen, la diferencia de nombre es puramente administrativa.** Esta es una **comparación controlada y válida** entre los dos modelos sobre PROTOTIPO — de hecho más controlada que la comparación WEB (Sección 3), donde la navegación autónoma de cada modelo pudo divergir; aquí no hay exploración, la única variable real es el modelo.

### 6.2. HALLAZGO CRÍTICO: bug de emparejamiento de criterios en PROTOTIPO (confirmado, P0)

Este es el hallazgo más importante de toda esta auditoría.

**El problema**: 8 de los 14 documentos `Finding` de PROTO-02 tienen el campo `wcagCriterion` **sin el prefijo "WCAG "** — por ejemplo `"1.4.3 Contraste mínimo"` en vez de `"WCAG 1.4.3 Contraste mínimo"`. Esto es una inconsistencia real de la respuesta de Gemini en esta ejecución concreta (confirmado: el prompt de prototipos sí muestra la lista de criterios aplicables con el prefijo correcto, `WCAG 1.4.3` etc., pero la plantilla JSON de salida del prompt de prototipos —a diferencia de la de WEB— no incluye un ejemplo concreto con el prefijo junto al campo `wcagCriterion`, lo que probablemente contribuye a esta inconsistencia).

**La consecuencia, verificada en código, es grave**: la función `normalizeCriterionKey()` (`ground-truth-oracle.ts`) solo reconoce un código WCAG si la cadena contiene literalmente la subcadena `"WCAG"` antes de los dígitos (`/WCAG\s+\d+\.\d+\.\d+/i`). Si el prefijo falta, la función cae a un tercer camino (`criterion.toLowerCase().trim()`) que **no coincide con ningún criterio aplicable** — y esta misma función fragil se reutiliza en **dos puntos distintos y críticos**:

1. **`prototype-metrics.service.ts::calculatePrototypeMetrics`** — los 8 hallazgos mal formateados quedan **silenciosamente excluidos** de `coverage.evaluatedCriteria`, `passCount`, `failCount` y del cálculo del `overallScore`. Esto explica exactamente la discrepancia que señalaste: el "resumen visual" (2 PASS / 3 FAIL / 1 NOT_EVALUABLE = 6) es el resultado de esta exclusión silenciosa — los otros 8 hallazgos, igual de reales y con evidencia completa, simplemente nunca llegan a contarse.
2. **`visual-evidence-gate.service.ts::Gate Rule V5`** (`NON_DEMONSTRABLE_FROM_IMAGE_WCAG_CRITERIA`) — **esta es la consecuencia más grave**. Esta regla existe específicamente para forzar `NOT_EVALUABLE` en WCAG 1.3.1/1.4.3/1.1.1/3.3.2 sin importar lo que diga Gemini, porque el propio diseño del sistema establece que ninguna evidencia visual puede demostrar estos 4 criterios en ninguna dirección. La regla también usa `normalizeCriterionKey(finding.wcagCriterion)` (línea 347) para decidir si aplica — y por el mismo bug de prefijo, **nunca se activó** para los hallazgos #3 y #4 de PROTO-02 (ambos `WCAG 1.4.3`, basados únicamente en `visualContrast: "appears-low"`, una observación cualitativa). **Resultado real y verificado: dos hallazgos FAIL de WCAG 1.4.3, sustentados solo en una impresión visual cualitativa, se persistieron como incumplimientos confirmados — exactamente lo que esta regla se diseñó para impedir.**

**Por qué esto no afecta a WEB de la misma forma (verificado, no asumido)**: el Gate equivalente de WEB para WCAG 1.4.3 (`evidence-gate.service.ts::isWcag143`) usa un patrón distinto y más tolerante: `/^(?:WCAG\s+)?1\.4\.3(?!\.\d)(?:\s|$)/i` — el prefijo `"WCAG "` es **opcional** en esa expresión regular. Es decir: **el Gate de WEB para este mismo problema ya fue diseñado para resistir exactamente esta variación, y el de PROTOTIPO no.** Es un patrón de robustez ya resuelto en una parte del sistema y nunca aplicado a la otra.

**Riesgo latente para WEB (no confirmado, pero real)**: `calculateMetrics` de WEB (consolidación por criterio, `audit-metrics.service.ts`) también usa `normalizeCriterionKey` para su propio `wcagStatusMap` — en las dos evaluaciones WEB reales auditadas (Secciones 1 y 2), **todos** los `wcagCriterion` tenían el prefijo correcto, por lo que este riesgo nunca se manifestó ahí — pero el código no impide que ocurra en una futura evaluación WEB.

### 6.3. Cobertura (Sección 4A del encargo)

| | PROTO-01 (3.5 Flash-Lite) | PROTO-02 (2.5 Flash) |
|---|---|---|
| Criterios evaluados (reales, post-bug) | 1/13 | 5/13 |
| Criterios NOT_EVALUABLE (por criterio) | 12 | 8 |
| Fuera de alcance visual | 6 (idéntico, mismo set fijo) | 6 (idéntico) |
| Evidencias generadas (`evidenceCount`) | 3 | 37 |
| Hallazgos reales persistidos | 3 | 14 |

Gemini 2.5 Flash exploró visiblemente más regiones de la misma imagen (formulario principal, pie de página, iconos sociales, mapa, encabezados, navegación) que Gemini 3.5 Flash-Lite (que solo abordó pie de página y un campo de boletín). **Esto es una diferencia real de exhaustividad**, pero antes de atribuirla "al modelo" en sentido fuerte, nótese que PROTO-01 tiene además un hallazgo menos por el mismo bug de la Sección 6.2 — no se puede descartar que parte de la diferencia de cobertura observada entre ambos modelos sea, en realidad, el mismo bug de emparejamiento afectando también a PROTO-01 en menor medida. (Verificado: los 3 hallazgos de PROTO-01 SÍ tenían el campo correcto — `wcagCriterion`/`heuristicCode` sin prefijo faltante — por lo que en este caso específico la cobertura menor de PROTO-01 es una diferencia real de exhaustividad del modelo, no del bug; pero el riesgo de confundir ambas causas en futuras pruebas es real y debe vigilarse.)

### 6.4. Calidad de los hallazgos (Sección 4B y 4D del encargo)

Los 3 hallazgos de WCAG 1.4.3/3.3.2 de PROTO-01 (NOT_EVALUABLE) están correctamente gateados (Sección 5.3). De los 7 FAIL de PROTO-02:

| Hallazgo | Evaluación |
|---|---|
| N-06, 6 campos del formulario sin etiqueta persistente | Evidencia estructurada (6 ítems `visualLabel`), confianza alta razonable — observación directa y visible. **Correcto.** |
| N-06, campo de email del boletín sin etiqueta | Igual que el anterior, elemento distinto. **Correcto, no es duplicado** (son dos elementos físicamente distintos de la imagen). |
| **WCAG 1.4.3, placeholders del formulario** | **Debió degradarse a NOT_EVALUABLE** (Sección 6.2) — persiste como FAIL por el bug de prefijo. **Falso positivo de severidad arquitectónica**, no de observación: la observación visual (`appears-low`) es plausible, pero el sistema no debería permitir que una impresión cualitativa se presente como un incumplimiento WCAG confirmado. |
| **WCAG 1.4.3, texto de derechos de autor** | Mismo caso exacto que el anterior. **Mismo falso positivo arquitectónico.** |
| N-04, inconsistencia de estilo entre iconos sociales | Evidencia válida (dos descripciones visuales comparadas), pero severidad `low` y la propia descripción reconoce "siguen siendo reconocibles" — bien calibrado, consistente con la advertencia D.2 del encargo (una diferencia de estilo no implica automáticamente un problema relevante; aquí la severidad baja ya refleja eso correctamente). |
| N-03, ausencia de botón de cancelar/borrar | Evidencia visual directa de la ausencia (no una inferencia de comportamiento). Correctamente limitada en su propia descripción a "no presenta un botón visible y dedicado" (nunca afirma que no exista otra forma de cancelar) — alineado con la advertencia D.1 del encargo. Confianza `high` es defendible porque la observación (ausencia de un elemento visual concreto) es, en sí misma, directa. |
| N-06, iconos sociales sin etiqueta de texto | Dos evidencias con `value: ""` (ausencia confirmada visualmente) + un ítem solo-contexto. Bien estructurado, severidad `low` razonable. |

El único NOT_EVALUABLE (N-05, prevención de errores) está correctamente clasificado — coincide exactamente con la advertencia D.3 del encargo (ausencia de mensajes de error en una imagen estática no permite confirmar ausencia de prevención de errores), y la evidencia/descripción lo reflejan con precisión ("no se observan... en esta captura estática").

**Ningún falso positivo adicional detectado más allá de los dos ya señalados (ambos explicados por el bug 6.2, no por un error de juicio de Gemini). No se detectan duplicados reales** (cada hallazgo con el mismo heurístico se refiere a un elemento visual distinto de la imagen).

### 6.5. Evidencia visual y gates (Sección 4C del encargo)

Toda la evidencia de ambas evaluaciones usa exclusivamente `type: VISUAL_OBSERVATION` con propiedades de la lista blanca (`visualLabel`, `visualContrast`, `visibleText`, `grouping`, `colorCoding`, `layout`, `visualHierarchy` — todas confirmadas en `VISUAL_PROPERTY_DEFINITIONS`). Ningún hallazgo PASS carece de al menos un ítem con `property`+`value`+`elementDescription` juntos (regla V4 respetada). El único problema de evidencia confirmado es el de la Sección 6.2 (Gate V5 no disparado por el bug de prefijo) — no un problema de estructura de la evidencia en sí.

### 6.6. Rendimiento y costos (Sección 5 del encargo)

| Métrica | PROTO-01 (3.5 Flash-Lite) | PROTO-02 (2.5 Flash) | Diferencia |
|---|---|---|---|
| Llamadas físicas | 1 | 2 (1 `SCHEMA_MISMATCH` + 1 éxito) | — |
| Tokens de entrada | 7.637 | 6.787 | -11% (Lite mayor, no menor) |
| Tokens de salida | 1.170 | 6.543 | **2.5 Flash generó 5.6× más salida** |
| Tokens totales | 8.807 | 13.330 | +51% en 2.5 Flash |
| Thinking tokens | 0 | 6.131 | mismo patrón ya documentado en WEB |
| Tiempo total | 6.023 ms | 87.557 ms | **2.5 Flash tardó 14.5× más** (incluye 1 reintento) |
| Coste estimado | USD 0.005216 | USD 0.018394 | 2.5 Flash costó 3.5× más |
| Estado del coste | `confirmed` (tarifa no verificada para Lite, Sección 0) | `confirmed-excludes-unverified-thinking-cost` (tarifa de 2.5 Flash SÍ está confirmada) | — |
| Evidencias generadas | 3 | 37 | 2.5 Flash generó 12× más evidencia |
| Hallazgos reales persistidos | 3 | 14 | — |
| Hallazgos que realmente cuentan (post-bug 6.2) | 3 | 6 | — |

**No se declara "más económico" sin matices**: Gemini 3.5 Flash-Lite consumió menos tokens totales y fue mucho más rápido, pero también **exploró visiblemente menos la misma imagen** (3 evidencias vs. 37) — menor costo y menor cobertura están ligados aquí, no son independientes. A diferencia de WEB, el coste de PROTO-02 (2.5 Flash) **sí usa una tarifa confirmada** (coincide con la tabla de precios real del código); el de PROTO-01 sigue sin tarifa verificada para Lite (misma limitación de la Sección 0).

---

## 7. Conclusiones generales, limitaciones y recomendación de modelo

### 7.1. Estado consolidado: WEB

**Vigentes, verificados contra el código actual en esta misma auditoría** (ninguno se corrigió):
- `metricsAudit`/`expectedPersistedFindingsCount` sigue con la política desactualizada (`metrics-tracker.ts:192-205`, confirmado por grep directo) — se reproduce idéntico en ambas evaluaciones WEB.
- `calculateCost` sigue sin fila propia para `gemini-3.5-flash-lite` — el coste de la Entrada 1 de la Sección 2 sigue sin tarifa verificada.
- Ambos resúmenes ejecutivos siguen mostrando desconexión parcial con los hallazgos formales (más marcada en 2.5 Flash).
- Los 3 FAIL de contraste siguen siendo idénticos y confiables en ambos modelos (deterministas, no dependen de IA).

### 7.2. Estado consolidado: PROTOTIPO (nuevo en esta auditoría)

- **Comparación válida y controlada** (Sección 6.1) — misma imagen (hash idéntico), mismo perfil, mismo código.
- **Bug crítico confirmado** (Sección 6.2): el emparejamiento de criterios por prefijo "WCAG " es frágil en PROTOTIPO (a diferencia de WEB, que ya tiene un patrón tolerante para WCAG 1.4.3) y permitió que 2 hallazgos FAIL de WCAG 1.4.3 evadieran el Gate V5, además de excluir silenciosamente 8 de 14 hallazgos de las métricas de PROTO-02.
- El patrón de incumplimiento de contrato "property/value" (ya visto en una evaluación fallida de esta sesión) **también ocurrió en el primer intento de PROTO-02** (con Gemini 2.5 Flash) — confirma que no es exclusivo de un modelo.
- Gemini 2.5 Flash exploró la misma imagen de forma notablemente más exhaustiva (37 evidencias vs. 3; 7 hallazgos distintos de incumplimiento vs. 1) que Gemini 3.5 Flash-Lite.

### 7.3. Problemas por flujo

| Problema | WEB | PROTOTIPO | Compartido |
|---|---|---|---|
| `metricsAudit` con política desactualizada | ✅ | — (el bug de PROTOTIPO es distinto, ver abajo) | No — son dos bugs distintos en el mismo archivo |
| Emparejamiento frágil de `wcagCriterion` sin prefijo | Riesgo latente, no confirmado en los datos reales | ✅ Confirmado, con consecuencia grave (bypass de Gate V5) | Función compartida (`normalizeCriterionKey`), pero solo PROTOTIPO carece de un patrón tolerante propio |
| `calculateCost` sin tarifa para 3.5 Flash-Lite | ✅ | ✅ | Sí |
| Resumen ejecutivo desconectado de hallazgos formales | ✅ | No detectado en PROTO-01/02 | No |
| Incumplimiento de contrato "property/value" (reintentos) | No observado | ✅ (PROTO-02 intento 1, y la evaluación fallida ya analizada) | Específico de PROTOTIPO (el contrato de WEB no tiene esta regla de pares) |
| Campos `Report` WEB-only sin poblar en PROTOTIPO | — | ✅ | Específico de PROTOTIPO |
| `totalFindings` con semántica distinta entre flujos | — | — | Sí, confirmado en ambos (Secciones 3.7 y 5.2/6.2) |

### 7.4. Limitaciones metodológicas generales

- n=1 por modelo en ambos flujos — ninguna conclusión cuantitativa es generalizable sin más repeticiones.
- No se verificó documentación oficial de Google sobre precios ni soporte de "thinking" para `gemini-3.5-flash-lite`.
- La comparación WEB depende de una exploración autónoma no determinista (cada modelo pudo, en principio, tomar decisiones distintas incluso con el mismo prompt); la comparación de PROTOTIPO no tiene esa fuente de variación (imagen estática), por lo que es metodológicamente más limpia.
- No se evaluó el comportamiento de ningún modelo más allá del punto de interrupción/fallo real de cada evaluación.

### 7.5. Recomendación sobre el modelo operativo

**No se puede declarar un ganador general.** La evidencia es mixta y depende de la dimensión:

- **Por velocidad/coste de tokens**: Gemini 3.5 Flash-Lite es claramente superior en ambos flujos (10-14× más rápido), pero el coste reportado no es comparable de forma fiable hasta corregir `calculateCost`.
- **Por exhaustividad/cobertura**: Gemini 2.5 Flash exploró más la misma imagen de prototipo (37 vs. 3 evidencias) y generó más observaciones individuales en WEB (181 vs. 168 PASS) — aunque "más observaciones" no equivale a "mejor calidad" por sí solo.
- **Por confiabilidad de hallazgos confirmados (FAIL)**: ambos modelos coinciden exactamente en los únicos hallazgos deterministas (contraste WEB); en PROTOTIPO, 2 de los 7 FAIL de Gemini 2.5 Flash deberían haber sido NOT_EVALUABLE por un bug de plataforma (no por un error propio del modelo) — esto no debe leerse como "2.5 Flash es menos confiable", sino como una falla del sistema que afecta a cualquier modelo que produzca un `wcagCriterion` sin el prefijo exacto.
- **Por falsos negativos cualitativos**: se identificó uno concreto en Gemini 3.5 Flash-Lite (jerarquía de encabezados en WEB) que no tiene contraparte equivalente confirmada en Gemini 2.5 Flash en esta muestra.

**Recomendación concreta**: mantener `gemini-2.5-flash` como modelo operativo por ahora (ya configurado así), no por ser definitivamente superior, sino porque (a) es el modelo con el que se validó originalmente el sistema, (b) su tarifa de coste SÍ está confirmada en el código, y (c) la evidencia de Gemini 3.5 Flash-Lite, aunque prometedora en velocidad, todavía tiene una muestra demasiado pequeña (n=1 por flujo) para sustituir al modelo de referencia. Revisar esta recomendación después de corregir el backlog P0/P1 (Sección 8) y ejecutar al menos 2-3 pruebas adicionales por modelo y por flujo.

---

## 8. Backlog priorizado de estabilización

> No implementado. Pendiente de tu revisión y aprobación antes de iniciar cualquier corrección.

### P0 — Crítico

**P0-1 — Emparejamiento frágil de `wcagCriterion` en PROTOTIPO permite que hallazgos FAIL evadan el Gate V5**
- **Flujo afectado**: PROTOTIPO (riesgo latente también en WEB, no confirmado).
- **Descripción**: `normalizeCriterionKey()` exige la subcadena literal `"WCAG"` antes de los dígitos. Un `wcagCriterion` sin ese prefijo (ej. `"1.4.3 Contraste mínimo"`) nunca coincide con las claves canónicas, lo que hace que (a) el hallazgo quede excluido de `coverage`/`passCount`/`failCount`/`overallScore`, y (b) el Gate V5 (`NON_DEMONSTRABLE_FROM_IMAGE_WCAG_CRITERIA`), que debería forzar `NOT_EVALUABLE` para WCAG 1.3.1/1.4.3/1.1.1/3.3.2, nunca se active.
- **Evidencia**: PROTO-02 (`6af4a140f337ed352c4b9226`), hallazgos `_id` `6af4a198f337ed352c4b9257` y `6af4a198f337ed352c4b925a` (ambos WCAG 1.4.3, FAIL, deberían ser NOT_EVALUABLE) — 8 de 14 hallazgos en total con el mismo patrón de prefijo faltante.
- **Causa**: confirmada — `normalizeCriterionKey` (`ground-truth-oracle.ts:99-106`) requiere coincidencia exacta del patrón `/WCAG\s+\d+\.\d+\.\d+/i`.
- **Archivos/módulos**: `src/shared/testing/ground-truth-oracle.ts` (`normalizeCriterionKey`), `src/modules/evaluations/services/prototype-metrics.service.ts`, `src/modules/evaluations/services/visual-evidence-gate.service.ts` (línea 51-52, 347).
- **Corrección recomendada**: hacer que `normalizeCriterionKey` reconozca el código WCAG con o sin el prefijo "WCAG " (mismo principio ya usado con éxito en `evidence-gate.service.ts::WCAG_143_PATTERN`, que usa `(?:WCAG\s+)?` opcional) — una corrección puntual en una sola función compartida, sin tocar su interfaz.
- **Riesgo de la corrección**: bajo — es una ampliación de qué cadenas reconoce, no un cambio de comportamiento para las cadenas ya bien formadas.
- **Prueba de regresión necesaria**: repetir el cálculo de métricas y el Gate V5 contra los 14 hallazgos reales de PROTO-02 (como fixture) y confirmar que los 8 hallazgos antes excluidos ahora se clasifican correctamente, y que las dos de WCAG 1.4.3 quedan forzadas a `NOT_EVALUABLE`.
- **Dependencias**: ninguna — es la causa raíz de P1-1 también.

**P0-2 — `metricsAudit` reporta una advertencia falsa de "fallo parcial de persistencia" en WEB**
- **Flujo afectado**: WEB.
- **Descripción**: `expectedPersistedFindingsCount` usa la fórmula de la política de persistencia anterior (FAIL+NOT_EVALUABLE); la política real (`PASS_PERSISTED`) persiste las tres categorías. La discrepancia resultante dispara una advertencia textual de "posible fallo parcial de persistencia" que es falsa.
- **Evidencia**: ambas evaluaciones WEB de este documento (Secciones 1 y 2) muestran la advertencia; verificado que los documentos `Finding` reales coinciden exactamente con `persistedFindingsCount` en ambos casos.
- **Causa**: confirmada — `metrics-tracker.ts::buildMetricsAudit`, línea 191-193 y 204-209.
- **Archivos/módulos**: `src/shared/infrastructure/metrics-tracker.ts`.
- **Corrección recomendada**: actualizar `expectedPersistedFindingsCount` para sumar `FAIL + NOT_EVALUABLE + PASS` bajo la política `PASS_PERSISTED`, y corregir el texto de `note`.
- **Riesgo de la corrección**: bajo — función pura, ya extraída y testeada.
- **Prueba de regresión necesaria**: `metrics-tracker.test.ts`/equivalente con casos que cubran ambas políticas históricas (si se decide distinguir reportes antiguos de nuevos).
- **Dependencias**: ninguna.

### P1 — Alto

**P1-1 — Campos de `Report` diseñados para WEB quedan sin poblar (y potencialmente mal interpretados) en PROTOTIPO**
- **Flujo afectado**: PROTOTIPO.
- **Descripción**: `evaluatedCriteria`, `totalCriteria`, `auditCoverage`, `wcagCompliance`, `nielsenCompliance`, `wcagCoverage`, `nielsenCoverage` nunca se calculan para prototipos y muestran sus valores por defecto de Mongoose, fácilmente confundibles con mediciones reales de 0%.
- **Evidencia**: PROTO-01 y PROTO-02, ambos con `evaluatedCriteria: 0`/`totalCriteria: 20`/`auditCoverage: 0` pese a tener cobertura real distinta (`coverage.evaluatedCriteria`: 1 y 5 respectivamente).
- **Causa**: confirmada — `prototype-evaluation.service.ts` nunca asigna estos campos al construir `reportData`.
- **Archivos/módulos**: `src/modules/evaluations/services/prototype-evaluation.service.ts`, `src/modules/reports/report.model.ts`.
- **Corrección recomendada**: omitir estos campos del todo para `type: 'prototype'` (dejarlos `undefined`, no persistirlos) en vez de dejar que tomen un default engañoso — o, alternativamente, documentar explícitamente en el modelo que son "solo WEB". Evaluar si vale la pena separar el schema en dos sub-documentos en una fase posterior (no en esta).
- **Riesgo**: bajo-medio — cualquier consumidor del frontend que lea estos campos sin comprobar `type` podría necesitar ajuste.
- **Prueba de regresión**: confirmar que ningún componente del frontend ya dependa de que estos campos existan con un valor numérico para prototipos.
- **Dependencias**: relacionado con P2-1 (semántica de `totalFindings`).

**P1-2 — Incumplimiento recurrente del contrato "property/value deben aparecer juntos" en prototipos**
- **Flujo afectado**: PROTOTIPO.
- **Descripción**: Gemini (ambos modelos observados) produce ocasionalmente evidencia con `property` presente y `value: null`, violando la regla de `VisualEvidenceItemSchema`. Ya causó una evaluación completamente fallida (4/4 intentos agotados) y un reintento en PROTO-02.
- **Evidencia**: evaluación fallida `6af49f3ff337ed352c4b8f82` (3 intentos consecutivos con este error) y PROTO-02 intento 1.
- **Causa probable**: la plantilla JSON de salida del prompt de prototipos (`ai.service.ts`, línea ~1168) no incluye un ejemplo concreto mostrando el par `property`/`value` correctamente formado, a diferencia de la plantilla de WEB.
- **Archivos/módulos**: `src/modules/ai/ai.service.ts` (`buildPrototypeAuditPrompt`).
- **Corrección recomendada**: añadir un ejemplo explícito en la plantilla JSON (igual que ya existe en WEB) mostrando que `value` nunca debe ser `null` cuando `property` está presente, y reforzar la regla 7 existente con ese ejemplo.
- **Riesgo**: bajo — es un cambio de texto del prompt, no de lógica; requiere validar que no se rompa el formato esperado en otros aspectos.
- **Prueba de regresión**: repetir (manualmente, con autorización futura) la evaluación del mismo prototipo y confirmar una tasa menor de `SCHEMA_MISMATCH`.
- **Dependencias**: ninguna.

### P2 — Medio

**P2-1 — `totalFindings` tiene semántica incompatible entre WEB y PROTOTIPO**
- **Flujo afectado**: Ambos (incompatibilidad entre ellos).
- **Descripción**: en WEB, `totalFindings` = conteo de hallazgos `FAIL` por severidad; en PROTOTIPO, `totalFindings` = conteo de TODOS los hallazgos (`findings.length`), cualquier estado. Mismo nombre de campo, significado distinto.
- **Evidencia**: WEB (Secciones 1/2): `totalFindings: 3` = suma de severidades FAIL. PROTOTIPO (PROTO-02): `totalFindings: 14` ≠ suma de severidades (`criticalCount+highCount+mediumCount+lowCount = 1`).
- **Causa**: confirmada — definiciones independientes en `audit-metrics.service.ts` vs. `prototype-metrics.service.ts`.
- **Archivos/módulos**: ambos servicios de métricas.
- **Corrección recomendada**: documentar explícitamente la diferencia en el modelo (comentario en `report.model.ts`) como mínimo; considerar, en una fase separada, unificar el significado si el frontend los presenta de forma intercambiable.
- **Riesgo**: medio si se decide unificar (cambiaría un valor ya usado); bajo si solo se documenta.
- **Prueba de regresión**: ninguna si solo se documenta.
- **Dependencias**: relacionado con P1-1.

**P2-2 — `cumulativeCostUsd` no es utilizable por evaluación**
- **Flujo afectado**: Ambos.
- **Descripción**: es un contador de proceso (vida del backend), no por evaluación — puede confundirse con el coste real de una evaluación específica si varias comparten el mismo proceso.
- **Evidencia**: PROTO-01 (`cumulativeCostUsd: 0.029017`) = su propio coste + el de la Entrada 1 WEB de Gemini 3.5 Flash-Lite, confirmado por aritmética exacta.
- **Causa**: diseño original de `MetricsTracker` como singleton de proceso.
- **Archivos/módulos**: `src/shared/infrastructure/metrics-tracker.ts`.
- **Corrección recomendada**: ninguna funcional necesaria — documentar claramente en el propio campo (comentario de esquema) que es acumulado por proceso, no por evaluación, para evitar que se use mal en futuras comparaciones.
- **Riesgo**: ninguno (solo documentación).
- **Prueba de regresión**: ninguna.
- **Dependencias**: ninguna.

### P3 — Bajo

**P3-1 — Tabla de precios sin tarifa confirmada para `gemini-3.5-flash-lite`**
- **Flujo afectado**: Ambos.
- **Descripción**: ya documentado en la Sección 0 y confirmado empíricamente en las 4 evaluaciones de 3.5 Flash-Lite de este documento.
- **Evidencia**: todas las entradas de 3.5 Flash-Lite en este documento.
- **Causa**: confirmada — `metrics-tracker.ts::calculateCost` no tiene una rama para este modelo.
- **Archivos/módulos**: `src/shared/infrastructure/metrics-tracker.ts`.
- **Corrección recomendada**: obtener la tarifa oficial de Google para `gemini-3.5-flash-lite` antes de añadir una rama específica — no inventar un número.
- **Riesgo**: bajo.
- **Prueba de regresión**: verificar que el nuevo cálculo coincida con la tarifa oficial documentada.
- **Dependencias**: bloqueado por disponibilidad de la tarifa oficial (fuera del control del equipo).

**P3-2 — Posible debilidad de Gemini 3.5 Flash-Lite en seguimiento de pasos ya completados (Fase 1 WEB)**
- **Flujo afectado**: WEB.
- **Descripción**: en la Entrada 1 de la Sección 2, el modelo repitió una acción ya ejecutada con éxito un paso antes, en vez de reconocer que el objetivo ya se había cumplido.
- **Evidencia**: Sección 3.5, decisiones reales de `AiInteraction` de la evaluación B.
- **Causa**: no confirmada — observación de una sola muestra.
- **Archivos/módulos**: posiblemente `ai.service.ts::buildV2DecisionPrompt` (cómo se comunica `completedSteps`/`currentStepObjective`).
- **Corrección recomendada**: ninguna todavía — recopilar más muestras antes de modificar el prompt de Fase 1.
- **Riesgo**: N/A (no se interviene aún).
- **Prueba de regresión**: N/A.
- **Dependencias**: requiere más evaluaciones WEB con Gemini 3.5 Flash-Lite.

---

## 9. RONDA 1 — GEMINI 3.5 FLASH-LITE

> **Registro oficial de cierre de la Ronda 1 (`gemini-3.5-flash-lite`) — 11 y 12 de noviembre de 2026.**
> Esta sección consolida, preserva y analiza técnica y metodológicamente las tres ejecuciones reales que integran la **Ronda 1 — Gemini 3.5 Flash-Lite** (una evaluación de PROTOTIPO post-estabilización y dos evaluaciones WEB sobre OpenCart ejecutadas antes y después del cierre de estabilización P0-1..P2-2). Los documentos históricos en MongoDB se conservan intactos sin ninguna modificación.

### 9.1. Inventario de ejecuciones registradas en la Ronda 1

| Código en ronda | Flujo | Evaluation ID | Report ID | Título | Fecha (UTC) | Estado del código backend | Modelo configurado / solicitado / efectivo |
|---|---|---|---|---|---|---|---|
| **A. PROTOTIPO** | `prototype` | `6af5dfcbb112ec17f1728161` | `6af5dfcfb112ec17f1728171` | `Contact Prototype 2 using 3.5 lite` | `2026-11-12T15:48:27.584Z` | **Post-estabilización** (P0-1, P0-2, P1-1, P1-2, P2-1, P2-2 activos) | `gemini-3.5-flash-lite` / `gemini-3.5-flash-lite` / `gemini-3.5-flash-lite` |
| **B. WEB (11 nov)** | `website` | `6af48ff0c1d54382d38c576e` | `6af49008c1d54382d38c6568` | `Evalación OpenCart 2 (3.5)` | `2026-11-11T15:55:28.356Z` | **Pre-estabilización** (anterior a P0-1..P2-2) | `gemini-3.5-flash-lite` / `gemini-3.5-flash-lite` / `gemini-3.5-flash-lite` |
| **C. WEB (12 nov)** | `website` | `6af5e1eeb112ec17f1728192` | `6af5e209b112ec17f17292da` | `OpenCart evaluation 2 (3.5 lite)` | `2026-11-12T15:57:34.267Z` | **Post-estabilización** (P0-1, P0-2, P1-1, P1-2, P2-1, P2-2 activos) | `gemini-3.5-flash-lite` / `gemini-3.5-flash-lite` / `gemini-3.5-flash-lite` |

---

### 9.2. Resumen cuantitativo de las tres evaluaciones

#### 9.2.1. Métricas de cobertura, cumplimiento y hallazgos

| Métrica | A. PROTOTIPO (`6af5dfcbb112ec17f1728161`) | B. WEB 11 nov (`6af48ff0c1d54382d38c576e`) | C. WEB 12 nov (`6af5e1eeb112ec17f1728192`) |
|---|---|---|---|
| **Report ID** | `6af5dfcfb112ec17f1728171` | `6af49008c1d54382d38c6568` | `6af5e209b112ec17f17292da` |
| **Perfil evaluador** | `6a714bfd22b377d22d439c05` (Laura Martínez) | `6a714bfd22b377d22d439c05` (Laura Martínez) | `6a714bfd22b377d22d439c05` (Laura Martínez) |
| **Objeto evaluado** | Imagen KassaPay Contact Page (`205.224 bytes`, `SHA-256: 4f3a19a5...e427`) | `https://opencart-demo.smartfront.io` | `https://opencart-demo.smartfront.io/` |
| **Score global (`overallScore`)** | `0/100` | `49/100` | `49/100` |
| **Criterios aplicables** | `13` (`coverage.applicableCriteria`) | `20` (`totalCriteria`) | `20` (`totalCriteria`) |
| **Criterios evaluados (PASS + FAIL)** | `1` (`coverage.evaluatedCriteria`, `7,69 %`) | `5` (`evaluatedCriteria`, `auditCoverage: 25 %`) | `5` (`evaluatedCriteria`, `auditCoverage: 25 %`) |
| **Criterios `NOT_EVALUABLE` (por criterio)** | `12` (`coverage.notEvaluableCriteria`) | `15` (`notEvaluableCount`) | `15` (`notEvaluableCount`) |
| **Criterios `OUT_OF_COVERAGE`** | `6` (`coverage.outOfCoverageCriteria`: `WCAG 4.1.2`, `2.1.1`, `N-01`, `N-07`, `N-09`, `N-10`) | N/A (flujo WEB) | N/A (flujo WEB) |
| **Distribución por criterio (`PASS / FAIL / NOT_EVALUABLE`)** | `0 / 1 / 12` | `4 / 1 / 15` | `4 / 1 / 15` |
| **Cumplimiento WCAG / Cobertura WCAG** | `null` / N/A (omitido por P1-1) | `80 %` (`4 PASS / 5 eval.`) / `50 %` (`5/10`) | `80 %` (`4 PASS / 5 eval.`) / `50 %` (`5/10`) |
| **Cumplimiento Nielsen / Cobertura Nielsen** | `null` / N/A (omitido por P1-1) | `null` / `0 %` (`0/10`) | `null` / `0 %` (`0/10`) |
| **Hallazgos consolidados (`FAIL / PASS / NOT_EVALUABLE`)** | `1 / 0 / 1` (total `2`) | `3 / 168 / 2` (total `173`) | `3 / 153 / 5` (total `161`) |
| **`Report.totalFindings` (según semántica P2-1)** | `2` (todos los estados en PROTOTIPO) | `3` (solo `FAIL` en WEB) | `3` (solo `FAIL` en WEB) |
| **Severidades `FAIL` (`critical / high / medium / low`)** | `0 / 0 / 0 / 1` (`infoCount: 1`) | `0 / 3 / 0 / 0` (`infoCount: 169`) | `0 / 3 / 0 / 0` (`infoCount: 157`) |
| **Evidencias totales (`evidenceCount`)** | `2` | `258` | `238` |
| **`metricsAudit.expectedPersistedFindingsCount`** | N/A (flujo PROTOTIPO) | **`5`** (**Problema histórico pre-P0-2**) | **`161`** (**Verificado post-P0-2**) |
| **`metricsAudit.persistedFindingsCount`** | N/A (`2` documentos `Finding` en BD) | **`173`** (`173` documentos `Finding` en BD) | **`161`** (`161` documentos `Finding` en BD) |
| **Política de persistencia (`findingPersistencePolicy`)** | `PASS_PERSISTED` | `PASS_PERSISTED` | `PASS_PERSISTED` |

#### 9.2.2. Consumo de tokens, tiempos y costos

| Métrica | A. PROTOTIPO (`6af5dfcbb112ec17f1728161`) | B. WEB 11 nov (`6af48ff0c1d54382d38c576e`) | C. WEB 12 nov (`6af5e1eeb112ec17f1728192`) |
|---|---|---|---|
| **Llamadas Fase 1 (navegación IA)** | `0` | `3` (+ `1` iteración `RuleEngine`) | `5` (+ `1` iteración `RuleEngine`) |
| **Llamadas Fase 2 / Auditoría IA** | `1` (intentos físicos: `1`) | `1` (intentos físicos: `1`) | `1` (intentos físicos: `1`) |
| **Tokens de entrada (`promptTokens`)** | `7.803` | `71.353` (`21.189` Fase 1 + `50.164` Fase 2) | `79.889` (`30.064` Fase 1 + `49.825` Fase 2) |
| **Tokens de salida (`outputTokens`)** | `767` | `958` (`567` Fase 1 + `391` Fase 2) | `1.354` (`953` Fase 1 + `401` Fase 2) |
| **Thinking tokens (`thinkingTokens`)** | `0` (ausente en `usageMetadata`) | `0` (ausente en `usageMetadata`) | `0` (ausente en `usageMetadata`) |
| **Tokens totales (`totalTokens`)** | `8.570` | `72.311` | `81.243` |
| **Tiempo total (`totalExecutionTimeMs`)** | `4.135 ms` | `6.796 ms` (`4.224 ms` Fase 1 + `2.572 ms` Fase 2) | `9.840 ms` (`7.370 ms` Fase 1 + `2.470 ms` Fase 2) |
| **Costo estimado individual (`estimatedCostUsd`)** | **`USD 0.004258`** | **`USD 0.023801`** | **`USD 0.027352`** |
| **Costo acumulado de proceso (`cumulativeCostUsd`)** | `USD 0.004258` (1.ª eval. tras reinicio) | `USD 0.023801` (1.ª eval. de su proceso) | `USD 0.031610` (`= 0.004258 + 0.027352`) |
| **Estado del costo (`costStatus`)** | `confirmed` (tarifa USD 0.30 / USD 2.50 por 1M) | `confirmed` (tarifa USD 0.30 / USD 2.50 por 1M) | `confirmed` (tarifa USD 0.30 / USD 2.50 por 1M) |

---

### 9.3. Análisis técnico y metodológico individual

#### 9.3.1. Evaluación A — PROTOTIPO (`6af5dfcbb112ec17f1728161` / Report `6af5dfcfb112ec17f1728171`)

1. **Verificación de identidad de imagen y trazabilidad del modelo (Observado)**:
   - El archivo `/uploads/prototypes/prototype_468b5473-2e37-40a0-a492-b144c9d09750.jpg` tiene exactamente `205.224 bytes` y hash `SHA-256: 4f3a19a507dac24bd9a2b48dbb54255efb943b903e58406a93c98145d242e427`, idéntico byte por byte a `PROTO-01` (`6af49726c1d54382d38c6a12`) y `PROTO-02` (`6af4a140f337ed352c4b9226`).
   - El documento `AiInteraction` (`_id: 6af5dfcfb112ec17f1728168`, `phase: PROTOTYPE`) registra un único intento físico (`attemptNumber: 1`, `outcome: SUCCESS`) con `modelRequested: "gemini-3.5-flash-lite"` y `modelVersionEffective: "gemini-3.5-flash-lite"`.
   - Se verifica también en producción el efecto de las correcciones de estabilización **P1-1** (los 7 campos exclusivos de WEB como `auditCoverage`, `evaluatedCriteria: 0` y `totalCriteria: 20` ya no aparecen en el documento `Report`) y **P1-2** (el modelo respetó el contrato de pares `property`/`value` a la primera llamada, sin reintentos por `SCHEMA_MISMATCH`).

2. **Por qué solo se evaluó 1 de los 13 criterios aplicables y los otros 12 quedaron como `NOT_EVALUABLE` (Observado + Problema identificado de exhaustividad del modelo)**:
   - Según `prototype-criteria-resolver.ts`, el espacio de 19 criterios se divide en **6 `OUT_OF_COVERAGE`** (excluidos del prompt: `WCAG 4.1.2`, `WCAG 2.1.1`, `N-01`, `N-07`, `N-09`, `N-10`) y **13 aplicables** enviados a Gemini:
     - **4 criterios WCAG `PARTIALLY_EVALUABLE` no demostrables desde imagen estática** (`WCAG 1.1.1`, `WCAG 1.3.1`, `WCAG 1.4.3`, `WCAG 3.3.2`): tanto el prompt como la regla determinista **Gate V5** (`NON_DEMONSTRABLE_FROM_IMAGE_WCAG_CRITERIA`) fuerzan que cualquier observación sobre ellos quede en `NOT_EVALUABLE` (nunca `PASS` ni `FAIL`). En consecuencia, el máximo teórico de criterios que pueden alcanzar estado `PASS` o `FAIL` en una imagen estática es de **9 criterios** (`WCAG 1.4.1`, `WCAG 2.4.4`, `WCAG 2.4.6`, `N-02`, `N-03`, `N-04`, `N-05`, `N-06`, `N-08`; u **8** si el formulario estático no muestra un estado de error activo para `N-05`).
   - En esta ejecución, sin embargo, los registros de auditoría del servidor (`[VisualEvidenceGateAudit] total=2 noIdentity=0 foreignEvidence=0 dynamicBehaviorClaim=0`, `[WcagCardinalityAudit] total=2 violations=0`, `[VisualEvidenceConsistencyAudit] total=2 consistent=2`) demuestran que **`gemini-3.5-flash-lite` emitió únicamente 2 hallazgos en toda su respuesta JSON (`767` tokens de salida)**:
     1. `WCAG 1.4.3 Contraste mínimo` (`status: NOT_EVALUABLE`, `_id: 6af5dfcfb112ec17f172816b`).
     2. `N-02 Coincidencia entre el sistema y el mundo real` (`status: FAIL`, `_id: 6af5dfcfb112ec17f172816e`).
   - Para los otros **11 criterios aplicables** (`WCAG 1.4.1`, `WCAG 1.3.1`, `WCAG 2.4.4`, `WCAG 2.4.6`, `WCAG 1.1.1`, `WCAG 3.3.2`, `N-03`, `N-04`, `N-05`, `N-06`, `N-08`), el modelo guardó **silencio absoluto** (cero objetos en `findings`). En `PrototypeMetricsService.calculatePrototypeMetrics`, todo criterio aplicable que no recibe al menos un hallazgo `PASS` o `FAIL` se contabiliza en `coverage.notEvaluableCriteria = applicableCriteria (13) - evaluatedCriteria (1) = 12` (1 hallazgo explícito `NOT_EVALUABLE` + 11 omisiones del modelo).
   - **Evidencia directa de que el modelo omitió criterios que SÍ podían evaluarse en esta imagen**:
     - Al contrastar contra otras ejecuciones sobre el **mismo archivo de imagen exacto** (`SHA-256: 4f3a19a5...e427`), queda demostrado que la imagen contiene elementos visuales directos para evaluar múltiples criterios omitidos aquí:
       - En `PROTO-01` (`6af49726c1d54382d38c6a12`), el propio `gemini-3.5-flash-lite` sí había evaluado **`N-06` (`FAIL`)** sobre el campo de suscripción al boletín (`placeholder="Email"` sin etiqueta visible fija) y había reportado **`WCAG 3.3.2` (`NOT_EVALUABLE`)** sobre los 6 campos del formulario principal (`Name`, `Company`, `Phone`, `Email`, `Subject`, `Message`). En `6af5dfcbb112ec17f1728161`, el modelo ignoró por completo tanto el formulario principal como el boletín del pie de página.
       - En `PROTO-02` (`6af4a140f337ed352c4b9226`), `gemini-2.5-flash` evaluó sobre la misma imagen **`N-06`** (formulario principal y boletín), **`N-03`** (ausencia de botón visible para cancelar/limpiar el formulario), **`N-04`** (consistencia visual de encabezados e iconos), **`N-05`** (`NOT_EVALUABLE` sobre prevención de errores en captura estática), **`N-08`**, **`WCAG 2.4.6`** y **`WCAG 2.4.4`**, generando 14 hallazgos y 37 evidencias.
     - Se confirma así que la baja cobertura (`1/13`) de `6af5dfcbb112ec17f1728161` es un **falso negativo de exhaustividad (sub-generación severa) de `gemini-3.5-flash-lite`**, sumado a una variabilidad intra-modelo entre `PROTO-01` (que evaluó `N-06` y omitió `N-02`) y esta ejecución (que evaluó `N-02` y omitió `N-06`).

3. **Análisis crítico del hallazgo `N-02` (`FAIL`, `_id: 6af5dfcfb112ec17f172816e`) — ¿Es evidencia suficiente para `N-02`?**:
   - **Datos registrados en el hallazgo**:
     - `heuristicCode`: `"N-02"`, `heuristicName`: `"Coincidencia entre el sistema y el mundo real"`
     - `status`: `"FAIL"`, `severity`: `"low"`, `confidence`: `"high"`
     - `description`: *"En la sección de contacto, los iconos de redes sociales situados abajo a la izquierda se presentan como círculos azules sin etiquetas de texto que identifiquen claramente cada plataforma a primera vista."*
     - `evidence[0]`: `{ type: "VISUAL_OBSERVATION", property: "visualLabel", value: "", context: "Los iconos muestran logotipos reconocibles pero carecen de texto adyacente o tooltip visible en esta vista estática.", elementDescription: "Iconos circulares de redes sociales", region: "middle-left" }`
     - `recommendation`: *"Incluir etiquetas de texto visibles junto a los iconos o asegurar que incorporen nombres descriptivos equivalentes en el código final."*
   - **Evaluación metodológica rigurosa**:
     1. **Contradicción interna con la definición de `N-02`**: La heurística **N-02 (Coincidencia entre el sistema y el mundo real)** evalúa si el sistema emplea lenguaje, conceptos, metáforas y convenciones del mundo real familiares para el usuario. El propio campo `evidence[0].context` generado por el modelo admite que **"los iconos muestran logotipos reconocibles"**. En el diseño web moderno, representar enlaces a perfiles de redes sociales mediante sus logotipos oficiales dentro de una hilera de iconos en el bloque de contacto o pie de página **es** la convención estándar del mundo real. Si el logotipo es reconocible por sí mismo, la ausencia de una etiqueta de texto adyacente ("Facebook", "Instagram", etc.) **no constituye evidencia suficiente de un incumplimiento de `N-02`**.
     2. **Desplazamiento / confusión de criterio (`N-02` vs. `N-06` y `WCAG 1.1.1` / `4.1.2`)**:
        - Si el argumento fuera que el usuario debe recordar el significado del icono por falta de etiqueta visible, el criterio correspondiente sería **N-06 (Reconocimiento antes que recuerdo)** (donde, de hecho, `PROTO-02` clasificó la misma observación), no `N-02`.
        - Si el argumento fuera la necesidad de *"nombres descriptivos equivalentes en el código final"* (como sugiere la segunda mitad de `recommendation`) o la presencia de un *tooltip* al pasar el cursor (como menciona `context`), ambos aspectos dependen del DOM (`aria-label`, `alt`, `title`) o de la interacción dinámica, los cuales pertenecen a **`WCAG 1.1.1`** (`PARTIALLY_EVALUABLE`, forzado a `NOT_EVALUABLE` en imagen estática) y **`WCAG 4.1.2`** (`OUT_OF_COVERAGE` en imagen estática).
     3. **Conclusión sobre `N-02`**: El hallazgo cumple **estructuralmente** el contrato de `VisualEvidenceItemSchema` (`property: "visualLabel"`, `value: ""`, `elementDescription`, `region`), razón por la cual superó legítimamente los Gates deterministas (que validan estructura, trazabilidad y no-inferencia dinámica, pero no juzgan la pertinencia teórica entre dos heurísticas de Nielsen). Sin embargo, **metodológicamente es una clasificación débil / cuestionable (posible falso positivo de `N-02` con `confidence: "high"` sobreestimada)**, y al ser el único criterio con veredicto (`1/13`), arrastra por sí solo el `overallScore` del prototipo a `0/100`.

---

#### 9.3.2. Evaluación B — WEB del 11 de noviembre (`6af48ff0c1d54382d38c576e` / Report `6af49008c1d54382d38c6568`)

1. **Origen exacto de la discrepancia en `metricsAudit` (`expectedPersistedFindingsCount: 5` vs. `persistedFindingsCount: 173`) (Problema identificado en registro histórico)**:
   - En el documento `Report` (`6af49008c1d54382d38c6568`), `metrics.metricsAudit` registra:
     - `consolidatedByStatus: { FAIL: 3, PASS: 168, NOT_EVALUABLE: 2 }`
     - `expectedPersistedFindingsCount: 5`
     - `persistedFindingsCount: 173`
     - `note`: incluye la alerta `"ADVERTENCIA: el conteo real persistido (173) no coincide con el esperado (5) — posible fallo parcial de persistencia."`
   - **Verificación en código y en base de datos**:
     - La consulta directa a la colección `findings` para `evaluationId: ObjectId("6af48ff0c1d54382d38c576e")` confirma que existen exactamente **173 documentos `Finding`** (`3 FAIL + 2 NOT_EVALUABLE + 168 PASS`), coincidiendo 1:1 con `persistedFindingsCount: 173` y con la suma de `consolidatedByStatus` (`3 + 2 + 168 = 173`).
     - El origen de la discrepancia estuvo en `src/shared/infrastructure/metrics-tracker.ts::buildMetricsAudit`: cuando se implementó el cambio metodológico `P1.7.2` en `src/modules/evaluations/services/audit-engine.service.ts` (paso 9, política `PASS_PERSISTED` que pasó a persistir `FAIL`, `NOT_EVALUABLE` y `PASS`), la función `buildMetricsAudit` conservó por error la fórmula de la política anterior (`P1.5.2` `PASS_DISCARDED`): `expectedPersistedFindingsCount = consolidatedByStatus.FAIL + consolidatedByStatus.NOT_EVALUABLE` (`3 + 2 = 5`).
     - Este defecto fue corregido posteriormente mediante la intervención **P0-2** en `metrics-tracker.ts:199-200` (confirmado por la Evaluación C del 12 de noviembre, donde `expectedPersistedFindingsCount: 161 === persistedFindingsCount: 161`).
     - Conforme a la regla de preservación histórica, el documento `6af49008c1d54382d38c6568` **no se modifica en MongoDB** y queda registrado aquí como una anomalía histórica de auditoría de persistencia ya diagnosticada y resuelta en el código para ejecuciones posteriores.

2. **Cobertura, hallazgos y evidencias de la Evaluación B (Observado)**:
   - De los **173 hallazgos persistidos**, **172 provienen del analizador determinista (`DeterministicAnalyzer`)** sobre los 4 snapshots capturados (`3 FAIL` de `WCAG 1.4.3` con ratios `1.37:1`, `1.33:1` y `1.38:1` en los enlaces `"Apparel"`, `"Audio"` y `"Home"`; `1 NOT_EVALUABLE` de `WCAG 1.4.3` por fondo semitransparente `rgba(255, 255, 255, 0.18)` en `"New season — 46 arrivals"`; y `168 PASS` distribuidos en `WCAG 2.4.4`: 82, `WCAG 1.1.1`: 33, `WCAG 1.4.3`: 25, `WCAG 4.1.2`: 23 y `WCAG 3.3.2`: 5).
   - **Aporte real de `gemini-3.5-flash-lite` en Fase 2**: el modelo devolvió **1 único hallazgo** en toda la auditoría de Fase 2 (`_id: 6af49008c1d54382d38c6565`, `N-04` / `WCAG 1.3.1`, afirmando `PASS` en jerarquía de encabezados con un único selector `div > section > div > h1`), el cual fue degradado a **`NOT_EVALUABLE`** por los Gates deterministas (`EvidenceTraceabilityService`: selector fuera del índice priorizado; `EvidenceClaimConsistencyService`: un único `h1` es insuficiente para demostrar jerarquía completa `h1..h3`). Por tanto, **el 100 % de los 5 criterios evaluados (`4 PASS` y `1 FAIL`) en el reporte final provino del analizador determinista, y 0 % del modelo de IA**.

---

#### 9.3.3. Evaluación C — WEB del 12 de noviembre (`6af5e1eeb112ec17f1728192` / Report `6af5e209b112ec17f17292da`)

1. **Verificación de persistencia (`metricsAudit`) y costos (Observado)**:
   - En `Report.metrics.metricsAudit`, los conteos coinciden exactamente:
     - `consolidatedByStatus: { FAIL: 3, PASS: 153, NOT_EVALUABLE: 5 }`
     - `expectedPersistedFindingsCount: 161`
     - `persistedFindingsCount: 161`
   - La consulta directa a MongoDB confirma que existen exactamente **161 documentos `Finding`** para `evaluationId: ObjectId("6af5e1eeb112ec17f1728192")`, validando empíricamente la corrección **P0-2**.
   - El costo individual de la evaluación fue **`USD 0.027352`** (`79.889` tokens de entrada × `USD 0.30/1M` = `USD 0.0239667` + `1.354` tokens de salida × `USD 2.50/1M` = `USD 0.0033850` $\rightarrow$ `USD 0.027352`). El campo `cumulativeCostUsd: 0.031610` corresponde a la suma exacta en memoria del proceso backend (`PID 27846`) entre la Evaluación A de prototipo (`USD 0.004258`) y esta Evaluación C (`USD 0.027352`).

2. **Reconstrucción exacta de la exploración y causa del fallo `ACTION_FAILED` en `body > nav > a:nth-of-type(1)` (Observado + Problema identificado)**:
   - Secuencia de las **6 iteraciones** registradas en `aiinteractions` y `snapshotevidences`:
     - **Iteración 1** (`Snapshot 1`, URL `https://opencart-demo.smartfront.io/`, portada con banner de cookies): `gemini-3.5-flash-lite` (`7.128` in / `170` out) decide `CLICK` en `button:nth-of-type(3)` (aceptar cookies). Playwright ejecuta el clic con éxito (`result: "success"`).
     - **Iteración 2** (`Snapshot 2`, URL `https://opencart-demo.smartfront.io/`, portada sin banner): `gemini-3.5-flash-lite` (`6.985` in / `186` out) decide `CLICK` en `nav > div:nth-of-type(3) > a` (enlace `"Sign in"` del encabezado). Playwright ejecuta el clic con éxito (`result: "success"`).
     - **Iteración 3** (`Snapshot 3`, URL `https://opencart-demo.smartfront.io/`, capturado antes de que completara la transición a `/login` porque `page.waitForLoadState('domcontentloaded')` en `automation.service.ts:683` resuelve de inmediato sobre el documento actual): al recibir una captura que aún muestra la portada, `gemini-3.5-flash-lite` (`7.062` in / `182` out) **repite exactamente la misma acción** (`CLICK` en `nav > div:nth-of-type(3) > a`). Playwright vuelve a hacer clic con éxito y la página queda en `/login`.
     - **Iteración 4** (`Snapshot 4`, URL `https://opencart-demo.smartfront.io/login`, página `"Sign in"`): `gemini-3.5-flash-lite` (`4.424` in / `215` out) decide `CLICK` en `p:nth-of-type(2) > a` (`"New here? Create an account"`). Playwright ejecuta el clic con éxito (`result: "success"`).
     - **Iteración 5** (`Snapshot 5`, URL `https://opencart-demo.smartfront.io/login`, capturado justo antes de completarse la transición a `/register`): `gemini-3.5-flash-lite` (`4.465` in / `200` out) decide cambiar de rumbo y explorar el catálogo haciendo `CLICK` en `body > nav > a:nth-of-type(1)` (con texto `"Shop"`).
       - **Por qué falló Playwright (`ACTION_FAILED`)**: `page.click('body > nav > a:nth-of-type(1)')` resolvió al elemento `<a href="/" data-path="/" class="mrd-tabbar__item" data-testid="meridian-tab-shop">Shop</a>`, que corresponde a la **barra de navegación inferior exclusiva para dispositivos móviles (`mrd-tabbar__item`)**, oculta mediante CSS (`element is not visible`) en el *viewport* de escritorio de Playwright (`1280×720`). Tras 23 reintentos durante `10.000 ms`, Playwright abortó por *timeout*.
       - **Por qué el modelo eligió un selector no visible (Causa raíz verificada en código)**: En `src/modules/automation/automation.service.ts:318-369`, la función `getInteractiveElements()` que construye `visibleDOMSummary` para el prompt de Fase 1 ejecuta `document.querySelectorAll('a[href], button, input, ...')` **sin filtrar elementos ocultos** (`display: none`, `visibility: hidden` o caja geométrica nula). Como resultado, los 5 enlaces de la barra móvil (`body > nav > a:nth-of-type(1..5)`: `"Shop"`, `"Browse"`, `"Search"`, `"Bag"`, `"Account"`) fueron enviados a Gemini dentro de `visibleDOMSummary` como si fueran elementos visibles en pantalla (confirmado en `SnapshotEvidence` donde `body > nav > a:nth-of-type(1)` aparece listado con `text: "Shop"`).
     - **Iteración 6** (`Snapshot 6`, URL `https://opencart-demo.smartfront.io/register`, página `"Create account"`, ya cargada tras el clic exitoso de la Iteración 4): antes de llamar a Gemini, el `RuleEngine` determinista detectó que la última acción de la Iteración 5 tenía `result: "failure"` y emitió `STOP_FLOW` (`0` llamadas a Gemini en la Iteración 6).

3. **Qué parte del proceso se completó y qué limitaciones tiene la evidencia obtenida**:
   - **Proceso completado**:
     - Se completaron exitosamente **6 capturas y snapshots verificados** (`evidenceFullyVerified: true`, `snapshotPersistenceFailureCount: 0`) cubriendo **3 vistas distintas del sitio**: portada `/` (Snapshots 1, 2 y 3), inicio de sesión `/login` (Snapshots 4 y 5) y registro de cuenta `/register` (Snapshot 6).
     - Se completó al 100 % el análisis determinista de Fase 2 sobre los 6 snapshots (`522` pares elemento-criterio evaluados, consolidados en `160` hallazgos deterministas: `3 FAIL`, `4 NOT_EVALUABLE` y `153 PASS`).
     - Se completó la llamada a Gemini de Fase 2 (`50.226` tokens totales) y la ejecución de los Gates de evidencia (`EvidenceTraceabilityService`, `WcagCardinalityAudit`, `EvidenceClaimConsistencyService`).
     - Se completó la persistencia íntegra de los `161` hallazgos y del `Report` (`6af5e209b112ec17f17292da`).
   - **Limitaciones de la evidencia obtenida**:
     - La exploración se detuvo en la página `/register` sin llegar a explorar listados de categorías (`/c/apparel`, etc.), fichas de producto (`/p/...`), carrito (`/cart`) ni proceso de compra (*checkout*).
     - Dos de los 6 snapshots (`Snapshot 3` en `/` y `Snapshot 5` en `/login`) son capturas redundantes de páginas ya vistas, producto del desfase entre `page.click` y la navegación asíncrona antes de `extractCurrentSnapshot`.
     - Al igual que en la Evaluación B, `gemini-3.5-flash-lite` en Fase 2 **solo generó 1 hallazgo en total** (`_id: 6af5e209b112ec17f17292d7`, `N-04` / `WCAG 1.3.1` con estado original `PASS` sobre `div > section > div > h1`), que fue degradado al 100 % a `NOT_EVALUABLE` por falta de trazabilidad en el índice priorizado y por evidencia insuficiente (`1` solo nivel de encabezado). Ningún criterio de Nielsen (`0/10`) quedó evaluado como `PASS` o `FAIL`.

---

### 9.4. Análisis de comparabilidad entre B (11 nov) y C (12 nov) y frente a Gemini 3.8 Flash

> **Advertencia metodológica**: Aunque las evaluaciones WEB **B (`6af48ff0c1d54382d38c576e`)** y **C (`6af5e1eeb112ec17f1728192`)** utilizaron el mismo sitio (`https://opencart-demo.smartfront.io`), el mismo perfil evaluador (`Laura Martínez`), el mismo modelo (`gemini-3.5-flash-lite`) y obtuvieron el mismo score global (`49/100`) y cobertura (`5/20`, `25 %`), **NO son ejecuciones idénticas ni directamente equivalentes**.

| Dimensión comparada | B. WEB — 11 de noviembre (`6af48ff0c1d54382d38c576e`) | C. WEB — 12 de noviembre (`6af5e1eeb112ec17f1728192`) | Impacto en la comparabilidad |
|---|---|---|---|
| **1. Secuencia de navegación (URLs visitadas)** | `/` (×3) $\rightarrow$ `/p/oxford-tailored-tee` (×1). Exploró portada y **una ficha de producto**. | `/` (×3) $\rightarrow$ `/login` (×2) $\rightarrow$ `/register` (×1). Exploró portada y **flujo de autenticación/registro** (sin visitar productos). | **Alto**: los snapshots alimentados a Fase 2 representan secciones distintas del sitio tras la portada. |
| **2. Acciones ejecutadas en Fase 1** | 1) `CLICK` banner cookies (`button:nth-of-type(3)`)<br>2) `CLICK` producto `"Oxford Tailored Tee"`<br>3) `CLICK` repetido al mismo selector de producto (falló por *timeout* porque la página ya había cambiado a `/p/oxford-tailored-tee`)<br>4) `STOP_FLOW` (`RuleEngine`) | 1) `CLICK` banner cookies (`button:nth-of-type(3)`)<br>2) `CLICK` `"Sign in"` (`nav > div:nth-of-type(3) > a`)<br>3) `CLICK` repetido a `"Sign in"`<br>4) `CLICK` `"New here? Create an account"` (`p:nth-of-type(2) > a`)<br>5) `CLICK` en enlace móvil oculto `"Shop"` (`body > nav > a:nth-of-type(1)`, falló por `element is not visible`)<br>6) `STOP_FLOW` (`RuleEngine`) | **Alto**: demuestra que la navegación autónoma en Fase 1 con `gemini-3.5-flash-lite` es **no determinista** ante la misma portada inicial (en B eligió un producto; en C eligió `"Sign in"`). |
| **3. Iteraciones y llamadas a Gemini** | `4` iteraciones (`3` llamadas Fase 1 + `1` llamada Fase 2 = `4` llamadas a Gemini). | `6` iteraciones (`5` llamadas Fase 1 + `1` llamada Fase 2 = `6` llamadas a Gemini). | **Medio**: C realizó 2 llamadas adicionales en Fase 1 (+`8.875` tokens de entrada y +`386` de salida en Fase 1). |
| **4. Capturas y evidencia DOM disponible** | `4` capturas; `463` chequeos deterministas; `173` hallazgos consolidados (`258` evidencias). En `/p/oxford-tailored-tee` capturó imágenes de producto y 18 botones. | `6` capturas; `522` chequeos deterministas; `161` hallazgos consolidados (`238` evidencias). En `/login` y `/register` capturó `0` imágenes y más campos de formulario (`WCAG 3.3.2` subió de `5` a `13` PASS; `NOT_EVALUABLE` de contraste RGBA subió de `1` a `4`). | **Medio**: aunque el agregado por criterio (`4 PASS / 1 FAIL / 15 NOT_EVALUABLE`) coincidió porque los 5 criterios medidos por `DeterministicAnalyzer` están presentes tanto en producto como en login/registro, el número de hallazgos individuales (`173` vs. `161`) varía según las páginas visitadas. |
| **5. Estado del código y estabilización** | Ejecutada **antes** de las correcciones `P0-1`, `P0-2`, `P1-1`, `P1-2`, `P2-1` y `P2-2` (`expectedPersistedFindingsCount: 5` vs. `173`). | Ejecutada **después** de la estabilización completa (`expectedPersistedFindingsCount: 161` vs. `161`). Prompts de WEB (Fase 1 y Fase 2) idénticos entre B y C (`P1-2` solo modificó el ejemplo JSON del prompt de PROTOTIPO). | **Bajo en Fase 1/2 WEB, Alto en trazabilidad**: C es la referencia limpia post-estabilización cuyas garantías de auditoría coinciden con las que tendrá la ronda de `gemini-3.8-flash`. |
| **6. Resultados consolidados** | Score `49/100`, `4 PASS`, `1 FAIL`, `15 NOT_EVALUABLE`. `1` único hallazgo de IA en Fase 2 (degradado a `NOT_EVALUABLE`). | Score `49/100`, `4 PASS`, `1 FAIL`, `15 NOT_EVALUABLE`. `1` único hallazgo de IA en Fase 2 (degradado a `NOT_EVALUABLE`). | **Constante**: la igualdad de `overallScore` (`49/100`) y cobertura (`25 %`) en B y C se explica porque el resultado final estuvo dominado al 100 % por los 5 criterios WCAG del `DeterministicAnalyzer` sobre la portada común (`step_1`), mientras que `gemini-3.5-flash-lite` aportó `0` criterios evaluados (`PASS`/`FAIL`) en Fase 2 en ambas ejecuciones. |

#### Implicaciones para la comparación posterior con `gemini-3.8-flash`

1. **En el flujo WEB**:
   - Como la Fase 1 es autónoma, `gemini-3.8-flash` puede seguir una ruta de navegación distinta a la de B y C (o completar más iteraciones sin caer en el selector oculto `body > nav > a:nth-of-type(1)`). Por ello, al comparar `gemini-3.8-flash` contra `gemini-3.5-flash-lite` en WEB, **no debe compararse únicamente el `overallScore` final**, sino separar:
     - **(a) Desempeño en Fase 1**: número de pasos válidos ejecutados, ausencia de repetición de selectores ya clicados y tasa de finalización limpia (`NATURAL_STOP` vs. `ACTION_FAILED`).
     - **(b) Desempeño en Fase 2**: número de hallazgos emitidos por el modelo sobre los 15 criterios que dependen de IA (10 heurísticas de Nielsen + 5 criterios WCAG no cubiertos o parcialmente cubiertos por el analizador determinista), y porcentaje de esos hallazgos que superan la validación de trazabilidad (`EvidenceTraceabilityService`) y consistencia (`EvidenceClaimConsistencyService`).
2. **En el flujo PROTOTIPO**:
   - Al no existir exploración autónoma y utilizarse exactamente el mismo archivo de imagen (`SHA-256: 4f3a19a5...e427`) y el mismo código post-estabilización que en la **Evaluación A (`6af5dfcbb112ec17f1728161`)**, la comparación entre la Evaluación A (`gemini-3.5-flash-lite`) y la próxima ejecución con `gemini-3.8-flash` será **100 % controlada (ceteris paribus)**, donde la única variable independiente será el modelo de IA.

---

### 9.5. Conclusiones respaldadas por los datos y aspectos pendientes de investigar

#### Conclusiones empíricamente respaldadas en la Ronda 1 (`gemini-3.5-flash-lite`)

1. **Velocidad de respuesta alta y cero consumo de *thinking tokens*** (**Observado**): En las 3 evaluaciones de la ronda (`10` llamadas físicas a Gemini en total: `1` en Prototipo A, `4` en Web B y `6` en Web C), `gemini-3.5-flash-lite` respondió en el primer intento físico (`0` reintentos, `0` errores `SCHEMA_MISMATCH`), sin reportar `thoughtsTokenCount` (`thinkingTokens: 0`), con tiempos totales de evaluación entre `4,1 s` (Prototipo) y `6,8–9,8 s` (Web).
2. **Sub-generación severa (baja exhaustividad) tanto en PROTOTIPO como en Fase 2 de WEB** (**Observado**):
   - En **PROTOTIPO (`6af5dfcbb112ec17f1728161`)**, ante 13 criterios aplicables, el modelo generó solo `767` tokens de salida y **2 hallazgos** (`1 FAIL` y `1 NOT_EVALUABLE`), dejando 11 criterios aplicables sin evaluar (incluyendo criterios directamente observables en la imagen KassaPay Contact Page como `N-06`, `N-03`, `N-04`, `N-08`, `WCAG 2.4.6`).
   - En **WEB Fase 2 (`6af48ff0c1d54382d38c576e` y `6af5e1eeb112ec17f1728192`)**, ante un prompt de ~50.000 tokens de entrada y 20 criterios, el modelo generó solo `391` y `401` tokens de salida respectivamente, emitiendo **1 único hallazgo de IA** en cada evaluación (ambos degradados a `NOT_EVALUABLE`), dejando las **10 heurísticas de Nielsen con 0 % de cobertura**.
3. **Debilidad metodológica en el único `FAIL` emitido en PROTOTIPO (`N-02`)** (**Observado**): El único hallazgo `FAIL` de `6af5dfcbb112ec17f1728161` clasificó bajo `N-02` (Coincidencia entre el sistema y el mundo real) la ausencia de texto visible junto a iconos de redes sociales cuyo propio `context` describió como *"logotipos reconocibles"*, confundiendo `N-02` con `N-06` / `WCAG 1.1.1`.
4. **Repetición de acciones en Fase 1 WEB ante transiciones asíncronas** (**Observado**): Tanto en B (Iteración 2 $\rightarrow$ 3 sobre el enlace de producto) como en C (Iteración 2 $\rightarrow$ 3 sobre `"Sign in"`), `gemini-3.5-flash-lite` repitió el mismo selector que acababa de clicar en la iteración inmediata anterior cuando el snapshot intermedio aún mostraba la URL previa.
5. **Verificación exitosa en producción de las correcciones de estabilización P0-1, P0-2, P1-1, P1-2, P2-1 y P2-2** (**Observado**): Las dos ejecuciones del 12 de noviembre (`6af5dfcbb112ec17f1728161` y `6af5e1eeb112ec17f1728192`) confirmaron en entorno real que `metricsAudit` concilia `161 === 161` (`P0-2`) y que los reportes de prototipo ya no persisten los 7 campos exclusivos de WEB (`P1-1`).

#### Aspectos técnicos y metodológicos pendientes de investigar (fuera del alcance de esta intervención, documentados para fases posteriores)

1. **Filtrado de elementos ocultos en `getInteractiveElements()` (`automation.service.ts:318-369`)**: Actualmente `visibleDOMSummary` incluye elementos con `display: none` / ocultos en el *viewport* actual (como la barra de navegación móvil `.mrd-tabbar__item` en escritorio), lo que expone a cualquier modelo en Fase 1 a seleccionar enlaces que Playwright no puede clicar por no ser visibles (`ACTION_FAILED` de la Evaluación C).
2. **Sincronización post-acción en `executeAction()` (`automation.service.ts:683`)**: `await page.waitForLoadState('domcontentloaded')` tras `page.click()` retorna inmediatamente cuando la navegación aún está iniciándose, provocando que la siguiente iteración capture un snapshot de la página anterior antes de que complete la transición de URL.
3. **Desempeño comparativo de `gemini-3.8-flash` (Ronda 2)**: Determinar si el cambio de modelo a `gemini-3.8-flash` (manteniendo intactos los prompts, criterios y Gates) incrementa la cobertura de criterios evaluados en PROTOTIPO (`> 1/13`) y en Fase 2 de WEB (`> 0/10` en Nielsen), y cuál es su relación costo/latencia/calidad incluyendo *thinking tokens*.



---

## 10. RONDA 2 — GEMINI 3.8 FLASH (12 DE NOVIEMBRE DE 2026)

### 10.1 Inventario de ejecuciones

| Código | Flujo | Evaluation ID | Report ID | Título | Fecha | Tokens Prompt | Tokens Salida | Thinking Tokens | Tokens Totales | Tiempo Total | Coste Estimado |
|---|---|---|---|---|---|---|---|---|---|---|---|
| **D** | PROTOTIPO | `6af65aa82a119bed787b8f10` | `6af65ad42a119bed787b8f3c` | ContactPage (3.8) | 12/11/2026 | 7.799 | 2.400 | 3.399 | 10.199 (+ 3.399 think) | 44.369 ms | $0.027596 USD |
| **E** | WEB | `6af65b502a119bed787b8f69` | `6af65bb82a119bed787ba0b2` | OpenCart (3.8 flash) | 12/11/2026 | 89.949 | 2.668 | 8.547 | 92.617 (+ 8.547 think) | 88.692 ms | $0.109518 USD |

---

### 10.2 Evaluación D — PROTOTIPO (ContactPage)

- **ID de Evaluación**: `6af65aa82a119bed787b8f10`
- **ID de Reporte**: `6af65ad42a119bed787b8f3c`
- **Hash de Imagen (SHA-256)**: `4f3a19a507dac24bd9a2b48dbb54255efb943b903e58406a93c98145d242e427` (205.224 bytes) — **100% idéntico al evaluado en la Evaluación A**.
- **Puntuación Global**: `0 / 100`
- **Desglose de Criterios**:
  - Aplicables: 13
  - Evaluados: 3 (3 FAIL, 0 PASS)
  - NOT_EVALUABLE: 10
  - Fuera de cobertura: 6
- **Hallazgos Registrados**: 6 totales (3 FAIL, 3 NOT_EVALUABLE).
  1. `N-04` (FAIL, Severidad Alta): Discrepancia visual crítica entre la dirección física declarada en texto (*Jalan Cempaka Wangi No 22 Jakarta - Indonesia*) y el mapa interactivo embebido (*lastminute.com London Eye Riverside Building, London*).
  2. `N-02` (FAIL, Severidad Media): Presencia de texto simulado en latín (*Lorem ipsum dolor sit amet...*) en descripción de soporte y correo electrónico ficticio (*support@companyname.com*).
  3. `N-08` (FAIL, Severidad Baja): Redundancia visual y funcional en el formulario (*Phone* / *Phone*, etiqueta y placeholder idénticos sin ofrecer formatos esperados).
  4. `WCAG 3.3.2` (NOT_EVALUABLE, Info): Instrucciones o etiquetas en prototipo estático (Gate V5).
  5. `WCAG 1.4.3` (NOT_EVALUABLE, Info): Contraste aparente en placeholder de campos de formulario en captura estática.
  6. `N-05` (NOT_EVALUABLE, Info): Prevención de errores no determinable sin validaciones dinámicas en tiempo de ejecución.
- **Métricas de Token y Rendimiento**:
  - Prompt: 7.799 tokens.
  - Salida: 2.400 tokens.
  - Thinking tokens: 3.399 tokens.
  - Latencia total: 44.369 ms.
  - Coste: $0.027596 USD.

---

### 10.3 Evaluación E — WEB (OpenCart Demo)

- **ID de Evaluación**: `6af65b502a119bed787b8f69`
- **ID de Reporte**: `6af65bb82a119bed787ba0b2`
- **URL Objetivo**: `https://opencart-demo.smartfront.io/`
- **Puntuación Global**: `49 / 100`
- **Desglose de Auditoría**:
  - Criterios Totales: 20
  - Criterios Evaluados: 5 (1 FAIL, 4 PASS)
  - Criterios NOT_EVALUABLE: 15
  - Cumplimiento WCAG: `80%` (4/5 criterios aprobados)
  - Cobertura de Auditoría: `25%`
- **Hallazgos Persistidos (Colección findings)**: 189 documentos conciliados (`189 === 189`).
  - `PASS`: 182
  - `FAIL`: 3 (los 3 correspondientes a violaciones determinísticas de `WCAG 1.4.3` en selectores `section:nth-of-type(6) > section > div > div > section > section > a:nth-of-type(1..3)` con ratios 1.37:1, 1.33:1 y 1.38:1).
  - `NOT_EVALUABLE`: 4 (`WCAG 1.4.3` por fondo transparente rgba; `WCAG 1.3.1` por múltiples `<h1>`; `N-01` por retroalimentación positiva de navegación; `N-07` por atajos de compra rápida en tarjetas de catálogo).
- **Trazabilidad de la Exploración**:
  - Iteración 1: Carga inicial de home (`https://opencart-demo.smartfront.io/`).
  - Iteración 2: Clic en aceptación de banner de cookies (`button:nth-of-type(3)`).
  - Iteración 3: Clic en llamada a la acción principal *Shop new in* (`section:nth-of-type(1) > ... > a:nth-of-type(1)`).
  - Iteración 4: Navegación exitosa a catálogo (`https://opencart-demo.smartfront.io/c/all`). Intento de clic en enlace de producto (`section:nth-of-type(4) > div > div > section > div > div:nth-of-type(1) > a`) con timeout de 10.000 ms superado en Playwright (`ACTION_FAILED`).
- **Métricas de Token y Rendimiento**:
  - Prompt: 89.949 tokens (Fase 1: 21.163 en 3 llamadas; Fase 2: 68.786).
  - Salida: 2.668 tokens (Fase 1: 554; Fase 2: 2.114).
  - Thinking tokens: 8.547 tokens (Fase 1: 1.412; Fase 2: 7.135).
  - Latencia total: 88.692 ms (Fase 1: ~20.216 ms; Fase 2: 68.476 ms).
  - Coste: $0.109518 USD (acumulado en sesión: $0.137114 USD).


---

## 11. ESTUDIO COMPARATIVO FINAL: GEMINI 3.5 FLASH-LITE vs GEMINI 3.8 FLASH

### 11.1 Comparación Cualitativa de Hallazgos y Razonamiento Multimodal

En el análisis de prototipos estáticos con imágenes idénticas (SHA-256 `4f3a19a507dac24bd9a2b48dbb54255efb943b903e58406a93c98145d242e427`), la diferencia de profundidad y perspicacia analítica entre ambos modelos es categórica:

1. **Gemini 3.5 Flash-Lite (Evaluación A)**:
   - Solo evaluó **1 criterio de 13** (`N-02`).
   - Identificó únicamente la ausencia de etiquetas textuales en los iconos de redes sociales.
   - Omitió por completo el contenido del mapa, el texto en latín del soporte y la estructura del formulario.
   - Demostró una agudeza visual superficial, limitándose a patrones genéricos de interfaz.

2. **Gemini 3.8 Flash (Evaluación D)**:
   - Evaluó **3 criterios de 13** (`N-04`, `N-02`, `N-08`) con estatus FAIL sólidamente evidenciado, más 3 abstenciones metodológicas debidamente fundamentadas (`WCAG 3.3.2`, `WCAG 1.4.3`, `N-05`).
   - **Hallazgo estelar de consistencia (`N-04`)**: Detectó que la dirección física declarada en texto es *"Jalan Cempaka Wangi No 22 Jakarta - Indonesia"*, mientras que el mapa embebido interactivo muestra la tarjeta de *"lastminute.com London Eye Riverside Building, County Hall, London SE1 7PB, United Kingdom"*. Esta contradicción geográfica entre dos regiones del prototipo es un problema crítico de credibilidad que solo un modelo con razonamiento visual profundo puede correlacionar.
   - **Hallazgo de terminología y contenido (`N-02`)**: Identificó la presencia de *"Lorem ipsum dolor sit amet..."* en el bloque de soporte y el correo ficticio *"support@companyname.com"*, fundamentando que no comunican términos comprensibles del negocio para la usuaria final.
   - **Hallazgo de redundancia y minimalismo (`N-08`)**: Señaló la duplicidad innecesaria entre etiqueta superior y placeholder interior (*Phone* / *Phone*), recomendando sustituirlo por formatos de entrada esperados.

### 11.2 Comparación de Calidad y Accionabilidad de las Recomendaciones

- **Gemini 3.8 Flash**: Redacta directrices de ingeniería y diseño altamente accionables. No se limita a enunciar el principio teórico; especifica qué valor cambiar por cuál (por ejemplo, sincronizar el marcador del mapa con las coordenadas de Yakarta o añadir máscaras de formato telefónico `+1 (555) 000-0000`).
- **Gemini 3.5 Flash-Lite**: Emite directrices genéricas o basadas en plantillas (*"incluir texto descriptivo en enlaces"*), aportando poco valor diferencial al equipo de diseño.

### 11.3 Comportamiento en Síntesis Web y Disciplina de Evidencia

En el flujo WEB (Evaluación E vs C):
1. **Detección estructural en DOM**: En el resumen ejecutivo y en los hallazgos de Fase 2, Gemini 3.8 Flash detectó con total exactitud la presencia de **múltiples encabezados `<h1>`** tanto en la página principal (*"Objects made to be used every day."* y *"Six pieces that carry a whole season"*) como en el catálogo de productos `/c/all` (*"All products"* y *"About this category"*).
2. **Respeto a las barreras deterministas (Evidence Gate)**: Aunque Gemini 3.8 Flash identificó esta anomalía de encabezados y aspectos positivos de usabilidad (`N-01` en transiciones con breadcrumbs y `N-07` en botones de compra rápida), el Evidence Gate degradó `WCAG 1.3.1` a `NOT_EVALUABLE` al no existir una regla determinista de fallo de cardinalidad en el analizador de backend para headings. El sistema mantuvo la integridad del reporte sin generar falsos positivos no corroborados.

### 11.4 Exploración Web y Causa Raíz de Interrupciones

- Ambas rondas se enfrentaron a la misma aplicación web real (`https://opencart-demo.smartfront.io/`).
- En la Evaluación C (3.5 Lite), el modelo intentó clicar un enlace de navegación móvil que no estaba visible en el viewport de escritorio (`body > nav > a:nth-of-type(1)`), agotando el timeout de Playwright.
- En la Evaluación E (3.8 Flash), la exploración fue más profunda: avanzó de la página de inicio al catálogo general (`/c/all`). En la iteración 4, Playwright falló al intentar clicar `section:nth-of-type(4) > div > div > section > div > div:nth-of-type(1) > a` por timeout de 10.000 ms.
- **Conclusión técnica**: La interrupción prematura en ambos modelos responde a limitaciones de la capa de automatización de Playwright (visibilidad y estado interactivo de elementos) y no a alucinaciones de selectores por parte de los LLMs.

### 11.5 Comparativa de Rendimiento, Thinking Tokens y Coste

| Métrica | Prototipo A (3.5 Lite) | Prototipo D (3.8 Flash) | Factor Mult. | Web C (3.5 Lite) | Web E (3.8 Flash) | Factor Mult. |
|---|---|---|---|---|---|---|
| **Tokens Prompt** | 8.570 | 7.799 | ~0.9x | 81.243 | 89.949 | ~1.1x |
| **Tokens Salida** | 0 (incluidos en total) | 2.400 | - | 0 (incluidos) | 2.668 | - |
| **Thinking Tokens** | 0 | **3.399** | - | 0 | **8.547** | - |
| **Tokens Totales Facturables** | 8.570 | 13.598 | ~1.6x | 81.243 | 92.617 (+8.5k thk) | ~1.2x |
| **Latencia Total** | **4.135 ms** | **44.369 ms** | **~10.7x** | **9.840 ms** | **88.692 ms** | **~9.0x** |
| **Coste Total (USD)** | **$0.004258** | **$0.027596** | **~6.5x** | **$0.027352** | **$0.109518** | **~4.0x** |

**Impacto de los Thinking Tokens**:
Gemini 3.8 Flash incorpora razonamiento interno explícito que se factura a la tarifa de tokens de salida ($3.75 / millón).
- En Prototipo D, los 3.399 thinking tokens costaron $0.012746 USD (**46,2% del coste total** de la evaluación).
- En Web E, los 8.547 thinking tokens costaron $0.032051 USD (**29,3% del coste total** de la evaluación).
Este razonamiento extendido es precisamente el que permite a Gemini 3.8 correlacionar visualmente el texto de Yakarta con el mapa de Londres, justificando su coste en tareas de auditoría visual compleja.

---

### 11.6 Matriz Comparativa Global

| Dimensión de Análisis | Gemini 3.5 Flash-Lite | Gemini 3.8 Flash | Veredicto Técnico |
|---|---|---|---|
| **Agudeza visual en Prototipos** | Baja (1 hallazgo evidente en iconos) | Sobresaliente (discrepancia geográfica, contenido latino, redundancia) | **Gemini 3.8 Flash** |
| **Accionabilidad de recomendaciones** | Media-Baja (genéricas) | Alta (específicas con valores y formatos sugeridos) | **Gemini 3.8 Flash** |
| **Profundidad de exploración Web** | Moderada (interrumpida en iteración 2-3) | Mayor profundidad (alcanzó /c/all y tarjetas de catálogo) | **Gemini 3.8 Flash** |
| **Velocidad / Latencia por llamada** | Rápida (1 a 4 segundos) | Lenta (6 a 68 segundos) | **Gemini 3.5 Flash-Lite** |
| **Coste por evaluación** | Extremadamente económico ($0.004 Prototipo / $0.027 Web) | Moderado ($0.028 Prototipo / $0.110 Web) | **Gemini 3.5 Flash-Lite** |
| **Disciplina metodológica (Gates)** | Conservadora | Conservadora con mayor riqueza descriptiva | **Gemini 3.8 Flash** |

---

### 11.7 Recomendación de Arquitectura de Modelos para EvalUXIA

Con base en la evidencia empírica cuantitativa y cualitativa recopilada, se recomienda formalmente la siguiente arquitectura:

1. **Flujo PROTOTIPOS $ightarrow$ `gemini-3.8-flash`**:
   - La calidad del análisis UX es inconmensurablemente superior.
   - El coste unitario absoluto ($0.0276 USD) es trivial para una evaluación de interfaz corporativa.
   - La latencia de ~44 segundos es perfectamente aceptable para una auditoría estática one-shot.

2. **Flujo WEB $ightarrow$ Arquitectura Híbrida / Desacoplada**:
   - **Fase 1 (Exploración interactiva paso a paso)**: `gemini-3.5-flash-lite` (o modelo rápido equivalente). En la exploración en bucle, latencias de 6-8 segundos por clic degradan severamente la experiencia de usuario y multiplican el riesgo de desconexión de sockets.
   - **Fase 2 (Síntesis y Auditoría Global de Sesión)**: `gemini-3.8-flash`. La capacidad analítica superior para correlacionar encabezados, navegación y arquetipos justifica plenamente la llamada única de cierre.
   - Si no es posible desacoplar fases inmediatamente en el backend (configuración global única `GEMINI_MODEL`), **`gemini-3.8-flash` debe ser el modelo preferente**, priorizando la calidad y relevancia del reporte final sobre la velocidad de navegación.
