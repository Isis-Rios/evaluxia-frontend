// src/hooks/useFindings.ts
import { useState, useCallback } from 'react'
import axios from 'axios'
import { findingsService } from '@services/findings/findings.service'
import type { Finding } from '@/types/evaluation.types'

export interface UseFindingsReturn {
  findings: Finding[]
  isLoading: boolean
  error: string | null
  fetchFindings: (evaluationId: string) => Promise<void>
  clear: () => void
}

export function useFindings(): UseFindingsReturn {
  const [findings, setFindings] = useState<Finding[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchFindings = useCallback(async (evaluationId: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await findingsService.getByEvaluationId(evaluationId)
      setFindings(data)
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 404) {
        // Evaluación aún no tiene findings — no es error
        setFindings([])
      } else {
        setError('No se pudieron cargar los findings.')
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  const clear = useCallback(() => {
    setFindings([])
    setError(null)
  }, [])

  return { findings, isLoading, error, fetchFindings, clear }
}
