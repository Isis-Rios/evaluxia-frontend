// src/utils/criteriaCoverage.ts
import type {
  Evaluation,
  EvaluationType,
  Finding,
  FindingSeverity,
  FindingStatus,
  Report,
} from '@/types/evaluation.types'
import type { SnapshotEvidenceItem } from '@services/snapshots/snapshots.service'

/**
 * Catálogos estáticos y funciones puras de reconstrucción de cobertura de criterios
 * (Nielsen N-01..N-10 y WCAG 2.2) a partir de los documentos `Finding` persistidos.
 *
 * Replica exactamente las reglas de consolidación del backend:
 * - Sitios web (`AuditMetricsService.calculateMetrics`, audit-metrics.service.ts):
 *   Espacio fijo de 20 criterios (10 Nielsen + 10 WCAG). Evalúa `heuristicCode` y
 *   `wcagCriterion` en dos bloques `if` independientes (permitiendo que el hallazgo
 *   determinístico transversal de ausencia de `<h1>` impacte tanto `N-04` como `WCAG 1.3.1`).
 * - Prototipos visuales (`calculatePrototypeMetrics`, prototype-metrics.service.ts, y
 *   `prototype-criteria-resolver.ts`):
 *   Espacio de 19 criterios inventariados: 13 aplicables (6 Nielsen + 7 WCAG) y
 *   6 excluidos (`OUT_OF_COVERAGE`: 4 Nielsen + 2 WCAG). `WCAG 3.2.2` no forma parte
 *   del inventario de prototipos estáticos y se expone únicamente como nota metodológica.
 */

export type CriterionFramework = 'NIELSEN' | 'WCAG'
export type CriterionModalityCoverage = 'DIRECTLY_EVALUABLE' | 'PARTIALLY_EVALUABLE' | 'OUT_OF_COVERAGE'
export type CriterionMechanism =
  | 'deterministic_and_ai'
  | 'ai_only'
  | 'visual_direct_ai'
  | 'visual_partial_ai'
  | 'catalog_no_dynamic_extractor'
  | 'out_of_coverage_modality'

/**
 * Los 4 casos de trazabilidad de un criterio:
 * - CASE_A_WITH_VERDICT: Criterio aplicable con resultado PASS o FAIL y >= 1 documento Finding.
 * - CASE_B_NOT_EVALUABLE_NO_FINDING: Criterio aplicable en NOT_EVALUABLE sin documento Finding (silencio/abstención).
 * - CASE_C_NOT_EVALUABLE_WITH_FINDING: Criterio aplicable en NOT_EVALUABLE con >= 1 documento Finding NOT_EVALUABLE.
 * - CASE_D_OUT_OF_COVERAGE: Criterio excluido por las restricciones de la modalidad (imagen estática).
 */
export type CriterionTraceabilityCase =
  | 'CASE_A_WITH_VERDICT'
  | 'CASE_B_NOT_EVALUABLE_NO_FINDING'
  | 'CASE_C_NOT_EVALUABLE_WITH_FINDING'
  | 'CASE_D_OUT_OF_COVERAGE'

export interface CriterionCatalogEntry {
  code: string
  name: string
  framework: CriterionFramework
  wcagLevel?: 'A' | 'AA'
  coverage: CriterionModalityCoverage
  mechanism: CriterionMechanism
  mechanismLabel: string
  scopeNote: string
}

export interface ReconstructedCriterionRow extends CriterionCatalogEntry {
  status: FindingStatus | 'OUT_OF_COVERAGE'
  traceabilityCase: CriterionTraceabilityCase
  maxSeverity: FindingSeverity
  findingsCount: number
  failFindingsCount: number
  passFindingsCount: number
  notEvaluableFindingsCount: number
  associatedFindings: Finding[]
  /** Indica si entre los hallazgos asociados existe el hallazgo transversal N-04 + WCAG 1.3.1 */
  hasCrossDomainHeadingFinding: boolean
}

export interface ReconstructedDomainSummary {
  applicableCount: number
  evaluatedCount: number
  passCount: number
  failCount: number
  notEvaluableCount: number
  notEvaluableWithFindingsCount: number
  notEvaluableWithoutFindingsCount: number
  outOfCoverageCount: number
  compliance: number | null
  coveragePercent: number
}

export interface ReconstructedCoverageMatrix {
  evaluationType: EvaluationType
  nielsenRows: ReconstructedCriterionRow[]
  wcagRows: ReconstructedCriterionRow[]
  nielsenSummary: ReconstructedDomainSummary
  wcagSummary: ReconstructedDomainSummary
  globalSummary: {
    applicableCriteria: number
    evaluatedCriteria: number
    passCriteria: number
    failCriteria: number
    notEvaluableCriteria: number
    outOfCoverageCriteria: number
    auditCoveragePercent: number
  }
  /** Hallazgos que no pudieron vincularse a ningún código del catálogo aplicable (defensivo) */
  unmappedFindings: Finding[]
  /** Nota metodológica sobre criterios del catálogo web no contemplados en el inventario de prototipos */
  uncontemplatedPrototypeNote?: string
}

// ─── Catálogos para Sitios Web (10 Nielsen + 10 WCAG = 20 criterios) ──────────

export const WEB_NIELSEN_CATALOG: readonly CriterionCatalogEntry[] = [
  {
    code: 'N-01',
    name: 'Visibilidad del estado del sistema',
    framework: 'NIELSEN',
    coverage: 'DIRECTLY_EVALUABLE',
    mechanism: 'ai_only',
    mechanismLabel: 'Análisis IA (Recorrido DOM)',
    scopeNote: 'Analiza cambios de estado, URL, encabezados o atributos tras acciones ejecutadas durante el recorrido.',
  },
  {
    code: 'N-02',
    name: 'Coincidencia entre el sistema y el mundo real',
    framework: 'NIELSEN',
    coverage: 'DIRECTLY_EVALUABLE',
    mechanism: 'ai_only',
    mechanismLabel: 'Análisis IA (Textos DOM)',
    scopeNote: 'Evalúa la familiaridad del lenguaje, convenciones, textos simulados e idioma en relación con el perfil evaluador.',
  },
  {
    code: 'N-03',
    name: 'Control y libertad del usuario',
    framework: 'NIELSEN',
    coverage: 'DIRECTLY_EVALUABLE',
    mechanism: 'ai_only',
    mechanismLabel: 'Análisis IA (Controles DOM)',
    scopeNote: 'Inspecciona la presencia de controles visibles para cancelar, cerrar, retroceder o salir de estados activos.',
  },
  {
    code: 'N-04',
    name: 'Consistencia y estándares',
    framework: 'NIELSEN',
    coverage: 'DIRECTLY_EVALUABLE',
    mechanism: 'deterministic_and_ai',
    mechanismLabel: 'Regla determinística (<h1>) + IA',
    scopeNote:
      'Incluye la verificación determinística de presencia de encabezado principal <h1> (compartida con WCAG 1.3.1) y el análisis por IA de consistencia terminológica y estructural.',
  },
  {
    code: 'N-05',
    name: 'Prevención de errores',
    framework: 'NIELSEN',
    coverage: 'DIRECTLY_EVALUABLE',
    mechanism: 'ai_only',
    mechanismLabel: 'Análisis IA (Formularios DOM)',
    scopeNote: 'Analiza atributos de restricción, instrucciones preventivas y controles en formularios capturados.',
  },
  {
    code: 'N-06',
    name: 'Reconocimiento antes que recuerdo',
    framework: 'NIELSEN',
    coverage: 'DIRECTLY_EVALUABLE',
    mechanism: 'ai_only',
    mechanismLabel: 'Análisis IA (Etiquetas y menús)',
    scopeNote: 'Verifica la visibilidad de etiquetas, opciones de navegación e instrucciones sin exigir memorización.',
  },
  {
    code: 'N-07',
    name: 'Flexibilidad y eficiencia de uso',
    framework: 'NIELSEN',
    coverage: 'PARTIALLY_EVALUABLE',
    mechanism: 'ai_only',
    mechanismLabel: 'Análisis IA (Atajos visibles)',
    scopeNote: 'Observa mecanismos de acceso rápido o búsqueda en el DOM; no inspecciona listeners de atajos de teclado JS.',
  },
  {
    code: 'N-08',
    name: 'Diseño estético y minimalista',
    framework: 'NIELSEN',
    coverage: 'DIRECTLY_EVALUABLE',
    mechanism: 'ai_only',
    mechanismLabel: 'Análisis IA (Estructura y estilos)',
    scopeNote: 'Evalúa saturación informativa, elementos distractores y priorización del contenido relevante.',
  },
  {
    code: 'N-09',
    name: 'Ayudar a reconocer, diagnosticar y recuperarse de errores',
    framework: 'NIELSEN',
    coverage: 'PARTIALLY_EVALUABLE',
    mechanism: 'ai_only',
    mechanismLabel: 'Análisis IA (Condicional a error)',
    scopeNote: 'Solo es evaluable si durante las iteraciones de exploración se activa un mensaje o estado de error visible.',
  },
  {
    code: 'N-10',
    name: 'Ayuda y documentación',
    framework: 'NIELSEN',
    coverage: 'PARTIALLY_EVALUABLE',
    mechanism: 'ai_only',
    mechanismLabel: 'Análisis IA (Enlaces de ayuda)',
    scopeNote: 'Inspecciona la disponibilidad de enlaces o secciones de ayuda, preguntas frecuentes y documentación.',
  },
]

