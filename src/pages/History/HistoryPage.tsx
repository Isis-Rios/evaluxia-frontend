// src/pages/History/HistoryPage.tsx
import { useEffect, useState, useMemo, useCallback, useRef } from 'react'
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Collapse,
  Divider,
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
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp'
import HistoryIcon from '@mui/icons-material/History'
import { useTheme } from '@mui/material/styles'
import { useEvaluations } from '@hooks/useEvaluations'
import { useFindings } from '@hooks/useFindings'
import { useReport } from '@hooks/useReport'
import { useEvaluatorProfiles } from '@hooks/useEvaluatorProfiles'
import FindingsAccordion from '@components/evaluations/FindingsAccordion'
import EvaluationSummary from '@components/evaluations/EvaluationSummary'
import IncompleteExplorationNotice from '@components/evaluations/IncompleteExplorationNotice'
import { buildFindingSummary } from '@/types/evaluation.types'
import type { Evaluation } from '@/types/evaluation.types'
// ── Colores de estado ──────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; color: 'default' | 'info' | 'warning' | 'success' | 'error' }> = {
  pending:   { label: 'Pendiente',   color: 'default' },
  running:   { label: 'En progreso', color: 'info' },
  completed: { label: 'Completada',  color: 'success' },
  failed:    { label: 'Fallida',     color: 'error' },
}
// ── Fila expandible ────────────────────────────────────────────────────────
interface EvaluationRowProps {
  evaluation: Evaluation
  profileName?: string
  profilesLoading?: boolean
}

