// src/pages/Evaluations/EvaluatePrototypePage.tsx
import { useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Divider,
  Grid,
  Snackbar,
  Typography,
} from '@mui/material'
import CropOriginalIcon from '@mui/icons-material/CropOriginal'
import { useNavigate } from 'react-router-dom'

import { useEvaluatorProfiles } from '@hooks/useEvaluatorProfiles'
import { useEvaluations } from '@hooks/useEvaluations'
import { useFindings } from '@hooks/useFindings'
import { useReport } from '@hooks/useReport'
import { buildFindingSummary } from '@/types/evaluation.types'

import ActiveProfileCard from '@components/evaluations/ActiveProfileCard'
import PrototypeEvaluationForm from '@components/evaluations/PrototypeEvaluationForm'
import EvaluationRunningState from '@components/evaluations/EvaluationRunningState'
import EvaluationSummary from '@components/evaluations/EvaluationSummary'
import FindingsAccordion from '@components/evaluations/FindingsAccordion'
import type { PrototypeEvaluationSubmitValues } from '@components/evaluations/PrototypeEvaluationForm'

/** Base del backend para resolver `imageUrl` (ruta relativa `/uploads/...`). */
const API_BASE_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? ''

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
    if (!result) return // error ya manejado en el hook
  }

  const summary = buildFindingSummary(findings)
  const imageSrc = currentEvaluation?.imageUrl ? `${API_BASE_URL}${currentEvaluation.imageUrl}` : null

  return (
    <Box>
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
          {!isCreating && !showResults && (
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

          {showResults && !isCreating && (
            <Box>
              {imageSrc && (
                <Box sx={{ mb: 3, textAlign: 'center' }}>
                  <Box
                    component="img"
                    src={imageSrc}
                    alt="Prototipo evaluado"
                    sx={{ maxWidth: '100%', maxHeight: 360, borderRadius: 2, border: '1px solid #e0e0e0' }}
                  />
                </Box>
              )}

              <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                Resumen ejecutivo
              </Typography>
              {/* P7.2: la cobertura ahora se muestra junto al overallScore
                  dentro de EvaluationSummary (evaluationType="prototype"),
                  evitando duplicar la misma información en dos widgets. */}
              <EvaluationSummary
                summary={summary}
                title={currentEvaluation?.title}
                report={report}
                evaluationType="prototype"
              />

              <Divider sx={{ my: 3 }} />

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