export const WEB_WCAG_CATALOG: readonly CriterionCatalogEntry[] = [
  {
    code: 'WCAG 1.1.1',
    name: 'Contenido no textual',
    framework: 'WCAG',
    wcagLevel: 'A',
    coverage: 'PARTIALLY_EVALUABLE',
    mechanism: 'deterministic_and_ai',
    mechanismLabel: 'Determinístico DOM (<img>) + IA',
    scopeNote: 'Verifica determinísticamente atributos alt/role/aria-hidden en etiquetas <img> capturadas.',
  },
  {
    code: 'WCAG 1.3.1',
    name: 'Información y relaciones',
    framework: 'WCAG',
    wcagLevel: 'A',
    coverage: 'PARTIALLY_EVALUABLE',
    mechanism: 'deterministic_and_ai',
    mechanismLabel: 'Determinístico (<h1>) + IA (ARIA/Headings)',
    scopeNote:
      'Verifica determinísticamente la presencia de <h1> cuando existen encabezados (hallazgo transversal con N-04) y analiza jerarquía de headings y landmarks con IA.',
  },
  {
    code: 'WCAG 1.4.1',
    name: 'Uso del color',
    framework: 'WCAG',
    wcagLevel: 'A',
    coverage: 'PARTIALLY_EVALUABLE',
    mechanism: 'ai_only',
    mechanismLabel: 'Análisis IA (DOM y estilos)',
    scopeNote: 'Evalúa mediante IA si el color se utiliza como único medio para transmitir información según textos y estilos capturados.',
  },
  {
    code: 'WCAG 1.4.3',
    name: 'Contraste (mínimo)',
    framework: 'WCAG',
    wcagLevel: 'AA',
    coverage: 'PARTIALLY_EVALUABLE',
    mechanism: 'deterministic_and_ai',
    mechanismLabel: 'Determinístico sRGB (4.5:1 / 3:1) + IA',
    scopeNote:
      'Calcula matemáticamente la luminancia relativa sRGB sobre elementos con fondo opaco declarado; marca como NOT_EVALUABLE fondos semitransparentes (alpha < 1).',
  },
  {
    code: 'WCAG 2.1.1',
    name: 'Teclado',
    framework: 'WCAG',
    wcagLevel: 'A',
    coverage: 'PARTIALLY_EVALUABLE',
    mechanism: 'catalog_no_dynamic_extractor',
    mechanismLabel: 'En catálogo · Sin extractor de teclado en MVP',
    scopeNote:
      'Incluido en la matriz de 10 criterios WCAG web, pero excluido del prompt de IA por requerir simulación de tabulación y orden de foco no capturados en el snapshot estático.',
  },
  {
    code: 'WCAG 2.4.4',
    name: 'Propósito de los enlaces (en contexto)',
    framework: 'WCAG',
    wcagLevel: 'A',
    coverage: 'PARTIALLY_EVALUABLE',
    mechanism: 'deterministic_and_ai',
    mechanismLabel: 'Determinístico (a[href]) + IA',
    scopeNote: 'Verifica determinísticamente que todo enlace a[href] posea texto o aria-label, y evalúa su claridad semántica con IA.',
  },
  {
    code: 'WCAG 2.4.6',
    name: 'Encabezados y etiquetas',
    framework: 'WCAG',
    wcagLevel: 'AA',
    coverage: 'PARTIALLY_EVALUABLE',
    mechanism: 'ai_only',
    mechanismLabel: 'Análisis IA (Headings y Labels)',
    scopeNote: 'Evalúa mediante IA la calidad descriptiva de los textos de encabezados (h1-h6) y etiquetas de formulario.',
  },
  {
    code: 'WCAG 3.2.2',
    name: 'Al recibir entradas (On Input)',
    framework: 'WCAG',
    wcagLevel: 'A',
    coverage: 'PARTIALLY_EVALUABLE',
    mechanism: 'catalog_no_dynamic_extractor',
    mechanismLabel: 'En catálogo · Sin extractor de cambio de contexto',
    scopeNote:
      'Incluido en la matriz de 10 criterios WCAG web, pero excluido del prompt de IA por requerir trazas dinámicas de cambio de contexto al alterar controles.',
  },
  {
    code: 'WCAG 3.3.2',
    name: 'Etiquetas o instrucciones',
    framework: 'WCAG',
    wcagLevel: 'A',
    coverage: 'PARTIALLY_EVALUABLE',
    mechanism: 'deterministic_and_ai',
    mechanismLabel: 'Determinístico (<form>) + IA',
    scopeNote:
      'Verifica determinísticamente la presencia de <label> o aria-label en controles de formulario; marca NOT_EVALUABLE cuando depende de aria-labelledby no resuelto.',
  },
  {
    code: 'WCAG 4.1.2',
    name: 'Nombre, función y valor',
    framework: 'WCAG',
    wcagLevel: 'A',
    coverage: 'PARTIALLY_EVALUABLE',
    mechanism: 'deterministic_and_ai',
    mechanismLabel: 'Determinístico (Botones) + IA',
    scopeNote: 'Verifica determinísticamente que los botones y controles interactivos posean nombre accesible (texto o aria-label).',
  },
]

// ─── Catálogos para Prototipos Visuales (6+4 Nielsen y 7+2 WCAG = 19 criterios) ─

export const PROTOTYPE_NIELSEN_CATALOG: readonly CriterionCatalogEntry[] = [
  {
    code: 'N-02',
    name: 'Coincidencia entre el sistema y el mundo real',
    framework: 'NIELSEN',
    coverage: 'DIRECTLY_EVALUABLE',
    mechanism: 'visual_direct_ai',
    mechanismLabel: 'Análisis visual IA (Evaluable directamente)',
    scopeNote: 'Evaluable desde una única imagen estática (metáforas, iconografía, textos y lenguaje visibles).',
  },
  {
    code: 'N-03',
    name: 'Control y libertad del usuario',
    framework: 'NIELSEN',
    coverage: 'DIRECTLY_EVALUABLE',
    mechanism: 'visual_direct_ai',
    mechanismLabel: 'Análisis visual IA (Evaluable directamente)',
    scopeNote: 'Evaluable desde la presencia o ausencia visible de salidas (botones cancelar, cerrar o retroceder).',
  },
  {
    code: 'N-04',
    name: 'Consistencia y estándares',
    framework: 'NIELSEN',
    coverage: 'DIRECTLY_EVALUABLE',
    mechanism: 'visual_direct_ai',
    mechanismLabel: 'Análisis visual IA (Evaluable directamente)',
    scopeNote: 'Evaluable por comparación visual entre elementos de la misma imagen (consistencia de estilos, formatos y etiquetas).',
  },
  {
    code: 'N-05',
    name: 'Prevención de errores',
    framework: 'NIELSEN',
    coverage: 'DIRECTLY_EVALUABLE',
    mechanism: 'visual_direct_ai',
    mechanismLabel: 'Análisis visual IA (Solo indicios visibles)',
    scopeNote:
      'Evaluable únicamente cuando existen indicaciones o advertencias visibles en la imagen; la ausencia de validación dinámica en reposo no se considera incumplimiento.',
  },
  {
    code: 'N-06',
    name: 'Reconocimiento antes que recuerdo',
    framework: 'NIELSEN',
    coverage: 'DIRECTLY_EVALUABLE',
    mechanism: 'visual_direct_ai',
    mechanismLabel: 'Análisis visual IA (Evaluable directamente)',
    scopeNote: 'Evaluable desde la visibilidad permanente de opciones, etiquetas e instrucciones en la pantalla.',
  },
  {
    code: 'N-08',
    name: 'Diseño estético y minimalista',
    framework: 'NIELSEN',
    coverage: 'DIRECTLY_EVALUABLE',
    mechanism: 'visual_direct_ai',
    mechanismLabel: 'Análisis visual IA (Evaluable directamente)',
    scopeNote: 'Evaluable directamente por composición, jerarquía, densidad informativa y ruido visual de la imagen.',
  },
  {
    code: 'N-01',
    name: 'Visibilidad del estado del sistema',
    framework: 'NIELSEN',
    coverage: 'OUT_OF_COVERAGE',
    mechanism: 'out_of_coverage_modality',
    mechanismLabel: 'Excluido en imagen estática',
    scopeNote: 'Requiere comparar un antes y después de una interacción; una única imagen estática no captura transiciones de estado.',
  },
  {
    code: 'N-07',
    name: 'Flexibilidad y eficiencia de uso',
    framework: 'NIELSEN',
    coverage: 'OUT_OF_COVERAGE',
    mechanism: 'out_of_coverage_modality',
    mechanismLabel: 'Excluido en imagen estática',
    scopeNote: 'Requiere observar atajos, aceleradores o rutas alternativas en uso; no es deducible de una captura estática.',
  },
  {
    code: 'N-09',
    name: 'Ayudar a reconocer, diagnosticar y recuperarse de errores',
    framework: 'NIELSEN',
    coverage: 'OUT_OF_COVERAGE',
    mechanism: 'out_of_coverage_modality',
    mechanismLabel: 'Excluido en imagen estática',
    scopeNote: 'Requiere un estado de error provocado tras una interacción; fuera de cobertura en la evaluación de una sola imagen.',
  },
  {
    code: 'N-10',
    name: 'Ayuda y documentación',
    framework: 'NIELSEN',
    coverage: 'OUT_OF_COVERAGE',
    mechanism: 'out_of_coverage_modality',
    mechanismLabel: 'Excluido en imagen estática',
    scopeNote: 'Requiere explorar y navegar el contenido de ayuda o documentación; no es evaluable desde una única imagen estática.',
  },
]

export const PROTOTYPE_WCAG_CATALOG: readonly CriterionCatalogEntry[] = [
  {
    code: 'WCAG 1.4.1',
    name: 'Uso del color',
    framework: 'WCAG',
    wcagLevel: 'A',
    coverage: 'DIRECTLY_EVALUABLE',
    mechanism: 'visual_direct_ai',
    mechanismLabel: 'Visual directo (Imagen estática)',
    scopeNote:
      'Tanto el uso del color como la presencia o ausencia de un indicador textual o icónico alternativo son observables en la imagen capturada.',
  },
  {
    code: 'WCAG 2.4.6',
    name: 'Encabezados y etiquetas',
    framework: 'WCAG',
    wcagLevel: 'AA',
    coverage: 'DIRECTLY_EVALUABLE',
    mechanism: 'visual_direct_ai',
    mechanismLabel: 'Visual directo (Imagen estática)',
    scopeNote: 'La calidad descriptiva de los encabezados y etiquetas visibles es evaluable visualmente sin depender del DOM.',
  },
  {
    code: 'WCAG 1.1.1',
    name: 'Contenido no textual',
    framework: 'WCAG',
    wcagLevel: 'A',
    coverage: 'PARTIALLY_EVALUABLE',
    mechanism: 'visual_partial_ai',
    mechanismLabel: 'Visual parcial (Sin acceso a DOM/alt)',
    scopeNote:
      'Permite observar íconos o controles gráficos sin indicio textual visible, pero no puede verificar la existencia del atributo programático alt o aria-label.',
  },
  {
    code: 'WCAG 1.3.1',
    name: 'Información y relaciones',
    framework: 'WCAG',
    wcagLevel: 'A',
    coverage: 'PARTIALLY_EVALUABLE',
    mechanism: 'visual_partial_ai',
    mechanismLabel: 'Visual parcial (Solo jerarquía visual)',
    scopeNote:
      'Permite observar la agrupación y jerarquía visual (tamaño, peso, espaciado), pero no puede confirmar el marcado semántico HTML (h1-h6, landmarks).',
  },
  {
    code: 'WCAG 1.4.3',
    name: 'Contraste mínimo',
    framework: 'WCAG',
    wcagLevel: 'AA',
    coverage: 'PARTIALLY_EVALUABLE',
    mechanism: 'visual_partial_ai',
    mechanismLabel: 'Visual parcial (Sin ratio numérico)',
    scopeNote:
      'Política VISUAL_OBSERVATION_ONLY: señala textos con legibilidad o contraste visual comprometido, sin calcular ni afirmar ratios numéricos sRGB desde píxeles.',
  },
  {
    code: 'WCAG 2.4.4',
    name: 'Propósito de los enlaces',
    framework: 'WCAG',
    wcagLevel: 'A',
    coverage: 'PARTIALLY_EVALUABLE',
    mechanism: 'visual_partial_ai',
    mechanismLabel: 'Visual parcial (Sin URLs de destino)',
    scopeNote:
      'Permite evaluar si el texto visible de un enlace o llamado a la acción es descriptivo, pero no puede verificar las URLs reales de destino.',
  },
  {
    code: 'WCAG 3.3.2',
    name: 'Etiquetas o instrucciones',
    framework: 'WCAG',
    wcagLevel: 'A',
    coverage: 'PARTIALLY_EVALUABLE',
    mechanism: 'visual_partial_ai',
    mechanismLabel: 'Visual parcial (Proximidad visual)',
    scopeNote:
      'Permite observar si existe una etiqueta o instrucción visible junto a cada campo, sin confirmar su asociación programática (<label for>).',
  },
  {
    code: 'WCAG 4.1.2',
    name: 'Nombre, función y valor',
    framework: 'WCAG',
    wcagLevel: 'A',
    coverage: 'OUT_OF_COVERAGE',
    mechanism: 'out_of_coverage_modality',
    mechanismLabel: 'Excluido en imagen estática',
    scopeNote: 'Los roles, estados y valores accesibles programáticos (ARIA/DOM) son invisibles en una imagen estática.',
  },
  {
    code: 'WCAG 2.1.1',
    name: 'Teclado',
    framework: 'WCAG',
    wcagLevel: 'A',
    coverage: 'OUT_OF_COVERAGE',
    mechanism: 'out_of_coverage_modality',
    mechanismLabel: 'Excluido en imagen estática',
    scopeNote: '100 % comportamental (operabilidad y orden de foco por teclado); no es observable en una imagen estática.',
  },
]

