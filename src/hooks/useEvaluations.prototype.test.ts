// src/hooks/useEvaluations.prototype.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useEvaluations } from './useEvaluations'
import { evaluationService } from '@services/evaluations/evaluation.service'
import type { Evaluation, CreatePrototypeEvaluationDto } from '@/types/evaluation.types'

/**
 * P6.1 — valida que `createPrototypeEvaluation` (P5) reutiliza EXACTAMENTE
 * el mismo ciclo de polling ya probado para WEB en `useEvaluations.test.ts`
 * (archivo separado, no modificado, para no arriesgar su estabilidad).
 */

vi.mock('@services/evaluations/evaluation.service', () => ({
  evaluationService: {
    getAll: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    createPrototype: vi.fn(),
  },
}))

const mockedService = vi.mocked(evaluationService, true)

function makePrototypeEvaluation(overrides: Partial<Evaluation> = {}): Evaluation {
  return {
    _id: 'proto-eval-1',
    userId: 'user-1',
    evaluatorProfileId: 'profile-1',
    title: 'Checkout móvil v2',
    description: 'Pantalla de checkout ficticia.',
    type: 'prototype',
    imageUrl: '/uploads/prototypes/prototype_abc.png',
    status: 'running',
    auditStatus: 'running',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  }
}

const createDto: CreatePrototypeEvaluationDto = {
  evaluatorProfileId: 'profile-1',
  title: 'Checkout móvil v2',
  description: 'Pantalla de checkout ficticia.',
  image: new File(['fake'], 'prototype.png', { type: 'image/png' }),
}

const POLL_INTERVAL_MS = 2500

beforeEach(() => {
  vi.useFakeTimers()
  mockedService.createPrototype.mockReset()
  mockedService.getById.mockReset()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('useEvaluations — createPrototypeEvaluation (P5)', () => {
  it('calls evaluationService.createPrototype (not create) and starts polling the returned evaluation', async () => {
    mockedService.createPrototype.mockResolvedValue(makePrototypeEvaluation({ status: 'running', auditStatus: 'running' }))
    mockedService.getById.mockResolvedValue(
      makePrototypeEvaluation({ status: 'completed', auditStatus: 'completed' }),
    )

    const { result } = renderHook(() => useEvaluations())

    let createPromise!: Promise<Evaluation | null>
    await act(async () => {
      createPromise = result.current.createPrototypeEvaluation(createDto)
      await vi.advanceTimersByTimeAsync(0)
    })

    expect(mockedService.createPrototype).toHaveBeenCalledTimes(1)
    expect(mockedService.createPrototype).toHaveBeenCalledWith(createDto, expect.objectContaining({ signal: expect.anything() }))
    expect(result.current.currentEvaluation?.type).toBe('prototype')
    expect(result.current.currentEvaluation?.imageUrl).toBe('/uploads/prototypes/prototype_abc.png')

    await act(async () => {
      await vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS)
    })

    expect(mockedService.getById).toHaveBeenCalledTimes(1)
    const finalEvaluation = await createPromise
    expect(finalEvaluation?.status).toBe('completed')
    expect(finalEvaluation?.auditStatus).toBe('completed')
    expect(result.current.successMessage).toBe('Evaluación y auditoría de IA completadas con éxito.')
  })

  it('surfaces a server error without starting the polling loop', async () => {
    mockedService.createPrototype.mockRejectedValue({
      isAxiosError: true,
      response: { status: 400, data: { message: 'La descripción es requerida y debe explicar el contexto del prototipo.' } },
    })

    const { result } = renderHook(() => useEvaluations())

    await act(async () => {
      await result.current.createPrototypeEvaluation(createDto)
    })

    expect(result.current.error).toBe('La descripción es requerida y debe explicar el contexto del prototipo.')
    expect(result.current.isCreating).toBe(false)
    expect(mockedService.getById).not.toHaveBeenCalled()
  })
})
