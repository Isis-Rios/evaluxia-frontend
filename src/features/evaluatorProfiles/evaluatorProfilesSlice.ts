// src/features/evaluatorProfiles/evaluatorProfilesSlice.ts
import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import type { EvaluatorProfile } from '@/types/evaluatorProfile.types'

interface EvaluatorProfilesState {
  /** Perfil evaluador activo en la sesión actual. null mientras no se haya cargado. */
  activeProfile: EvaluatorProfile | null
}

const initialState: EvaluatorProfilesState = {
  activeProfile: null,
}

/**
 * evaluatorProfilesSlice — Slice ligero para compartir el perfil activo
 * entre todos los componentes sin prop drilling ni fetches duplicados.
 *
 * NO se persiste (el activo se lee del backend al iniciar sesión).
 * Se actualiza desde useEvaluatorProfiles al hacer fetch o al activar un perfil.
 */
const evaluatorProfilesSlice = createSlice({
  name: 'evaluatorProfiles',
  initialState,
  reducers: {
    /** Se despacha tras cargar la lista de perfiles o tras activar uno. */
    setActiveProfile(state, action: PayloadAction<EvaluatorProfile | null>) {
      state.activeProfile = action.payload
    },
    /** Se despacha al cerrar sesión para limpiar el perfil activo. */
    clearActiveProfile(state) {
      state.activeProfile = null
    },
  },
})

export const { setActiveProfile, clearActiveProfile } = evaluatorProfilesSlice.actions
export default evaluatorProfilesSlice.reducer