export const PROTOTYPE_UNCONTEMPLATED_WCAG_NOTE =
  'Nota metodológica sobre el catálogo visual: El inventario de prototipos estáticos contempla 9 criterios WCAG 2.2 (7 aplicables visualmente y 2 excluidos por requerir inspección programática o teclado, que junto con las 4 heurísticas excluidas suman los 6 criterios fuera de cobertura del reporte). El criterio WCAG 3.2.2 (Al recibir entradas / On Input), presente en el catálogo de 10 criterios de sitios web, no forma parte del inventario de prototipos.'

// ─── Funciones puras de normalización y reconstrucción ────────────────────────

const SEVERITY_ORDER: readonly FindingSeverity[] = ['critical', 'high', 'medium', 'low', 'info']

function getHigherSeverity(sev1: FindingSeverity, sev2: FindingSeverity): FindingSeverity {
  const idx1 = SEVERITY_ORDER.indexOf(sev1)
  const idx2 = SEVERITY_ORDER.indexOf(sev2)
  if (idx1 === -1) return sev2
  if (idx2 === -1) return sev1
  return idx1 <= idx2 ? sev1 : sev2
}

/**
 * Espejo exacto de `AuditMetricsService.normalizeCriterionKey` (audit-metrics.service.ts:L361-368)
 * y `ground-truth-oracle.ts`.
 */
export function normalizeCriterionKey(criterion?: string | null): string {
  if (!criterion) return 'unknown'
  const nielsenMatch = criterion.match(/N-\d{2}/i)
  if (nielsenMatch) return nielsenMatch[0].toUpperCase().trim()
  const wcagMatch = criterion.match(/(?<!\d\.)\b(?:WCAG\s+)?(\d+\.\d+\.\d+)(?!\.\d)\b/i)
  if (wcagMatch) return `WCAG ${wcagMatch[1]}`
  return criterion.toLowerCase().replace(/\s+/g, ' ').trim()
}

/**
 * Extrae exclusivamente el código WCAG canónico (`WCAG X.X.X`) de una cadena,
 * incluso si la cadena contuviera otro texto.
 */
export function extractCanonicalWcagCode(wcagCriterion?: string | null): string | null {
  if (!wcagCriterion) return null
  const wcagMatch = wcagCriterion.match(/(?<!\d\.)\b(?:WCAG\s+)?(\d+\.\d+\.\d+)(?!\.\d)\b/i)
  return wcagMatch ? `WCAG ${wcagMatch[1]}` : null
}

/**
 * Extrae exclusivamente el código Nielsen canónico (`N-XX`) de un finding.
 */
export function extractCanonicalNielsenCode(heuristicCode?: string | null): string | null {
  if (!heuristicCode) return null
  const nielsenMatch = heuristicCode.match(/N-\d{2}/i)
  return nielsenMatch ? nielsenMatch[0].toUpperCase().trim() : null
}

/**
 * Indica si un documento Finding lleva simultáneamente un código de heurística
 * Nielsen (`N-XX`) y un criterio WCAG (`WCAG X.X.X`).
 */
export function hasDualDomainCodes(finding: Finding): boolean {
  const nCode = extractCanonicalNielsenCode(finding.heuristicCode)
  const wCode = extractCanonicalWcagCode(finding.wcagCriterion)
  return Boolean(nCode && wCode)
}

/**
 * Detecta si un documento Finding corresponde verificablemente al hallazgo
 * determinístico transversal de ausencia de `<h1>` emitido por
 * `DeterministicAnalyzer.analyzeHeadings()` (`N-04` + `WCAG 1.3.1` + evidencia
 * `HEADING_STRUCTURE` con `h1_count: 0`).
 *
 * No retorna `true` para hallazgos duales emitidos por Gemini (p. ej. `<nav>`
 * sin `aria-label` o `<h2>` antes de `<h1>` en EJE-10), evitando atribuir
 * falsamente una ausencia de `<h1>` cuando la evidencia no la respalda.
 */
export function isCrossDomainHeadingFinding(finding: Finding): boolean {
  const nCode = extractCanonicalNielsenCode(finding.heuristicCode)
  const wCode = extractCanonicalWcagCode(finding.wcagCriterion)
  if (nCode !== 'N-04' || wCode !== 'WCAG 1.3.1') {
    return false
  }
  return Boolean(
    finding.evidence?.some(
      (e) =>
        e.type === 'HEADING_STRUCTURE' &&
        typeof e.value === 'string' &&
        /\bh1_count\s*:\s*0\b/i.test(e.value.trim()),
    ),
  )
}

/**
 * Clasifica de forma determinística el origen de un documento Finding persistido,
 * sin requerir modificaciones en MongoDB.
 *
 * Categorías honestas:
 * - `'deterministic'`: solo cuando existe firma verificable del `DeterministicAnalyzer`
 *   (o discrepancia donde el mecanismo alternativo es `'ai'`).
 * - `'ai'`: cuando la modalidad es prototipo, existe `VISUAL_OBSERVATION`, existe
 *   `discrepancy.origin === 'deterministic'`, el `type` pertenece al esquema de Gemini
 *   (`usability | content | interaction | visual`), o lleva `heuristicCode` sin ser
 *   el hallazgo programático `h1_count: 0`.
 * - `'unknown'`: cuando los datos históricos no permiten atribuir el mecanismo con
 *   certeza; nunca presenta una inferencia débil como confirmación.
 */
export type ResolvedFindingOrigin = 'deterministic' | 'ai' | 'unknown'

const AI_ONLY_FINDING_TYPES = new Set(['usability', 'content', 'interaction', 'visual'])

function hasDeterministicWcagSignature(finding: Finding): boolean {
  if (finding.type !== 'wcag' || finding.heuristicCode) {
    return false
  }

  const wcagCode = extractCanonicalWcagCode(finding.wcagCriterion)
  const evidence = finding.evidence || []
  const desc = (finding.description || '').trim()

  if (!wcagCode || evidence.length === 0) {
    return false
  }

  // analyzeContrast -> WCAG 1.4.3 con COMPUTED_STYLE + property contrastRatio
  if (wcagCode === 'WCAG 1.4.3') {
    return evidence.some((e) => e.type === 'COMPUTED_STYLE' && e.property === 'contrastRatio')
  }

  // analyzeImages -> WCAG 1.1.1 con DOM_ATTRIBUTE (alt/role/aria-hidden) + plantilla determinística
  if (wcagCode === 'WCAG 1.1.1') {
    const hasImgEv = evidence.some(
      (e) => e.type === 'DOM_ATTRIBUTE' && (e.property === 'alt' || e.property === 'role' || e.property === 'aria-hidden'),
    )
    return hasImgEv && /^La imagen\b/i.test(desc)
  }

  // analyzeLinks -> WCAG 2.4.4 con DOM_ATTRIBUTE (href/text/ariaLabel) + plantilla determinística
  if (wcagCode === 'WCAG 2.4.4') {
    const hasLinkEv = evidence.some(
      (e) => e.type === 'DOM_ATTRIBUTE' && (e.property === 'href' || e.property === 'text' || e.property === 'ariaLabel'),
    )
    return hasLinkEv && /^El enlace\b/i.test(desc)
  }

  // analyzeForms -> WCAG 3.3.2 con DOM_ATTRIBUTE (label/ariaLabel/aria-labelledby/id) + plantilla determinística
  if (wcagCode === 'WCAG 3.3.2') {
    const hasFormEv = evidence.some(
      (e) =>
        e.type === 'DOM_ATTRIBUTE' &&
        (e.property === 'label' || e.property === 'ariaLabel' || e.property === 'aria-labelledby' || e.property === 'id'),
    )
    return hasFormEv && /^(El campo|El control|No se pudo determinar la etiqueta)/i.test(desc)
  }

  // analyzeButtons -> WCAG 4.1.2 con DOM_ATTRIBUTE (text/ariaLabel/role) + plantilla determinística
  if (wcagCode === 'WCAG 4.1.2') {
    const hasBtnEv = evidence.some(
      (e) => e.type === 'DOM_ATTRIBUTE' && (e.property === 'text' || e.property === 'ariaLabel' || e.property === 'role'),
    )
    return hasBtnEv && /^El bot[oó]n\b/i.test(desc)
  }

  return false
}

export function resolveFindingOrigin(
  finding: Finding,
  evaluationType: EvaluationType = 'website',
): ResolvedFindingOrigin {
  if (evaluationType === 'prototype') {
    return 'ai'
  }
  if (finding.evidence?.some((e) => e.type === 'VISUAL_OBSERVATION')) {
    return 'ai'
  }
  if (finding.discrepancy) {
    return finding.discrepancy.origin === 'ai' ? 'deterministic' : 'ai'
  }
  // 1. Firma verificable de regla determinística `analyzeHeadings()` (ausencia de <h1>)
  if (isCrossDomainHeadingFinding(finding)) {
    return 'deterministic'
  }
  // 2. Firma verificable de las 5 reglas determinísticas WCAG de DeterministicAnalyzer
  if (hasDeterministicWcagSignature(finding)) {
    return 'deterministic'
  }
  // 3. Tipos propios del esquema de Gemini (no usados por reglas determinísticas excepto h1_count: 0 ya capturado arriba)
  if (finding.type && AI_ONLY_FINDING_TYPES.has(finding.type.toLowerCase())) {
    return 'ai'
  }
  // 4. Cualquier hallazgo con código heurístico Nielsen distinto de `h1_count: 0` solo pudo originarse en Gemini
  if (extractCanonicalNielsenCode(finding.heuristicCode)) {
    return 'ai'
  }
  // 5. Sin firma concluyente en los metadatos históricos -> categoría honesta indeterminada
  return 'unknown'
}

