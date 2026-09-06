// src/components/evaluations/EvaluationSummary.tsx
import { Box, Chip, Divider, Typography, Grid, Paper, Card } from '@mui/material'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import HighlightOffIcon from '@mui/icons-material/HighlightOff'
import HelpOutlineIcon from '@mui/icons-material/HelpOutline'
import SpeedIcon from '@mui/icons-material/Speed'
import type { FindingSummary, Report } from '@/types/evaluation.types'

interface Props {
  summary: FindingSummary
  title?: string
  url?: string
  report?: Report | null
}

const SEVERITY_CONFIG = [
  { key: 'critical', label: 'Crítico', color: '#d32f2f', bg: '#ffebee' },
  { key: 'high', label: 'Alto', color: '#e65100', bg: '#fff3e0' },
  { key: 'medium', label: 'Medio', color: '#f57f17', bg: '#fffde7' },
  { key: 'low', label: 'Bajo', color: '#2e7d32', bg: '#e8f5e9' },
  { key: 'info', label: 'Info', color: '#0277bd', bg: '#e1f5fe' },
] as const

/**
 * EvaluationSummary — Resumen ejecutivo con métricas determinísticas (Score, Compliance, Cobertura) y panel de tokens.
 */
export default function EvaluationSummary({ summary, title, url, report }: Props) {
  const metrics = report?.metrics

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
          <Divider sx={{ mb: 2.5 }} />
        </>
      )}

      {/* ── SECCIÓN 1: SCORE DETERMINÍSTICO Y CUMPLIMIENTO GLOBAL ── */}
      {report && (
        <Grid container spacing={2.5} sx={{ mb: 3 }}>
          {/* Card 1: Overall Score */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Card
              elevation={0}
              sx={{
                bgcolor: '#ffffff',
                border: '1px solid #d1c4e9',
                borderRadius: 2,
                textAlign: 'center',
                p: 2,
              }}
            >
              <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ letterSpacing: 0.5 }}>
                🏆 CALIFICACIÓN GLOBAL DETERMINÍSTICA
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, my: 1 }}>
                <SpeedIcon color="primary" sx={{ fontSize: 36 }} />
                <Typography variant="h3" fontWeight={900} color="primary.main">
                  {report.overallScore !== null && report.overallScore !== undefined
                    ? `${report.overallScore} / 100`
                    : 'No evaluable'}
                </Typography>
              </Box>
              <Typography variant="caption" color="text.secondary">
                Calculado 100% en backend (Algoritmo Determinístico 3D)
              </Typography>
            </Card>
          </Grid>

          {/* Card 2: Compliance por Dominio */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Card
              elevation={0}
              sx={{
                bgcolor: '#ffffff',
                border: '1px solid #c8e6c9',
                borderRadius: 2,
                p: 2,
              }}
            >
              <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ letterSpacing: 0.5 }}>
                🛡️ TASA DE CUMPLIMIENTO (COMPLIANCE)
              </Typography>
              <Box sx={{ mt: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="body2" fontWeight={600} color="text.secondary">
                    Nielsen Compliance:
                  </Typography>
                  <Typography variant="body2" fontWeight={800} color="success.dark">
                    {report.nielsenCompliance !== null && report.nielsenCompliance !== undefined
                      ? `${report.nielsenCompliance}%`
                      : 'No evaluable'}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" fontWeight={600} color="text.secondary">
                    WCAG 2.2 Compliance:
                  </Typography>
                  <Typography variant="body2" fontWeight={800} color="primary.dark">
                    {report.wcagCompliance !== null && report.wcagCompliance !== undefined
                      ? `${report.wcagCompliance}%`
                      : 'No evaluable'}
                  </Typography>
                </Box>
              </Box>
            </Card>
          </Grid>

          {/* Card 3: Cobertura de Auditoría */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Card
              elevation={0}
              sx={{
                bgcolor: '#ffffff',
                border: '1px solid #bbdefb',
                borderRadius: 2,
                p: 2,
              }}
            >
              <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ letterSpacing: 0.5 }}>
                📊 COBERTURA DE AUDITORÍA (COVERAGE)
              </Typography>
              <Box sx={{ mt: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="body2" fontWeight={600} color="text.secondary">
                    Cobertura Global:
                  </Typography>
                  <Typography variant="body2" fontWeight={800} color="info.main">
                    {report.auditCoverage ?? 0}%
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" fontWeight={600} color="text.secondary">
                    Criterios Evaluados:
                  </Typography>
                  <Typography variant="body2" fontWeight={800} color="text.primary">
                    {report.evaluatedCriteria ?? 0} / {report.totalCriteria ?? 20}
                  </Typography>
                </Box>
              </Box>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* ── SECCIÓN 2: DESGLOSE DE CRITERIOS (PASS / FAIL / NOT_EVALUABLE) ── */}
      {report && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mb: 2.5, alignItems: 'center' }}>
          <Chip
            icon={<CheckCircleOutlineIcon sx={{ color: '#2e7d32 !important' }} />}
            label={`PASS: ${report.passCount ?? 0}`}
            sx={{ bgcolor: '#e8f5e9', color: '#2e7d32', fontWeight: 800, fontSize: 13, px: 1 }}
          />
          <Chip
            icon={<HighlightOffIcon sx={{ color: '#d32f2f !important' }} />}
            label={`FAIL: ${report.failCount ?? 0}`}
            sx={{ bgcolor: '#ffebee', color: '#d32f2f', fontWeight: 800, fontSize: 13, px: 1 }}
          />
          <Chip
            icon={<HelpOutlineIcon sx={{ color: '#757575 !important' }} />}
            label={`NOT_EVALUABLE: ${report.notEvaluableCount ?? 0}`}
            sx={{ bgcolor: '#f5f5f5', color: '#616161', fontWeight: 800, fontSize: 13, px: 1 }}
          />
        </Box>
      )}

      {/* ── SECCIÓN 3: CHIPS DE SEVERIDAD Y TRAZABILIDAD ── */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: metrics ? 3 : 0, alignItems: 'center' }}>
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

        {report && (
          <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto', fontWeight: 600 }}>
            📸 Capturas: {report.screenshotsCount ?? 0} | ⚙️ Evidencias: {report.evidenceCount ?? 0} | 🔄 Iteraciones: {report.iterationsEvaluated ?? 1}
          </Typography>
        )}
      </Box>

      {/* ── SECCIÓN 4: PANEL DE CONSUMO DE TOKENS Y COSTOS ── */}
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
            <Grid size={{ xs: 6, sm: 3 }}>
              <Typography variant="caption" sx={{ color: '#9fa8da', display: 'block' }}>
                Modelo Configurado
              </Typography>
              <Typography variant="body2" fontWeight={700} sx={{ color: '#81d4fa' }}>
                {metrics.modelUsed}
              </Typography>
            </Grid>

            <Grid size={{ xs: 6, sm: 3 }}>
              <Typography variant="caption" sx={{ color: '#9fa8da', display: 'block' }}>
                Llamadas IA (F1 / F2)
              </Typography>
              <Typography variant="body2" fontWeight={700}>
                {metrics.phase1Calls} Nav / {metrics.phase2Calls} Audit
              </Typography>
            </Grid>

            <Grid size={{ xs: 6, sm: 3 }}>
              <Typography variant="caption" sx={{ color: '#9fa8da', display: 'block' }}>
                Tokens (Input / Output)
              </Typography>
              <Typography variant="body2" fontWeight={700}>
                {metrics.promptTokens.toLocaleString()} / {metrics.outputTokens.toLocaleString()}
              </Typography>
            </Grid>

            <Grid size={{ xs: 6, sm: 3 }}>
              <Typography variant="caption" sx={{ color: '#9fa8da', display: 'block' }}>
                Tiempo Total
              </Typography>
              <Typography variant="body2" fontWeight={700}>
                {metrics.totalExecutionTimeMs} ms
              </Typography>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Divider sx={{ my: 1, borderColor: '#31255a' }} />
            </Grid>

            <Grid size={{ xs: 6 }}>
              <Typography variant="caption" sx={{ color: '#9fa8da', display: 'block' }}>
                Costo Estimado Evaluación
              </Typography>
              <Typography variant="h6" fontWeight={800} sx={{ color: '#a5d6a7' }}>
                ${metrics.estimatedCostUsd.toFixed(6)} USD
              </Typography>
            </Grid>

            <Grid size={{ xs: 6 }}>
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
