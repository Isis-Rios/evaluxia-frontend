// src/features/auth/authSlice.ts
import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import type { AuthState, User, JwtTokens } from '@/types/auth.types'

const initialState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    /**
     * Se despacha tras un login exitoso.
     * redux-persist se encarga de la persistencia — no se toca localStorage manualmente.
     */
    setCredentials(
      state,
      action: PayloadAction<{ user: User; tokens: JwtTokens }>,
    ) {
      state.user = action.payload.user
      state.accessToken = action.payload.tokens.accessToken
      state.refreshToken = action.payload.tokens.refreshToken
      state.isAuthenticated = true
    },

    /**
     * Actualiza sólo el accessToken (usado por el interceptor de refresh).
     * Preparado para la iteración de renovación automática.
     */
    updateAccessToken(state, action: PayloadAction<string>) {
      state.accessToken = action.payload
    },

    /**
     * Limpia la sesión por completo.
     * redux-persist sincronizará el store vacío al storage.
     */
    clearCredentials(state) {
      state.user = null
      state.accessToken = null
      state.refreshToken = null
      state.isAuthenticated = false
    },

    // ─── Aliases para compatibilidad con código existente ─────────────────
    loginSuccess(
      state,
      action: PayloadAction<{ user: User; token: string }>,
    ) {
      state.user = action.payload.user
      state.accessToken = action.payload.token
      state.isAuthenticated = true
    },
    logout(state) {
      state.user = null
      state.accessToken = null
      state.refreshToken = null
      state.isAuthenticated = false
    },
  },
})

export const {
  setCredentials,
  updateAccessToken,
  clearCredentials,
  loginSuccess,
  logout,
} = authSlice.actions

export default authSlice.reducer
