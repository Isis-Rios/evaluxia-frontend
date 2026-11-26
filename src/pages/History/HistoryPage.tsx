// src/pages/History/HistoryPage.tsx
import { useEffect, useState, useMemo, useCallback, useRef } from 'react'
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import HistoryIcon from '@mui/icons-material/History'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import { useTheme } from '@mui/material/styles'
import { useNavigate, useParams } from 'react-router-dom'
import { useEvaluations } from '@hooks/useEvaluations'
import { useEvaluatorProfiles } from '@hooks/useEvaluatorProfiles'
import { evaluationService } from '@services/evaluations/evaluation.service'
import { findingsService } from '@services/findings/findings.service'
import { reportsService } from '@services/reports/reports.service'
import { snapshotsService, type SnapshotEvidenceItem } from '@services/snapshots/snapshots.service'
import EvaluationResultsView from '@components/evaluations/EvaluationResultsView'
import type { Evaluation, Finding, Report } from '@/types/evaluation.types'

// ── Colores de estado ──────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; color: 'default' | 'info' | 'warning' | 'success' | 'error' }> = {
  pending:   { label: 'Pendiente',   color: 'default' },
  running:   { label: 'En progreso', color: 'info' },
  completed: { label: 'Completada',  color: 'success' },
  failed:    { label: 'Fallida',     color: 'error' },
}

interface CachedEvaluationDetails {
  findings: Finding[]
  report: Report | null
  snapshots: SnapshotEvidenceItem[]
  loaded: boolean
}

const HISTORY_REFRESH_INTERVAL_MS = 5000

