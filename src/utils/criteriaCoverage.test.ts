// src/utils/criteriaCoverage.test.ts
import { describe, it, expect } from 'vitest'
import {
  buildCriteriaCoverageMatrix,
  buildCriterionEvaluationContext,
  buildExplorationIntegritySummary,
  findingMatchesCriterion,
  hasDualDomainCodes,
  isCrossDomainHeadingFinding,
  normalizeCriterionKey,
  resolveFindingOrigin,
  resolveSnapshotTemporalActions,
  PROTOTYPE_UNCONTEMPLATED_WCAG_NOTE,
} from '@utils/criteriaCoverage'
import type { Evaluation, Finding } from '@/types/evaluation.types'
import type { SnapshotEvidenceItem } from '@services/snapshots/snapshots.service'

function makeFinding(overrides: Partial<Finding> = {}): Finding {
  return {
    _id: 'f-1',
    id: 'f-1',
    evaluationId: 'eval-1',
    iteration: 1,
    findingGroup: 'accessibility',
    status: 'FAIL',
    severity: 'medium',
    confidence: 'high',
    description: 'Hallazgo de prueba',
    createdAt: '2026-11-14T14:00:00.000Z',
    updatedAt: '2026-11-14T14:00:00.000Z',
    ...overrides,
  }
}

describe('criteriaCoverage — normalizeCriterionKey', () => {
  it('extracts canonical Nielsen and WCAG keys accurately', () => {
    expect(normalizeCriterionKey('N-04')).toBe('N-04')
    expect(normalizeCriterionKey('n-08 Diseño estético')).toBe('N-08')
    expect(normalizeCriterionKey('WCAG 1.4.3 Contraste (Mínimo)')).toBe('WCAG 1.4.3')
    expect(normalizeCriterionKey('1.1.1 Contenido no textual')).toBe('WCAG 1.1.1')
    expect(normalizeCriterionKey(undefined)).toBe('unknown')
  })
})