/**
 * Determina si un Finding pertenece a un código de criterio canónico (`N-XX` o `WCAG X.X.X`),
 * respetando la semántica de cada modalidad para que el filtro entre `CriteriaCoverageMatrix`
 * y `FindingsAccordion` sea 100 % consistente con los conteos de la matriz.
 */
export function findingMatchesCriterion(
  finding: Finding,
  criterionCode: string,
  evaluationType: EvaluationType = 'website',
): boolean {
  const target = normalizeCriterionKey(criterionCode)
  if (evaluationType === 'prototype') {
    const key = normalizeCriterionKey(finding.wcagCriterion || finding.heuristicCode || undefined)
    return key === target
  }
  // Modalidad website: dos comprobaciones independientes (igual que AuditMetricsService.calculateMetrics)
  if (target.startsWith('N-')) {
    return extractCanonicalNielsenCode(finding.heuristicCode) === target
  }
  if (target.startsWith('WCAG ')) {
    return normalizeCriterionKey(finding.wcagCriterion) === target
  }
  return false
}

/**
 * Reconstruye la matriz completa de cobertura de criterios (Nielsen y WCAG) a partir
 * de los documentos `Finding` persistidos, reproduciendo con exactitud matemática
 * los agregados históricos de `Report` tanto en sitios web como en prototipos.
 */
export function buildCriteriaCoverageMatrix(
  findings: Finding[],
  evaluationType: EvaluationType = 'website',
): ReconstructedCoverageMatrix {
  const isPrototype = evaluationType === 'prototype'
  const nielsenCatalog = isPrototype ? PROTOTYPE_NIELSEN_CATALOG : WEB_NIELSEN_CATALOG
  const wcagCatalog = isPrototype ? PROTOTYPE_WCAG_CATALOG : WEB_WCAG_CATALOG

  const nielsenFindingsMap = new Map<string, Finding[]>()
  const wcagFindingsMap = new Map<string, Finding[]>()

  for (const entry of nielsenCatalog) {
    if (entry.coverage !== 'OUT_OF_COVERAGE') {
      nielsenFindingsMap.set(entry.code, [])
    }
  }
  for (const entry of wcagCatalog) {
    if (entry.coverage !== 'OUT_OF_COVERAGE') {
      wcagFindingsMap.set(entry.code, [])
    }
  }

  const unmappedFindings: Finding[] = []

  if (isPrototype) {
    // Replica exactamente `calculatePrototypeMetrics` (prototype-metrics.service.ts:L57-69):
    // `const key = normalizeCriterionKey(f.wcagCriterion || f.heuristicCode || undefined)`
    for (const f of findings) {
      const key = normalizeCriterionKey(f.wcagCriterion || f.heuristicCode || undefined)
      if (nielsenFindingsMap.has(key)) {
        nielsenFindingsMap.get(key)!.push(f)
      } else if (wcagFindingsMap.has(key)) {
        wcagFindingsMap.get(key)!.push(f)
      } else {
        unmappedFindings.push(f)
      }
    }
  } else {
    // Replica exactamente `AuditMetricsService.calculateMetrics` (audit-metrics.service.ts:L574-610):
    // Dos bloques `if` independientes (NO `else if`).
    for (const f of findings) {
      let mapped = false

      if (f.heuristicCode && nielsenFindingsMap.has(f.heuristicCode)) {
        nielsenFindingsMap.get(f.heuristicCode)!.push(f)
        mapped = true
      }

      if (f.wcagCriterion) {
        const matchedWCAG = normalizeCriterionKey(f.wcagCriterion)
        if (wcagFindingsMap.has(matchedWCAG)) {
          wcagFindingsMap.get(matchedWCAG)!.push(f)
          mapped = true
        }
      }

      if (!mapped) {
        unmappedFindings.push(f)
      }
    }
  }

  const buildRow = (
    entry: CriterionCatalogEntry,
    groupMap: Map<string, Finding[]>,
  ): ReconstructedCriterionRow => {
    if (entry.coverage === 'OUT_OF_COVERAGE') {
      return {
        ...entry,
        status: 'OUT_OF_COVERAGE',
        traceabilityCase: 'CASE_D_OUT_OF_COVERAGE',
        maxSeverity: 'info',
        findingsCount: 0,
        failFindingsCount: 0,
        passFindingsCount: 0,
        notEvaluableFindingsCount: 0,
        associatedFindings: [],
        hasCrossDomainHeadingFinding: false,
      }
    }

    const group = groupMap.get(entry.code) || []
    const failItems = group.filter((f) => f.status === 'FAIL')
    const passItems = group.filter((f) => f.status === 'PASS')
    const notEvalItems = group.filter((f) => f.status === 'NOT_EVALUABLE')
    const hasCrossDomain = group.some((f) => isCrossDomainHeadingFinding(f))

    let status: FindingStatus = 'NOT_EVALUABLE'
    let maxSeverity: FindingSeverity = 'info'
    let traceabilityCase: CriterionTraceabilityCase = 'CASE_B_NOT_EVALUABLE_NO_FINDING'

    if (failItems.length > 0) {
      status = 'FAIL'
      maxSeverity = failItems.reduce<FindingSeverity>(
        (worst, f) => getHigherSeverity(worst, f.severity),
        failItems[0].severity,
      )
      traceabilityCase = 'CASE_A_WITH_VERDICT'
    } else if (passItems.length > 0) {
      status = 'PASS'
      maxSeverity = 'info'
      traceabilityCase = 'CASE_A_WITH_VERDICT'
    } else if (notEvalItems.length > 0) {
      status = 'NOT_EVALUABLE'
      maxSeverity = 'info'
      traceabilityCase = 'CASE_C_NOT_EVALUABLE_WITH_FINDING'
    } else {
      status = 'NOT_EVALUABLE'
      maxSeverity = 'info'
      traceabilityCase = 'CASE_B_NOT_EVALUABLE_NO_FINDING'
    }

    return {
      ...entry,
      status,
      traceabilityCase,
      maxSeverity,
      findingsCount: group.length,
      failFindingsCount: failItems.length,
      passFindingsCount: passItems.length,
      notEvaluableFindingsCount: notEvalItems.length,
      associatedFindings: group,
      hasCrossDomainHeadingFinding: hasCrossDomain,
    }
  }

  const nielsenRows = nielsenCatalog.map((entry) => buildRow(entry, nielsenFindingsMap))
  const wcagRows = wcagCatalog.map((entry) => buildRow(entry, wcagFindingsMap))

  const summarizeDomain = (rows: ReconstructedCriterionRow[]): ReconstructedDomainSummary => {
    const applicableRows = rows.filter((r) => r.status !== 'OUT_OF_COVERAGE')
    const outOfCoverageCount = rows.filter((r) => r.status === 'OUT_OF_COVERAGE').length
    const passCount = applicableRows.filter((r) => r.status === 'PASS').length
    const failCount = applicableRows.filter((r) => r.status === 'FAIL').length
    const notEvaluableRows = applicableRows.filter((r) => r.status === 'NOT_EVALUABLE')
    const notEvaluableCount = notEvaluableRows.length
    const notEvaluableWithFindingsCount = notEvaluableRows.filter(
      (r) => r.traceabilityCase === 'CASE_C_NOT_EVALUABLE_WITH_FINDING',
    ).length
    const notEvaluableWithoutFindingsCount = notEvaluableRows.filter(
      (r) => r.traceabilityCase === 'CASE_B_NOT_EVALUABLE_NO_FINDING',
    ).length

    const evaluatedCount = passCount + failCount
    const applicableCount = applicableRows.length
    const compliance =
      evaluatedCount > 0 ? parseFloat(((passCount / evaluatedCount) * 100).toFixed(2)) : null
    const coveragePercent =
      applicableCount > 0 ? parseFloat(((evaluatedCount / applicableCount) * 100).toFixed(2)) : 0

    return {
      applicableCount,
      evaluatedCount,
      passCount,
      failCount,
      notEvaluableCount,
      notEvaluableWithFindingsCount,
      notEvaluableWithoutFindingsCount,
      outOfCoverageCount,
      compliance,
      coveragePercent,
    }
  }

  const nielsenSummary = summarizeDomain(nielsenRows)
  const wcagSummary = summarizeDomain(wcagRows)

  const applicableCriteria = nielsenSummary.applicableCount + wcagSummary.applicableCount
  const evaluatedCriteria = nielsenSummary.evaluatedCount + wcagSummary.evaluatedCount
  const passCriteria = nielsenSummary.passCount + wcagSummary.passCount
  const failCriteria = nielsenSummary.failCount + wcagSummary.failCount
  const notEvaluableCriteria = nielsenSummary.notEvaluableCount + wcagSummary.notEvaluableCount
  const outOfCoverageCriteria = nielsenSummary.outOfCoverageCount + wcagSummary.outOfCoverageCount
  const auditCoveragePercent =
    applicableCriteria > 0
      ? parseFloat(((evaluatedCriteria / applicableCriteria) * 100).toFixed(2))
      : 0

  return {
    evaluationType,
    nielsenRows,
    wcagRows,
    nielsenSummary,
    wcagSummary,
    globalSummary: {
      applicableCriteria,
      evaluatedCriteria,
      passCriteria,
      failCriteria,
      notEvaluableCriteria,
      outOfCoverageCriteria,
      auditCoveragePercent,
    },
    unmappedFindings,
    ...(isPrototype ? { uncontemplatedPrototypeNote: PROTOTYPE_UNCONTEMPLATED_WCAG_NOTE } : {}),
  }
}

const REGION_LABELS_ES: Record<string, string> = {
  'top-left': 'Superior izquierda',
  'top-center': 'Superior central',
  'top-right': 'Superior derecha',
  'middle-left': 'Media izquierda',
  center: 'Centro',
  'middle-right': 'Media derecha',
  'bottom-left': 'Inferior izquierda',
  'bottom-center': 'Inferior central',
  'bottom-right': 'Inferior derecha',
  'full-screen': 'Pantalla completa',
}

export function formatVisualRegionLabel(region?: string | null): string {
  if (!region) return ''
  const es = REGION_LABELS_ES[region]
  return es ? `${es} (${region})` : region
}

// ─── Trazabilidad temporal entre Snapshots y Acciones (previousActions) ──────

