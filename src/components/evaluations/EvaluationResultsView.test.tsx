// src/components/evaluations/EvaluationResultsView.test.tsx
import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import EvaluationResultsView from './EvaluationResultsView'
import type { Evaluation, Finding, Report } from '@/types/evaluation.types'
import type { SnapshotEvidenceItem } from '@services/snapshots/snapshots.service'

afterEach(() => {
  cleanup()
})

const EJE10_LONG_SUMMARY = [
  'RESULTADOS VERIFICADOS POR EVALUXIA (FUENTE AUTORITATIVA)',
  ...Array.from({ length: 20 }, (_, i) => `  ${i + 1}. Criterio: WCAG 2.4.4 | Enlace sin texto accesible #${i + 1}`),
  '----------------------------------------',
  'ANÁLISIS NARRATIVO COMPLEMENTARIO (IA, NO AUTORITATIVO)',
  'El siguiente texto fue generado por IA y puede incluir observaciones adicionales.',
  '### Resumen Ejecutivo de Auditoría UX y Accesibilidad',
  'La sesión de navegación evaluada para Laura Martínez demostró un flujo eficiente hasta el editor.',
].join('\n')

const eje10Evaluation: Evaluation = {
  _id: '6af8b9aecf630223c066f8fc',
  userId: 'u1',
  evaluatorProfileId: 'p1',
  title: 'WEB-10 Carrd (Laura)',
  type: 'website',
  url: 'https://carrd.com/',
  status: 'completed',
  auditStatus: 'completed',
  createdAt: '2026-11-14T19:42:38.500Z',
  updatedAt: '2026-11-14T19:44:30.800Z',
  flowState: {
    currentStep: 3,
    completedSteps: ['Paso 1', 'Paso 2'],
    previousActions: [
      { actionType: 'NAVIGATE', description: 'Navegar a https://carrd.com/', result: 'success' },
    ],
    blockingError: null,
    terminationReason: 'NATURAL_STOP',
    maxIterationsUsed: 4,
  },
}

const eje10Report: Report = {
  _id: '6af8ba1ecf630223c0672b17',
  evaluationId: '6af8b9aecf630223c066f8fc',
  title: 'Reporte WEB-10 Carrd',
  status: 'ready',
  summary: EJE10_LONG_SUMMARY,
  overallScore: 0,
  nielsenCompliance: 0,
  wcagCompliance: 0,
  auditCoverage: 25,
  nielsenCoverage: 10,
  wcagCoverage: 40,
  passCount: 0,
  failCount: 5,
  notEvaluableCount: 15,
  totalFindings: 360,
  criticalCount: 0,
  highCount: 19,
  mediumCount: 340,
  lowCount: 1,
  infoCount: 1044,
  evaluatedCriteria: 5,
  totalCriteria: 20,
  evidenceCount: 2440,
  screenshotsCount: 3,
  iterationsEvaluated: 3,
}

const eje10SampleFindings: Finding[] = [
  {
    _id: '6af8ba1ecf630223c0672b0e',
    id: '6af8ba1ecf630223c0672b0e',
    evaluationId: '6af8b9aecf630223c066f8fc',
    iteration: 1,
    findingGroup: 'accessibility',
    type: 'wcag',
    status: 'FAIL',
    severity: 'low',
    confidence: 'high',
    heuristicCode: 'N-04',
    heuristicName: 'Consistencia y estándares',
    wcagCriterion: 'WCAG 1.3.1 Información y relaciones',
    description: "El punto de referencia de navegación `<nav>` carece de 'aria-label'.",
    evidence: [{ type: 'DOM_ATTRIBUTE', property: 'ariaLabel', value: 'null', selector: 'header > nav' }],
    recommendation: 'Añadir aria-label al elemento <nav>.',
    createdAt: '2026-11-14T19:44:30.798Z',
    updatedAt: '2026-11-14T19:44:30.798Z',
  },
  {
    _id: '6af8ba1dcf630223c0670ab2',
    id: '6af8ba1dcf630223c0670ab2',
    evaluationId: '6af8b9aecf630223c066f8fc',
    iteration: 1,
    findingGroup: 'accessibility',
    type: 'wcag',
    status: 'FAIL',
    severity: 'medium',
    confidence: 'high',
    wcagCriterion: 'WCAG 2.4.4 Propósito de los enlaces',
    description: 'El enlace en div > a:nth-of-type(1) carece de texto accesible.',
    evidence: [
      { type: 'DOM_ATTRIBUTE', property: 'href', value: 'https://johnsmith-demo.carrd.co/', selector: 'div > a:nth-of-type(1)' },
      { type: 'DOM_ATTRIBUTE', property: 'text', value: '', selector: 'div > a:nth-of-type(1)' },
    ],
    recommendation: 'Agregar aria-label al enlace.',
    createdAt: '2026-11-14T19:44:29.461Z',
    updatedAt: '2026-11-14T19:44:29.461Z',
  },
]

