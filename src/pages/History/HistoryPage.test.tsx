// src/pages/History/HistoryPage.test.tsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { Provider } from 'react-redux'
import { store } from '@app/store'
import HistoryPage from './HistoryPage'
import { evaluationService } from '@services/evaluations/evaluation.service'
import { evaluatorProfileService } from '@services/evaluator-profiles/evaluatorProfile.service'
import { findingsService } from '@services/findings/findings.service'
import { reportsService } from '@services/reports/reports.service'
import { snapshotsService } from '@services/snapshots/snapshots.service'
import type { Evaluation, Finding } from '@/types/evaluation.types'
import type { EvaluatorProfile } from '@/types/evaluatorProfile.types'

vi.mock('@services/evaluations/evaluation.service', () => ({
  evaluationService: {
    getAll: vi.fn(),
    getById: vi.fn(),
  },
}))

vi.mock('@services/evaluator-profiles/evaluatorProfile.service', () => ({
  evaluatorProfileService: {
    getAll: vi.fn(),
  },
}))

vi.mock('@services/findings/findings.service', () => ({
  findingsService: {
    getByEvaluationId: vi.fn(),
  },
}))

vi.mock('@services/reports/reports.service', () => ({
  reportsService: {
    getByEvaluationId: vi.fn(),
  },
}))

vi.mock('@services/snapshots/snapshots.service', () => ({
  snapshotsService: {
    getByEvaluationId: vi.fn(),
  },
}))

const mockedEvaluationService = vi.mocked(evaluationService, true)
const mockedProfileService = vi.mocked(evaluatorProfileService, true)
const mockedFindingsService = vi.mocked(findingsService, true)
const mockedReportsService = vi.mocked(reportsService, true)
const mockedSnapshotsService = vi.mocked(snapshotsService, true)

function makeProfile(overrides: Partial<EvaluatorProfile> = {}): EvaluatorProfile {
  return {
    _id: 'prof-laura-123',
    userId: 'user-1',
    fullName: 'Laura Martínez',
    phrase: 'frase',
    age: 28,
    profession: 'Diseñadora',
    maritalStatus: 'single',
    country: 'MX',
    city: 'CDMX',
    archetype: 'Pragmático',
    biography: 'bio',
    personality: 'metódica',
    goals: [],
    frustrations: [],
    techSavviness: 'high',
    accessibilityNeeds: [],
    preferredDevice: 'desktop',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  }
}

function makeEvaluation(overrides: Partial<Evaluation> = {}): Evaluation {
  return {
    _id: 'eval-1',
    userId: 'user-1',
    evaluatorProfileId: 'prof-laura-123',
    title: 'Evaluación Wikipedia',
    type: 'website',
    url: 'https://www.wikipedia.org/',
    status: 'completed',
    auditStatus: 'completed',
    createdAt: '2026-11-14T14:30:00.000Z',
    updatedAt: '2026-11-14T14:35:00.000Z',
    ...overrides,
  }
}

