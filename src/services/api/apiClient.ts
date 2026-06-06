// src/services/api/apiClient.ts
import axios from 'axios'
import { store } from '@app/store'
import type { RootState } from '@app/store'

/**
 * Instancia Axios centralizada para toda la aplicación.
 *
 * - baseURL: configurada por variable de entorno VITE_API_URL
 * - Interceptor de REQUEST: inyecta "Authorization: Bearer <accessToken>"
 *   obteniendo el token exclusivamente desde el Redux store
 *   (redux-persist garantiza que el store se rehidrate desde storage en boot)
 * - Interceptor de RESPONSE: normaliza errores para un manejo uniforme
 *
 * Listo para implementar refresh automático en una iteración posterior:
 * basta con agregar lógica en el interceptor 401 aquí.
 */
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// ─── Request interceptor ───────────────────────────────────────────────────

apiClient.interceptors.request.use(
  (config) => {
    const state: RootState = store.getState()
    const token = state.auth?.accessToken

    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }

    return config
  },
  (error) => Promise.reject(error),
)

// ─── Response interceptor ─────────────────────────────────────────────────

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    /**
     * TODO (iteración futura): si error.response?.status === 401
     * y existe refreshToken, intentar renovar el accessToken con
     * POST /api/v1/auth/refresh y reintentar la request original.
     *
     * Por ahora, propagamos el error normalizado para que el hook lo maneje.
     */
    return Promise.reject(error)
  },
)

export default apiClient
