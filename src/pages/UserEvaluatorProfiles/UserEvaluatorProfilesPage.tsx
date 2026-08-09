// src/pages/UserEvaluatorProfiles/UserEvaluatorProfilesPage.tsx
import { useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Grid,
  Snackbar,
  Typography,
} from '@mui/material'
import PersonAddIcon from '@mui/icons-material/PersonAdd'
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline'
import { useNavigate } from 'react-router-dom'

import { useEvaluatorProfiles } from '@hooks/useEvaluatorProfiles'
import EvaluatorProfileCard from '@components/evaluator-profiles/EvaluatorProfileCard'
import DeleteProfileDialog from '@components/evaluator-profiles/DeleteProfileDialog'
import type { EvaluatorProfile } from '@/types/evaluatorProfile.types'

export default function UserEvaluatorProfilesPage() {
  const navigate = useNavigate()
  const {
    profiles,
    isLoading,
    isActivating,
    error,
    successMessage,
    fetchProfiles,
    deleteProfile,
    activateProfile,
    clearMessages,
  } = useEvaluatorProfiles()

  const [profileToDelete, setProfileToDelete] = useState<EvaluatorProfile | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  /** ID del perfil que está siendo activado en este momento (para spinner por tarjeta) */
  const [activatingId, setActivatingId] = useState<string | null>(null)

  // Cargar perfiles al montar
  useEffect(() => {
    fetchProfiles()
  }, [fetchProfiles])

  // ── Handlers de eliminación ──────────────────────────────────────────────

  const handleDeleteRequest = (profile: EvaluatorProfile) => {
    setProfileToDelete(profile)
  }

  const handleDeleteConfirm = async () => {
    if (!profileToDelete) return
    setIsDeleting(true)
    await deleteProfile(profileToDelete._id)
    setIsDeleting(false)
    setProfileToDelete(null)
  }

  const handleDeleteCancel = () => {
    setProfileToDelete(null)
  }

  // ── Handler de activación ────────────────────────────────────────────────

  const handleActivate = async (profile: EvaluatorProfile) => {
    if (profile.isActive || isActivating) return
    setActivatingId(profile._id)
    await activateProfile(profile._id)
    setActivatingId(null)
  }

  return (
    <Box p={0}>
      {/* ── Header ── */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={600}>
            Perfiles Evaluadores
          </Typography>
          {!isLoading && (
            <Typography variant="body2" color="text.secondary">
              {profiles.length} {profiles.length === 1 ? 'perfil registrado' : 'perfiles registrados'}
            </Typography>
          )}
        </Box>
        <Button
          id="btn-nuevo-perfil"
          variant="contained"
          color="primary"
          startIcon={<PersonAddIcon />}
          onClick={() => navigate('/perfiles/nuevo')}
        >
          Nuevo perfil
        </Button>
      </Box>

      {/* ── Error global ── */}
      {error && (
        <Alert severity="error" onClose={clearMessages} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* ── Loading ── */}
      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
          <CircularProgress />
        </Box>
      )}

      {/* ── Empty state ── */}
      {!isLoading && profiles.length === 0 && !error && (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            mt: 10,
            gap: 2,
            color: 'text.secondary',
          }}
        >
          <PeopleOutlineIcon sx={{ fontSize: 72, opacity: 0.3 }} />
          <Typography variant="h6" color="text.secondary">
            Aún no tienes perfiles evaluadores
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Crea tu primer perfil para comenzar a evaluar interfaces con EvalUXIA.
          </Typography>
          <Button
            variant="contained"
            startIcon={<PersonAddIcon />}
            onClick={() => navigate('/perfiles/nuevo')}
            sx={{ mt: 1 }}
          >
            Crear primer perfil
          </Button>
        </Box>
      )}

      {/* ── Grid de tarjetas ── */}
      {!isLoading && profiles.length > 0 && (
        <Grid container spacing={2}>
          {profiles.map((profile) => (
            <Grid key={profile._id} size={{ xs: 12, md: 6, lg: 4 }}>
              <EvaluatorProfileCard
                profile={profile}
                isActivating={activatingId === profile._id}
                onDelete={handleDeleteRequest}
                onActivate={handleActivate}
              />
            </Grid>
          ))}
        </Grid>
      )}

      {/* ── Dialog de confirmación de eliminación ── */}
      <DeleteProfileDialog
        open={!!profileToDelete}
        profile={profileToDelete}
        isLoading={isDeleting}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />

      {/* ── Snackbar de éxito (activación, eliminación, etc.) ── */}
      <Snackbar
        open={!!successMessage}
        autoHideDuration={4000}
        onClose={clearMessages}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={clearMessages} severity="success" variant="filled">
          {successMessage}
        </Alert>
      </Snackbar>
    </Box>
  )
}