export interface TemporalActionItem {
  actionType: string
  description: string
  result?: 'success' | 'failure' | string
  targetElement?: string
}

export interface SnapshotTemporalActions {
  /**
   * Acción que produjo el estado visual que se observa en la captura del Paso k.
   * En el bucle de Playwright (`evaluation.service.ts:L504-741`):
   * - Paso 1: corresponde a `previousActions[0]` (`[NAVIGATE] Navegar a <url>`).
   * - Paso k (k >= 2): corresponde a `previousActions[k - 1]` (la acción ejecutada
   *   al final del Paso k-1 cuyo resultado fue capturado al inicio del Paso k).
   */
  actionReflectedInCapture: TemporalActionItem | null
  /**
   * Acción decidida por el agente al inspeccionar la pantalla del Paso k y ejecutada
   * DESPUÉS de haber guardado la captura de pantalla del Paso k (`previousActions[k]`).
   */
  actionExecutedAfterCapture: TemporalActionItem | null
  /**
   * `true` si existe un Paso k+1 posterior cuya captura refleja el resultado de
   * `actionExecutedAfterCapture`; `false` si `actionExecutedAfterCapture` ocurrió en el
   * último paso capturado (por fallo de la acción o por alcanzar el límite de iteraciones).
   */
  afterActionHasSubsequentCapture: boolean
}

export function resolveSnapshotTemporalActions(
  snapshot: SnapshotEvidenceItem,
  allSnapshots: SnapshotEvidenceItem[],
  previousActions?: Array<{ actionType: string; description: string; result: 'success' | 'failure' | string }>,
): SnapshotTemporalActions {
  const k = snapshot.iteration || 1
  const totalSnapshots = allSnapshots.length

  if (previousActions && previousActions.length > 0) {
    const reflectedRaw = previousActions[k - 1] ?? null
    const afterRaw = previousActions[k] ?? null

    const actionReflectedInCapture: TemporalActionItem | null = reflectedRaw
      ? {
          actionType: reflectedRaw.actionType,
          description: reflectedRaw.description,
          result: reflectedRaw.result,
        }
      : snapshot.action
        ? {
            actionType: snapshot.action.actionType,
            description: snapshot.action.description,
            targetElement: snapshot.action.targetElement,
          }
        : snapshot.actionExecuted
          ? { actionType: 'ACCIÓN', description: snapshot.actionExecuted }
          : k === 1
            ? { actionType: 'NAVIGATE', description: `Carga inicial de ${snapshot.url}`, result: 'success' }
            : null

    const actionExecutedAfterCapture: TemporalActionItem | null = afterRaw
      ? {
          actionType: afterRaw.actionType,
          description: afterRaw.description,
          result: afterRaw.result,
        }
      : null

    return {
      actionReflectedInCapture,
      actionExecutedAfterCapture,
      afterActionHasSubsequentCapture: Boolean(actionExecutedAfterCapture && k < totalSnapshots),
    }
  }

  // Fallback cuando no se dispone de `previousActions` (ej. mocks unitarios simples de SnapshotEvidence)
  const fallbackAction: TemporalActionItem | null = snapshot.action
    ? {
        actionType: snapshot.action.actionType,
        description: snapshot.action.description,
        targetElement: snapshot.action.targetElement,
      }
    : snapshot.actionExecuted
      ? { actionType: 'ACCIÓN', description: snapshot.actionExecuted }
      : k === 1
        ? { actionType: 'NAVIGATE', description: 'Navegación Inicial', result: 'success' }
        : null

  return {
    actionReflectedInCapture: fallbackAction,
    actionExecutedAfterCapture: null,
    afterActionHasSubsequentCapture: false,
  }
}

// ─── Resumen de integridad de exploración ─────────────────────────────────────

export interface ExplorationIntegritySummary {
  isComplete: boolean
  statusLabel: string
  terminationReasonCode: string
  terminationReasonLabel: string
  capturedStepsCount: number
  maxIterationsUsed?: number
  totalActionsCount: number
  successfulActionsCount: number
  failedActionsCount: number
  lastActionVerifiedBySnapshot: boolean | undefined
  persistenceFailuresCount: number
  integrityNote: string
}

const TERMINATION_LABELS_ES: Record<string, string> = {
  NATURAL_STOP: 'Finalización natural del recorrido',
  MAX_ITERATIONS_REACHED: 'Alcanzó el límite máximo de pasos de exploración',
  ACTION_FAILED: 'Detenido por una interacción fallida o enlace fuera de alcance',
  INVALID_ACTION_DECISION: 'Detenido por decisión de acción sin elemento objetivo válido',
  EXPLORATION_ERROR: 'Interrumpido por error general durante la sesión de exploración',
  UNKNOWN: 'Motivo de cierre no especificado en el registro histórico',
}

export function buildExplorationIntegritySummary(params: {
  evaluation?: Evaluation | null
  report?: Report | null
  snapshots?: SnapshotEvidenceItem[]
}): ExplorationIntegritySummary {
  const { evaluation, report, snapshots = [] } = params
  const flowState = evaluation?.flowState
  const expIntegrity = report?.metrics?.explorationIntegrity

  const previousActions = flowState?.previousActions || []
  const successfulActionsCount = previousActions.filter((a) => a.result === 'success').length
  const failedActionsCount = previousActions.filter((a) => a.result === 'failure').length

  const terminationReasonCode =
    flowState?.terminationReason ||
    expIntegrity?.terminationReason ||
    (flowState?.blockingError ? 'ACTION_FAILED' : 'NATURAL_STOP')

  const terminationReasonLabel =
    TERMINATION_LABELS_ES[terminationReasonCode] || TERMINATION_LABELS_ES.UNKNOWN

  const persistenceFailuresCount =
    flowState?.snapshotIntegrity?.persistenceFailures?.length ??
    expIntegrity?.snapshotPersistenceFailureCount ??
    0

  const lastActionVerifiedBySnapshot =
    flowState?.snapshotIntegrity?.lastActionVerifiedBySnapshot ??
    expIntegrity?.evidenceFullyVerified

  const isComplete =
    expIntegrity?.complete !== undefined
      ? expIntegrity.complete
      : terminationReasonCode === 'NATURAL_STOP' &&
        !flowState?.blockingError &&
        persistenceFailuresCount === 0 &&
        lastActionVerifiedBySnapshot !== false

  const capturedStepsCount = snapshots.length || report?.iterationsEvaluated || flowState?.currentStep || 1

  let integrityNote = 'Todas las capturas de los pasos ejecutados se almacenaron y verificaron correctamente.'
  if (flowState?.blockingError) {
    integrityNote = `El recorrido se detuvo de forma controlada tras un problema de interacción en el último paso. El análisis se realizó sobre las ${capturedStepsCount} capturas obtenidas hasta ese momento.`
  } else if (terminationReasonCode === 'MAX_ITERATIONS_REACHED') {
    integrityNote =
      lastActionVerifiedBySnapshot === false
        ? `La sesión alcanzó su límite de ${capturedStepsCount} pasos inmediatamente después de ejecutar la última acción; el efecto posterior de esa última acción no cuenta con una captura adicional.`
        : `La sesión alcanzó el límite de ${capturedStepsCount} pasos establecidos para la exploración.`
  } else if (persistenceFailuresCount > 0) {
    integrityNote = `Se registraron ${persistenceFailuresCount} fallo(s) al guardar capturas intermedias durante la sesión.`
  }

  return {
    isComplete,
    statusLabel: isComplete ? 'Exploración completa y verificada' : 'Exploración parcial / acotada',
    terminationReasonCode,
    terminationReasonLabel,
    capturedStepsCount,
    maxIterationsUsed: flowState?.maxIterationsUsed,
    totalActionsCount: previousActions.length,
    successfulActionsCount,
    failedActionsCount,
    lastActionVerifiedBySnapshot,
    persistenceFailuresCount,
    integrityNote,
  }
}

// ─── Contexto y alcance histórico por criterio (4 apartados) ─────────────────

export interface CriterionEvaluationContext {
  /** A. Resultado de la evaluación */
  resultSection: {
    statusSummary: string
    explanation: string
    deterministicHeadingCheckNote?: string
  }
  /** B. Información recopilada */
  collectedInfoSection: {
    framingDisclaimer: string
    items: string[]
    availableStepsNote?: string
  }
  /** C. Limitaciones de la revisión */
  limitationsSection: {
    items: string[]
  }
  /** D. Verificación humana recomendada */
  humanVerificationSection: {
    recommendation: string
  }
}

const EXIT_CONTROL_REGEX = /\b(cancel|cancelar|close|cerrar|back|volver|regresar|atrás|salir|hide|ocultar|dismiss|rechazar|skip|omitir)\b/i
const HELP_LINK_REGEX = /\b(help|ayuda|faq|preguntas frecuentes|support|soporte|docs|documentation|documentación|guía|guide|manual|contacto|contact)\b/i
const SPECIFIC_INPUT_TYPES = new Set(['email', 'tel', 'number', 'url', 'date', 'time', 'datetime-local', 'month', 'week', 'search'])

