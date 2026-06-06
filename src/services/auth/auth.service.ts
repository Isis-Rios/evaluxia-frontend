// src/services/auth/auth.service.ts
import apiClient from '@services/api/apiClient'
import type { LoginRequest, LoginResponse } from '@/types/auth.types'

/**
 * AuthService — Encapsula todas las llamadas HTTP relacionadas con autenticación.
 *
 * Responsabilidades:
 *   - Comunicarse con el backend via apiClient
 *   - Retornar datos tipados
 *
 * NO responsabilidades (Separation of Concerns):
 *   - No despacha acciones Redux (eso es responsabilidad del hook useAuth)
 *   - No navega (responsabilidad del componente / hook)
 *   - No manipula storage (redux-persist lo gestiona)
 */
class AuthService {
  private readonly LOGIN_URL = '/api/v1/auth/login'

  /**
   * Autentica al usuario contra el backend.
   * @returns LoginResponse con user + tokens
   * @throws AxiosError — el hook useAuth normaliza el mensaje de error
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const { data } = await apiClient.post<LoginResponse>(
      this.LOGIN_URL,
      credentials,
    )
    return data
  }

  /**
   * Placeholder para logout en servidor (revocar refreshToken).
   *
   * En esta iteración el logout es solo local (Redux/persist).
   * TODO (iteración futura): POST /api/v1/auth/logout con refreshToken
   * para invalidarlo en la base de datos del backend.
   */
  async logout(): Promise<void> {
    // TODO: await apiClient.post('/api/v1/auth/logout', { refreshToken })
  }
}

// Singleton — una sola instancia en toda la app
export const authService = new AuthService()
