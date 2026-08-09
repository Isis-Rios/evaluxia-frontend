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
}

export interface Report {
  _id: string
  evaluationId: string
  title: string
  status: string
  summary?: string
  overallScore?: number
  totalFindings: number
  criticalCount: number
  highCount: number
  mediumCount: number
  lowCount: number
  infoCount: number
  metrics?: EvaluationMetrics
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
  url: string
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

export interface Finding {
  _id: string
  id: string
  evaluationId: string
  iteration: number
  findingGroup: FindingGroup
  type?: string
  severity: FindingSeverity
  description: string
  heuristic?: string
  affectedArchetypeTraits?: string[]
  wcagCriterion?: string
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

/** Calcula el resumen de findings a partir de un array */
export function buildFindingSummary(findings: Finding[]): FindingSummary {
  return findings.reduce<FindingSummary>(
    (acc, f) => {
      acc.total++
      acc[f.severity]++
      return acc
    },
    { total: 0, critical: 0, high: 0, medium: 0, low: 0, info: 0 },
  )
}
