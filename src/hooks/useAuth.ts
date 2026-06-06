// src/hooks/useAuth.ts
import { useState, useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

import type { RootState, AppDispatch } from '@app/store'
import { setCredentials, clearCredentials } from '@features/auth/authSlice'
import { authService } from '@services/auth/auth.service'
import type { LoginRequest, User } from '@/types/auth.types'

export interface UseAuthReturn {
  /** Usuario autenticado actualmente, null si no hay sesión */
  user: User | null
  /** true si existe sesión activa */
  isAuthenticated: boolean
  /** true mientras se procesa una operación de auth */
  isLoading: boolean
  /** Mensaje de error legible, null si no hay error */
  error: string | null
  /** Rol del usuario para guards de autorización */
  role: string | null
  /** Inicia sesión con email/password */
  login: (credentials: LoginRequest) => Promise<void>
  /** Cierra la sesión local y redirige a /login */
  logout: () => Promise<void>
  /** Limpia el error actual */
  clearError: () => void
}

/**
 * useAuth — Hook reutilizable para autenticación.
 *
 * Encapsula:
 *   - Lectura del estado de auth desde el Redux store
 *   - Operaciones de login/logout (delegadas a AuthService)
 *   - Despacho de acciones al store
 *   - Normalización de errores con mensajes amigables
 *   - Navegación post-auth
 *
 * Los componentes visuales solo consumen esta API;
 * no conocen a Redux, AuthService ni Axios directamente.
 */
export function useAuth(): UseAuthReturn {
  const dispatch = useDispatch<AppDispatch>()
  const navigate = useNavigate()

  const user = useSelector((state: RootState) => state.auth.user)
  const isAuthenticated = useSelector(
    (state: RootState) => state.auth.isAuthenticated,
  )

  // El role se expone directamente para preparar guards de autorización por rol
  const role = user?.role ?? null

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const clearError = useCallback(() => setError(null), [])

  // ─── login ──────────────────────────────────────────────────────────────

  const login = useCallback(
    async (credentials: LoginRequest) => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await authService.login(credentials)

        dispatch(
          setCredentials({
            user: response.data.user,
            tokens: response.data.tokens,
          }),
        )

        navigate('/inicio')
      } catch (err) {
        setError(normalizeAuthError(err))
      } finally {
        setIsLoading(false)
      }
    },
    [dispatch, navigate],
  )

  // ─── logout ─────────────────────────────────────────────────────────────

  const logout = useCallback(async () => {
    setIsLoading(true)

    try {
      // Fire-and-forget: intentamos revocar en el servidor pero no bloqueamos
      await authService.logout().catch(() => {
        // El logout local sigue aunque falle la llamada al servidor
      })
    } finally {
      dispatch(clearCredentials())
      navigate('/login', { replace: true })
      setIsLoading(false)
    }
  }, [dispatch, navigate])

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    role,
    login,
    logout,
    clearError,
  }
}

// ─── Helpers privados ─────────────────────────────────────────────────────

/**
 * Normaliza cualquier error de Axios/red en un mensaje legible en español.
 * Centralizar aquí evita duplicación en cada componente.
 */
function normalizeAuthError(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const status = err.response?.status

    if (status === 401 || status === 400) {
      return 'Correo o contraseña incorrectos. Verifica tus datos e intenta de nuevo.'
    }

    if (status === 429) {
      return 'Demasiados intentos. Por favor espera un momento antes de intentar de nuevo.'
    }

    if (status && status >= 500) {
      return 'El servidor no está disponible en este momento. Inténtalo más tarde.'
    }

    if (err.code === 'ERR_NETWORK' || err.code === 'ECONNREFUSED') {
      return 'No se pudo conectar con el servidor. Verifica tu conexión a internet.'
    }
  }

  return 'Ocurrió un error inesperado. Por favor intenta de nuevo.'
}
