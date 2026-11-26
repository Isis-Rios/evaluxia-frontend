// src/pages/Evaluations/EvaluateWebPage.tsx
import { useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Grid,
  Snackbar,
  Typography,
} from '@mui/material'
import LanguageIcon from '@mui/icons-material/Language'
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'
import { useNavigate } from 'react-router-dom'

import { useEvaluatorProfiles } from '@hooks/useEvaluatorProfiles'
import { useEvaluations } from '@hooks/useEvaluations'
import { useFindings } from '@hooks/useFindings'
import { useReport } from '@hooks/useReport'

import ActiveProfileCard from '@components/evaluations/ActiveProfileCard'
import EvaluationForm from '@components/evaluations/EvaluationForm'
import EvaluationRunningState from '@components/evaluations/EvaluationRunningState'
import EvaluationResultsView from '@components/evaluations/EvaluationResultsView'
import type { EvaluationFormValues } from '@components/evaluations/EvaluationForm'

export default function EvaluateWebPage() {
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
    createEvaluation,
    clearMessages,
  } = useEvaluations()

  // ── Findings & Report ──────────────────────────────────────────────────────
  const { findings, isLoading: findingsLoading, error: findingsError, fetchFindings } = useFindings()
  const { report, snapshots, fetchReportData } = useReport()
  const [showResults, setShowResults] = useState(false)

  // Cargar findings y report únicamente cuando la auditoría de Fase 2 (auditStatus) esté completed
  useEffect(() => {
    if (currentEvaluation?.auditStatus === 'completed' && currentEvaluation?._id) {
      Promise.all([
        fetchFindings(currentEvaluation._id),
        fetchReportData(currentEvaluation._id),
      ]).then(() => setShowResults(true))
    }
  }, [currentEvaluation?.auditStatus, currentEvaluation?._id, fetchFindings, fetchReportData])

  const handleSubmit = async (values: EvaluationFormValues) => {
    if (!activeProfile) return
    setShowResults(false)
    const result = await createEvaluation({
      evaluatorProfileId: activeProfile._id,
      title: values.title,
      type: 'website',
      url: values.url,
    })
    if (!result) return
  }

  return (
    <Box sx={{ width: '100%', minWidth: 0 }}>
      {/* ── Header ── */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
        <LanguageIcon color="primary" sx={{ fontSize: 28 }} />
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Evaluar sitio web
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Análisis de accesibilidad y UX basado en el perfil evaluador activo
          </Typography>
        </Box>
      </Box>

      {/* Cuando finaliza la evaluación, los resultados aprovechan el 100 % del ancho sin columna lateral de perfil */}
      {showResults && !isCreating ? (
        <EvaluationResultsView
          evaluation={currentEvaluation}
          evaluationType="website"
          report={report}
          findings={findings}
          snapshots={snapshots}
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
                <EvaluationForm
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

      {/* ── Snackbar de éxito ── */}
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
