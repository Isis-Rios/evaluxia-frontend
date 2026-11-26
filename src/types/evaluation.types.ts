// src/types/evaluation.types.ts

// ─── Enums (mirror del backend) ───────────────────────────────────────────

export type EvaluationType = 'website' | 'prototype'
export type EvaluationStatus = 'pending' | 'running' | 'completed' | 'failed'
export type AuditStatus = 'pending' | 'running' | 'completed' | 'failed'
export type FindingGroup = 'ux' | 'accessibility'
export type FindingSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info'

// ─── Metrics & Report ──────────────────────────────────────────────────────

export interface EvaluationMetrics {
  evaluationId: string
  modelUsed: string
  phase1Calls: number
  phase2Calls: number
  totalExecutionTimeMs: number
  promptTokens: number
  outputTokens: number
  totalTokens: number
  estimatedCostUsd: number
  cumulativeCostUsd: number
  thinkingTokens?: number
  costStatus?: 'confirmed' | 'confirmed-excludes-unverified-thinking-cost' | 'unverified-model-rate'
  metricsAudit?: {
    consolidatedByStatus: { FAIL: number; PASS: number; NOT_EVALUABLE: number }
    expectedPersistedFindingsCount: number
    persistedFindingsCount?: number
    note: string
  }
  explorationIntegrity?: {
    complete: boolean
    interruptionReason: string | null
    terminationReason:
      | 'NATURAL_STOP'
      | 'MAX_ITERATIONS_REACHED'
      | 'ACTION_FAILED'
      | 'INVALID_ACTION_DECISION'
      | 'EXPLORATION_ERROR'
      | 'UNKNOWN'
    evidenceFullyVerified?: boolean
    snapshotPersistenceFailureCount?: number
  }
}

export interface DomainMetrics {
  evaluatedCount: number
  passCount: number
  failCount: number
  notEvaluableCount: number
  compliance: number | null
  coverage: number
}

export interface Report {
  _id: string
  evaluationId: string
  title: string
  status: string
  summary?: string
  overallScore?: number | null
  nielsenCompliance?: number | null
  wcagCompliance?: number | null
  auditCoverage?: number
  nielsenCoverage?: number
  wcagCoverage?: number
  passCount?: number
  failCount?: number
  notEvaluableCount?: number
  totalFindings: number
  criticalCount: number
  highCount: number
  mediumCount: number
  lowCount: number
  infoCount: number
  evaluatedCriteria?: number
  totalCriteria?: number
  evidenceCount?: number
  screenshotsCount?: number
  iterationsEvaluated?: number
  metrics?: EvaluationMetrics
  /** Evaluación de prototipos — metadata de cobertura (K.2.1 §5). Ausente para evaluaciones WEB. */
  coverage?: {
    applicableCriteria: number
    evaluatedCriteria: number
    notEvaluableCriteria: number
    outOfCoverageCriteria: number
  }
  findingPersistencePolicy?: 'PASS_PERSISTED' | 'PASS_DISCARDED'
  geminiModel?: string
  generatedAt?: string
}

// ─── Evaluation ───────────────────────────────────────────────────────────

export interface Evaluation {
  _id: string
  userId: string
  evaluatorProfileId: string
  title: string
  description?: string
  type: EvaluationType
  /** Requerida únicamente cuando `type === 'website'`. */
  url?: string
  /** Presente únicamente cuando `type === 'prototype'` — ruta estática servida por el backend. */
  imageUrl?: string
  status: EvaluationStatus
  auditStatus?: AuditStatus
  flowDefinition?: {
    flowDescription: string
    totalStepsEstimated: number
  }
  flowState?: {
    currentStep: number
    completedSteps: string[]
    previousActions: Array<{ actionType: string; description: string; result: 'success' | 'failure' }>
    blockingError: string | null
    /** P1.2/P1.2.2 (backend) — ausente en evaluaciones persistidas antes de ese cambio. */
    terminationReason?: 'NATURAL_STOP' | 'MAX_ITERATIONS_REACHED' | 'ACTION_FAILED' | 'INVALID_ACTION_DECISION' | 'EXPLORATION_ERROR' | 'UNKNOWN'
    maxIterationsUsed?: number
    snapshotIntegrity?: {
      persistenceFailures: Array<{ iteration: number; error: string }>
      lastActionVerifiedBySnapshot: boolean
    }
  }
  createdAt: string
  updatedAt: string
}