describe('criteriaCoverage — buildCriteriaCoverageMatrix (Website modality)', () => {
  it('initializes all 20 web criteria (10 Nielsen + 10 WCAG) as CASE_B_NOT_EVALUABLE_NO_FINDING when findings is empty', () => {
    const matrix = buildCriteriaCoverageMatrix([], 'website')

    expect(matrix.nielsenRows).toHaveLength(10)
    expect(matrix.wcagRows).toHaveLength(10)
    expect(matrix.globalSummary.applicableCriteria).toBe(20)
    expect(matrix.globalSummary.evaluatedCriteria).toBe(0)
    expect(matrix.globalSummary.notEvaluableCriteria).toBe(20)
    expect(matrix.globalSummary.outOfCoverageCriteria).toBe(0)
    expect(matrix.nielsenSummary.compliance).toBeNull()
    expect(matrix.wcagSummary.compliance).toBeNull()

    for (const row of [...matrix.nielsenRows, ...matrix.wcagRows]) {
      expect(row.status).toBe('NOT_EVALUABLE')
      expect(row.traceabilityCase).toBe('CASE_B_NOT_EVALUABLE_NO_FINDING')
      expect(row.findingsCount).toBe(0)
    }
  })

  it('distinguishes CASE_B (NOT_EVALUABLE without Finding) from CASE_C (NOT_EVALUABLE with explicit Finding)', () => {
    const findings: Finding[] = [
      makeFinding({
        _id: 'f-rgba',
        status: 'NOT_EVALUABLE',
        severity: 'info',
        wcagCriterion: 'WCAG 1.4.3 Contraste (Mínimo)',
        description: 'No se pudo determinar el contraste sobre fondo translúcido.',
      }),
      makeFinding({
        _id: 'f-n01-degraded',
        findingGroup: 'ux',
        status: 'NOT_EVALUABLE',
        severity: 'info',
        confidence: 'low',
        heuristicCode: 'N-01',
        heuristicName: 'Visibilidad del estado del sistema',
        description: 'Observación degradada por falta de evidencia verificable.',
      }),
    ]

    const matrix = buildCriteriaCoverageMatrix(findings, 'website')

    const wcag143 = matrix.wcagRows.find((r) => r.code === 'WCAG 1.4.3')!
    expect(wcag143.status).toBe('NOT_EVALUABLE')
    expect(wcag143.traceabilityCase).toBe('CASE_C_NOT_EVALUABLE_WITH_FINDING')
    expect(wcag143.notEvaluableFindingsCount).toBe(1)

    const n01 = matrix.nielsenRows.find((r) => r.code === 'N-01')!
    expect(n01.status).toBe('NOT_EVALUABLE')
    expect(n01.traceabilityCase).toBe('CASE_C_NOT_EVALUABLE_WITH_FINDING')
    expect(n01.findingsCount).toBe(1)

    const n02 = matrix.nielsenRows.find((r) => r.code === 'N-02')!
    expect(n02.status).toBe('NOT_EVALUABLE')
    expect(n02.traceabilityCase).toBe('CASE_B_NOT_EVALUABLE_NO_FINDING')
    expect(n02.findingsCount).toBe(0)

    expect(matrix.nielsenSummary.notEvaluableWithFindingsCount).toBe(1)
    expect(matrix.nielsenSummary.notEvaluableWithoutFindingsCount).toBe(9)
  })

  it('applies FAIL > PASS > NOT_EVALUABLE precedence when multiple findings exist for the same criterion', () => {
    const findings: Finding[] = [
      makeFinding({ _id: 'f1', status: 'PASS', severity: 'info', wcagCriterion: 'WCAG 1.1.1 Contenido no textual' }),
      makeFinding({ _id: 'f2', status: 'NOT_EVALUABLE', severity: 'info', wcagCriterion: 'WCAG 1.1.1 Contenido no textual' }),
      makeFinding({ _id: 'f3', status: 'FAIL', severity: 'high', wcagCriterion: 'WCAG 1.1.1 Contenido no textual' }),
      makeFinding({ _id: 'f4', status: 'PASS', severity: 'info', wcagCriterion: 'WCAG 2.4.4 Propósito de los enlaces' }),
      makeFinding({ _id: 'f5', status: 'NOT_EVALUABLE', severity: 'info', wcagCriterion: 'WCAG 2.4.4 Propósito de los enlaces' }),
    ]

    const matrix = buildCriteriaCoverageMatrix(findings, 'website')

    const wcag111 = matrix.wcagRows.find((r) => r.code === 'WCAG 1.1.1')!
    expect(wcag111.status).toBe('FAIL')
    expect(wcag111.maxSeverity).toBe('high')
    expect(wcag111.traceabilityCase).toBe('CASE_A_WITH_VERDICT')
    expect(wcag111.findingsCount).toBe(3)
    expect(wcag111.failFindingsCount).toBe(1)
    expect(wcag111.passFindingsCount).toBe(1)
    expect(wcag111.notEvaluableFindingsCount).toBe(1)

    const wcag244 = matrix.wcagRows.find((r) => r.code === 'WCAG 2.4.4')!
    expect(wcag244.status).toBe('PASS')
    expect(wcag244.traceabilityCase).toBe('CASE_A_WITH_VERDICT')
    expect(wcag244.findingsCount).toBe(2)
  })

  it('handles the cross-domain deterministic heading finding (N-04 + WCAG 1.3.1) identically to AuditMetricsService', () => {
    const crossDomainHeadingFinding = makeFinding({
      _id: 'f-h1-missing',
      findingGroup: 'ux',
      type: 'usability',
      status: 'FAIL',
      severity: 'medium',
      confidence: 'high',
      heuristicCode: 'N-04',
      heuristicName: 'Consistencia y estándares',
      wcagCriterion: 'WCAG 1.3.1 Información y relaciones',
      description: 'La página evaluada carece de un encabezado principal de primer nivel (<h1>).',
      evidence: [{ type: 'HEADING_STRUCTURE', value: 'h1_count: 0', selector: 'body' }],
    })

    expect(isCrossDomainHeadingFinding(crossDomainHeadingFinding)).toBe(true)
    expect(resolveFindingOrigin(crossDomainHeadingFinding, 'website')).toBe('deterministic')

    const matrix = buildCriteriaCoverageMatrix([crossDomainHeadingFinding], 'website')

    const n04 = matrix.nielsenRows.find((r) => r.code === 'N-04')!
    const wcag131 = matrix.wcagRows.find((r) => r.code === 'WCAG 1.3.1')!

    expect(n04.status).toBe('FAIL')
    expect(n04.hasCrossDomainHeadingFinding).toBe(true)
    expect(n04.findingsCount).toBe(1)

    expect(wcag131.status).toBe('FAIL')
    expect(wcag131.hasCrossDomainHeadingFinding).toBe(true)
    expect(wcag131.findingsCount).toBe(1)

    // Both criteria count as evaluated FAIL in their respective domain maps (1 Nielsen + 1 WCAG = 2/20)
    expect(matrix.nielsenSummary.failCount).toBe(1)
    expect(matrix.nielsenSummary.compliance).toBe(0)
    expect(matrix.wcagSummary.failCount).toBe(1)
    expect(matrix.wcagSummary.compliance).toBe(0)
    expect(matrix.globalSummary.evaluatedCriteria).toBe(2)

    // Matches both filters in FindingsAccordion without duplicating the document
    expect(findingMatchesCriterion(crossDomainHeadingFinding, 'N-04', 'website')).toBe(true)
    expect(findingMatchesCriterion(crossDomainHeadingFinding, 'WCAG 1.3.1', 'website')).toBe(true)
  })
})

