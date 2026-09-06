// src/services/evaluations/evaluation.service.ts
import apiClient from '@services/api/apiClient'
import type {
  Evaluation,
  EvaluationsListResponse,
  EvaluationResponse,
  CreateEvaluationDto,
} from '@/types/evaluation.types'

const BASE_URL = '/api/v1/evaluations'

export interface RequestOptions {
  signal?: AbortSignal
}

class EvaluationService {
  /** GET /api/v1/evaluations?page=1&limit=20 */
  async getAll(page = 1, limit = 20): Promise<EvaluationsListResponse> {
    const { data } = await apiClient.get<EvaluationsListResponse>(BASE_URL, {
      params: { page, limit },
    })
    return data
  }

  /** GET /api/v1/evaluations/:id */
  async getById(id: string, options?: RequestOptions): Promise<Evaluation> {
    const { data } = await apiClient.get<EvaluationResponse>(`${BASE_URL}/${id}`, {
      signal: options?.signal,
    })
    return data.data
  }

  /** POST /api/v1/evaluations — lanza la evaluación */
  async create(dto: CreateEvaluationDto, options?: RequestOptions): Promise<Evaluation> {
    const { data } = await apiClient.post<EvaluationResponse>(BASE_URL, dto, {
      signal: options?.signal,
    })
    return data.data
  }
}

export const evaluationService = new EvaluationService()
