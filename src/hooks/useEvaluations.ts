// src/hooks/useEvaluations.ts
import { useState, useCallback, useEffect, useRef } from 'react'
import axios from 'axios'
import { evaluationService } from '@services/evaluations/evaluation.service'
import type { Evaluation, CreateEvaluationDto, CreatePrototypeEvaluationDto } from '@/types/evaluation.types'

export interface UseEvaluationsReturn {
  evaluations: Evaluation[]
  currentEvaluation: Evaluation | null
  isLoading: boolean
  isCreating: boolean
  error: string | null
  successMessage: string | null
  total: number

  fetchEvaluations: (page?: number, limit?: number, options?: { silent?: boolean }) => Promise<void>
  createEvaluation: (dto: CreateEvaluationDto) => Promise<Evaluation | null>
  createPrototypeEvaluation: (dto: CreatePrototypeEvaluationDto) => Promise<Evaluation | null>
  clearMessages: () => void
}

function isAbortError(err: unknown): boolean {
  return (
    axios.isCancel(err) ||
    (err instanceof DOMException && err.name === 'AbortError') ||
    (err as { name?: string } | null)?.name === 'AbortError'
  )
}

/**
 * Resolves after `ms`, unless `signal` aborts first — in which case it
 * rejects with an AbortError and clears its own timeout (no dangling timer).
 */
function sleep(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(new DOMException('Aborted', 'AbortError'))
      return
    }

    const onAbort = () => {
      clearTimeout(timeoutId)
      reject(new DOMException('Aborted', 'AbortError'))
    }

    const timeoutId = setTimeout(() => {
      signal.removeEventListener('abort', onAbort)
      resolve()
    }, ms)

    signal.addEventListener('abort', onAbort, { once: true })
  })
}