export default function HistoryPage() {
  const { evaluationId: routeEvaluationId } = useParams<{ evaluationId?: string }>()
  const navigate = useNavigate()
  const theme = useTheme()

  const { evaluations, isLoading, error, fetchEvaluations } = useEvaluations()
  const { profiles, isLoading: profilesLoading, fetchProfiles } = useEvaluatorProfiles()

  // Evaluación seleccionada para la vista de detalle a ancho completo (fuera del <table>)
  const [selectedEvaluationId, setSelectedEvaluationId] = useState<string | null>(routeEvaluationId ?? null)
  const [directEvaluation, setDirectEvaluation] = useState<Evaluation | null>(null)
  const [detailsCache, setDetailsCache] = useState<Record<string, CachedEvaluationDetails>>({})
  const [isDetailsLoading, setIsDetailsLoading] = useState(false)
  const [detailsError, setDetailsError] = useState<string | null>(null)

  const detailsCacheRef = useRef(detailsCache)
  detailsCacheRef.current = detailsCache

  useEffect(() => {
    setSelectedEvaluationId(routeEvaluationId ?? null)
  }, [routeEvaluationId])

  useEffect(() => {
    fetchEvaluations(1, 50)
    fetchProfiles()
  }, [fetchEvaluations, fetchProfiles])

  const profileMap = useMemo(() => {
    const map: Record<string, { fullName: string; archetype?: string }> = {}
    for (const p of profiles) {
      map[p._id] = { fullName: p.fullName, archetype: p.archetype }
    }
    return map
  }, [profiles])

  // Refresco en segundo plano mientras exista alguna evaluación en progreso
  const hasNonTerminalEvaluation = evaluations.some(
    (ev) => ev.status === 'pending' || ev.status === 'running' || ev.auditStatus === 'running',
  )
  useEffect(() => {
    if (!hasNonTerminalEvaluation) return
    const intervalId = setInterval(() => {
      fetchEvaluations(1, 50, { silent: true })
    }, HISTORY_REFRESH_INTERVAL_MS)
    return () => clearInterval(intervalId)
  }, [hasNonTerminalEvaluation, fetchEvaluations])

  const selectedEvaluation = useMemo(() => {
    if (!selectedEvaluationId) return null
    return evaluations.find((ev) => ev._id === selectedEvaluationId) ?? (directEvaluation?._id === selectedEvaluationId ? directEvaluation : null)
  }, [selectedEvaluationId, evaluations, directEvaluation])

  const loadEvaluationDetails = useCallback(async (ev: Evaluation, forceReload = false) => {
    const cached = detailsCacheRef.current[ev._id]
    if (cached?.loaded && !forceReload) {
      setDetailsError(null)
      return
    }

    setIsDetailsLoading(true)
    setDetailsError(null)
    try {
      const canHaveReport = ev.auditStatus === 'completed'
      const [findingsRes, reportRes, snapshotsRes] = await Promise.all([
        findingsService.getByEvaluationId(ev._id).catch((err) => {
          if (err?.response?.status === 404) return [] as Finding[]
          throw err
        }),
        canHaveReport ? reportsService.getByEvaluationId(ev._id).catch(() => null) : Promise.resolve(null),
        canHaveReport && ev.type !== 'prototype'
          ? snapshotsService.getByEvaluationId(ev._id).catch(() => [] as SnapshotEvidenceItem[])
          : Promise.resolve([] as SnapshotEvidenceItem[]),
      ])

      setDetailsCache((prev) => ({
        ...prev,
        [ev._id]: {
          findings: findingsRes,
          report: reportRes,
          snapshots: snapshotsRes,
          loaded: true,
        },
      }))
    } catch {
      setDetailsError('No se pudieron cargar los resultados de esta evaluación.')
    } finally {
      setIsDetailsLoading(false)
    }
  }, [])

  // Si se abre por ruta directa `/historial/:evaluationId` y la evaluación aún no está en la lista
  useEffect(() => {
    if (!selectedEvaluationId) return
    if (selectedEvaluation) {
      loadEvaluationDetails(selectedEvaluation)
      return
    }
    if (!isLoading) {
      let cancelled = false
      setIsDetailsLoading(true)
      evaluationService
        .getById(selectedEvaluationId)
        .then((ev) => {
          if (cancelled) return
          setDirectEvaluation(ev)
          loadEvaluationDetails(ev)
        })
        .catch(() => {
          if (!cancelled) {
            setDetailsError('No se encontró la evaluación solicitada.')
            setIsDetailsLoading(false)
          }
        })
      return () => {
        cancelled = true
      }
    }
  }, [selectedEvaluationId, selectedEvaluation, isLoading, loadEvaluationDetails])

  // Si la evaluación abierta termina en segundo plano, recargar sus detalles
  const prevSelectedStatusRef = useRef<string | undefined>(selectedEvaluation?.status)
  useEffect(() => {
    if (
      selectedEvaluation &&
      prevSelectedStatusRef.current &&
      prevSelectedStatusRef.current !== selectedEvaluation.status &&
      selectedEvaluation.status === 'completed'
    ) {
      loadEvaluationDetails(selectedEvaluation, true)
    }
    prevSelectedStatusRef.current = selectedEvaluation?.status
  }, [selectedEvaluation, loadEvaluationDetails])

  const handleOpenEvaluation = (ev: Evaluation) => {
    setSelectedEvaluationId(ev._id)
    if (routeEvaluationId !== ev._id) {
      navigate(`/historial/${ev._id}`)
    }
  }

  const handleBackToList = () => {
    setSelectedEvaluationId(null)
    setDetailsError(null)
    if (routeEvaluationId) {
      navigate('/historial')
    }
  }

  const resolveProfileInfo = (ev: Evaluation) => {
    if (typeof ev.evaluatorProfileId === 'string' && profileMap[ev.evaluatorProfileId]) {
      return profileMap[ev.evaluatorProfileId]
    }
    if (typeof ev.evaluatorProfileId === 'object' && ev.evaluatorProfileId !== null) {
      const obj = ev.evaluatorProfileId as unknown as { fullName?: string; archetype?: string }
      if (obj.fullName) return { fullName: obj.fullName, archetype: obj.archetype }
    }
    return { fullName: '—', archetype: undefined }
  }

  // ── VISTA DE DETALLE A ANCHO COMPLETO (FUERA DE LA TABLA PRINCIPAL) ───────
  if (selectedEvaluationId) {
    const cached = detailsCache[selectedEvaluationId]
    const profileInfo = selectedEvaluation ? resolveProfileInfo(selectedEvaluation) : { fullName: '—', archetype: undefined }

    return (
      <Box sx={{ width: '100%', minWidth: 0 }}>
        <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
          <Button
            type="button"
            variant="outlined"
            size="small"
            startIcon={<ArrowBackIcon fontSize="small" />}
            onClick={handleBackToList}
            sx={{ textTransform: 'none', fontWeight: 700 }}
          >
            Volver al historial
          </Button>
        </Box>

        {isDetailsLoading && !cached?.loaded && (
          <Paper elevation={0} sx={{ p: 4, border: '1px solid #e0d9f9', borderRadius: 2, textAlign: 'center' }}>
            <CircularProgress size={28} sx={{ mb: 1.5 }} />
            <Typography variant="body2" color="text.secondary">
              Cargando hallazgos, evidencias y reporte...
            </Typography>
          </Paper>
        )}

        {detailsError && !isDetailsLoading && (
          <Alert
            severity="error"
            sx={{ mb: 2 }}
            action={
              selectedEvaluation ? (
                <Button color="inherit" size="small" onClick={() => loadEvaluationDetails(selectedEvaluation, true)}>
                  Reintentar
                </Button>
              ) : undefined
            }
          >
            {detailsError}
          </Alert>
        )}

        {selectedEvaluation && cached?.loaded && !detailsError && (
          <EvaluationResultsView
            evaluation={selectedEvaluation}
            evaluationType={selectedEvaluation.type === 'prototype' ? 'prototype' : 'website'}
            report={cached.report}
            findings={cached.findings}
            snapshots={cached.snapshots}
            profileName={profileInfo.fullName !== '—' ? profileInfo.fullName : undefined}
            profileArchetype={profileInfo.archetype}
          />
        )}
      </Box>
    )
  }

  // ── VISTA DE LISTADO DEL HISTORIAL (TABLA LIGERA SIN DETALLES ANIDADOS) ───
  return (
    <Box sx={{ width: '100%', minWidth: 0 }}>
      {/* ── Header ── */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
        <HistoryIcon color="primary" sx={{ fontSize: 28 }} />
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Historial de evaluaciones
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {!isLoading && `${evaluations.length} evaluaciones registradas · Seleccione una evaluación para abrir su reporte completo`}
          </Typography>
        </Box>
      </Box>

      {/* Error */}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Loading */}
      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Vacío */}
      {!isLoading && evaluations.length === 0 && !error && (
        <Box sx={{ textAlign: 'center', mt: 8, color: 'text.secondary' }}>
          <HistoryIcon sx={{ fontSize: 64, opacity: 0.2 }} />
          <Typography variant="h6" mt={2}>Aún no tienes evaluaciones</Typography>
          <Typography variant="body2">Ejecuta tu primera evaluación desde "Evaluar sitio web".</Typography>
        </Box>
      )}

      {/* Tabla ligera (sin filas expandibles anidadas) */}
      {!isLoading && evaluations.length > 0 && (
        <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e0e0e0', borderRadius: 2 }}>
          <Table sx={{ tableLayout: { xs: 'auto', md: 'fixed' }, width: '100%' }}>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f8f6ff' }}>
                <TableCell sx={{ width: { md: '40%' } }}><Typography fontWeight={700} variant="body2">Evaluación</Typography></TableCell>
                <TableCell sx={{ width: { md: '20%' } }}><Typography fontWeight={700} variant="body2">Perfil evaluador</Typography></TableCell>
                <TableCell sx={{ width: { md: '16%' } }}><Typography fontWeight={700} variant="body2">Fecha y hora</Typography></TableCell>
                <TableCell sx={{ width: { md: '12%' } }}><Typography fontWeight={700} variant="body2">Estado</Typography></TableCell>
                <TableCell align="right" sx={{ width: { md: '12%' } }}><Typography fontWeight={700} variant="body2">Acción</Typography></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {evaluations.map((ev) => {
                const status = STATUS_CONFIG[ev.status] ?? { label: ev.status, color: 'default' }
                const dateObj = new Date(ev.createdAt)
                const formattedDate = dateObj.toLocaleDateString('es-MX', {
                  day: '2-digit', month: 'short', year: 'numeric',
                })
                const formattedTime = dateObj.toLocaleTimeString('es-MX', {
                  hour: '2-digit', minute: '2-digit', hour12: false,
                })
                const profileInfo = resolveProfileInfo(ev)

                return (
                  <TableRow
                    key={ev._id}
                    hover
                    sx={{ cursor: 'pointer' }}
                    onClick={() => handleOpenEvaluation(ev)}
                  >
                    <TableCell sx={{ overflowWrap: 'anywhere' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                        <Typography variant="body2" fontWeight={600}>
                          {ev.title}
                        </Typography>
                        <Chip
                          label={ev.type === 'prototype' ? 'Prototipo' : 'Sitio web'}
                          size="small"
                          variant="outlined"
                          sx={{ height: 18, fontSize: 10, fontWeight: 700 }}
                        />
                      </Box>
                      {ev.type === 'website' && ev.url ? (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          component="a"
                          href={ev.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          sx={{
                            display: 'block',
                            textDecoration: 'none',
                            overflowWrap: 'anywhere',
                            '&:hover': { textDecoration: 'underline' },
                          }}
                        >
                          {ev.url}
                        </Typography>
                      ) : (
                        <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block', maxWidth: '100%' }}>
                          {ev.description || 'Sin descripción'}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {profilesLoading && profileInfo.fullName === '—' ? (
                        <CircularProgress size={16} />
                      ) : (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
                          <Avatar
                            sx={{
                              width: 24,
                              height: 24,
                              fontSize: 11,
                              fontWeight: 700,
                              bgcolor: theme.palette.primary.main,
                              color: '#fff',
                              flexShrink: 0,
                            }}
                          >
                            {profileInfo.fullName !== '—' ? profileInfo.fullName.charAt(0).toUpperCase() : '?'}
                          </Avatar>
                          <Typography variant="body2" fontWeight={500} color="text.primary" noWrap>
                            {profileInfo.fullName}
                          </Typography>
                        </Box>
                      )}
                    </TableCell>
                    <TableCell>
                      <Tooltip title={dateObj.toISOString()} arrow>
                        <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
                          {formattedDate}, {formattedTime}
                        </Typography>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={status.label}
                        color={status.color}
                        size="small"
                        sx={{ fontWeight: 600 }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Button
                        type="button"
                        size="small"
                        variant="outlined"
                        endIcon={<OpenInNewIcon sx={{ fontSize: 14 }} />}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleOpenEvaluation(ev)
                        }}
                        aria-label={`Ver resultados de ${ev.title}`}
                        sx={{ textTransform: 'none', fontWeight: 700, fontSize: 12, whiteSpace: 'nowrap' }}
                      >
                        Ver
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  )
}
