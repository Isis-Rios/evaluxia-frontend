import { Box, LinearProgress, Typography, Fade, Paper, Stack } from '@mui/material'
import { useEffect, useState } from 'react'
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import ErrorIcon from '@mui/icons-material/Error'
import type { Evaluation } from '@/types/evaluation.types'

const STEPS = [
  'Iniciando simulación del navegador...',
  'Evaluando accesibilidad y estructura...',
  'Revisando experiencia de usuario cognitivo...',
  'Ejecutando interacción sugerida...',
  'Generando recomendaciones heurísticas...',
  'Consolidando reporte Nielsen y WCAG...',
]

interface EvaluationRunningStateProps {
  evaluation?: Evaluation | null
}

export default function EvaluationRunningState({ evaluation }: EvaluationRunningStateProps) {
  const [stepIndex, setStepIndex] = useState(0)
  const [progress, setProgress] = useState(5)

  // Ciclo decorativo de textos de carga
  useEffect(() => {
    const stepInterval = setInterval(() => {
      setStepIndex((prev) => (prev + 1) % STEPS.length)
    }, 4500)

    return () => clearInterval(stepInterval)
  }, [])

  // Calcular progreso en base a la iteración actual (si max es 5)
  useEffect(() => {
    if (evaluation?.flowState) {
      const currentStep = evaluation.flowState.currentStep || 1
      const percent = Math.min(95, Math.round((currentStep / 5) * 100))
      setProgress(percent)
    } else {
      // Progreso simulado inicial
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 25) return prev
          return prev + 2
        })
      }, 500)
      return () => clearInterval(progressInterval)
    }
  }, [evaluation])

  const previousActions = evaluation?.flowState?.previousActions || []
  const currentStep = evaluation?.flowState?.currentStep || 1
  const completedSteps = evaluation?.flowState?.completedSteps || []

  // Color de badge según acción
  const getActionColor = (actionType: string) => {
    switch (actionType.toUpperCase()) {
      case 'CLICK':
        return '#0288d1'
      case 'TYPE':
        return '#2e7d32'
      case 'NAVIGATE':
        return '#7b1fa2'
      default:
        return '#ed6c02'
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

      <Box sx={{ width: '100%', maxWidth: 500, textAlign: 'center' }}>
        <Typography variant="h6" fontWeight={800} gutterBottom sx={{ color: 'text.primary' }}>
          {evaluation?.status === 'completed' && evaluation?.auditStatus === 'running'
            ? 'Fase 2: Generando Auditoría Especializada'
            : 'Fase 1: Exploración en progreso'}
        </Typography>

        <Fade key={stepIndex} in timeout={600}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2, minHeight: 22 }}>
            {evaluation?.status === 'completed' && evaluation?.auditStatus === 'running'
              ? 'Analizando recorrido con Gemini (Nielsen 10 Heurísticas & WCAG 2.2)...'
              : evaluation?.flowState
              ? `Ejecutando iteración cognitiva ${currentStep} de 5...`
              : STEPS[stepIndex]}
          </Typography>
        </Fade>

        <LinearProgress
          variant="determinate"
          value={progress}
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
          {progress}% completado
        </Typography>
      </Box>

      {/* Timeline de la simulación */}
      {previousActions.length > 0 && (
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
            Historial de Acciones Simuladas ({previousActions.length})
          </Typography>

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
                    <Typography
                      variant="caption"
                      fontWeight={700}
                      sx={{
                        px: 1,
                        py: 0.25,
                        borderRadius: 1,
                        bgcolor: getActionColor(action.actionType),
                        color: '#fff',
                        textTransform: 'uppercase',
                        fontSize: 10,
                      }}
                    >
                      {action.actionType}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Iteración {idx + 1} • {completedSteps[idx] || 'Exploración inicial'}
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ color: 'text.primary', fontSize: 13, lineHeight: 1.4 }}>
                    {action.description}
                  </Typography>
                </Box>
              </Box>
            ))}

            {/* Paso activo actual */}
            {currentStep > previousActions.length && (
              <Box sx={{ display: 'flex', gap: 2 }}>
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
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="body2" fontWeight={600} sx={{ color: 'primary.main', fontSize: 13 }}>
                    Analizando y decidiendo siguiente paso...
                  </Typography>
                </Box>
              </Box>
            )}
          </Stack>
        </Paper>
      )}
    </Box>
  )
}