const HUMAN_VERIFICATION_BY_CODE: Record<string, string> = {
  'N-01':
    'Interactuar manualmente con los controles principales (envío de formularios, filtros, carga de secciones) para comprobar si la interfaz muestra indicadores inmediatos de progreso, confirmación o estado activo.',
  'N-02':
    'Revisar que los términos, iconos, metáforas visuales y formatos (moneda, fechas, unidades) sean naturales y comprensibles para el perfil de usuario objetivo en su contexto real de uso.',
  'N-03':
    'Comprobar en un flujo real si el usuario puede cancelar procesos iniciados, cerrar ventanas emergentes con facilidad (incluyendo tecla Escape o clic exterior) y retroceder o deshacer acciones sin perder el control.',
  'N-04':
    'Contrastando varias pantallas o secciones del producto, verificar que los botones, enlaces, titulares y componentes con la misma función mantengan una terminología, ubicación y apariencia visual uniformes.',
  'N-05':
    'Intentar realizar acciones críticas o completar formularios con datos límite para verificar si existen restricciones de formato útiles, sugerencias previas y diálogos de confirmación antes de acciones irreversibles.',
  'N-06':
    'Comprobar que las etiquetas de los campos permanezcan visibles al escribir, que los iconos no estándar vayan acompañados de texto y que el usuario no necesite recordar datos de una pantalla a otra.',
  'N-07':
    'Evaluar con usuarios frecuentes si existen atajos de teclado, filtros rápidos, valores predeterminados inteligentes o rutas abreviadas para acelerar tareas repetitivas.',
  'N-08':
    'Inspeccionar visualmente la jerarquía de la pantalla para confirmar que los elementos decorativos, fondos o bloques promocionales no compitan con la lectura ni distraigan de la tarea principal.',
  'N-09':
    'Provocar deliberadamente entradas inválidas o vacías en los formularios para verificar si los mensajes de error aparecen junto al campo afectado, usan lenguaje claro y explican cómo corregir el problema.',
  'N-10':
    'Navegar hacia las secciones de ayuda, preguntas frecuentes o soporte contextual para comprobar si están disponibles, son fáciles de buscar y ofrecen pasos concretos orientados a la tarea del usuario.',
  'WCAG 1.1.1':
    'Verificar con un lector de pantalla que cada imagen informativa, icono funcional o gráfico transmita su propósito equivalente, y que las imágenes puramente decorativas sean ignoradas.',
  'WCAG 1.3.1':
    'Inspeccionar el árbol semántico completo (tablas de datos, listas, agrupaciones de formulario y jerarquía h1-h6) para confirmar que la estructura visual esté respaldada por etiquetas HTML correctas.',
  'WCAG 1.4.1':
    'Comprobar que los estados, enlaces dentro de párrafos, alertas o categorías en gráficos no dependan únicamente del color y cuenten con texto, iconos, subrayado o patrones diferenciadores.',
  'WCAG 1.4.3':
    'Medir con un analizador de color los textos colocados sobre imágenes, degradados o fondos translúcidos (no determinables automáticamente desde un estilo CSS plano) para asegurar la relación mínima de 4.5:1 (o 3:1 en texto grande).',
  'WCAG 2.1.1':
    'Recorrer toda la interfaz utilizando únicamente el teclado (teclas Tab, Shift+Tab, Enter, Espacio y flechas) para confirmar que todos los controles sean alcanzables, operables y sin trampas de foco.',
  'WCAG 2.4.4':
    'Revisar que cada enlace comunique claramente a dónde conduce sin ambigüedades, especialmente cuando existen varios enlaces con textos similares que apuntan a destinos diferentes.',
  'WCAG 2.4.6':
    'Evaluar si los encabezados de sección y las etiquetas de los controles describen con claridad su tema o propósito para orientar al usuario.',
  'WCAG 3.2.2':
    'Interactuar con listas desplegables, casillas y botones de opción para verificar que cambiar su selección no provoque recargas, envíos automáticos ni cambios inesperados de contexto sin aviso previo.',
  'WCAG 3.3.2':
    'Comprobar que todo campo de entrada cuente con una etiqueta persistente e instrucciones visibles sobre formatos obligatorios antes de que el usuario comience a escribir.',
  'WCAG 4.1.2':
    'Probar los componentes interactivos personalizados (modales, pestañas, menús desplegables, interruptores) con tecnologías de asistencia para confirmar que anuncien su nombre, rol y estado actual.',
}

