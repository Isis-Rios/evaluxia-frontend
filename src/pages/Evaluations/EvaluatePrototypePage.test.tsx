// src/pages/Evaluations/EvaluatePrototypePage.test.tsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { Provider } from 'react-redux'
import { store } from '@app/store'
import EvaluatePrototypePage from './EvaluatePrototypePage'
import { evaluationService } from '@services/evaluations/evaluation.service'
import { evaluatorProfileService } from '@services/evaluator-profiles/evaluatorProfile.service'
import { findingsService } from '@services/findings/findings.service'
import { reportsService } from '@services/reports/reports.service'
import { snapshotsService } from '@services/snapshots/snapshots.service'
import type { Evaluation, Finding, Report } from '@/types/evaluation.types'
import type { EvaluatorProfile } from '@/types/evaluatorProfile.types'

/**
 * P6.1 — validación mínima pero suficiente del flujo PROTOTYPE end-to-end
 * (formulario → POST /prototype (mock) → polling (mock) → resultado),
 * sin browser real: se mockea exclusivamente la capa de servicios HTTP
 * (mismo punto de corte que `useEvaluations.test.ts`), nunca Gemini (que
 * ni siquiera es alcanzable desde el frontend).
 */

vi.mock('@services/evaluations/evaluation.service', () => ({
  evaluationService: {
    getAll: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    createPrototype: vi.fn(),
  },
}))
vi.mock('@services/evaluator-profiles/evaluatorProfile.service', () => ({
  evaluatorProfileService: { getAll: vi.fn() },
}))
vi.mock('@services/findings/findings.service', () => ({
  findingsService: { getByEvaluationId: vi.fn() },
}))
vi.mock('@services/reports/reports.service', () => ({
  reportsService: { getByEvaluationId: vi.fn() },
}))
vi.mock('@services/snapshots/snapshots.service', () => ({
  snapshotsService: { getByEvaluationId: vi.fn() },
}))

const mockedEvaluationService = vi.mocked(evaluationService, true)
const mockedProfileService = vi.mocked(evaluatorProfileService, true)
const mockedFindingsService = vi.mocked(findingsService, true)
const mockedReportsService = vi.mocked(reportsService, true)
const mockedSnapshotsService = vi.mocked(snapshotsService, true)

function makeProfile(overrides: Partial<EvaluatorProfile> = {}): EvaluatorProfile {
  return {
    _id: 'profile-1', userId: 'user-1', fullName: 'Perfil Activo', phrase: 'frase', age: 30,
    profession: 'QA', maritalStatus: 'single', country: 'MX', city: 'CDMX', archetype: 'El Explorador',
    biography: 'bio', personality: 'curioso', goals: [], frustrations: [], techSavviness: 'medium',
    accessibilityNeeds: [], preferredDevice: 'desktop', isActive: true,
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    ...overrides,
  }
}

function makePrototypeEvaluation(overrides: Partial<Evaluation> = {}): Evaluation {
  return {
    _id: 'proto-1', userId: 'user-1', evaluatorProfileId: 'profile-1', title: 'Checkout móvil v2',
    description: 'Pantalla de checkout ficticia.', type: 'prototype',
    imageUrl: '/uploads/prototypes/prototype_abc.png', status: 'running', auditStatus: 'running',
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    ...overrides,
  }
}

function makeVisualFinding(): Finding {
  return {
    _id: 'f1', id: 'f1', evaluationId: 'proto-1', iteration: 1, findingGroup: 'ux',
    status: 'FAIL', severity: 'medium', confidence: 'high', heuristicCode: 'N-04',
    heuristicName: 'Consistencia y estándares',
    description: 'El botón principal usa un estilo distinto al resto de la pantalla.',
    evidence: [{ type: 'VISUAL_OBSERVATION', property: 'visibleText', value: 'Confirmar compra' }],
    affectedElement: { visualReference: { description: 'botón Confirmar compra', region: 'bottom-center' } },
    recommendation: 'Unificar el estilo visual de los botones principales.',
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  }
}

function makeReport(): Report {
  return {
    _id: 'r1', evaluationId: 'proto-1', title: 'Reporte de prototipo', status: 'ready',
    totalFindings: 1, criticalCount: 0, highCount: 0, mediumCount: 1, lowCount: 0, infoCount: 0,
    overallScore: 72,
    coverage: { applicableCriteria: 15, evaluatedCriteria: 10, notEvaluableCriteria: 5, outOfCoverageCriteria: 4 },
  }
}

function renderPage() {
  return render(
    <Provider store={store}>
      <MemoryRouter>
        <EvaluatePrototypePage />
      </MemoryRouter>
    </Provider>,
  )
}

const POLL_INTERVAL_MS = 2500

beforeEach(() => {
  vi.useFakeTimers()
  mockedEvaluationService.createPrototype.mockReset()
  mockedEvaluationService.getById.mockReset()
  mockedProfileService.getAll.mockReset()
  mockedFindingsService.getByEvaluationId.mockReset()
  mockedReportsService.getByEvaluationId.mockReset()
  mockedSnapshotsService.getByEvaluationId.mockReset()

  mockedProfileService.getAll.mockResolvedValue({
    status: 'success', data: [makeProfile()], total: 1, page: 1, limit: 50,
  })
  mockedSnapshotsService.getByEvaluationId.mockResolvedValue([])
})

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