export interface CreateEvaluationDto {
  evaluatorProfileId: string
  title: string
  type: EvaluationType
  url: string
  description?: string
}

export interface CreatePrototypeEvaluationDto {
  evaluatorProfileId: string
  title?: string
  description: string
  image: File
}

export interface EvaluationsListResponse {
  status: 'success'
  data: Evaluation[]
  total: number
  page: number
  limit: number
}

export interface EvaluationResponse {
  status: 'success'
  data: Evaluation
}

// ─── Finding ──────────────────────────────────────────────────────────────

export type FindingStatus = 'PASS' | 'FAIL' | 'NOT_EVALUABLE'
export type FindingConfidence = 'high' | 'medium' | 'low'

export interface TechnicalEvidenceItem {
  type: string
  property?: string
  value?: string
  selector?: string
  attribute?: string
  measurement?: string
  context?: string
  relatedValue?: {
    property?: string
    value?: string
  }
  /**
   * [Revisión MVP] Faltaban en el tipo (aunque el backend ya los emite para
   * `type: 'VISUAL_OBSERVATION'`, ver finding.model.ts) -- sin esto,
   * FindingsAccordion no podía renderizarlos aunque quisiera. `elementDescription`
   * es texto libre del elemento observado; `region` es contexto espacial, nunca
   * identidad por sí solo.
   */
  elementDescription?: string
  region?: VisualRegion
}

export type VisualRegion =
  | 'top-left' | 'top-center' | 'top-right'
  | 'middle-left' | 'center' | 'middle-right'
  | 'bottom-left' | 'bottom-center' | 'bottom-right'
  | 'full-screen'

export interface AffectedElement {
  tag?: string
  text?: string
  selector?: string
  role?: string
  ariaLabel?: string
  href?: string
  id?: string
  attributes?: Record<string, string>
  /** Evaluación de prototipos — análogo de `selector` para una imagen estática. */
  visualReference?: {
    description?: string
    region?: VisualRegion
  }
}

export interface ConsolidationDiscrepancy {
  origin: 'deterministic' | 'ai'
  status: FindingStatus
  severity: FindingSeverity
  confidence: FindingConfidence
  description: string
  recommendation?: string | null
  evidence?: TechnicalEvidenceItem[]
}

export interface Finding {
  _id: string
  id: string
  evaluationId: string
  iteration: number
  findingGroup: FindingGroup
  type?: string
  status: FindingStatus
  severity: FindingSeverity
  confidence: FindingConfidence
  heuristicCode?: string
  heuristicName?: string
  heuristic?: string // Legacy
  wcagCriterion?: string
  description: string
  evidence?: TechnicalEvidenceItem[]
  affectedElement?: AffectedElement
  impact?: string
  recommendation?: string | null
  screenshotUrl?: string
  discrepancy?: ConsolidationDiscrepancy
  affectedArchetypeTraits?: string[]
  createdAt: string
  updatedAt: string
}

export interface FindingsResponse {
  status: 'success'
  data: Finding[]
  total: number
}

// ─── Resumen por severidad ────────────────────────────────────────────────

export interface FindingSummary {
  total: number
  critical: number
  high: number
  medium: number
  low: number
  info: number
}

/**
 * Calcula el resumen de severidad a partir de un array de findings.
 *
 * [P1.5.2] Desde que el backend persiste también hallazgos `NOT_EVALUABLE`
 * (antes solo existían `FAIL` en este array), este resumen se calcula
 * exclusivamente sobre `status === 'FAIL'`: un `NOT_EVALUABLE` no es un
 * defecto y no debe inflar ningún chip de severidad (ni siquiera "Info").
 * Sigue apareciendo igualmente en `FindingsAccordion`, que no filtra por
 * status -- este filtro es solo para el resumen de severidad.
 */
export function buildFindingSummary(findings: Finding[]): FindingSummary {
  return findings
    .filter((f) => f.status === 'FAIL')
    .reduce<FindingSummary>(
      (acc, f) => {
        acc.total++
        acc[f.severity]++
        return acc
      },
      { total: 0, critical: 0, high: 0, medium: 0, low: 0, info: 0 },
    )
}