const eje10Snapshots: SnapshotEvidenceItem[] = [
  {
    _id: '6af8b9b0cf630223c066f900',
    evaluationId: '6af8b9aecf630223c066f8fc',
    iteration: 1,
    url: 'https://carrd.com/',
    screenshotPath: '/uploads/evaluation_6af8b9aecf630223c066f8fc_step_1.png',
    timestamp: '2026-11-14T19:42:40.077Z',
    headings: [{ level: 1, text: 'Carrd', selector: 'h1' }],
  },
]

describe('EvaluationResultsView — Etapa 2: 4 secciones, narrativa priorizada, Drawer y navegación Criterios -> Hallazgos', () => {
  it('renders 4 main tabs, prioritizes brief AI narrative while preserving full summary on demand, and navigates from Criterios to filtered Hallazgos', () => {
    render(
      <EvaluationResultsView
        evaluation={eje10Evaluation}
        evaluationType="website"
        report={eje10Report}
        findings={eje10SampleFindings}
        snapshots={eje10Snapshots}
        profileName="Laura Martínez"
        profileArchetype="Pragmático"
      />,
    )

    // 1. Pestaña Resumen activa inicialmente: prioriza narrativa breve sin volcar las 20 líneas del dump
    expect(screen.getByRole('tab', { name: /Resumen/i })).toBeTruthy()
    expect(screen.getByRole('tab', { name: /Criterios/i })).toBeTruthy()
    expect(screen.getByRole('tab', { name: /Hallazgos \(2\)/i })).toBeTruthy()
    expect(screen.getByRole('tab', { name: /Recorrido y evidencias \(1\)/i })).toBeTruthy()

    expect(screen.getByText(/La sesión de navegación evaluada para Laura Martínez/i)).toBeTruthy()
    expect(screen.queryByText(/Enlace sin texto accesible #1/i)).toBeNull()

    // Desplegar el informe textual completo original sin modificarlo
    const expandSummaryBtn = screen.getByRole('button', { name: /Ver informe textual completo original/i })
    fireEvent.click(expandSummaryBtn)
    expect(screen.getByText(/RESULTADOS VERIFICADOS POR EVALUXIA/i)).toBeTruthy()

    // 2. Ir a pestaña Criterios y abrir panel lateral/diálogo "Contexto y alcance" de N-04
    fireEvent.click(screen.getByRole('tab', { name: /Criterios/i }))
    expect(screen.getByText('N-04')).toBeTruthy()
    // N-04 NO debe mostrar el badge falso de ausencia de <h1> en EJE-10
    expect(screen.queryByText(/Ausencia de <h1>/i)).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: /Ver contexto y alcance de N-04/i }))
    expect(screen.getByText('1. Resultado de la evaluación')).toBeTruthy()
    expect(screen.getByText('4. Verificación humana recomendada')).toBeTruthy()

    // Desde el panel lateral, saltar a Hallazgos filtrados por N-04
    fireEvent.click(screen.getByRole('button', { name: /Ver 1 registro asociado en Hallazgos/i }))

    // Debe haberse cambiado automáticamente a la pestaña Hallazgos con N-04 filtrado
    expect(screen.getByText(/Criterio filtrado: N-04/i)).toBeTruthy()
    expect(screen.getByText(/El punto de referencia de navegación/i)).toBeTruthy()
    expect(screen.queryByText(/El enlace en div > a:nth-of-type\(1\) carece de texto accesible/i)).toBeNull()

    // 3. Ir a pestaña Recorrido y evidencias
    fireEvent.click(screen.getByRole('tab', { name: /Recorrido y evidencias \(1\)/i }))
    expect(screen.getByText(/TIMELINE VISUAL DE LA SIMULACIÓN/i)).toBeTruthy()
  })

  it('renders Prototipo visual tab with accessible image link and descriptive context for EJE-14 prototype', () => {
    const protoEval: Evaluation = {
      _id: '6af8bf10cf630223c0673719',
      userId: 'u1',
      evaluatorProfileId: 'p1',
      title: 'PRO-04 Dashboard de administración (Laura)',
      description: 'Tablero de administración logística de PickShipHub.',
      type: 'prototype',
      imageUrl: '/uploads/prototypes/prototype_e939dc90.jpg',
      status: 'completed',
      auditStatus: 'completed',
      createdAt: '2026-11-14T20:05:36.675Z',
      updatedAt: '2026-11-14T20:06:01.205Z',
    }

    render(
      <EvaluationResultsView
        evaluation={protoEval}
        evaluationType="prototype"
        report={{
          _id: 'r-proto',
          evaluationId: protoEval._id,
          title: protoEval.title,
          status: 'ready',
          overallScore: 25,
          nielsenCompliance: null,
          wcagCompliance: null,
          totalFindings: 1,
          criticalCount: 0,
          highCount: 0,
          mediumCount: 1,
          lowCount: 0,
          infoCount: 0,
          coverage: { applicableCriteria: 13, evaluatedCriteria: 5, notEvaluableCriteria: 8, outOfCoverageCriteria: 6 },
        }}
        findings={[]}
      />,
    )

    fireEvent.click(screen.getByRole('tab', { name: /Prototipo visual/i }))
    expect(screen.getByAltText('Prototipo evaluado')).toBeTruthy()
    expect(screen.getByText(/Tablero de administración logística de PickShipHub/i)).toBeTruthy()
  })
})
