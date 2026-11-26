// src/components/evaluations/EvaluationSummary.test.tsx
import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'
import EvaluationSummary from './EvaluationSummary'
import { buildFindingSummary } from '@/types/evaluation.types'
import type { Report, FindingSummary, Finding } from '@/types/evaluation.types'

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

  it('prioritizes the brief AI narrative when report.summary contains a long verified findings dump (EJE-10 pattern) while keeping the full original text expandable', () => {
    const longSummary = [
      'RESULTADOS VERIFICADOS POR EVALUXIA (FUENTE AUTORITATIVA)',
      '1. Criterio: WCAG 2.4.4 | Enlace sin texto accesible #1',
      '2. Criterio: WCAG 2.4.4 | Enlace sin texto accesible #2',
      'ANÁLISIS NARRATIVO COMPLEMENTARIO (IA, NO AUTORITATIVO)',
      'El siguiente texto fue generado por IA y puede incluir observaciones adicionales.',
      '### Resumen Ejecutivo de Auditoría UX y Accesibilidad',
      'Flujo principal ágil pero con 3 incumplimientos normativos detectados.',
    ].join('\n')

    render(
      <EvaluationSummary
        summary={emptySummary}
        report={makeReport({ summary: longSummary })}
      />,
    )

    // Muestra primero la narrativa breve
    expect(screen.getByText(/Flujo principal ágil pero con 3 incumplimientos normativos detectados/i)).toBeTruthy()
    // No vuelca el listado masivo antes del botón de expansión
    expect(screen.queryByText(/Enlace sin texto accesible #1/i)).toBeNull()

    // Al pulsar el botón accesible, muestra el informe íntegro original sin modificarlo
    const btn = screen.getByRole('button', { name: /Ver informe textual completo original/i })
    expect(btn.getAttribute('aria-expanded')).toBe('false')
    fireEvent.click(btn)
    expect(btn.getAttribute('aria-expanded')).toBe('true')
    expect(screen.getByText(/RESULTADOS VERIFICADOS POR EVALUXIA/i)).toBeTruthy()
    expect(screen.getByText(/Enlace sin texto accesible #2/i)).toBeTruthy()
  })
})

/**
 * P7.2 — EvaluationSummary debe evitar que un `overallScore` calculado
 * sobre una cobertura parcial de prototipo se lea como un veredicto
 * completo. `evaluationType` es el único dato nuevo que distingue el
 * caso; omitido, el comportamiento WEB debe quedar exactamente igual
 * (ver bloque "website regression" abajo).
 */
describe('EvaluationSummary — evaluationType="prototype" coverage clarity (P7.2)', () => {
  it('shows the coverage denominator next to overallScore for a prototype with PARTIAL coverage', () => {
    render(
      <EvaluationSummary
        summary={emptySummary}
        evaluationType="prototype"
        report={makeReport({
          overallScore: 0,
          coverage: { applicableCriteria: 13, evaluatedCriteria: 2, notEvaluableCriteria: 11, outOfCoverageCriteria: 6 },
        })}
      />,
    )

    expect(screen.getByText('0 / 100')).toBeTruthy()
    expect(screen.getByText(/Calculado sobre 2 de 13 criterios aplicables evaluados/i)).toBeTruthy()
    expect(screen.getByText('2 / 13')).toBeTruthy()
    expect(screen.getByText(/Fuera del alcance visual/i)).toBeTruthy()
    // Nunca debe fabricar el denominador fijo de 20 que usa WEB.
    expect(screen.queryByText(/\/ 20/)).toBeNull()
    expect(screen.queryByText(/Algoritmo Determinístico 3D/i)).toBeNull()
  })

  it('represents FULL coverage of applicable criteria for a prototype (evaluatedCriteria === applicableCriteria)', () => {
    render(
      <EvaluationSummary
        summary={emptySummary}
        evaluationType="prototype"
        report={makeReport({
          overallScore: 90,
          coverage: { applicableCriteria: 13, evaluatedCriteria: 13, notEvaluableCriteria: 0, outOfCoverageCriteria: 6 },
        })}
      />,
    )

    expect(screen.getByText(/Calculado sobre 13 de 13 criterios aplicables evaluados/i)).toBeTruthy()
    expect(screen.getByText('13 / 13')).toBeTruthy()
  })

  it('degrades gracefully, without fabricating numbers, when a prototype report has NO coverage data', () => {
    render(
      <EvaluationSummary
        summary={emptySummary}
        evaluationType="prototype"
        report={makeReport({ overallScore: 50, coverage: undefined })}
      />,
    )

    expect(screen.getByText('50 / 100')).toBeTruthy()
    expect(screen.getByText(/Cobertura no disponible para este reporte/i)).toBeTruthy()
    expect(screen.getAllByText(/no disponible para este reporte/i)).toHaveLength(2) // caption (Card 1) + Card 3
    // Ningún número inventado -- ni el 20 fijo de WEB, ni un porcentaje fabricado.
    expect(screen.queryByText(/\/ 20/)).toBeNull()
    expect(screen.queryByText(/0%/)).toBeNull()
  })

  it('WEB regression: website evaluations (evaluationType omitted) render byte-for-byte as before', () => {
    render(
      <EvaluationSummary
        summary={emptySummary}
        report={makeReport({
          overallScore: 82,
          auditCoverage: 65,
          evaluatedCriteria: 13,
          totalCriteria: 20,
          nielsenCompliance: 70,
          wcagCompliance: 60,
        })}
      />,
    )

    expect(screen.getByText('82 / 100')).toBeTruthy()
    expect(screen.getByText(/Algoritmo Determinístico 3D/i)).toBeTruthy()
    expect(screen.getByText('65%')).toBeTruthy()
    expect(screen.getByText('13 / 20')).toBeTruthy()
    // La presentación de prototipo nunca aparece para WEB.
    expect(screen.queryByText(/criterios aplicables evaluados/i)).toBeNull()
    expect(screen.queryByText(/Fuera del alcance visual/i)).toBeNull()
  })

  it('explicit evaluationType="website" behaves identically to omitting it', () => {
    render(
      <EvaluationSummary
        summary={emptySummary}
        evaluationType="website"
        report={makeReport({ overallScore: 82, auditCoverage: 65, evaluatedCriteria: 13, totalCriteria: 20 })}
      />,
    )
    expect(screen.getByText('82 / 100')).toBeTruthy()
    expect(screen.getByText(/Algoritmo Determinístico 3D/i)).toBeTruthy()
    expect(screen.getByText('13 / 20')).toBeTruthy()
  })
})

/**
 * P1.5.2 — desde que el backend persiste también hallazgos `NOT_EVALUABLE`
 * (antes de esto, `findings` solo podía contener `FAIL`), `buildFindingSummary`
 * debe seguir calculando los chips de severidad EXCLUSIVAMENTE sobre
 * `status === 'FAIL'`. Un `NOT_EVALUABLE` no es un defecto y no debe inflar
 * ningún chip de severidad, ni siquiera "Info".
 */
function makeFinding(overrides: Partial<Finding> = {}): Finding {
  return {
    _id: 'finding-1',
    id: 'finding-1',
    evaluationId: 'eval-1',
    iteration: 1,
    findingGroup: 'accessibility',
    status: 'FAIL',
    severity: 'high',
    confidence: 'high',
    description: 'Hallazgo de prueba',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

describe('buildFindingSummary — FAIL-only severity counting (P1.5.2)', () => {
  it('counts a FAIL finding in its severity bucket', () => {
    const summary = buildFindingSummary([makeFinding({ status: 'FAIL', severity: 'high' })])
    expect(summary.high).toBe(1)
    expect(summary.total).toBe(1)
  })

  it('does NOT count a NOT_EVALUABLE finding in any severity bucket, even "info"', () => {
    const findings = [
      makeFinding({ _id: 'f1', status: 'FAIL', severity: 'high' }),
      makeFinding({ _id: 'f2', status: 'NOT_EVALUABLE', severity: 'info' }),
    ]
    const summary = buildFindingSummary(findings)
    expect(summary.high).toBe(1)
    expect(summary.info).toBe(0)
    expect(summary.total).toBe(1)
  })

  it('does NOT count a PASS finding either (defensive — PASS is never persisted today, but the function must not assume that)', () => {
    const findings = [
      makeFinding({ _id: 'f1', status: 'FAIL', severity: 'medium' }),
      makeFinding({ _id: 'f2', status: 'PASS', severity: 'low' }),
    ]
    const summary = buildFindingSummary(findings)
    expect(summary.medium).toBe(1)
    expect(summary.low).toBe(0)
    expect(summary.total).toBe(1)
  })

  it('returns all-zero summary when every finding is NOT_EVALUABLE', () => {
    const summary = buildFindingSummary([makeFinding({ status: 'NOT_EVALUABLE', severity: 'medium' })])
    expect(summary).toEqual({ total: 0, critical: 0, high: 0, medium: 0, low: 0, info: 0 })
  })
})

describe('EvaluationSummary + FindingsAccordion — NOT_EVALUABLE persisted findings (P1.5.2)', () => {
  it('a NOT_EVALUABLE finding never inflates any severity chip in EvaluationSummary', () => {
    const findings = [
      makeFinding({ _id: 'f1', status: 'FAIL', severity: 'critical' }),
      makeFinding({ _id: 'f2', status: 'NOT_EVALUABLE', severity: 'info', description: 'No se pudo determinar la jerarquía de encabezados.' }),
    ]
    const summary = buildFindingSummary(findings)
    render(<EvaluationSummary summary={summary} report={makeReport({ failCount: 1, notEvaluableCount: 1 })} />)

    expect(screen.getByText('1 Crítico')).toBeTruthy()
    // Ningún chip "Info" debe aparecer: el SEVERITY_CONFIG oculta un conteo
    // en 0 (`if (count === 0) return null`), así que su ausencia prueba que
    // el NOT_EVALUABLE no incrementó `summary.info`.
    expect(screen.queryByText(/Info/)).toBeNull()
  })

  it('PASS/FAIL/NOT_EVALUABLE criterion counters (report.passCount/failCount/notEvaluableCount) stay exactly as the Report reports them, independent of the findings array', () => {
    const findings = [
      makeFinding({ _id: 'f1', status: 'FAIL', severity: 'high' }),
      makeFinding({ _id: 'f2', status: 'NOT_EVALUABLE', severity: 'info' }),
    ]
    const summary = buildFindingSummary(findings)
    render(
      <EvaluationSummary
        summary={summary}
        report={makeReport({ passCount: 5, failCount: 2, notEvaluableCount: 13 })}
      />,
    )

    expect(screen.getByText('PASS: 5')).toBeTruthy()
    expect(screen.getByText('FAIL: 2')).toBeTruthy()
    expect(screen.getByText('NOT_EVALUABLE: 13')).toBeTruthy()
  })

  it('EJE-14 prototype: distinguishes persisted null domain compliance from reconstructed Nielsen/WCAG breakdown without altering overallScore', () => {
    const eje14Findings: Finding[] = [
      makeFinding({ _id: '1', findingGroup: 'accessibility', type: 'visual', status: 'NOT_EVALUABLE', severity: 'info', wcagCriterion: 'WCAG 1.4.3 Contraste mínimo' }),
      makeFinding({ _id: '2', findingGroup: 'accessibility', type: 'visual', status: 'NOT_EVALUABLE', severity: 'info', wcagCriterion: 'WCAG 1.4.3 Contraste mínimo' }),
      makeFinding({ _id: '3', findingGroup: 'accessibility', type: 'visual', status: 'FAIL', severity: 'medium', wcagCriterion: 'WCAG 1.4.1 Uso del color' }),
      makeFinding({ _id: '4', findingGroup: 'ux', type: 'usability', status: 'FAIL', severity: 'low', heuristicCode: 'N-08' }),
      makeFinding({ _id: '5', findingGroup: 'ux', type: 'content', status: 'FAIL', severity: 'medium', heuristicCode: 'N-04' }),
      makeFinding({ _id: '6', findingGroup: 'ux', type: 'interaction', status: 'PASS', severity: 'info', heuristicCode: 'N-06' }),
      makeFinding({ _id: '7', findingGroup: 'accessibility', type: 'wcag', status: 'PASS', severity: 'info', wcagCriterion: 'WCAG 2.4.6 Encabezados y etiquetas' }),
    ]

    render(
      <EvaluationSummary
        summary={buildFindingSummary(eje14Findings)}
        evaluationType="prototype"
        findings={eje14Findings}
        report={makeReport({
          overallScore: 25,
          nielsenCompliance: null,
          wcagCompliance: null,
          passCount: 2,
          failCount: 3,
          notEvaluableCount: 2,
          coverage: { applicableCriteria: 13, evaluatedCriteria: 5, notEvaluableCriteria: 8, outOfCoverageCriteria: 6 },
        })}
      />,
    )

    expect(screen.getByText('25 / 100')).toBeTruthy()
    expect(screen.getByText(/no persiste tasa de cumplimiento desagregada por dominio/i)).toBeTruthy()
    expect(screen.getByText(/Desglose reconstruido \(desde hallazgos\):/i)).toBeTruthy()
    expect(screen.getByText('33.33%')).toBeTruthy()
    expect(screen.getByText('50%')).toBeTruthy()
  })
})