const sampleFinding: Finding = {
  _id: 'finding-1',
  id: 'finding-1',
  evaluationId: 'eval-1',
  heuristicCode: 'N-01',
  heuristicName: 'Visibilidad del estado del sistema',
  findingGroup: 'ux',
  severity: 'critical',
  confidence: 'high',
  status: 'FAIL',
  description: 'Falta de feedback visual al interactuar',
  recommendation: 'Agregar indicador de carga',
  iteration: 1,
  evidence: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

describe('HistoryPage — Cabecera con fecha, hora y perfil evaluador', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockedFindingsService.getByEvaluationId.mockResolvedValue([sampleFinding])
    mockedReportsService.getByEvaluationId.mockResolvedValue(null as any)
    mockedSnapshotsService.getByEvaluationId.mockResolvedValue([])
  })

  afterEach(() => {
    cleanup()
  })

  it('renders table headers including "Perfil evaluador" and "Fecha y hora"', async () => {
    mockedEvaluationService.getAll.mockResolvedValue({
      status: 'success',
      data: [makeEvaluation()],
      total: 1,
      page: 1,
      limit: 50,
    })
    mockedProfileService.getAll.mockResolvedValue({
      status: 'success',
      data: [makeProfile()],
      total: 1,
      page: 1,
      limit: 50,
    })

    render(
      <Provider store={store}>
        <MemoryRouter>
          <HistoryPage />
        </MemoryRouter>
      </Provider>,
    )

    // Check table column headers
    expect(await screen.findByText('Evaluación')).toBeTruthy()
    expect(screen.getByText('Perfil evaluador')).toBeTruthy()
    expect(screen.getByText('Fecha y hora')).toBeTruthy()
    expect(screen.getByText('Estado')).toBeTruthy()

    // Check row data: profile name
    expect(await screen.findByText('Laura Martínez')).toBeTruthy()

    // Check row data: evaluation title
    expect(screen.getByText('Evaluación Wikipedia')).toBeTruthy()

    // Check date and time are rendered
    const dateObj = new Date('2026-11-14T14:30:00.000Z')
    const formattedDate = dateObj.toLocaleDateString('es-MX', {
      day: '2-digit', month: 'short', year: 'numeric',
    })
    const formattedTime = dateObj.toLocaleTimeString('es-MX', {
      hour: '2-digit', minute: '2-digit', hour12: false,
    })
    expect(screen.getByText(`${formattedDate}, ${formattedTime}`)).toBeTruthy()
  })

  it('abre el detalle a ancho completo fuera de la tabla y conserva la caché al volver al listado y reabrir (sin redundancia de red)', async () => {
    mockedEvaluationService.getAll.mockResolvedValue({
      status: 'success',
      data: [makeEvaluation()],
      total: 1,
      page: 1,
      limit: 50,
    })
    mockedProfileService.getAll.mockResolvedValue({
      status: 'success',
      data: [makeProfile()],
      total: 1,
      page: 1,
      limit: 50,
    })

    const { container } = render(
      <Provider store={store}>
        <MemoryRouter>
          <HistoryPage />
        </MemoryRouter>
      </Provider>,
    )

    // 1. Clic en la fila para abrir el detalle a ancho completo
    const rowTitle = await screen.findByText('Evaluación Wikipedia')
    fireEvent.click(rowTitle)

    // La vista de detalle NO está anidada dentro de la tabla principal de historial
    expect(await screen.findByRole('button', { name: /Volver al historial/i })).toBeTruthy()
    expect(container.querySelector('table')).toBeNull()

    // Ir a la pestaña Hallazgos y comprobar el hallazgo cargado
    fireEvent.click(screen.getByRole('tab', { name: /Hallazgos \(1\)/i }))
    expect(await screen.findByText('Falta de feedback visual al interactuar')).toBeTruthy()
    expect(mockedFindingsService.getByEvaluationId).toHaveBeenCalledTimes(1)

    // 2. Volver al listado del historial
    fireEvent.click(screen.getByRole('button', { name: /Volver al historial/i }))
    expect(await screen.findByText('Evaluación Wikipedia')).toBeTruthy()

    // 3. Reabrir la misma evaluación: los datos continúan disponibles en caché sin repetir llamada de red
    fireEvent.click(screen.getByText('Evaluación Wikipedia'))
    fireEvent.click(await screen.findByRole('tab', { name: /Hallazgos \(1\)/i }))
    expect(await screen.findByText('Falta de feedback visual al interactuar')).toBeTruthy()
    expect(mockedFindingsService.getByEvaluationId).toHaveBeenCalledTimes(1)
  })

  it('muestra la matriz de cobertura y la vista previa de imagen en evaluaciones históricas de prototipos', async () => {
    mockedEvaluationService.getAll.mockResolvedValue({
      status: 'success',
      data: [
        makeEvaluation({
          _id: 'eval-proto-1',
          title: 'Prototipo Admisiones',
          type: 'prototype',
          url: undefined,
          imageUrl: '/uploads/prototypes/proto1.jpg',
        }),
      ],
      total: 1,
      page: 1,
      limit: 50,
    })
    mockedProfileService.getAll.mockResolvedValue({
      status: 'success',
      data: [makeProfile()],
      total: 1,
      page: 1,
      limit: 50,
    })

    render(
      <Provider store={store}>
        <MemoryRouter>
          <HistoryPage />
        </MemoryRouter>
      </Provider>,
    )

    const rowTitle = await screen.findByText('Prototipo Admisiones')
    fireEvent.click(rowTitle)

    // Pestaña Prototipo visual muestra la imagen del prototipo
    fireEvent.click(await screen.findByRole('tab', { name: /Prototipo visual/i }))
    expect(await screen.findByAltText('Prototipo evaluado')).toBeTruthy()

    // Pestaña Criterios muestra la matriz de cobertura
    fireEvent.click(screen.getByRole('tab', { name: /Criterios/i }))
    expect(screen.getByText(/MATRIZ DE COBERTURA Y TRAZABILIDAD POR CRITERIO/i)).toBeTruthy()
  })

  it('muestra el IterationTimeline en la pestaña Recorrido y evidencias para una evaluación web histórica con snapshots', async () => {
    mockedEvaluationService.getAll.mockResolvedValue({
      status: 'success',
      data: [makeEvaluation()],
      total: 1,
      page: 1,
      limit: 50,
    })
    mockedProfileService.getAll.mockResolvedValue({
      status: 'success',
      data: [makeProfile()],
      total: 1,
      page: 1,
      limit: 50,
    })
    mockedSnapshotsService.getByEvaluationId.mockResolvedValue([
      {
        _id: 'snap-1',
        evaluationId: 'eval-1',
        iteration: 1,
        url: 'https://www.wikipedia.org/',
        screenshotPath: '/uploads/evaluation_eval-1_step_1.png',
        action: { actionType: 'NAVIGATE', description: 'Carga inicial de Wikipedia' },
        timestamp: '2026-11-14T14:30:00.000Z',
      },
    ])

    render(
      <Provider store={store}>
        <MemoryRouter>
          <HistoryPage />
        </MemoryRouter>
      </Provider>,
    )

    const rowTitle = await screen.findByText('Evaluación Wikipedia')
    fireEvent.click(rowTitle)

    fireEvent.click(await screen.findByRole('tab', { name: /Recorrido y evidencias \(1\)/i }))
    expect(await screen.findByText(/TIMELINE VISUAL DE LA SIMULACIÓN/i)).toBeTruthy()
    expect(screen.getByText('[NAVIGATE] Carga inicial de Wikipedia')).toBeTruthy()
  })
})