export function useEvaluations(): UseEvaluationsReturn {
  const [evaluations, setEvaluations] = useState<Evaluation[]>([])
  const [currentEvaluation, setCurrentEvaluation] = useState<Evaluation | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [total, setTotal] = useState(0)

  // Guards against the polling loop (createEvaluation) updating state or
  // scheduling further timers/requests after the owning component unmounts.
  const isMountedRef = useRef(true)
  const pollAbortControllerRef = useRef<AbortController | null>(null)

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
      // Stops the polling loop immediately: any pending sleep()/axios call
      // rejects with AbortError instead of scheduling another iteration.
      pollAbortControllerRef.current?.abort()
    }
  }, [])

  const setIfMounted = useCallback((update: () => void) => {
    if (isMountedRef.current) update()
  }, [])

  const clearMessages = useCallback(() => {
    setError(null)
    setSuccessMessage(null)
  }, [])

  const fetchEvaluations = useCallback(async (page = 1, limit = 20, options?: { silent?: boolean }) => {
    // `silent` (background auto-refresh, e.g. HistoryPage polling for a
    // stale status chip) skips the isLoading toggle so it never flashes
    // the full-page spinner over an already-rendered list.
    if (!options?.silent) setIsLoading(true)
    setError(null)
    try {
      const response = await evaluationService.getAll(page, limit)
      setEvaluations(response.data)
      setTotal(response.total)
    } catch (err) {
      if (!options?.silent) setError(normalizeError(err, 'No se pudo cargar el historial de evaluaciones.'))
    } finally {
      if (!options?.silent) setIsLoading(false)
    }
  }, [])

  /**
   * Flujo compartido de creación + polling — WEB (`createEvaluation`) y
   * PROTOTYPE (`createPrototypeEvaluation`) difieren únicamente en CÓMO se
   * crea la evaluación (JSON vs multipart); el ciclo de polling posterior
   * (mismos campos `status`/`auditStatus`, mismo backend) es IDÉNTICO.
   */
  const runCreationFlow = useCallback(
    async (submit: (signal: AbortSignal) => Promise<Evaluation>): Promise<Evaluation | null> => {
      // Only one polling loop should ever be active: cancel any previous one
      // (defensive — isCreating already disables re-submission from the UI).
      pollAbortControllerRef.current?.abort()
      const controller = new AbortController()
      pollAbortControllerRef.current = controller

      setIfMounted(() => {
        setIsCreating(true)
        setCurrentEvaluation(null)
        setError(null)
      })

      try {
        const created = await submit(controller.signal)
        setIfMounted(() => {
          setCurrentEvaluation(created)
          setEvaluations((prev) => [created, ...prev])
          setTotal((t) => t + 1)
        })

        const pollingIntervalMs = Number(import.meta.env.VITE_POLLING_INTERVAL_MS) || 2500
        let isDone = false
        let pollEvaluation = created
        // [Revisión MVP] El backend corre su cola de trabajos en memoria
        // (JobRunner, sin persistencia): si el servidor se reinicia o se
        // cae mientras esta evaluación sigue 'running' y NO vuelve a
        // arrancar (la reconciliación del backend solo corre al inicio),
        // el documento se queda 'running' indefinidamente y este bucle
        // sondearía para siempre sin ninguna señal de error visible. Un
        // tope de tiempo evita un spinner infinito incluso en ese caso.
        const pollStartedAt = Date.now()
        const MAX_POLLING_MS = 10 * 60 * 1000

        while (!isDone) {
          await sleep(pollingIntervalMs, controller.signal)

          try {
            const updated = await evaluationService.getById(created._id, { signal: controller.signal })
            pollEvaluation = updated
            setIfMounted(() => {
              setCurrentEvaluation(updated)
              setEvaluations((prev) => prev.map((e) => (e._id === updated._id ? updated : e)))
            })

            if (updated.status === 'failed') {
              isDone = true
              setIfMounted(() => setError('La simulación de la evaluación ha fallado en el servidor.'))
            } else if (updated.status === 'completed') {
              if (updated.auditStatus === 'completed') {
                isDone = true
                setIfMounted(() => setSuccessMessage('Evaluación y auditoría de IA completadas con éxito.'))
              } else if (updated.auditStatus === 'failed') {
                isDone = true
                setIfMounted(() => setError('La exploración finalizó, pero la auditoría de IA de la Fase 2 falló.'))
              }
            } else if (Date.now() - pollStartedAt > MAX_POLLING_MS) {
              isDone = true
              setIfMounted(() =>
                setError(
                  'La evaluación está tardando más de lo esperado y dejamos de esperar en esta pantalla. ' +
                    'Puedes revisar su estado más tarde en el Historial.',
                ),
              )
            }
          } catch (pollErr) {
            // A cancelled poll (unmount, or a newer createEvaluation call)
            // must actually stop the loop instead of being swallowed.
            if (isAbortError(pollErr) || controller.signal.aborted) throw pollErr
            console.error('[useEvaluations] Error during polling:', pollErr)
          }
        }

        return pollEvaluation
      } catch (err) {
        if (isAbortError(err)) {
          // Polling was cancelled (unmount or superseded) — not a real error.
          return null
        }
        setIfMounted(() => setError(normalizeError(err, 'No se pudo ejecutar la evaluación.')))
        return null
      } finally {
        if (pollAbortControllerRef.current === controller) {
          setIfMounted(() => setIsCreating(false))
        }
      }
    },
    [setIfMounted],
  )

  const createEvaluation = useCallback(
    (dto: CreateEvaluationDto): Promise<Evaluation | null> =>
      runCreationFlow((signal) => evaluationService.create(dto, { signal })),
    [runCreationFlow],
  )

  const createPrototypeEvaluation = useCallback(
    (dto: CreatePrototypeEvaluationDto): Promise<Evaluation | null> =>
      runCreationFlow((signal) => evaluationService.createPrototype(dto, { signal })),
    [runCreationFlow],
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
    createPrototypeEvaluation,
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
