// src/hooks/useEvaluatorProfiles.ts
import { useState, useCallback } from 'react'
import { useDispatch } from 'react-redux'
import axios from 'axios'
import { evaluatorProfileService } from '@services/evaluator-profiles/evaluatorProfile.service'
import { setActiveProfile } from '@features/evaluatorProfiles/evaluatorProfilesSlice'
import type {
  EvaluatorProfile,
  CreateEvaluatorProfileDto,
  UpdateEvaluatorProfileDto,
} from '@/types/evaluatorProfile.types'

export interface UseEvaluatorProfilesReturn {
  profiles: EvaluatorProfile[]
  profile: EvaluatorProfile | null
  isLoading: boolean
  /** true sólo durante la operación de activar (para no bloquear la UI entera) */
  isActivating: boolean
  error: string | null
  successMessage: string | null
  totalProfiles: number

  fetchProfiles: () => Promise<void>
  fetchProfileById: (id: string) => Promise<void>
  createProfile: (dto: CreateEvaluatorProfileDto) => Promise<EvaluatorProfile | null>
  updateProfile: (id: string, dto: UpdateEvaluatorProfileDto) => Promise<EvaluatorProfile | null>
  deleteProfile: (id: string) => Promise<boolean>
  /**
   * Activa el perfil indicado llamando a PATCH /api/v1/evaluator-profiles/:id/activate.
   * Actualiza el estado local a partir de la respuesta del servidor
   * (marca todos como inactivos y sólo el activado como activo).
   */
  activateProfile: (id: string) => Promise<boolean>
  clearMessages: () => void
}

/**
 * useEvaluatorProfiles — Hook que encapsula todo el ciclo de vida
 * del CRUD de perfiles evaluadores.
 *
 * Los componentes visuales consumen únicamente esta API;
 * no conocen a evaluatorProfileService ni a Axios.
 */
export function useEvaluatorProfiles(): UseEvaluatorProfilesReturn {
  const dispatch = useDispatch()
  const [profiles, setProfiles] = useState<EvaluatorProfile[]>([])
  const [profile, setProfile] = useState<EvaluatorProfile | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isActivating, setIsActivating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [totalProfiles, setTotalProfiles] = useState(0)

  const clearMessages = useCallback(() => {
    setError(null)
    setSuccessMessage(null)
  }, [])

  // ─── Fetch all ──────────────────────────────────────────────────────────

  const fetchProfiles = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await evaluatorProfileService.getAll()
      setProfiles(response.data)
      setTotalProfiles(response.total)
      // Sincronizar el perfil activo en Redux para que el Topbar se actualice
      const active = response.data.find((p) => p.isActive) ?? null
      dispatch(setActiveProfile(active))
    } catch (err) {
      setError(normalizeError(err, 'No se pudo cargar la lista de perfiles.'))
    } finally {
      setIsLoading(false)
    }
  }, [dispatch])

  // ─── Fetch by id ────────────────────────────────────────────────────────

  const fetchProfileById = useCallback(async (id: string) => {
    setIsLoading(true)
    setError(null)
    setProfile(null)
    try {
      const data = await evaluatorProfileService.getById(id)
      setProfile(data)
    } catch (err) {
      setError(normalizeError(err, 'No se pudo cargar el perfil.'))
    } finally {
      setIsLoading(false)
    }
  }, [])

  // ─── Create ─────────────────────────────────────────────────────────────

  const createProfile = useCallback(
    async (dto: CreateEvaluatorProfileDto): Promise<EvaluatorProfile | null> => {
      setIsLoading(true)
      setError(null)
      try {
        const created = await evaluatorProfileService.create(dto)
        setProfiles((prev) => [created, ...prev])
        setTotalProfiles((t) => t + 1)
        setSuccessMessage('Perfil creado exitosamente.')
        return created
      } catch (err) {
        setError(normalizeError(err, 'No se pudo crear el perfil.'))
        return null
      } finally {
        setIsLoading(false)
      }
    },
    [],
  )

  // ─── Update ─────────────────────────────────────────────────────────────

  const updateProfile = useCallback(
    async (id: string, dto: UpdateEvaluatorProfileDto): Promise<EvaluatorProfile | null> => {
      setIsLoading(true)
      setError(null)
      try {
        const updated = await evaluatorProfileService.update(id, dto)
        setProfiles((prev) => prev.map((p) => (p._id === id ? updated : p)))
        setProfile(updated)
        setSuccessMessage('Perfil actualizado exitosamente.')
        return updated
      } catch (err) {
        setError(normalizeError(err, 'No se pudo actualizar el perfil.'))
        return null
      } finally {
        setIsLoading(false)
      }
    },
    [],
  )

  // ─── Delete ─────────────────────────────────────────────────────────────

  const deleteProfile = useCallback(async (id: string): Promise<boolean> => {
    setIsLoading(true)
    setError(null)
    try {
      await evaluatorProfileService.delete(id)
      setProfiles((prev) => prev.filter((p) => p._id !== id))
      setTotalProfiles((t) => Math.max(0, t - 1))
      setSuccessMessage('Perfil eliminado exitosamente.')
      return true
    } catch (err) {
      setError(normalizeError(err, 'No se pudo eliminar el perfil.'))
      return false
    } finally {
      setIsLoading(false)
    }
  }, [])

  // ─── Activate ────────────────────────────────────────────────────────────

  const activateProfile = useCallback(async (id: string): Promise<boolean> => {
    setIsActivating(true)
    setError(null)
    try {
      const activated = await evaluatorProfileService.activate(id)

      /**
       * La fuente de verdad es el backend: marcamos todos como inactivos
       * y sólo el que retornó el servidor como activo.
       * Esto garantiza consistencia aunque el backend cambie reglas.
       */
      setProfiles((prev) =>
        prev.map((p) =>
          p._id === activated._id
            ? activated                   // perfil actualizado con isActive: true
            : { ...p, isActive: false },  // resto: inactivos
        ),
      )

      // Sincronizar el perfil activo en Redux → Topbar se actualiza automáticamente
      dispatch(setActiveProfile(activated))

      setSuccessMessage(`"${activated.fullName}" es ahora el perfil evaluador activo.`)
      return true
    } catch (err) {
      setError(normalizeError(err, 'No se pudo activar el perfil.'))
      return false
    } finally {
      setIsActivating(false)
    }
  }, [dispatch])

  return {
    profiles,
    profile,
    isLoading,
    isActivating,
    error,
    successMessage,
    totalProfiles,
    fetchProfiles,
    fetchProfileById,
    createProfile,
    updateProfile,
    deleteProfile,
    activateProfile,
    clearMessages,
  }
}

// ─── Helper ───────────────────────────────────────────────────────────────

function normalizeError(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    const status = err.response?.status
    if (status === 401) return 'Sesión expirada. Por favor inicia sesión de nuevo.'
    if (status === 403) return 'No tienes permiso para realizar esta acción.'
    if (status === 404) return 'El perfil no fue encontrado.'
    if (status === 422 || status === 400) {
      const msg = err.response?.data?.message
      return typeof msg === 'string' ? msg : 'Los datos enviados no son válidos.'
    }
    if (status && status >= 500) return 'Error en el servidor. Inténtalo más tarde.'
    if (err.code === 'ERR_NETWORK') return 'Sin conexión al servidor.'
  }
  return fallback
}
