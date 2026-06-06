// src/types/auth.types.ts

/**
 * Usuario autenticado retornado por el backend.
 * El campo `_id` es el ObjectId de MongoDB; lo normalizamos a `id`
 * en el slice para compatibilidad interna.
 */
export interface User {
  _id: string
  name: string
  email: string
  role: 'evaluator' | 'admin' | string // extensible para futuros roles
}

/** Par de tokens JWT emitidos por el backend tras login/refresh. */
export interface JwtTokens {
  accessToken: string
  refreshToken: string
}

/** Body que se envía al endpoint POST /api/v1/auth/login */
export interface LoginRequest {
  email: string
  password: string
}

/** Shape completa de la respuesta del backend tras un login exitoso. */
export interface LoginResponse {
  status: 'success' | 'error'
  data: {
    user: User
    tokens: JwtTokens
  }
}

/**
 * Estado de autenticación almacenado en Redux.
 * `refreshToken` se persiste para poder implementar
 * el flujo de renovación automática en una iteración posterior.
 */
export interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
}