function EvaluationRow({ evaluation, profileName, profilesLoading }: EvaluationRowProps) {
  const [open, setOpen] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const theme = useTheme()

  const {
    findings,
    isLoading: isFindingsLoading,
    error: findingsError,
    fetchFindings,
  } = useFindings()

  const {
    report,
    isLoading: isReportLoading,
    error: reportError,
    fetchReportData,
  } = useReport()

  const canHaveReport = evaluation.auditStatus === 'completed'
  const isDetailsLoading = isFindingsLoading || isReportLoading
  const detailsError = findingsError || reportError

  const loadData = useCallback(async () => {
    try {
      await Promise.all([
        fetchFindings(evaluation._id),
        canHaveReport ? fetchReportData(evaluation._id) : Promise.resolve(),
      ])
      setLoaded(true)
    } catch {
      // Si falla la petición, loaded permanece false para permitir reintentos
    }
  }, [evaluation._id, canHaveReport, fetchFindings, fetchReportData])

  // Si la evaluación termina en segundo plano mientras el usuario está en el historial
  const prevStatusRef = useRef(evaluation.status)
  useEffect(() => {
    if (prevStatusRef.current !== evaluation.status && evaluation.status === 'completed') {
      if (open) {
        loadData()
      } else {
        setLoaded(false)
      }
    }
    prevStatusRef.current = evaluation.status
  }, [evaluation.status, open, loadData])

  const handleToggle = () => {
    const nextOpen = !open
    setOpen(nextOpen)

    // Al abrir: si aún no se han cargado los datos (o hubo error previo), solicitarlos
    if (nextOpen && !loaded && !isDetailsLoading) {
      loadData()
    }
  }

  const status = STATUS_CONFIG[evaluation.status] ?? { label: evaluation.status, color: 'default' }

  const dateObj = new Date(evaluation.createdAt)
  const formattedDate = dateObj.toLocaleDateString('es-MX', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
  const formattedTime = dateObj.toLocaleTimeString('es-MX', {
    hour: '2-digit', minute: '2-digit', hour12: false,
  })

  const resolvedProfileName =
    profileName ||
    (typeof evaluation.evaluatorProfileId === 'object' && evaluation.evaluatorProfileId !== null
      ? (evaluation.evaluatorProfileId as unknown as { fullName?: string })?.fullName
      : undefined) ||
    '—'

  const summary = buildFindingSummary(findings)
  return (
    <>
      <TableRow
        hover
        sx={{ cursor: 'pointer', '& > *': { borderBottom: 'unset' } }}
        onClick={handleToggle}
      >
        <TableCell>
          <Button
            size="small"
            variant="text"
            sx={{ minWidth: 0, p: 0, color: 'text.secondary' }}
            onClick={(e) => {
              e.stopPropagation()
              handleToggle()
            }}
          >
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </Button>
        </TableCell>
        <TableCell>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" fontWeight={600}>{evaluation.title}</Typography>
            <Chip
              label={evaluation.type === 'prototype' ? 'Prototipo' : 'Sitio web'}
              size="small"
              variant="outlined"
              sx={{ height: 18, fontSize: 10, fontWeight: 700 }}
            />
          </Box>
          {evaluation.type === 'website' && evaluation.url ? (
            <Typography
              variant="caption"
              color="text.secondary"
              component="a"
              href={evaluation.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              sx={{ textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
            >
              {evaluation.url}
            </Typography>
          ) : (
            <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block', maxWidth: 320 }}>
              {evaluation.description || 'Sin descripción'}
            </Typography>
          )}
        </TableCell>
        <TableCell>
          {profilesLoading && resolvedProfileName === '—' ? (
            <CircularProgress size={16} />
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Avatar
                sx={{
                  width: 24,
                  height: 24,
                  fontSize: 11,
                  fontWeight: 700,
                  bgcolor: theme.palette.primary.main,
                  color: '#fff',
                }}
              >
                {resolvedProfileName !== '—' ? resolvedProfileName.charAt(0).toUpperCase() : '?'}
              </Avatar>
              <Typography variant="body2" fontWeight={500} color="text.primary">
                {resolvedProfileName}
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
      </TableRow>
      {/* Fila expandible con findings y reporte */}
      <TableRow>
        <TableCell colSpan={5} sx={{ p: 0, border: 0 }}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box
              sx={{
                p: 3,
                bgcolor: theme.palette.grey[50],
                borderLeft: `4px solid ${theme.palette.primary.light}`,
              }}
            >
              {isDetailsLoading && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1 }}>
                  <CircularProgress size={20} />
                  <Typography variant="body2" color="text.secondary">
                    Cargando hallazgos y reporte...
                  </Typography>
                </Box>
              )}
              {detailsError && !isDetailsLoading && (
                <Alert
                  severity="error"
                  sx={{ mb: 2 }}
                  action={
                    <Button color="inherit" size="small" onClick={loadData}>
                      Reintentar
                    </Button>
                  }
                >
                  {detailsError}
                </Alert>
              )}
              {!isDetailsLoading && !detailsError && loaded && (
                <>
                  {evaluation.status === 'completed' && (
                    <IncompleteExplorationNotice
                      blockingError={evaluation.flowState?.blockingError}
                      terminationReason={evaluation.flowState?.terminationReason}
                    />
                  )}
                  <EvaluationSummary
                    summary={summary}
                    report={report}
                    evaluationType={evaluation.type === 'prototype' ? 'prototype' : 'website'}
                  />
                  <Divider sx={{ my: 2 }} />
                  <FindingsAccordion findings={findings} />
                </>
              )}
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  )
}
// ── Página ─────────────────────────────────────────────────────────────────
const HISTORY_REFRESH_INTERVAL_MS = 5000

export default function HistoryPage() {
  const { evaluations, isLoading, error, fetchEvaluations } = useEvaluations()
  const { profiles, isLoading: profilesLoading, fetchProfiles } = useEvaluatorProfiles()

  useEffect(() => {
    fetchEvaluations(1, 50)
    fetchProfiles()
  }, [fetchEvaluations, fetchProfiles])

  const profileMap = useMemo(() => {
    const map: Record<string, string> = {}
    for (const p of profiles) {
      map[p._id] = p.fullName
    }
    return map
  }, [profiles])

  // [Revisión MVP] La lista se pedía una sola vez: si el usuario abre el
  // Historial mientras una evaluación sigue 'pending'/'running', el chip de
  // estado se quedaba congelado ahí aunque la evaluación ya hubiera
  // terminado en el backend, hasta que el usuario recargara la página a
  // mano. Mientras exista al menos una fila no-terminal, se refresca la
  // lista en segundo plano a intervalos cortos; se detiene en cuanto todas
  // las evaluaciones visibles llegan a un estado terminal.
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
  return (
    <Box>
      {/* ── Header ── */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
        <HistoryIcon color="primary" sx={{ fontSize: 28 }} />
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Historial de evaluaciones
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {!isLoading && `${evaluations.length} evaluaciones registradas`}
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
      {/* Tabla */}
      {!isLoading && evaluations.length > 0 && (
        <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e0e0e0', borderRadius: 2 }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f8f6ff' }}>
                <TableCell width={48} />
                <TableCell><Typography fontWeight={700} variant="body2">Evaluación</Typography></TableCell>
                <TableCell><Typography fontWeight={700} variant="body2">Perfil evaluador</Typography></TableCell>
                <TableCell><Typography fontWeight={700} variant="body2">Fecha y hora</Typography></TableCell>
                <TableCell><Typography fontWeight={700} variant="body2">Estado</Typography></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {evaluations.map((ev) => (
                <EvaluationRow
                  key={ev._id}
                  evaluation={ev}
                  profileName={
                    typeof ev.evaluatorProfileId === 'string'
                      ? profileMap[ev.evaluatorProfileId]
                      : undefined
                  }
                  profilesLoading={profilesLoading}
                />
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  )
}

