// src/components/evaluations/EvaluationSummary.tsx
import { Box, Chip, Divider, Typography, Grid, Paper } from '@mui/material'
import type { FindingSummary, EvaluationMetrics } from '@/types/evaluation.types'

interface Props {
  summary: FindingSummary
  title?: string
  url?: string
  metrics?: EvaluationMetrics
}

const SEVERITY_CONFIG = [
  { key: 'critical', label: 'Crítico', color: '#d32f2f', bg: '#ffebee' },
  { key: 'high', label: 'Alto', color: '#e65100', bg: '#fff3e0' },
  { key: 'medium', label: 'Medio', color: '#f57f17', bg: '#fffde7' },
  { key: 'low', label: 'Bajo', color: '#2e7d32', bg: '#e8f5e9' },
  { key: 'info', label: 'Info', color: '#0277bd', bg: '#e1f5fe' },
] as const

/**
 * EvaluationSummary — Resumen ejecutivo de una evaluación con métricas de costo y tokens en tiempo real.
 */
export default function EvaluationSummary({ summary, title, url, metrics }: Props) {
  return (
    <Box
      sx={{
        bgcolor: '#f8f6ff',
        borderRadius: 2,
        p: 3,
        border: '1px solid #e0d9f9',
      }}
    >
      {(title || url) && (
        <>
          <Box sx={{ mb: 2 }}>
            {title && (
              <Typography variant="h6" fontWeight={700}>
                {title}
              </Typography>
            )}
            {url && (
              <Typography
                variant="caption"
                color="text.secondary"
                component="a"
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                sx={{ textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
              >
                {url}
              </Typography>
            )}
          </Box>
          <Divider sx={{ mb: 2 }} />
        </>
      )}

      {/* Total */}
      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mb: 2 }}>
        <Typography variant="h3" fontWeight={800} color="primary">
          {summary.total}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {summary.total === 1 ? 'hallazgo encontrado' : 'hallazgos encontrados'}
        </Typography>
      </Box>

      {/* Chips por severidad */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: metrics ? 3 : 0 }}>
        {SEVERITY_CONFIG.map(({ key, label, color, bg }) => {
          const count = summary[key]
          if (count === 0) return null
          return (
            <Chip
              key={key}
              label={`${count} ${label}`}
              size="small"
              sx={{
                bgcolor: bg,
                color,
                fontWeight: 700,
                border: `1px solid ${color}`,
                fontSize: 12,
              }}
            />
          )
        })}
      </Box>

      {/* Panel de Métricas de Consumo de Tokens y Costos en Tiempo Real */}
      {metrics && (
        <Paper
          elevation={0}
          sx={{
            p: 2.5,
            bgcolor: '#1a103c',
            color: '#ffffff',
            borderRadius: 2,
            border: '1px solid #4a3e75',
          }}
        >
          <Typography variant="subtitle2" fontWeight={800} sx={{ color: '#b39ddb', mb: 1.5, letterSpacing: 0.5 }}>
            📊 PANEL DE CONSUMO Y COSTOS EN TIEMPO REAL
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={6} sm={3}>
              <Typography variant="caption" sx={{ color: '#9fa8da', display: 'block' }}>
                Modelo Configurado
              </Typography>
              <Typography variant="body2" fontWeight={700} sx={{ color: '#81d4fa' }}>
                {metrics.modelUsed}
              </Typography>
            </Grid>

            <Grid item xs={6} sm={3}>
              <Typography variant="caption" sx={{ color: '#9fa8da', display: 'block' }}>
                Llamadas IA (F1 / F2)
              </Typography>
              <Typography variant="body2" fontWeight={700}>
                {metrics.phase1Calls} Nav / {metrics.phase2Calls} Audit
              </Typography>
            </Grid>

            <Grid item xs={6} sm={3}>
              <Typography variant="caption" sx={{ color: '#9fa8da', display: 'block' }}>
                Tokens (Input / Output)
              </Typography>
              <Typography variant="body2" fontWeight={700}>
                {metrics.promptTokens.toLocaleString()} / {metrics.outputTokens.toLocaleString()}
              </Typography>
            </Grid>

            <Grid item xs={6} sm={3}>
              <Typography variant="caption" sx={{ color: '#9fa8da', display: 'block' }}>
                Tiempo Total
              </Typography>
              <Typography variant="body2" fontWeight={700}>
                {metrics.totalExecutionTimeMs} ms
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 1, borderColor: '#31255a' }} />
            </Grid>

            <Grid item xs={6}>
              <Typography variant="caption" sx={{ color: '#9fa8da', display: 'block' }}>
                Costo Estimado Evaluación
              </Typography>
              <Typography variant="h6" fontWeight={800} sx={{ color: '#a5d6a7' }}>
                ${metrics.estimatedCostUsd.toFixed(6)} USD
              </Typography>
            </Grid>

            <Grid item xs={6}>
              <Typography variant="caption" sx={{ color: '#9fa8da', display: 'block' }}>
                Costo Acumulado Backend
              </Typography>
              <Typography variant="h6" fontWeight={800} sx={{ color: '#ffe082' }}>
                ${metrics.cumulativeCostUsd.toFixed(6)} USD
              </Typography>
            </Grid>
          </Grid>
        </Paper>
      )}
    </Box>
  )
}