describe('EvaluatePrototypePage — flujo end-to-end (mock)', () => {
  it('renders the form with the active profile when no evaluation is running yet', async () => {
    renderPage()

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0)
    })

    expect(screen.getByText(/Evaluar prototipo/i)).toBeTruthy()
    // Sin /i: distingue el rótulo "PERFIL EVALUADOR ACTIVO" (mayúsculas) del
    // subtítulo de la página, que también contiene esa frase en minúsculas.
    expect(screen.getByText('PERFIL EVALUADOR ACTIVO')).toBeTruthy()
    expect(screen.getByRole('button', { name: /Ejecutar evaluación/i })).toBeTruthy()
  })

  it('runs the full flow: submit -> POST /prototype -> polling -> resultado con findings (región + descripción visual)', async () => {
    global.URL.createObjectURL = vi.fn(() => 'blob:mock-preview-url')

    mockedEvaluationService.createPrototype.mockResolvedValue(makePrototypeEvaluation({ status: 'running', auditStatus: 'running' }))
    mockedEvaluationService.getById.mockResolvedValue(makePrototypeEvaluation({ status: 'completed', auditStatus: 'completed' }))
    mockedFindingsService.getByEvaluationId.mockResolvedValue([makeVisualFinding()])
    mockedReportsService.getByEvaluationId.mockResolvedValue(makeReport())

    renderPage()
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0)
    })

    // ── Completar formulario ──
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    fireEvent.change(fileInput, { target: { files: [new File(['fake'], 'p.png', { type: 'image/png' })] } })
    fireEvent.change(screen.getByLabelText(/Descripción del prototipo/i), {
      target: { value: 'Pantalla de checkout ficticia con dos problemas controlados.' },
    })

    // ── Submit -> estado "en progreso" (polling) ──
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Ejecutar evaluación/i }))
      await vi.advanceTimersByTimeAsync(0)
    })
    expect(mockedEvaluationService.createPrototype).toHaveBeenCalledTimes(1)

    // ── Avanzar el polling hasta el estado final ──
    await act(async () => {
      await vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS)
    })
    expect(mockedEvaluationService.getById).toHaveBeenCalledTimes(1)

    // El useEffect que dispara fetchFindings/fetchReportData (al detectar
    // auditStatus==='completed') corre en un render posterior -- un segundo
    // flush deja que esa cadena de promesas (ya resuelta por los mocks)
    // termine de actualizar el estado antes de aserts.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0)
    })

    // ── Resultado (vista a ancho completo en 4 pestañas, sin columna lateral de perfil) ──
    expect(screen.queryByText('PERFIL EVALUADOR ACTIVO')).toBeNull()
    expect(screen.getByRole('tab', { name: /Hallazgos \(1\)/i })).toBeTruthy()

    // Pestaña Resumen (activa por defecto): Coverage y Score
    expect(screen.getByText(/Calculado sobre 10 de 15 criterios aplicables evaluados/i)).toBeTruthy()
    expect(screen.getByText('10 / 15')).toBeTruthy()
    expect(screen.getByText(/Fuera del alcance visual/i)).toBeTruthy()

    // Pestaña Hallazgos: descripción del problema, descripción visual + región y recomendación
    fireEvent.click(screen.getByRole('tab', { name: /Hallazgos \(1\)/i }))
    expect(screen.getByText(/El botón principal usa un estilo distinto/i)).toBeTruthy()
    expect(screen.getByText(/botón Confirmar compra/i)).toBeTruthy()
    expect(screen.getByText(/región: bottom-center/i)).toBeTruthy()
    expect(screen.getByText(/Unificar el estilo visual de los botones principales/i)).toBeTruthy()

    // Pestaña Prototipo visual: imagen asociada accesible
    fireEvent.click(screen.getByRole('tab', { name: /Prototipo visual/i }))
    expect(screen.getByAltText(/Prototipo evaluado/i)).toBeTruthy()
  })

  it('surfaces a server-side error (e.g. validation failure) without crashing and without entering the running state permanently', async () => {
    global.URL.createObjectURL = vi.fn(() => 'blob:mock-preview-url')
    mockedEvaluationService.createPrototype.mockRejectedValue({
      isAxiosError: true,
      response: { status: 400, data: { message: 'La imagen excede el tamaño máximo permitido.' } },
    })

    renderPage()
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0)
    })

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    fireEvent.change(fileInput, { target: { files: [new File(['fake'], 'p.png', { type: 'image/png' })] } })
    fireEvent.change(screen.getByLabelText(/Descripción del prototipo/i), {
      target: { value: 'Pantalla de checkout ficticia con dos problemas controlados.' },
    })

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Ejecutar evaluación/i }))
      await vi.advanceTimersByTimeAsync(0)
    })

    expect(screen.getByText(/La imagen excede el tamaño máximo permitido\./i)).toBeTruthy()
    // El formulario vuelve a estar disponible (no se queda atascado en "running").
    expect(screen.getByRole('button', { name: /Ejecutar evaluación/i })).toBeTruthy()
  })
})
