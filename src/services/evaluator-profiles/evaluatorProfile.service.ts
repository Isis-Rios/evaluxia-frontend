// src/services/evaluator-profiles/evaluatorProfile.service.ts
import apiClient from '@services/api/apiClient'
import type {
  EvaluatorProfile,
  EvaluatorProfilesListResponse,
  EvaluatorProfileResponse,
  ActivateProfileResponse,
  CreateEvaluatorProfileDto,
  UpdateEvaluatorProfileDto,
} from '@/types/evaluatorProfile.types'

const BASE_URL = '/api/v1/evaluator-profiles'

/**
 * EvaluatorProfileService — Adapter HTTP para el módulo de perfiles evaluadores.
 *
 * Responsabilidades:
 *   - Encapsular llamadas a /api/v1/evaluator-profiles
 *   - Retornar datos tipados
 *
 * NO responsabilidades:
 *   - No gestiona estado (eso es responsabilidad del hook)
 *   - No navega
 *   - No muestra errores (los propaga al hook)
 */
class EvaluatorProfileService {
  /** GET /api/v1/evaluator-profiles?page=1&limit=50 */
  async getAll(page = 1, limit = 50): Promise<EvaluatorProfilesListResponse> {
    const { data } = await apiClient.get<EvaluatorProfilesListResponse>(BASE_URL, {
      params: { page, limit },
    })
    return data
  }

  /** GET /api/v1/evaluator-profiles/:id */
  async getById(id: string): Promise<EvaluatorProfile> {
    const { data } = await apiClient.get<EvaluatorProfileResponse>(`${BASE_URL}/${id}`)
    return data.data
  }

  /** POST /api/v1/evaluator-profiles */
  async create(dto: CreateEvaluatorProfileDto): Promise<EvaluatorProfile> {
    const { data } = await apiClient.post<EvaluatorProfileResponse>(BASE_URL, dto)
    return data.data
  }

  /** PATCH /api/v1/evaluator-profiles/:id */
  async update(id: string, dto: UpdateEvaluatorProfileDto): Promise<EvaluatorProfile> {
    const { data } = await apiClient.patch<EvaluatorProfileResponse>(
      `${BASE_URL}/${id}`,
      dto,
    )
    return data.data
  }

  /** PATCH /api/v1/evaluator-profiles/:id/activate
   * Activa el perfil indicado y desactiva cualquier otro del usuario.
   * Retorna el perfil actualizado con isActive: true.
   */
  async activate(id: string): Promise<EvaluatorProfile> {
    const { data } = await apiClient.patch<ActivateProfileResponse>(
      `${BASE_URL}/${id}/activate`,
    )
    return data.data
  }

  /** DELETE /api/v1/evaluator-profiles/:id → 204 No Content */
  async delete(id: string): Promise<void> {
    await apiClient.delete(`${BASE_URL}/${id}`)
  }
}

export const evaluatorProfileService = new EvaluatorProfileService()