describe('criteriaCoverage — buildCriteriaCoverageMatrix (Prototype modality & WCAG 3.2.2)', () => {
  it('models 13 applicable criteria (6 Nielsen + 7 WCAG) and 6 excluded criteria (4 Nielsen + 2 WCAG), keeping WCAG 3.2.2 only as uncontemplated note', () => {
    const matrix = buildCriteriaCoverageMatrix([], 'prototype')

    expect(matrix.nielsenRows).toHaveLength(10) // 6 applicable + 4 excluded
    expect(matrix.wcagRows).toHaveLength(9) // 7 applicable + 2 excluded (3.2.2 not in prototype inventory)

    expect(matrix.nielsenSummary.applicableCount).toBe(6)
    expect(matrix.nielsenSummary.outOfCoverageCount).toBe(4)

    expect(matrix.wcagSummary.applicableCount).toBe(7)
    expect(matrix.wcagSummary.outOfCoverageCount).toBe(2)

    expect(matrix.globalSummary.applicableCriteria).toBe(13)
    expect(matrix.globalSummary.outOfCoverageCriteria).toBe(6)

    // WCAG 3.2.2 must NOT be in wcagRows (neither applicable nor excluded)
    expect(matrix.wcagRows.some((r) => r.code === 'WCAG 3.2.2')).toBe(false)
    expect(matrix.uncontemplatedPrototypeNote).toBe(PROTOTYPE_UNCONTEMPLATED_WCAG_NOTE)
    expect(matrix.uncontemplatedPrototypeNote).toMatch(/WCAG 3\.2\.2/)

    // Verify excluded rows have CASE_D_OUT_OF_COVERAGE
    const excludedCodes = [...matrix.nielsenRows, ...matrix.wcagRows]
      .filter((r) => r.traceabilityCase === 'CASE_D_OUT_OF_COVERAGE')
      .map((r) => r.code)
    expect(excludedCodes).toEqual(['N-01', 'N-07', 'N-09', 'N-10', 'WCAG 4.1.2', 'WCAG 2.1.1'])
  })

  it('reproduces prototype metrics accurately when multiple findings map to the same heuristic (e.g. EJE-19 PRO-02)', () => {
    const findings: Finding[] = [
      makeFinding({ _id: 'p1', findingGroup: 'ux', status: 'FAIL', severity: 'high', heuristicCode: 'N-02' }),
      makeFinding({ _id: 'p2', findingGroup: 'ux', status: 'FAIL', severity: 'low', heuristicCode: 'N-02' }),
      makeFinding({ _id: 'p3', findingGroup: 'ux', status: 'FAIL', severity: 'medium', heuristicCode: 'N-04' }),
      makeFinding({ _id: 'p4', findingGroup: 'accessibility', status: 'FAIL', severity: 'medium', wcagCriterion: 'WCAG 2.4.6' }),
      makeFinding({ _id: 'p5', findingGroup: 'accessibility', status: 'FAIL', severity: 'medium', wcagCriterion: 'WCAG 1.4.1' }),
      makeFinding({ _id: 'p6', findingGroup: 'accessibility', status: 'PASS', severity: 'info', wcagCriterion: 'WCAG 1.3.1' }),
      makeFinding({ _id: 'p7', findingGroup: 'accessibility', status: 'NOT_EVALUABLE', severity: 'info', wcagCriterion: 'WCAG 1.4.3' }),
    ]

    const matrix = buildCriteriaCoverageMatrix(findings, 'prototype')

    // 7 findings map to 6 distinct criteria: 4 FAIL criteria (N-02 with 2 findings, N-04, WCAG 2.4.6, WCAG 1.4.1), 1 PASS (WCAG 1.3.1), 1 NOT_EVALUABLE with finding (WCAG 1.4.3)
    expect(matrix.globalSummary.passCriteria).toBe(1)
    expect(matrix.globalSummary.failCriteria).toBe(4)
    expect(matrix.globalSummary.evaluatedCriteria).toBe(5)
    expect(matrix.globalSummary.notEvaluableCriteria).toBe(8) // 13 - 5 = 8

    const n02 = matrix.nielsenRows.find((r) => r.code === 'N-02')!
    expect(n02.status).toBe('FAIL')
    expect(n02.maxSeverity).toBe('high')
    expect(n02.findingsCount).toBe(2)
  })
})

