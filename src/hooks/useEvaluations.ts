// src/hooks/useEvaluations.ts
import { useState, useCallback } from 'react'
import axios from 'axios'
import { evaluationService } from '@services/evaluations/evaluation.service'
import type { Evaluation, CreateEvaluationDto } from '@/types/evaluation.types'

export interface UseEvaluationsReturn {
  evaluations: Evaluation[]
  currentEvaluation: Evaluation | null
  isLoading: boolean
  isCreating: boolean
  error: string | null
  successMessage: string | null
  total: number

  fetchEvaluations: (page?: number, limit?: number) => Promise<void>
  createEvaluation: (dto: CreateEvaluationDto) => Promise<Evaluation | null>
  clearMessages: () => void
}

export function useEvaluations(): UseEvaluationsReturn {
  const [evaluations, setEvaluations] = useState<Evaluation[]>([])
  const [currentEvaluation, setCurrentEvaluation] = useState<Evaluation | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [total, setTotal] = useState(0)

  const clearMessages = useCallback(() => {
    setError(null)
    setSuccessMessage(null)
  }, [])

  const fetchEvaluations = useCallback(async (page = 1, limit = 20) => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await evaluationService.getAll(page, limit)
      setEvaluations(response.data)
      setTotal(response.total)
    } catch (err) {
      setError(normalizeError(err, 'No se pudo cargar el historial de evaluaciones.'))
    } finally {
      setIsLoading(false)
    }
  }, [])

  const createEvaluation = useCallback(
    async (dto: CreateEvaluationDto): Promise<Evaluation | null> => {
      setIsCreating(true)
      setCurrentEvaluation(null)
      setError(null)
      try {
        const created = await evaluationService.create(dto)
        setCurrentEvaluation(created)
        setEvaluations((prev) => [created, ...prev])
        setTotal((t) => t + 1)

        const pollingIntervalMs = Number(import.meta.env.VITE_POLLING_INTERVAL_MS) || 2500
        let isDone = false
        let pollEvaluation = created

        while (!isDone) {
          await new Promise((resolve) => setTimeout(resolve, pollingIntervalMs))

          try {
            const updated = await evaluationService.getById(created._id)
            pollEvaluation = updated
            setCurrentEvaluation(updated)

            setEvaluations((prev) =>
              prev.map((e) => (e._id === updated._id ? updated : e))
            )

            if (updated.status === 'failed') {
              isDone = true
              setError('La simulación de la evaluación ha fallado en el servidor.')
            } else if (updated.status === 'completed') {
              if (updated.auditStatus === 'completed') {
                isDone = true
                setSuccessMessage('Evaluación y auditoría de IA completadas con éxito.')
              } else if (updated.auditStatus === 'failed') {
                isDone = true
                setError('La exploración finalizó, pero la auditoría de IA de la Fase 2 falló.')
              }
            }
          } catch (pollErr) {
            console.error('[useEvaluations] Error during polling:', pollErr)
          }
        }

        return pollEvaluation
      } catch (err) {
        setError(normalizeError(err, 'No se pudo ejecutar la evaluación.'))
        return null
      } finally {
        setIsCreating(false)
      }
    },
    [],
  )

  return {
    evaluations,
    currentEvaluation,
    isLoading,
    isCreating,
    error,
    successMessage,
    total,
    fetchEvaluations,
    createEvaluation,
    clearMessages,
  }
}

function normalizeError(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    const status = err.response?.status
    if (status === 401) return 'Sesión expirada. Por favor inicia sesión de nuevo.'
    if (status === 400 || status === 422) {
      const msg = err.response?.data?.message
      return typeof msg === 'string' ? msg : 'Los datos del formulario no son válidos.'
    }
    if (status && status >= 500) return 'Error en el servidor. Inténtalo más tarde.'
    if (err.code === 'ERR_NETWORK') return 'Sin conexión al servidor.'
  }
  return fallback
}
