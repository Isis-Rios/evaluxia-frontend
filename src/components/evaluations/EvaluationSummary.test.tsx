// src/components/evaluations/EvaluationSummary.test.tsx
import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import EvaluationSummary from './EvaluationSummary'
import type { Report, FindingSummary } from '@/types/evaluation.types'

// This file doesn't rely on vitest's `globals: true` (not enabled in
// vite.config.ts), so Testing Library's automatic afterEach-cleanup isn't
// auto-registered — without this, each `render()` in this file would leave
// its DOM mounted for the next test in the same run.
afterEach(() => {
  cleanup()
})

/**
 * Phase C.1 — Cambio 1: report.summary (Phase 2's executiveSummary) was
 * already fetched by the frontend but never rendered. These tests confirm
 * it now reaches the user when present, and that nothing renders/breaks
 * when it's absent (older reports, or a report still generating).
 */

const emptySummary: FindingSummary = { total: 0, critical: 0, high: 0, medium: 0, low: 0, info: 0 }

function makeReport(overrides: Partial<Report> = {}): Report {
  return {
    _id: 'report-1',
    evaluationId: 'eval-1',
    title: 'Reporte de prueba',
    status: 'ready',
    totalFindings: 0,
    criticalCount: 0,
    highCount: 0,
    mediumCount: 0,
    lowCount: 0,
    infoCount: 0,
    ...overrides,
  }
}

describe('EvaluationSummary — executive summary (report.summary)', () => {
  it('renders report.summary when present', () => {
    const executiveSummary = 'El sitio presenta una experiencia de usuario aceptable con hallazgos menores.'
    render(
      <EvaluationSummary
        summary={emptySummary}
        report={makeReport({ summary: executiveSummary })}
      />,
    )

    expect(screen.getByText(/RESUMEN EJECUTIVO/i)).toBeTruthy()
    expect(screen.getByText(executiveSummary)).toBeTruthy()
  })

  it('does not render the executive summary section when report.summary is absent', () => {
    render(<EvaluationSummary summary={emptySummary} report={makeReport({ summary: undefined })} />)
    expect(screen.queryByText(/RESUMEN EJECUTIVO/i)).toBeNull()
  })

  it('does not render the executive summary section when there is no report at all', () => {
    render(<EvaluationSummary summary={emptySummary} report={null} />)
    expect(screen.queryByText(/RESUMEN EJECUTIVO/i)).toBeNull()
  })

  it('still renders the deterministic score/compliance cards unaffected by the new section', () => {
    render(
      <EvaluationSummary
        summary={emptySummary}
        report={makeReport({ summary: 'Resumen', overallScore: 82 })}
      />,
    )
    expect(screen.getByText('82 / 100')).toBeTruthy()
  })
})