export function buildCriterionEvaluationContext(
  row: ReconstructedCriterionRow,
  params: {
    evaluation?: Evaluation | null
    report?: Report | null
    snapshots?: SnapshotEvidenceItem[]
  } = {},
): CriterionEvaluationContext {
  const { evaluation, report, snapshots = [] } = params
  const isPrototype = row.mechanism === 'out_of_coverage_modality' ||
    row.mechanism === 'visual_direct_ai' ||
    row.mechanism === 'visual_partial_ai' ||
    evaluation?.type === 'prototype'

  const previousActions = evaluation?.flowState?.previousActions || []
  const hasSnapshots = snapshots.length > 0

  // ── Agregados reales de los snapshots capturados (Sitios Web) ───────────────
  let totalHeadings = 0
  let totalH1 = 0
  let totalSubHeadings = 0
  let stepsWithH1 = 0
  let stepsWithHeadingsButNoH1 = 0
  const sampleHeadings: string[] = []

  let totalImages = 0
  let decorativeImages = 0
  let imagesWithAlt = 0
  let imagesWithoutAlt = 0

  let totalLinks = 0
  let linksWithTextOrAria = 0
  let helpLikeLinks = 0
  const sampleHelpLinks: string[] = []

  let totalButtons = 0
  let buttonsWithTextOrAria = 0
  let disabledButtons = 0
  let exitLikeControls = 0
  const sampleExitControls: string[] = []

  let totalForms = 0
  let totalFormControls = 0
  let requiredControls = 0
  let typedControls = 0
  let labeledControls = 0
  let placeholderControls = 0
  let ariaInvalidControls = 0
  let searchElements = 0

  let totalLandmarks = 0
  const landmarkTypes = new Set<string>()
  let totalComputedStyles = 0
  const distinctUrls = new Set<string>()

  for (const snap of snapshots) {
    if (snap.url) distinctUrls.add(snap.url)

    const headings = snap.headings || []
    totalHeadings += headings.length
    const snapH1 = headings.filter((h) => h.level === 1).length
    totalH1 += snapH1
    totalSubHeadings += headings.length - snapH1
    if (snapH1 > 0) stepsWithH1++
    if (headings.length > 0 && snapH1 === 0) stepsWithHeadingsButNoH1++
    for (const h of headings) {
      if (h.text && sampleHeadings.length < 3 && !sampleHeadings.includes(h.text.trim())) {
        sampleHeadings.push(h.text.trim().slice(0, 60))
      }
    }

    const images = snap.images || []
    totalImages += images.length
    for (const img of images) {
      if (img.isDecorative) decorativeImages++
      else if (img.alt && img.alt.trim().length > 0) imagesWithAlt++
      else imagesWithoutAlt++
    }

    const links = snap.links || []
    totalLinks += links.length
    for (const l of links) {
      const label = (l.ariaLabel || l.text || '').trim()
      if (label.length > 0) linksWithTextOrAria++
      if (EXIT_CONTROL_REGEX.test(label) || EXIT_CONTROL_REGEX.test(l.href || '')) {
        exitLikeControls++
        if (label && sampleExitControls.length < 3 && !sampleExitControls.includes(label)) {
          sampleExitControls.push(label.slice(0, 45))
        }
      }
      if (HELP_LINK_REGEX.test(label) || HELP_LINK_REGEX.test(l.href || '')) {
        helpLikeLinks++
        if (label && sampleHelpLinks.length < 3 && !sampleHelpLinks.includes(label)) {
          sampleHelpLinks.push(label.slice(0, 45))
        }
      }
    }

    const buttons = snap.buttons || []
    totalButtons += buttons.length
    for (const b of buttons) {
      const label = (b.ariaLabel || b.text || '').trim()
      if (label.length > 0) buttonsWithTextOrAria++
      if (b.isDisabled || b.disabled) disabledButtons++
      if (EXIT_CONTROL_REGEX.test(label)) {
        exitLikeControls++
        if (label && sampleExitControls.length < 3 && !sampleExitControls.includes(label)) {
          sampleExitControls.push(label.slice(0, 45))
        }
      }
    }

    const forms = snap.forms || []
    totalForms += forms.length
    for (const f of forms) {
      const elements = (f.elements || []) as Array<{
        type?: string
        label?: string | null
        ariaLabel?: string | null
        placeholder?: string | null
        required?: boolean
        ariaInvalid?: boolean
      }>
      totalFormControls += elements.length
      for (const el of elements) {
        const elType = (el.type || '').toLowerCase()
        if (el.required) requiredControls++
        if (SPECIFIC_INPUT_TYPES.has(elType)) typedControls++
        if ((el.label && el.label.trim()) || (el.ariaLabel && el.ariaLabel.trim())) labeledControls++
        if (el.placeholder && el.placeholder.trim()) placeholderControls++
        if (el.ariaInvalid) ariaInvalidControls++
        if (elType === 'search') searchElements++
      }
    }

    const landmarks = snap.landmarks || []
    totalLandmarks += landmarks.length
    for (const lm of landmarks) {
      const lmType = lm.type || lm.role
      if (lmType) {
        landmarkTypes.add(lmType)
        if (lmType.toLowerCase().includes('search')) searchElements++
      }
    }

    const styles = (snap as unknown as { computedStyles?: unknown[] }).computedStyles || []
    totalComputedStyles += styles.length
  }

  // ── A. Resultado de la evaluación ───────────────────────────────────────────
  let statusSummary = ''
  let explanation = ''
  let deterministicHeadingCheckNote: string | undefined

  if (row.traceabilityCase === 'CASE_D_OUT_OF_COVERAGE') {
    statusSummary = 'Fuera de cobertura por modalidad (0 hallazgos individuales)'
    explanation =
      'Este criterio no se evalúa en la modalidad de prototipos de imagen estática porque requiere interacción en vivo, seguimiento de estados o acceso al árbol programático del DOM. Queda excluido del denominador de cobertura y no penaliza ni incrementa la calificación.'
  } else if (row.traceabilityCase === 'CASE_B_NOT_EVALUABLE_NO_FINDING') {
    statusSummary = 'NOT_EVALUABLE · Sin hallazgos individuales generados (0 registros)'
    if (row.mechanism === 'catalog_no_dynamic_extractor') {
      explanation =
        'Este criterio forma parte de la matriz de 10 criterios WCAG de la modalidad web, pero el extractor automatizado actual no ejecuta pruebas dinámicas de teclado ni monitorea cambios automáticos de contexto al ingresar datos. Por ello permanece como No Evaluable sin generar hallazgos individuales.'
    } else {
      explanation =
        'Esta heurística formó parte del análisis de EvalUXIA, pero no se generó una observación individual que permitiera establecer un resultado de cumplimiento o incumplimiento. Conforme a la política de abstención del sistema, cuando no se emite un hallazgo respaldado por evidencia concreta el criterio conserva su estado inicial No Evaluable (no se asume cumplimiento por omisión, ni esto demuestra que todos sus aspectos hayan sido comprobados).'
    }
  } else if (row.traceabilityCase === 'CASE_C_NOT_EVALUABLE_WITH_FINDING') {
    statusSummary = `NOT_EVALUABLE · Con ${row.findingsCount} observación(es) registrada(s) como no concluyente(s)`
    explanation =
      'Durante la evaluación sí se generó una observación individual para este criterio, pero fue clasificada como No Evaluable porque la evidencia disponible en la captura o en el DOM no permite demostrar de forma concluyente un cumplimiento ni un incumplimiento sin verificación humana.'
  } else {
    // CASE_A_WITH_VERDICT (PASS o FAIL)
    const evalMode: EvaluationType = isPrototype ? 'prototype' : 'website'
    const detCount = row.associatedFindings.filter((f) => resolveFindingOrigin(f, evalMode) === 'deterministic').length
    const aiCount = row.associatedFindings.filter((f) => resolveFindingOrigin(f, evalMode) === 'ai').length
    const unknownCount = row.findingsCount - detCount - aiCount
    const originParts = [
      `${detCount} por regla determinística`,
      `${aiCount} por análisis asistido por IA`,
      ...(unknownCount > 0 ? [`${unknownCount} con origen no determinado en el registro`] : []),
    ]
    statusSummary = `Estado del criterio: ${row.status} (${row.findingsCount} registro(s): ${row.failFindingsCount} FAIL · ${row.passFindingsCount} PASS · ${row.notEvaluableFindingsCount} NOT_EVALUABLE)`
    explanation =
      row.status === 'FAIL'
        ? `Se registraron ${row.failFindingsCount} incumplimiento(s) asociado(s) a este criterio (${originParts.join(', ')}). Puede consultar el detalle y la evidencia de cada registro pulsando «Filtrar por criterio».`
        : `Se registraron ${row.passFindingsCount} comprobación(es) conforme(s) sin incumplimientos detectados (${originParts.join(', ')}) en los elementos inspeccionados durante la sesión.`
  }

  // Explicación separada de la comprobación determinística puntual de <h1> en N-04 y WCAG 1.3.1 (Web)
  if (!isPrototype && (row.code === 'N-04' || row.code === 'WCAG 1.3.1')) {
    if (row.hasCrossDomainHeadingFinding) {
      deterministicHeadingCheckNote =
        'Comprobación determinística puntual de encabezado principal (<h1>): Se detectó al menos una pantalla con encabezados secundarios pero sin etiqueta <h1>, lo que generó un hallazgo transversal registrado simultáneamente en N-04 y WCAG 1.3.1.'
    } else if (hasSnapshots) {
      deterministicHeadingCheckNote =
        totalHeadings > 0
          ? `Comprobación determinística puntual de encabezado principal (<h1>): Se ejecutó sobre los ${snapshots.length} paso(s) capturados, registrando ${totalH1} etiqueta(s) <h1> en ${stepsWithH1} paso(s) (${stepsWithHeadingsButNoH1} pasos sin <h1>). Al no activarse la condición de ausencia de <h1>, esta regla automática no emitió hallazgo de fallo; no obstante, dicha regla solo verifica esa condición puntual y no evalúa por sí sola el resto de la heurística.`
          : `Comprobación determinística puntual de encabezado principal (<h1>): No se detectaron etiquetas de encabezado (<h1> a <h6>) en los ${snapshots.length} paso(s) capturados, por lo que la regla de ausencia de <h1> no se activó.`
    } else {
      deterministicHeadingCheckNote =
        'Comprobación determinística puntual de encabezado principal (<h1>): En esta sesión no se activó un hallazgo de incumplimiento por ausencia de etiqueta <h1>. Esta regla automática solo verifica esa condición puntual y no equivale a una comprobación completa de todo el criterio.'
    }
  }

  // ── B. Información recopilada ───────────────────────────────────────────────
  const framingDisclaimer =
    'Los siguientes datos describen el material recopilado por EvalUXIA durante la sesión que resulta relevante para contextualizar este criterio (no representan comprobaciones superadas ni garantizan ausencia de problemas):'
  const collectedItems: string[] = []

  if (isPrototype) {
    const descLen = evaluation?.description?.trim().length || 0
    collectedItems.push(
      `Modalidad de imagen estática: 1 prototipo visual cargado (${evaluation?.imageUrl ? 'imagen disponible en la cabecera' : 'registro de imagen estática'}).`,
    )
    if (descLen > 0) {
      collectedItems.push(`Contexto descriptivo suministrado para la evaluación: ${descLen} caracteres.`)
    }
    if (row.findingsCount > 0) {
      collectedItems.push(
        `Observaciones visuales vinculadas directamente a este criterio: ${row.findingsCount} registro(s) en la lista de hallazgos.`,
      )
    } else if (row.traceabilityCase !== 'CASE_D_OUT_OF_COVERAGE') {
      collectedItems.push(
        'La imagen completa fue enviada al análisis multimodal de Fase 2 junto con este criterio, sin que se emitieran observaciones individuales para este código.',
      )
    }
  } else {
    // Modalidad Sitios Web (URL)
    const stepsCount = snapshots.length || report?.iterationsEvaluated || 1
    const successActions = previousActions.filter((a) => a.result === 'success').length
    const failedActions = previousActions.filter((a) => a.result === 'failure').length

    switch (row.code) {
      case 'N-01':
        collectedItems.push(
          `Recorrido capturado: ${stepsCount} paso(s) de navegación a través de ${distinctUrls.size || 1} dirección(es) URL.`,
        )
        collectedItems.push(
          `Acciones ejecutadas por el agente: ${previousActions.length} acción(es) registrada(s) (${successActions} exitosa(s), ${failedActions} fallida(s)).`,
        )
        if (hasSnapshots) {
          collectedItems.push(
            `Controles interactivos con atributo de estado capturados: ${totalButtons} botón(es) inspeccionado(s), de los cuales ${disabledButtons} presentaban estado deshabilitado (disabled).`,
          )
        }
        break

      case 'N-02':
        if (hasSnapshots) {
          collectedItems.push(
            `Textos extraídos del DOM en ${stepsCount} paso(s): ${totalHeadings} encabezado(s), ${buttonsWithTextOrAria} botón(es) con rótulo y ${linksWithTextOrAria} enlace(s) con texto o etiqueta.`,
          )
          if (sampleHeadings.length > 0) {
            collectedItems.push(`Muestra de encabezados capturados: «${sampleHeadings.join('», «')}».`)
          }
        } else {
          collectedItems.push(`Recorrido web de ${stepsCount} paso(s) con extracción de textos de encabezados, enlaces y botones.`)
        }
        break

      case 'N-03':
        if (hasSnapshots) {
          collectedItems.push(
            `Controles con términos asociados a cancelar, cerrar, ocultar o regresar detectados en el DOM: ${exitLikeControls} elemento(s) entre ${totalButtons} botón(es) y ${totalLinks} enlace(s) capturados.`,
          )
          if (sampleExitControls.length > 0) {
            collectedItems.push(`Ejemplos de rótulos detectados: «${sampleExitControls.join('», «')}».`)
          }
        }
        collectedItems.push(
          `Secuencia de navegación ejecutada: ${previousActions.length} acción(es) registrada(s) (${successActions} exitosa(s), ${failedActions} fallida(s)).`,
        )
        break

      case 'N-04':
        if (hasSnapshots) {
          collectedItems.push(
            `Estructura de encabezados capturada en ${stepsCount} paso(s): ${totalH1} encabezado(s) principal(es) <h1> y ${totalSubHeadings} encabezado(s) secundario(s) (<h2> a <h6>).`,
          )
          collectedItems.push(
            `Elementos comparables extraídos del DOM: ${totalButtons} botón(es), ${totalLinks} enlace(s) y ${totalComputedStyles} muestra(s) de estilos computados.`,
          )
        } else {
          collectedItems.push(`Extracción de encabezados, botones, enlaces y estilos computados en ${stepsCount} paso(s).`)
        }
        break

      case 'N-05':
        if (hasSnapshots) {
          if (totalForms === 0) {
            collectedItems.push(
              `Formularios capturados: 0 contenedores <form> detectados en los ${stepsCount} paso(s) visitados durante el recorrido.`,
            )
          } else {
            collectedItems.push(
              `Formularios capturados en ${stepsCount} paso(s): ${totalForms} contenedor(es) <form> con ${totalFormControls} control(es) de entrada.`,
            )
            collectedItems.push(
              `Atributos preventivos en los controles capturados: ${requiredControls} con atributo obligatorio (required), ${typedControls} con tipo de entrada específico (email, número, teléfono, fecha, búsqueda) y ${placeholderControls} con texto guía (placeholder).`,
            )
          }
        } else {
          collectedItems.push(`Inspección de contenedores <form> y atributos de controles en ${stepsCount} paso(s).`)
        }
        break

      case 'N-06':
        if (hasSnapshots) {
          collectedItems.push(
            `Elementos de orientación y reconocimiento capturados: ${totalLandmarks} región(es) estructurales (${landmarkTypes.size > 0 ? Array.from(landmarkTypes).join(', ') : 'landmarks'}), ${totalHeadings} encabezado(s) y ${buttonsWithTextOrAria} botón(es) con rótulo visible.`,
          )
          if (totalFormControls > 0) {
            collectedItems.push(
              `Campos de formulario con etiqueta o marcador visible: ${labeledControls} con etiqueta (<label> o aria-label) y ${placeholderControls} con placeholder de ${totalFormControls} campo(s).`,
            )
          }
        } else {
          collectedItems.push(`Extracción de regiones estructurales, etiquetas y encabezados en ${stepsCount} paso(s).`)
        }
        break

      case 'N-07':
        if (hasSnapshots) {
          collectedItems.push(
            `Mecanismos de acceso directo observables en el DOM: ${searchElements} campo(s) o región(es) de búsqueda detectados y ${totalLinks} enlace(s) en ${stepsCount} paso(s).`,
          )
        }
        collectedItems.push(
          'Atajos de teclado y aceleradores JavaScript: 0 capturados (el extractor de snapshots del MVP no extrae atributos accesskey ni listeners de eventos de teclado).',
        )
        break

      case 'N-08':
        if (hasSnapshots) {
          collectedItems.push(
            `Densidad de elementos extraídos en ${stepsCount} paso(s): ${totalHeadings} encabezado(s), ${totalImages} imagen(es) (${decorativeImages} decorativa(s)), ${totalButtons} botón(es), ${totalLinks} enlace(s) y ${totalLandmarks} región(es).`,
          )
        }
        collectedItems.push(
          'Modalidad de datos enviada al análisis heurístico web: árbol estructurado del DOM, textos y muestras de estilos CSS computados (las capturas PNG se almacenan como evidencia visual para el usuario, pero no se envían como imagen multimodal en Fase 2 web).',
        )
        break

      case 'N-09':
        if (hasSnapshots) {
          collectedItems.push(
            `Controles de formulario con estado de error activo (aria-invalid="true") en los pasos capturados: ${ariaInvalidControls} de ${totalFormControls} control(es) inspeccionado(s).`,
          )
        }
        collectedItems.push(
          `Interacciones de navegación fallidas durante el recorrido: ${failedActions} de ${previousActions.length} acción(es) ejecutada(s).`,
        )
        break

      case 'N-10':
        if (hasSnapshots) {
          collectedItems.push(
            `Enlaces o controles con términos asociados a ayuda, preguntas frecuentes, soporte o documentación detectados en el DOM: ${helpLikeLinks} de ${totalLinks} enlace(s) capturado(s).`,
          )
          if (sampleHelpLinks.length > 0) {
            collectedItems.push(`Ejemplos de enlaces detectados: «${sampleHelpLinks.join('», «')}».`)
          }
        } else {
          collectedItems.push(`Inspección de enlaces de ayuda y soporte en ${stepsCount} paso(s) capturado(s).`)
        }
        break

      case 'WCAG 1.1.1':
        if (hasSnapshots) {
          collectedItems.push(
            `Imágenes <img> extraídas en ${stepsCount} paso(s): ${totalImages} en total (${imagesWithAlt} con atributo alt descriptivo, ${decorativeImages} marcadas como decorativas y ${imagesWithoutAlt} sin alt).`,
          )
        }
        break

      case 'WCAG 1.3.1':
      case 'WCAG 2.4.6':
        if (hasSnapshots) {
          collectedItems.push(
            `Estructura semántica extraída en ${stepsCount} paso(s): ${totalH1} encabezado(s) <h1>, ${totalSubHeadings} encabezado(s) secundarios (<h2>-<h6>), ${totalLandmarks} región(es) landmark y ${totalFormControls} control(es) de formulario (${labeledControls} con etiqueta).`,
          )
        }
        break

      case 'WCAG 1.4.1':
      case 'WCAG 1.4.3':
        if (hasSnapshots) {
          collectedItems.push(
            `Estilos computados extraídos del DOM en ${stepsCount} paso(s): ${totalComputedStyles} muestra(s) con propiedades de color de texto, color de fondo, tamaño y grosor tipográfico.`,
          )
        }
        break

      case 'WCAG 2.4.4':
        if (hasSnapshots) {
          collectedItems.push(
            `Enlaces <a href> extraídos en ${stepsCount} paso(s): ${totalLinks} en total (${linksWithTextOrAria} con texto visible o aria-label y ${totalLinks - linksWithTextOrAria} sin texto accesible).`,
          )
        }
        break

      case 'WCAG 3.3.2':
        if (hasSnapshots) {
          collectedItems.push(
            `Controles dentro de etiquetas <form> en ${stepsCount} paso(s): ${totalFormControls} control(es) en ${totalForms} formulario(s) (${labeledControls} con <label> o aria-label resuelto).`,
          )
        }
        break

      case 'WCAG 4.1.2':
        if (hasSnapshots) {
          collectedItems.push(
            `Botones y controles interactivos extraídos en ${stepsCount} paso(s): ${totalButtons} elemento(s) (${buttonsWithTextOrAria} con texto visible o aria-label y ${totalButtons - buttonsWithTextOrAria} sin nombre accesible).`,
          )
        }
        break

      default:
        collectedItems.push(
          `Recorrido web de ${stepsCount} paso(s) capturado(s) y ${previousActions.length} acción(es) registrada(s).`,
        )
        break
    }
  }

  const availableStepsNote =
    !isPrototype && hasSnapshots
      ? `Dispone de ${snapshots.length} captura(s) y su resumen DOM paso a paso en la sección «Timeline Visual de la Simulación» más abajo (Paso 1 a Paso ${snapshots.length}).`
      : isPrototype && evaluation?.imageUrl
        ? 'Puede inspeccionar la imagen estática evaluada en la parte superior de este reporte.'
        : undefined

  // ── C. Limitaciones de la revisión ──────────────────────────────────────────
  const limitations: string[] = []

  if (isPrototype) {
    limitations.push(
      'Limitación de imagen estática: Una captura única en reposo no contiene árbol DOM, atributos ARIA ni permite ejecutar interacciones reales (clics, escritura, validación de formularios o navegación entre pantallas).',
    )
    if (row.coverage === 'PARTIALLY_EVALUABLE') {
      limitations.push(
        `Alcance visual parcial: ${row.scopeNote}`,
      )
    }
  } else {
    // Limitaciones específicas en modalidad Web
    if (row.code === 'N-01') {
      limitations.push(
        'Los snapshots se capturan de forma discreta al inicio de cada paso; las animaciones CSS transitorias, barras de carga breves o notificaciones efímeras (toasts) que desaparecen antes de la captura no quedan registradas.',
      )
    } else if (row.code === 'N-02' || row.code === 'N-08' || row.code === 'WCAG 1.4.1') {
      limitations.push(
        'En la modalidad web, la auditoría de Fase 2 analiza los textos, atributos DOM, árbol de accesibilidad y estilos CSS extraídos, pero no envía las capturas PNG como imagen multimodal a Gemini, por lo que no evalúa la apariencia gráfica de iconos sin texto ni composiciones visuales en píxeles.',
      )
    } else if (row.code === 'N-04') {
      limitations.push(
        'La única comprobación determinística programática asociada a N-04 verifica la ausencia de <h1> cuando existen otros encabezados. El resto de la heurística (consistencia terminológica, visual y apego a estándares de diseño) depende del análisis de Gemini sobre una muestra acotada de hasta 50 estilos computados priorizados.',
      )
    } else if (row.code === 'N-05' || row.code === 'WCAG 3.3.2') {
      limitations.push(
        'El extractor de formularios inspecciona únicamente controles anidados dentro de etiquetas <form> en los pasos visitados y no puede comprobar validaciones preventivas implementadas exclusivamente mediante scripts en tiempo de ejecución.',
      )
    } else if (row.code === 'N-07') {
      limitations.push(
        'Limitación estructural del extractor: Playwright no extrae atributos accesskey, manejadores de eventos de teclado en JavaScript, gestos táctiles ni opciones de personalización de la interfaz.',
      )
    } else if (row.code === 'N-09') {
      limitations.push(
        'Ausencia de pruebas negativas deliberadas: El agente de exploración navega buscando completar las metas del perfil evaluador y no inyecta datos inválidos a propósito para forzar la aparición de mensajes de error en formularios.',
      )
    } else if (row.code === 'N-10') {
      limitations.push(
        'El análisis solo puede detectar la presencia superficial de enlaces de ayuda o documentación en las páginas visitadas; si el recorrido de 3 a 8 pasos no ingresa a dichas secciones, no se evalúa la calidad de su contenido.',
      )
    } else if (row.code === 'WCAG 1.4.3') {
      limitations.push(
        'El cálculo matemático sRGB se realiza sobre los primeros 50 elementos por paso con color de fondo opaco declarado directamente en el nodo; los textos que heredan el fondo de contenedores ancestros, imágenes o fondos semitransparentes no pueden resolverse determinísticamente.',
      )
    } else if (row.code === 'WCAG 2.1.1' || row.code === 'WCAG 3.2.2') {
      limitations.push(
        'Este criterio requiere pruebas dinámicas de secuencia de tabulación por teclado o monitoreo de eventos de cambio de contexto que no forman parte del extractor automatizado del MVP.',
      )
    }

    if (evaluation?.flowState?.blockingError || evaluation?.flowState?.terminationReason === 'MAX_ITERATIONS_REACHED') {
      limitations.push(
        'Alcance del recorrido: La evaluación analizó únicamente las pantallas visitadas durante las iteraciones capturadas; las secciones del sitio no alcanzadas en el recorrido quedan fuera de la evidencia recopilada.',
      )
    }
  }

  if (row.traceabilityCase === 'CASE_B_NOT_EVALUABLE_NO_FINDING') {
    limitations.push(
      'Registro histórico de abstención: El sistema conserva los hallazgos emitidos y las evidencias capturadas, pero no almacena un motivo individual por cada criterio en el que Gemini decidió abstenerse de reportar hallazgos.',
    )
  } else if (row.traceabilityCase === 'CASE_C_NOT_EVALUABLE_WITH_FINDING') {
    limitations.push(
      'Registro histórico de observación no evaluable: La base de datos conserva la descripción y la evidencia adjunta de la observación, pero no almacena por separado el identificador interno de la regla de control que limitó su carácter concluyente.',
    )
  }

  // ── D. Verificación humana recomendada ──────────────────────────────────────
  const humanRecommendation =
    HUMAN_VERIFICATION_BY_CODE[row.code] ||
    'Realizar una inspección manual con un evaluador especialista sobre las pantallas principales del flujo para confirmar el cumplimiento de este criterio.'

  return {
    resultSection: {
      statusSummary,
      explanation,
      deterministicHeadingCheckNote,
    },
    collectedInfoSection: {
      framingDisclaimer,
      items: collectedItems,
      availableStepsNote,
    },
    limitationsSection: {
      items: limitations,
    },
    humanVerificationSection: {
      recommendation: humanRecommendation,
    },
  }
}

