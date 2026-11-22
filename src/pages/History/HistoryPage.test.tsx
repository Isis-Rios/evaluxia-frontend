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

  it('mantiene los hallazgos al cerrar y volver a abrir la fila expandible (evita pérdida de datos)', async () => {
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

    // 1. Clic para expandir
    const rowTitle = await screen.findByText('Evaluación Wikipedia')
    fireEvent.click(rowTitle)

    // Debe consultar el servicio y mostrar el hallazgo
    expect(await screen.findByText('Falta de feedback visual al interactuar')).toBeTruthy()
    expect(mockedFindingsService.getByEvaluationId).toHaveBeenCalledTimes(1)

    // 2. Clic para cerrar la fila
    fireEvent.click(rowTitle)

    // 3. Clic para volver a abrir la fila
    fireEvent.click(rowTitle)

    // El hallazgo debe continuar visible sin desaparecer y sin redundancia de red
    expect(await screen.findByText('Falta de feedback visual al interactuar')).toBeTruthy()
    expect(mockedFindingsService.getByEvaluationId).toHaveBeenCalledTimes(1)
  })
})
