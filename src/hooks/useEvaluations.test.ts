// src/hooks/useEvaluations.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useEvaluations } from './useEvaluations'
import { evaluationService } from '@services/evaluations/evaluation.service'
import type { Evaluation, CreateEvaluationDto } from '@/types/evaluation.types'

/**
 * P0-3 fix: the polling loop in createEvaluation() must stop cleanly on
 * unmount (no dangling setTimeout, no further HTTP requests, no state
 * updates on an unmounted component) instead of running until the
 * evaluation reaches a final state regardless of whether anyone is still
 * listening.
 */

vi.mock('@services/evaluations/evaluation.service', () => ({
  evaluationService: {
    getAll: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
  },
}))

const mockedService = vi.mocked(evaluationService, true)

function makeEvaluation(overrides: Partial<Evaluation> = {}): Evaluation {
  return {
    _id: 'eval-1',
    userId: 'user-1',
    evaluatorProfileId: 'profile-1',
    title: 'Test evaluation',
    type: 'website',
    url: 'https://example.com',
    status: 'pending',
    auditStatus: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  }
}

const createDto: CreateEvaluationDto = {
  evaluatorProfileId: 'profile-1',
  title: 'Test evaluation',
  type: 'website',
  url: 'https://example.com',
}

const POLL_INTERVAL_MS = 2500 // matches the hook's hardcoded fallback

beforeEach(() => {
  vi.useFakeTimers()
  mockedService.create.mockReset()
  mockedService.getById.mockReset()
  mockedService.getAll.mockReset()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('useEvaluations polling lifecycle', () => {
  it('starts polling after creating an evaluation', async () => {
    const created = makeEvaluation({ status: 'pending' })
    mockedService.create.mockResolvedValue(created)
    mockedService.getById.mockResolvedValue(makeEvaluation({ status: 'completed', auditStatus: 'completed' }))

    const { result } = renderHook(() => useEvaluations())

    let createPromise!: Promise<Evaluation | null>
    await act(async () => {
      createPromise = result.current.createEvaluation(createDto)
      await vi.advanceTimersByTimeAsync(0)
    })

    expect(mockedService.create).toHaveBeenCalledTimes(1)
    expect(mockedService.getById).not.toHaveBeenCalled()

    await act(async () => {
      await vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS)
    })

    expect(mockedService.getById).toHaveBeenCalledTimes(1)
    await createPromise
  })

  it('continues polling while the evaluation is pending/running, and stops on a final state', async () => {
    const created = makeEvaluation({ status: 'pending' })
    mockedService.create.mockResolvedValue(created)
    mockedService.getById
      .mockResolvedValueOnce(makeEvaluation({ status: 'running' }))
      .mockResolvedValueOnce(makeEvaluation({ status: 'running' }))
      .mockResolvedValueOnce(makeEvaluation({ status: 'completed', auditStatus: 'completed' }))

    const { result } = renderHook(() => useEvaluations())

    let createPromise!: Promise<Evaluation | null>
    await act(async () => {
      createPromise = result.current.createEvaluation(createDto)
      await vi.advanceTimersByTimeAsync(0)
    })

    // Three polling ticks: running, running, completed+completed (stops here).
    await act(async () => {
      await vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS)
    })
    expect(mockedService.getById).toHaveBeenCalledTimes(1)
    expect(result.current.isCreating).toBe(true)

    await act(async () => {
      await vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS)
    })
    expect(mockedService.getById).toHaveBeenCalledTimes(2)
    expect(result.current.isCreating).toBe(true)

    await act(async () => {
      await vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS)
    })
    expect(mockedService.getById).toHaveBeenCalledTimes(3)
    await createPromise

    expect(result.current.isCreating).toBe(false)
    expect(result.current.successMessage).toBe('Evaluación y auditoría de IA completadas con éxito.')

    // No further ticks are scheduled once the loop is done.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS * 3)
    })
    expect(mockedService.getById).toHaveBeenCalledTimes(3)
  })

  it('cancels polling immediately when the component unmounts, and never resumes it', async () => {
    const created = makeEvaluation({ status: 'pending' })
    mockedService.create.mockResolvedValue(created)
    // The evaluation never reaches a final state — without the P0-3 fix
    // this would poll forever.
    mockedService.getById.mockResolvedValue(makeEvaluation({ status: 'running' }))

    const { result, unmount } = renderHook(() => useEvaluations())

    let createPromise!: Promise<Evaluation | null>
    await act(async () => {
      createPromise = result.current.createEvaluation(createDto)
      await vi.advanceTimersByTimeAsync(0)
    })

    await act(async () => {
      await vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS)
    })
    expect(mockedService.getById).toHaveBeenCalledTimes(1)

    const callsAtUnmount = mockedService.getById.mock.calls.length

    // Unmount mid-poll (the request/timer for the next tick has not fired
    // yet) — this must stop the loop right away.
    unmount()

    // The pending createEvaluation() promise should resolve (not hang
    // forever) once its poll is aborted.
    await createPromise

    // Advance a large amount of fake time: if the loop were still running
    // (the bug this fixes), getById would keep being called on every tick.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS * 10)
    })

    expect(mockedService.getById).toHaveBeenCalledTimes(callsAtUnmount)
  })
})