// ─── Parseo no destructivo del resumen ejecutivo (report.summary) ────────────

export interface ParsedReportSummary {
  /** Texto breve prioritario para lectura rápida (narrativa IA o resumen corto intacto) */
  briefText: string
  /** Texto completo original tal como fue almacenado en `report.summary`, sin modificaciones */
  fullText: string
  /** Indica si el texto original contenía la sección larga de volcado determinístico */
  hasVerifiedDump: boolean
  /** Indica si la vista breve omite parte del texto original (activa el botón "Ver informe completo") */
  isTruncated: boolean
  /** Número total de líneas del informe original */
  totalLines: number
}

const NARRATIVE_SECTION_MARKER = /AN[AÁ]LISIS NARRATIVO COMPLEMENTARIO[^\n]*/i
const SHORT_SUMMARY_CHAR_LIMIT = 1400
const SHORT_SUMMARY_LINE_LIMIT = 14

/**
 * Separa de forma puramente presentacional la narrativa ejecutiva breve del volcado
 * extenso de hallazgos presentes en `report.summary` (p. ej. EJE-10 con 1,849 líneas),
 * conservando siempre `fullText` idéntico byte a byte al documento histórico original.
 */
export function parseReportSummary(rawSummary?: string | null): ParsedReportSummary | null {
  if (!rawSummary || !rawSummary.trim()) {
    return null
  }

  const fullText = rawSummary
  const lines = fullText.split(/\r?\n/)
  const totalLines = lines.length

  // Caso 1: Resumen web generado por verified-summary-builder con sección narrativa al final
  const markerMatch = fullText.match(NARRATIVE_SECTION_MARKER)
  if (markerMatch && markerMatch.index !== undefined) {
    const narrativeTail = fullText.slice(markerMatch.index + markerMatch[0].length).trim()
    const cleanedNarrative = narrativeTail
      .replace(/^El siguiente texto fue generado por IA[^\n]*\n+/i, '')
      .replace(/^###\s*Resumen Ejecutivo[^\n]*\n+/i, '')
      .trim()

    if (cleanedNarrative.length > 0) {
      return {
        briefText: cleanedNarrative,
        fullText,
        hasVerifiedDump: true,
        isTruncated: true,
        totalLines,
      }
    }
  }

  // Caso 2: Resumen corto (p. ej. EJE-14 de 979 chars / 3 líneas) -> mostrar íntegro sin colapsar
  if (fullText.length <= SHORT_SUMMARY_CHAR_LIMIT && totalLines <= SHORT_SUMMARY_LINE_LIMIT) {
    return {
      briefText: fullText,
      fullText,
      hasVerifiedDump: false,
      isTruncated: false,
      totalLines,
    }
  }

  // Caso 3: Resumen largo sin marcador estándar -> extracto seguro + botón para texto completo
  const slice = fullText.slice(0, 900)
  const lastBreak = Math.max(slice.lastIndexOf('\n\n'), slice.lastIndexOf('. '))
  const briefText = (lastBreak > 300 ? slice.slice(0, lastBreak + 1) : slice).trim() + '…'

  return {
    briefText,
    fullText,
    hasVerifiedDump: false,
    isTruncated: true,
    totalLines,
  }
}
