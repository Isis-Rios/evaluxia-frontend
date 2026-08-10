// src/pages/Evaluations/EvaluateWebPage.tsx
import { useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Divider,
  Grid,
  Snackbar,
  Typography,
} from '@mui/material'
import LanguageIcon from '@mui/icons-material/Language'
import { useNavigate } from 'react-router-dom'

import { useEvaluatorProfiles } from '@hooks/useEvaluatorProfiles'
import { useEvaluations } from '@hooks/useEvaluations'
import { useFindings } from '@hooks/useFindings'
import { useReport } from '@hooks/useReport'
import { buildFindingSummary } from '@/types/evaluation.types'

import ActiveProfileCard from '@components/evaluations/ActiveProfileCard'
import EvaluationForm from '@components/evaluations/EvaluationForm'
import EvaluationRunningState from '@components/evaluations/EvaluationRunningState'
import EvaluationSummary from '@components/evaluations/EvaluationSummary'
import FindingsAccordion from '@components/evaluations/FindingsAccordion'
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
  const { report, fetchReportData } = useReport()
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
    if (!result) return // error ya manejado en el hook
  }

  const summary = buildFindingSummary(findings)

  return (
    <Box>
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

      <Grid container spacing={3}>
        {/* ── Sidebar: perfil activo ── */}
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
                  <Box
                    component="span"
                    onClick={() => navigate('/perfiles')}
                    sx={{ cursor: 'pointer', fontWeight: 700, textDecoration: 'underline', fontSize: 13 }}
                  >
                    Ir a perfiles
                  </Box>
                }
              >
                No hay un perfil evaluador activo.
              </Alert>
            )
          )}
        </Grid>

        {/* ── Contenido principal ── */}
        <Grid size={{ xs: 12, md: 9 }}>
          {/* Formulario — solo visible si no está corriendo */}
          {!isCreating && !showResults && (
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

          {/* Estado "en progreso" */}
          {isCreating && <EvaluationRunningState evaluation={currentEvaluation} />}

          {/* Resultados */}
          {showResults && !isCreating && (
            <Box>
              {/* Resumen */}
              <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                Resumen ejecutivo
              </Typography>
              <EvaluationSummary
                summary={summary}
                title={currentEvaluation?.title}
                url={currentEvaluation?.url}
                report={report}
              />

              <Divider sx={{ my: 3 }} />

              {/* Findings */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle1" fontWeight={700}>
                  Hallazgos ({findings.length})
                </Typography>
              </Box>

              {findingsError && (
                <Alert severity="error" sx={{ mb: 2 }}>{findingsError}</Alert>
              )}

              {findingsLoading ? (
                <Typography color="text.secondary">Cargando hallazgos...</Typography>
              ) : (
                <FindingsAccordion findings={findings} />
              )}
            </Box>
          )}
        </Grid>
      </Grid>

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
