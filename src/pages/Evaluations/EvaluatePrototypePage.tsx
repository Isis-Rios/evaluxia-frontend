// src/pages/Evaluations/EvaluatePrototypePage.tsx
import { useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Grid,
  Snackbar,
  Typography,
} from '@mui/material'
import CropOriginalIcon from '@mui/icons-material/CropOriginal'
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'
import { useNavigate } from 'react-router-dom'

import { useEvaluatorProfiles } from '@hooks/useEvaluatorProfiles'
import { useEvaluations } from '@hooks/useEvaluations'
import { useFindings } from '@hooks/useFindings'
import { useReport } from '@hooks/useReport'

import ActiveProfileCard from '@components/evaluations/ActiveProfileCard'
import PrototypeEvaluationForm from '@components/evaluations/PrototypeEvaluationForm'
import EvaluationRunningState from '@components/evaluations/EvaluationRunningState'
import EvaluationResultsView from '@components/evaluations/EvaluationResultsView'
import type { PrototypeEvaluationSubmitValues } from '@components/evaluations/PrototypeEvaluationForm'

export default function EvaluatePrototypePage() {
  const navigate = useNavigate()

  // ── Perfil activo ────────────────────────────────────────────────────────
  const { profiles, fetchProfiles, isLoading: profilesLoading } = useEvaluatorProfiles()
  const activeProfile = profiles.find((p) => p.isActive) ?? null

  useEffect(() => {
    fetchProfiles()
  }, [fetchProfiles])

  // ── Evaluaciones ─────────────────────────────────────────────────────────
  const {
    isCreating,
    currentEvaluation,
    error: evalError,
    successMessage,
    createPrototypeEvaluation,
    clearMessages,
  } = useEvaluations()

  // ── Findings & Report ──────────────────────────────────────────────────────
  const { findings, isLoading: findingsLoading, error: findingsError, fetchFindings } = useFindings()
  const { report, fetchReportData } = useReport()
  const [showResults, setShowResults] = useState(false)

  useEffect(() => {
    if (currentEvaluation?.auditStatus === 'completed' && currentEvaluation?._id) {
      Promise.all([
        fetchFindings(currentEvaluation._id),
        fetchReportData(currentEvaluation._id),
      ]).then(() => setShowResults(true))
    }
  }, [currentEvaluation?.auditStatus, currentEvaluation?._id, fetchFindings, fetchReportData])

  const handleSubmit = async (values: PrototypeEvaluationSubmitValues) => {
    if (!activeProfile) return
    setShowResults(false)
    const result = await createPrototypeEvaluation({
      evaluatorProfileId: activeProfile._id,
      title: values.title,
      description: values.description,
      image: values.image,
    })
    if (!result) return
  }

  return (
    <Box sx={{ width: '100%', minWidth: 0 }}>
      {/* ── Header ── */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
        <CropOriginalIcon color="primary" sx={{ fontSize: 28 }} />
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Evaluar prototipo
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Análisis de accesibilidad y UX de una imagen estática, basado en el perfil evaluador activo
          </Typography>
        </Box>
      </Box>

      {/* Al terminar la evaluación, el reporte ocupa el 100 % del ancho disponible */}
      {showResults && !isCreating ? (
        <EvaluationResultsView
          evaluation={currentEvaluation}
          evaluationType="prototype"
          report={report}
          findings={findings}
          profileName={activeProfile?.fullName}
          profileArchetype={activeProfile?.archetype}
          findingsLoading={findingsLoading}
          findingsError={findingsError}
          headerAction={
            <Button
              type="button"
              variant="outlined"
              size="small"
              startIcon={<AddCircleOutlineIcon fontSize="small" />}
              onClick={() => setShowResults(false)}
              sx={{ textTransform: 'none', fontWeight: 700 }}
            >
              Nueva evaluación
            </Button>
          }
        />
      ) : (
        <Grid container spacing={3}>
          {/* ── Columna perfil activo (solo durante configuración / ejecución) ── */}
          <Grid size={{ xs: 12, md: 3 }}>
            {!profilesLoading && (
              activeProfile ? (
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={600} textAlign={'center'} sx={{ mb: 1, display: 'block' }}>
                    PERFIL EVALUADOR ACTIVO
                  </Typography>
                  <ActiveProfileCard profile={activeProfile} />
                </Box>
              ) : (
                <Alert
                  severity="warning"
                  action={
                    <Button
                      type="button"
                      color="inherit"
                      size="small"
                      onClick={() => navigate('/perfiles')}
                      sx={{ fontWeight: 700, textTransform: 'none' }}
                    >
                      Ir a perfiles
                    </Button>
                  }
                >
                  No hay un perfil evaluador activo.
                </Alert>
              )
            )}
          </Grid>

          {/* ── Contenido principal (formulario o estado en progreso) ── */}
          <Grid size={{ xs: 12, md: 9 }}>
            {!isCreating && (
              <Box>
                <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                  Configurar evaluación
                </Typography>
                <PrototypeEvaluationForm
                  onSubmit={handleSubmit}
                  isLoading={isCreating}
                  error={evalError}
                />
              </Box>
            )}

            {isCreating && <EvaluationRunningState evaluation={currentEvaluation} />}
          </Grid>
        </Grid>
      )}

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
