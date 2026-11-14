// src/pages/History/HistoryPage.tsx
import { useEffect, useState } from 'react'
import {
  Alert,
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
  Typography,
} from '@mui/material'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp'
import HistoryIcon from '@mui/icons-material/History'
import { useTheme } from '@mui/material/styles'
import { useEvaluations } from '@hooks/useEvaluations'
import { useFindings } from '@hooks/useFindings'
import { useReport } from '@hooks/useReport'
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
function EvaluationRow({ evaluation }: { evaluation: Evaluation }) {
  const [open, setOpen] = useState(false)
  const { findings, isLoading, error, fetchFindings, clear } = useFindings()
  // [Revisión MVP] La fila solo mostraba `findings` -- el score/compliance/
  // cobertura/resumen de IA ya calculados y persistidos (Report) nunca se
  // pedían aquí, así que esa información quedaba permanentemente
  // inalcanzable en el Historial una vez terminada la sesión en vivo
  // (EvaluateWebPage/EvaluatePrototypePage solo la muestran para la
  // evaluación recién creada en esa misma sesión del hook).
  const { report, fetchReportData } = useReport()
  const [loaded, setLoaded] = useState(false)
  const theme = useTheme()
  const canHaveReport = evaluation.auditStatus === 'completed'
  const handleToggle = async () => {
    if (!open && !loaded) {
      await Promise.all([
        fetchFindings(evaluation._id),
        canHaveReport ? fetchReportData(evaluation._id) : Promise.resolve(),
      ])
      setLoaded(true)
    }
    if (open) clear()
    setOpen((v) => !v)
  }
  const status = STATUS_CONFIG[evaluation.status] ?? { label: evaluation.status, color: 'default' }
  const date = new Date(evaluation.createdAt).toLocaleDateString('es-MX', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
  const summary = buildFindingSummary(findings)
  return (
    <>
      <TableRow
        hover
        sx={{ cursor: 'pointer', '& > *': { borderBottom: 'unset' } }}
        onClick={handleToggle}
      >
        <TableCell>
          <Button size="small" variant="text" sx={{ minWidth: 0, p: 0, color: 'text.secondary' }}>
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
          <Typography variant="body2" color="text.secondary">{date}</Typography>
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
      {/* Fila expandible con findings */}
      <TableRow>
        <TableCell colSpan={4} sx={{ p: 0, border: 0 }}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box
              sx={{
                p: 3,
                bgcolor: theme.palette.grey[50],
                borderLeft: `4px solid ${theme.palette.primary.light}`,
              }}
            >
              {isLoading && <CircularProgress size={20} />}
              {error && <Alert severity="error">{error}</Alert>}
              {!isLoading && loaded && (
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
  useEffect(() => {
    fetchEvaluations(1, 50)
  }, [fetchEvaluations])

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
                <TableCell><Typography fontWeight={700} variant="body2">Fecha</Typography></TableCell>
                <TableCell><Typography fontWeight={700} variant="body2">Estado</Typography></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {evaluations.map((ev) => (
                <EvaluationRow key={ev._id} evaluation={ev} />
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  )
}