describe('criteriaCoverage — buildCriterionEvaluationContext & temporal alignment', () => {
  it('builds honest context for NOT_EVALUABLE without finding, N-04 deterministic h1 check, and handles missing historical data gracefully', () => {
    const matrix = buildCriteriaCoverageMatrix([], 'website')
    const n04Row = matrix.nielsenRows.find((r) => r.code === 'N-04')!
    const n05Row = matrix.nielsenRows.find((r) => r.code === 'N-05')!

    // Sin snapshots ni evaluation (manejo defensivo de datos opcionales ausentes)
    const emptyCtx = buildCriterionEvaluationContext(n05Row, {})
    expect(emptyCtx.resultSection.explanation).toMatch(
      /Esta heurística formó parte del análisis de EvalUXIA, pero no se generó una observación individual/i,
    )
    expect(emptyCtx.limitationsSection.items.length).toBeGreaterThan(0)
    expect(emptyCtx.humanVerificationSection.recommendation.length).toBeGreaterThan(10)

    // Con snapshots donde sí hay <h1> (comprobación determinística puntual de N-04 sin fallo)
    const snapshots: SnapshotEvidenceItem[] = [
      {
        _id: 's1',
        evaluationId: 'eval-1',
        iteration: 1,
        url: 'https://www.gov.uk/',
        timestamp: '2026-11-14T14:00:00.000Z',
        headings: [
          { level: 1, text: 'Welcome to GOV.UK', selector: 'h1' },
          { level: 2, text: 'Popular on GOV.UK', selector: 'h2' },
        ],
        buttons: [{ text: 'Search', ariaLabel: null, selector: 'button' }],
        links: [{ href: '/help', text: 'Help and support', ariaLabel: null, selector: 'a' }],
        forms: [],
      },
    ]

    const n04Ctx = buildCriterionEvaluationContext(n04Row, { snapshots })
    expect(n04Ctx.resultSection.deterministicHeadingCheckNote).toMatch(
      /Comprobación determinística puntual de encabezado principal \(<h1>\): Se ejecutó sobre los 1 paso\(s\) capturados, registrando 1 etiqueta\(s\) <h1>/i,
    )
    expect(n04Ctx.resultSection.deterministicHeadingCheckNote).toMatch(
      /solo verifica esa condición puntual y no evalúa por sí sola el resto de la heurística/i,
    )

    // Contexto no altera la matriz ni las métricas
    expect(n04Row.status).toBe('NOT_EVALUABLE')
    expect(matrix.globalSummary.evaluatedCriteria).toBe(0)
  })

  it('aligns previousActions temporally with snapshots (reflected action vs action executed after capture)', () => {
    const snapshots: SnapshotEvidenceItem[] = [
      {
        _id: 's1',
        evaluationId: 'eval-1',
        iteration: 1,
        url: 'https://www.wikipedia.org/',
        timestamp: '2026-11-14T14:00:00.000Z',
      },
      {
        _id: 's2',
        evaluationId: 'eval-1',
        iteration: 2,
        url: 'https://es.wikipedia.org/',
        timestamp: '2026-11-14T14:00:10.000Z',
      },
    ]

    const previousActions = [
      { actionType: 'NAVIGATE', description: 'Navegar a https://www.wikipedia.org/', result: 'success' as const },
      { actionType: 'CLICK', description: 'Ir a Wikipedia en español', result: 'success' as const },
      { actionType: 'CLICK', description: 'Failed to execute: Timeout 10000ms exceeded', result: 'failure' as const },
    ]

    // Paso 1: refleja previousActions[0] (NAVIGATE) y muestra previousActions[1] (CLICK exitoso) como acción posterior con captura en Paso 2
    const step1 = resolveSnapshotTemporalActions(snapshots[0], snapshots, previousActions)
    expect(step1.actionReflectedInCapture?.actionType).toBe('NAVIGATE')
    expect(step1.actionExecutedAfterCapture?.description).toBe('Ir a Wikipedia en español')
    expect(step1.afterActionHasSubsequentCapture).toBe(true)

    // Paso 2 (último snapshot): refleja previousActions[1] (CLICK a es.wikipedia) y muestra previousActions[2] (CLICK fallido) como acción posterior sin captura subsiguiente
    const step2 = resolveSnapshotTemporalActions(snapshots[1], snapshots, previousActions)
    expect(step2.actionReflectedInCapture?.description).toBe('Ir a Wikipedia en español')
    expect(step2.actionExecutedAfterCapture?.result).toBe('failure')
    expect(step2.afterActionHasSubsequentCapture).toBe(false)

    // Integridad de exploración
    const evalDoc = {
      _id: 'eval-1',
      userId: 'u1',
      evaluatorProfileId: 'p1',
      title: 'Wikipedia',
      type: 'website',
      status: 'completed',
      createdAt: '2026-11-14T14:00:00.000Z',
      updatedAt: '2026-11-14T14:01:00.000Z',
      flowState: {
        currentStep: 2,
        completedSteps: ['Paso 1'],
        previousActions,
        blockingError: 'Timeout 10000ms',
        terminationReason: 'ACTION_FAILED',
      },
    } as Evaluation

    const integrity = buildExplorationIntegritySummary({ evaluation: evalDoc, snapshots })
    expect(integrity.isComplete).toBe(false)
    expect(integrity.successfulActionsCount).toBe(2)
    expect(integrity.failedActionsCount).toBe(1)
  })
})

