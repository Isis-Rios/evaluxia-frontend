// src/services/findings/findings.service.ts
import apiClient from '@services/api/apiClient'
import type { FindingsResponse, Finding } from '@/types/evaluation.types'

const BASE_URL = '/api/v1/findings'

class FindingsService {
  /** GET /api/v1/findings/evaluation/:evaluationId */
  async getByEvaluationId(evaluationId: string): Promise<Finding[]> {
    const { data } = await apiClient.get<FindingsResponse>(
      `${BASE_URL}/evaluation/${evaluationId}`,
    )
    return data.data
  }
}

export const findingsService = new FindingsService()
