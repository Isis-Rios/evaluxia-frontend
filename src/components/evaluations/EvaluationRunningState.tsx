// src/components/evaluations/EvaluationRunningState.tsx
import { Box, LinearProgress, Typography, Paper, Stack, Chip } from '@mui/material'
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import ErrorIcon from '@mui/icons-material/Error'
import PersonIcon from '@mui/icons-material/Person'
import type { Evaluation } from '@/types/evaluation.types'

interface EvaluationRunningStateProps {
  evaluation?: Evaluation | null
}

/**
 * EvaluationRunningState — Presenta la bitácora de navegación real en tiempo real (Live Observability).
 * Consume directamente los datos de flowState entregados por la API REST sin utilizar textos estáticos simulados.
 */
export default function EvaluationRunningState({ evaluation }: EvaluationRunningStateProps) {
  const previousActions = evaluation?.flowState?.previousActions || []
  const currentStep = evaluation?.flowState?.currentStep || 1
  const completedSteps = evaluation?.flowState?.completedSteps || []
  const blockingError = evaluation?.flowState?.blockingError || null

  // Calcular progreso aproximado en base a maxIterations (típicamente 4 u 8)
  const percent = Math.min(95, Math.max(10, Math.round((currentStep / 5) * 100)))

  // Color de badge según acción
  const getActionColor = (actionType: string) => {
    switch (actionType.toUpperCase()) {
      case 'CLICK':
        return '#0288d1'
      case 'TYPE':
        return '#2e7d32'
      case 'SELECT':
        return '#ed6c02'
      case 'NAVIGATE':
        return '#7b1fa2'
      case 'STOP_FLOW':
        return '#c62828'
      default:
        return '#616161'
    }
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        py: 4,
        gap: 3,
      }}
    >
      {/* Icono animado */}
      <Box
        sx={{
          width: 68,
          height: 68,
          borderRadius: '50%',
          bgcolor: 'primary.main',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 20px rgba(25, 118, 210, 0.4)',
          animation: 'pulse 2.2s ease-in-out infinite',
          '@keyframes pulse': {
            '0%': { transform: 'scale(1)', boxShadow: '0 0 0 0 rgba(25, 118, 210, 0.4)' },
            '70%': { transform: 'scale(1.06)', boxShadow: '0 0 0 12px rgba(25, 118, 210, 0)' },
            '100%': { transform: 'scale(1)', boxShadow: '0 0 0 0 rgba(25, 118, 210, 0)' },
          },
        }}
      >
        <AutoAwesomeIcon sx={{ color: '#fff', fontSize: 30 }} />
      </Box>

      {/* Título de Estado Real */}
      <Box sx={{ width: '100%', maxWidth: 550, textAlign: 'center' }}>
        <Typography variant="h6" fontWeight={800} gutterBottom sx={{ color: 'text.primary' }}>
          {evaluation?.status === 'completed' && evaluation?.auditStatus === 'running'
            ? 'Fase 2: Ejecutando Auditoría Especializada de Dominio (Gemini)'
            : `Fase 1: Exploración en Vivo — Iteración ${currentStep}`}
        </Typography>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {evaluation?.status === 'completed' && evaluation?.auditStatus === 'running'
            ? 'Analizando capturas y árbol ARIA con Gemini (Nielsen 10 & WCAG 2.2)...'
            : previousActions.length > 0
            ? `Última acción: ${previousActions[previousActions.length - 1].description}`
            : 'Conectando sesión de Playwright en tiempo real...'}
        </Typography>

        <LinearProgress
          variant="determinate"
          value={percent}
          sx={{
            borderRadius: 4,
            height: 8,
            bgcolor: 'action.hover',
            '& .MuiLinearProgress-bar': {
              borderRadius: 4,
              backgroundImage: 'linear-gradient(90deg, #1976d2, #82b1ff)',
            },
          }}
        />
        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block', fontWeight: 600 }}>
          {percent}% completado
        </Typography>
      </Box>

      {/* Muestra error de bloqueo si ocurrió */}
      {blockingError && (
        <Paper elevation={0} sx={{ p: 2, bgcolor: '#ffebee', border: '1px solid #ef5350', borderRadius: 2, maxWidth: 550, width: '100%' }}>
          <Typography variant="subtitle2" fontWeight={800} color="error.dark">
            ⚠️ Error de Navegación Interceptado
          </Typography>
          <Typography variant="body2" color="error.main">
            {blockingError}
          </Typography>
        </Paper>
      )}

      {/* Bitácora de Navegación en Tiempo Real */}
      <Paper
        elevation={0}
        sx={{
          width: '100%',
          maxWidth: 550,
          p: 3,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 3,
          bgcolor: 'background.paper',
        }}
      >
        <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2, color: 'text.primary' }}>
          📋 Bitácora de Navegación en Tiempo Real ({previousActions.length} acciones)
        </Typography>

        {previousActions.length === 0 ? (
          <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
            Preparando exploración y conectando navegador en tiempo real...
          </Typography>
        ) : (
          <Stack spacing={2.5} sx={{ position: 'relative', pl: 1 }}>
            {previousActions.map((action, idx) => (
              <Box
                key={idx}
                sx={{
                  display: 'flex',
                  gap: 2,
                  position: 'relative',
                  '&:not(:last-child)::after': {
                    content: '""',
                    position: 'absolute',
                    left: 10,
                    top: 24,
                    bottom: -20,
                    width: 2,
                    bgcolor: 'divider',
                  },
                }}
              >
                {/* Indicador de estado */}
                <Box sx={{ zIndex: 2, mt: 0.5 }}>
                  {action.result === 'success' ? (
                    <CheckCircleIcon sx={{ color: 'success.main', fontSize: 22 }} />
                  ) : (
                    <ErrorIcon sx={{ color: 'error.main', fontSize: 22 }} />
                  )}
                </Box>

                {/* Contenido de la acción */}
                <Box sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <Chip
                      label={action.actionType}
                      size="small"
                      sx={{
                        bgcolor: getActionColor(action.actionType),
                        color: '#fff',
                        fontWeight: 800,
                        fontSize: 10,
                        height: 20,
                      }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      Paso {idx + 1} • {completedSteps[idx] || 'Navegación'}
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ color: 'text.primary', fontSize: 13, lineHeight: 1.4 }}>
                    {action.description}
                  </Typography>
                </Box>
              </Box>
            ))}

            {/* Paso activo en procesamiento */}
            {evaluation?.status === 'running' && (
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <Box
                  sx={{
                    width: 22,
                    height: 22,
                    borderRadius: '50%',
                    border: '2px solid',
                    borderColor: 'primary.main',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: 'background.paper',
                    animation: 'spin 2s linear infinite',
                    '@keyframes spin': {
                      '0%': { transform: 'rotate(0deg)' },
                      '100%': { transform: 'rotate(360deg)' },
                    },
                  }}
                >
                  <PlayArrowIcon sx={{ color: 'primary.main', fontSize: 14 }} />
                </Box>
                <Typography variant="body2" fontWeight={600} sx={{ color: 'primary.main', fontSize: 13 }}>
                  Analizando y decidiendo siguiente paso táctico...
                </Typography>
              </Box>
            )}
          </Stack>
        )}
      </Paper>
    </Box>
  )
}