describe('criteriaCoverage — Stage 1: real EJE-10 & EJE-14 origin classification, h1 guard & unknown fallback', () => {
  it('EJE-10 real dual-coded Gemini findings (N-04/N-08 + WCAG 1.3.1) are classified as "ai" and NEVER flagged as missing <h1>', () => {
    // 1. EJE-10 real finding 6af8ba1ecf630223c0672b08 (type: 'wcag', HEADING_STRUCTURE level:2, N-04 + WCAG 1.3.1)
    const eje10HeadingOrder = makeFinding({
      _id: '6af8ba1ecf630223c0672b08',
      findingGroup: 'accessibility',
      type: 'wcag',
      status: 'NOT_EVALUABLE',
      severity: 'medium',
      confidence: 'low',
      heuristicCode: 'N-04',
      heuristicName: 'Consistencia y estándares',
      wcagCriterion: 'WCAG 1.3.1 Información y relaciones',
      description:
        "Se utilizan elementos de encabezado <h2> para enlaces dentro del menú de navegación ('Log In', 'Sign Up', etc.) que se encuentran programáticamente ubicados antes del encabezado principal <h1> ('Carrd') en el DOM.",
      evidence: [{ type: 'HEADING_STRUCTURE', property: 'level', value: '2', selector: 'li:nth-of-type(1) > a > h2' }],
    })

    // 2. EJE-10 real finding 6af8ba1ecf630223c0672b0e (type: 'wcag', DOM_ATTRIBUTE ariaLabel, N-04 + WCAG 1.3.1)
    const eje10NavAriaLabel = makeFinding({
      _id: '6af8ba1ecf630223c0672b0e',
      findingGroup: 'accessibility',
      type: 'wcag',
      status: 'FAIL',
      severity: 'low',
      confidence: 'high',
      heuristicCode: 'N-04',
      heuristicName: 'Consistencia y estándares',
      wcagCriterion: 'WCAG 1.3.1 Información y relaciones',
      description:
        "El punto de referencia de navegación `<nav>` ubicado en la cabecera carece de un atributo 'aria-label' o 'aria-labelledby'.",
      evidence: [{ type: 'DOM_ATTRIBUTE', property: 'ariaLabel', value: 'null', selector: 'header > nav' }],
    })

    // 3. EJE-10 real finding 6af8ba1ecf630223c0672b14 (type: 'visual', HEADING_STRUCTURE text:Carrd, N-08 + WCAG 1.3.1)
    const eje10MinimalistHeader = makeFinding({
      _id: '6af8ba1ecf630223c0672b14',
      findingGroup: 'ux',
      type: 'visual',
      status: 'NOT_EVALUABLE',
      severity: 'info',
      confidence: 'low',
      heuristicCode: 'N-08',
      heuristicName: 'Diseño estético y minimalista',
      wcagCriterion: 'WCAG 1.3.1 Información y relaciones',
      description:
        'La cabecera y el cuerpo principal presentan un diseño limpio y enfocado, comunicando la propuesta de valor sin ruido visual.',
      evidence: [{ type: 'HEADING_STRUCTURE', property: 'text', value: 'Carrd', selector: 'h1' }],
    })

    // 4. EJE-10 real deterministic findings (WCAG 2.4.4, WCAG 1.4.3, WCAG 1.1.1)
    const eje10LinkFail = makeFinding({
      _id: '6af8ba1dcf630223c0670ab2',
      findingGroup: 'accessibility',
      type: 'wcag',
      status: 'FAIL',
      severity: 'medium',
      confidence: 'high',
      wcagCriterion: 'WCAG 2.4.4 Propósito de los enlaces',
      description: 'El enlace en div > a:nth-of-type(1) carece de texto accesible que identifique su destino o propósito.',
      evidence: [
        { type: 'DOM_ATTRIBUTE', property: 'href', value: 'https://johnsmith-demo.carrd.co/', selector: 'div > a:nth-of-type(1)' },
        { type: 'DOM_ATTRIBUTE', property: 'text', value: '', selector: 'div > a:nth-of-type(1)' },
      ],
    })

    const eje10ContrastFail = makeFinding({
      _id: '6af8ba1dcf630223c0670b01',
      findingGroup: 'accessibility',
      type: 'wcag',
      status: 'FAIL',
      severity: 'high',
      confidence: 'high',
      wcagCriterion: 'WCAG 1.4.3 Contraste (Mínimo)',
      description: 'El elemento <a> presenta un ratio de contraste insuficiente de 2.73:1 (mínimo requerido: 4.5:1).',
      evidence: [{ type: 'COMPUTED_STYLE', property: 'contrastRatio', value: '2.73:1', selector: 'a' }],
    })

    const eje10ImgFail = makeFinding({
      _id: '6af8ba1dcf630223c0670bf0',
      findingGroup: 'accessibility',
      type: 'wcag',
      status: 'FAIL',
      severity: 'high',
      confidence: 'high',
      wcagCriterion: 'WCAG 1.1.1 Contenido no textual',
      description: 'La imagen informativa en article:nth-of-type(1) > a > img carece de atributo alt o texto alternativo accesibilidad.',
      evidence: [{ type: 'DOM_ATTRIBUTE', property: 'alt', value: 'null', selector: 'article:nth-of-type(1) > a > img' }],
    })

    // Los 3 duales de Gemini tienen doble código pero NO son el hallazgo programático de ausencia de <h1>
    for (const aiDual of [eje10HeadingOrder, eje10NavAriaLabel, eje10MinimalistHeader]) {
      expect(hasDualDomainCodes(aiDual)).toBe(true)
      expect(isCrossDomainHeadingFinding(aiDual)).toBe(false)
      expect(resolveFindingOrigin(aiDual, 'website')).toBe('ai')
    }

    // Los determinísticos WCAG mantienen clasificación 'deterministic'
    expect(resolveFindingOrigin(eje10LinkFail, 'website')).toBe('deterministic')
    expect(resolveFindingOrigin(eje10ContrastFail, 'website')).toBe('deterministic')
    expect(resolveFindingOrigin(eje10ImgFail, 'website')).toBe('deterministic')

    // En la matriz reconstruida de EJE-10: los conteos NO cambian, pero hasCrossDomainHeadingFinding es false en N-04, N-08 y WCAG 1.3.1
    const all = [
      eje10HeadingOrder,
      eje10NavAriaLabel,
      eje10MinimalistHeader,
      eje10LinkFail,
      eje10ContrastFail,
      eje10ImgFail,
    ]
    const matrix = buildCriteriaCoverageMatrix(all, 'website')

    const n04 = matrix.nielsenRows.find((r) => r.code === 'N-04')!
    const n08 = matrix.nielsenRows.find((r) => r.code === 'N-08')!
    const wcag131 = matrix.wcagRows.find((r) => r.code === 'WCAG 1.3.1')!

    expect(n04.status).toBe('FAIL')
    expect(n04.findingsCount).toBe(2)
    expect(n04.hasCrossDomainHeadingFinding).toBe(false)

    expect(n08.status).toBe('NOT_EVALUABLE')
    expect(n08.findingsCount).toBe(1)
    expect(n08.hasCrossDomainHeadingFinding).toBe(false)

    expect(wcag131.status).toBe('FAIL')
    expect(wcag131.findingsCount).toBe(3)
    expect(wcag131.hasCrossDomainHeadingFinding).toBe(false)

    // El contexto de N-04 reporta 0 determinísticos y 2 IA, sin afirmar ausencia de <h1>
    const ctxN04 = buildCriterionEvaluationContext(n04, {
      snapshots: [
        {
          _id: 's1',
          evaluationId: '6af8b9aecf630223c066f8fc',
          iteration: 1,
          url: 'https://carrd.com/',
          timestamp: '2026-11-14T19:42:40.077Z',
          headings: [{ level: 1, text: 'Carrd', selector: 'h1' }],
        },
      ],
    })
    expect(ctxN04.resultSection.explanation).toMatch(/0 por regla determinística, 2 por análisis asistido por IA/i)
    expect(ctxN04.resultSection.deterministicHeadingCheckNote).toMatch(/registrando 1 etiqueta\(s\) <h1>/i)
  })

  it('returns "unknown" when historical metadata do not allow attributing deterministic or AI origin with certainty', () => {
    const ambiguousWcagFinding = makeFinding({
      _id: 'f-ambiguous-1',
      findingGroup: 'accessibility',
      type: 'wcag',
      status: 'FAIL',
      severity: 'medium',
      wcagCriterion: 'WCAG 1.1.1 Contenido no textual',
      description: 'Observación histórica sin plantilla determinística ni evidencia estructurada.',
      evidence: [],
    })
    const legacyNoTypeFinding = makeFinding({
      _id: 'f-legacy-2',
      findingGroup: 'accessibility',
      type: undefined,
      status: 'FAIL',
      severity: 'low',
      wcagCriterion: 'WCAG 2.4.6 Encabezados y etiquetas',
      description: 'Encabezado poco descriptivo en sección secundaria.',
      evidence: [],
    })

    expect(resolveFindingOrigin(ambiguousWcagFinding, 'website')).toBe('unknown')
    expect(resolveFindingOrigin(legacyNoTypeFinding, 'website')).toBe('unknown')
  })

  it('reproduces exact EJE-14 prototype matrix counts (5/13 evaluated, 8 NOT_EVALUABLE, 6 excluded, Nielsen 33.33%, WCAG 50%)', () => {
    const eje14Findings: Finding[] = [
      makeFinding({ _id: '6af8bf29cf630223c067372b', findingGroup: 'accessibility', type: 'visual', status: 'NOT_EVALUABLE', severity: 'info', confidence: 'low', wcagCriterion: 'WCAG 1.4.3 Contraste mínimo' }),
      makeFinding({ _id: '6af8bf29cf630223c067372e', findingGroup: 'accessibility', type: 'visual', status: 'NOT_EVALUABLE', severity: 'info', confidence: 'low', wcagCriterion: 'WCAG 1.4.3 Contraste mínimo' }),
      makeFinding({ _id: '6af8bf29cf630223c0673731', findingGroup: 'accessibility', type: 'visual', status: 'FAIL', severity: 'medium', confidence: 'high', wcagCriterion: 'WCAG 1.4.1 Uso del color' }),
      makeFinding({ _id: '6af8bf29cf630223c0673734', findingGroup: 'ux', type: 'usability', status: 'FAIL', severity: 'low', confidence: 'high', heuristicCode: 'N-08', heuristicName: 'Diseño estético y minimalista' }),
      makeFinding({ _id: '6af8bf29cf630223c0673737', findingGroup: 'ux', type: 'content', status: 'FAIL', severity: 'medium', confidence: 'high', heuristicCode: 'N-04', heuristicName: 'Consistencia y estándares' }),
      makeFinding({ _id: '6af8bf29cf630223c067373a', findingGroup: 'ux', type: 'interaction', status: 'PASS', severity: 'info', confidence: 'high', heuristicCode: 'N-06', heuristicName: 'Reconocimiento antes que recuerdo' }),
      makeFinding({ _id: '6af8bf29cf630223c067373d', findingGroup: 'accessibility', type: 'wcag', status: 'PASS', severity: 'info', confidence: 'high', wcagCriterion: 'WCAG 2.4.6 Encabezados y etiquetas' }),
    ]

    for (const f of eje14Findings) {
      expect(resolveFindingOrigin(f, 'prototype')).toBe('ai')
    }

    const matrix = buildCriteriaCoverageMatrix(eje14Findings, 'prototype')
    expect(matrix.globalSummary).toEqual({
      applicableCriteria: 13,
      evaluatedCriteria: 5,
      passCriteria: 2,
      failCriteria: 3,
      notEvaluableCriteria: 8,
      outOfCoverageCriteria: 6,
      auditCoveragePercent: 38.46,
    })
    expect(matrix.nielsenSummary.compliance).toBe(33.33)
    expect(matrix.wcagSummary.compliance).toBe(50)
  })
})
