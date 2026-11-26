// src/components/evaluations/EvaluationSummary.tsx
import { useState } from 'react'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Card,
  Chip,
  Collapse,
  Divider,
  Grid,
  Paper,
  Tooltip,
  Typography,
} from '@mui/material'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import HighlightOffIcon from '@mui/icons-material/HighlightOff'
import HelpOutlineIcon from '@mui/icons-material/HelpOutline'
import SpeedIcon from '@mui/icons-material/Speed'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined'
import type { Finding, FindingSummary, Report } from '@/types/evaluation.types'
import { buildCriteriaCoverageMatrix, parseReportSummary } from '@utils/criteriaCoverage'

interface Props {
  summary: FindingSummary
  title?: string
  url?: string
  report?: Report | null
  /**
   * P7.2 — distingue prototype de website SOLO para ajustar la
   * presentación de `overallScore`/cobertura (nunca para cambiar datos o
   * fórmulas). Omitido (o 'website'): comportamiento 100% idéntico al
   * existente, byte-for-byte.
   */
  evaluationType?: 'website' | 'prototype'
  /**
   * Opcional — cuando se suministra en prototipos cuyo Report histórico
   * persiste `nielsenCompliance: null` / `wcagCompliance: null`, permite
   * mostrar de forma explícita y separada el desglose reconstruido desde
   * `findings[]` sin alterar los valores persistidos del Report.
   */
  findings?: Finding[]
}

// Paleta con contraste verificado WCAG 1.4.3 (>= 4.5:1) sobre sus fondos claros
const SEVERITY_CONFIG = [
  { key: 'critical', label: 'Crítico', color: '#b71c1c', bg: '#ffebee' },
  { key: 'high', label: 'Alto', color: '#bf360c', bg: '#fff3e0' },
  { key: 'medium', label: 'Medio', color: '#7a4f01', bg: '#fff8e1' },
  { key: 'low', label: 'Bajo', color: '#1b5e20', bg: '#e8f5e9' },
  { key: 'info', label: 'Info', color: '#01579b', bg: '#e1f5fe' },
] as const

/**
 * EvaluationSummary — Resumen ejecutivo con métricas determinísticas (Score, Compliance, Cobertura),
 * distinción clara entre estados de criterios y documentos de hallazgos, y panel de tokens.
 */
export default function EvaluationSummary({ summary, title, url, report, evaluationType, findings }: Props) {
  const [showFullSummary, setShowFullSummary] = useState(false)
  const metrics = report?.metrics
  const isPrototype = evaluationType === 'prototype'
  const coverage = report?.coverage
  const parsedSummary = parseReportSummary(report?.summary)
  const reconstructedMatrix =
    isPrototype && Array.isArray(findings) && findings.length > 0
      ? buildCriteriaCoverageMatrix(findings, 'prototype')
      : null
  const hasPersistedPrototypeCompliance =
    (report?.nielsenCompliance !== null && report?.nielsenCompliance !== undefined) ||
    (report?.wcagCompliance !== null && report?.wcagCompliance !== undefined)

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

      {/* ── RESUMEN EJECUTIVO (Prioriza narrativa breve; conserva el informe original íntegro bajo demanda) ── */}
      {parsedSummary && (
        <Box
          sx={{
            mb: 3,
            p: 2,
            bgcolor: '#ffffff',
            border: '1px solid #d1c4e9',
            borderRadius: 2,
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1, mb: 1 }}>
            <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ letterSpacing: 0.5 }}>
              🤖 RESUMEN EJECUTIVO (ANÁLISIS IA)
            </Typography>
            {parsedSummary.hasVerifiedDump && (
              <Chip
                size="small"
                label="Narrativa priorizada · Hallazgos detallados en pestañas"
                sx={{ height: 22, fontSize: 11, fontWeight: 700, bgcolor: '#ede7f6', color: '#4527a0' }}
              />
            )}
          </Box>

          <Typography
            variant="body2"
            color="text.primary"
            sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', lineHeight: 1.6 }}
          >
            {parsedSummary.briefText}
          </Typography>

          {parsedSummary.isTruncated && (
            <Box sx={{ mt: 1.5, pt: 1.25, borderTop: '1px dashed #e0d9f9' }}>
              <Button
                type="button"
                size="small"
                variant="outlined"
                color="primary"
                startIcon={<ArticleOutlinedIcon fontSize="small" />}
                endIcon={showFullSummary ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                onClick={() => setShowFullSummary((prev) => !prev)}
                aria-expanded={showFullSummary}
                sx={{ textTransform: 'none', fontWeight: 700, fontSize: 12 }}
              >
                {showFullSummary
                  ? 'Ocultar informe textual completo original'
                  : `Ver informe textual completo original (${parsedSummary.totalLines.toLocaleString()} líneas)`}
              </Button>

              <Collapse in={showFullSummary} timeout="auto" unmountOnExit>
                <Paper
                  elevation={0}
                  sx={{
                    mt: 1.5,
                    p: 2,
                    bgcolor: '#fafafa',
                    border: '1px solid #e0e0e0',
                    borderRadius: 1.5,
                    maxHeight: 420,
                    overflowY: 'auto',
                  }}
                >
                  <Typography variant="caption" color="text.secondary" fontWeight={700} display="block" sx={{ mb: 1 }}>
                    TEXTO ÍNTEGRO PERSISTIDO EN REPORT.SUMMARY (SIN MODIFICACIONES)
                  </Typography>
                  <Typography
                    variant="caption"
                    component="pre"
                    color="text.primary"
                    sx={{
                      m: 0,
                      fontFamily: 'inherit',
                      whiteSpace: 'pre-wrap',
                      overflowWrap: 'anywhere',
                      lineHeight: 1.5,
                    }}
                  >
                    {parsedSummary.fullText}
                  </Typography>
                </Paper>
              </Collapse>
            </Box>
          )}
        </Box>
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
                {isPrototype
                  ? coverage
                    ? `Calculado sobre ${coverage.evaluatedCriteria} de ${coverage.applicableCriteria} criterios aplicables evaluados`
                    : 'Cobertura no disponible para este reporte'
                  : 'Calculado 100% en backend (Algoritmo Determinístico 3D)'}
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
                {isPrototype && !hasPersistedPrototypeCompliance ? (
                  <>
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.75, lineHeight: 1.35 }}>
                      <strong>Reporte histórico:</strong> no persiste tasa de cumplimiento desagregada por dominio (Nielsen/WCAG) en prototipos.
                    </Typography>
                    {reconstructedMatrix ? (
                      <Box sx={{ pt: 0.75, borderTop: '1px dashed #c8e6c9' }}>
                        <Typography variant="caption" fontWeight={700} color="primary.dark" display="block" sx={{ mb: 0.5 }}>
                          Desglose reconstruido (desde hallazgos):
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.25 }}>
                          <Typography variant="body2" fontWeight={600} color="text.secondary">
                            Nielsen ({reconstructedMatrix.nielsenSummary.passCount}/{reconstructedMatrix.nielsenSummary.evaluatedCount} PASS):
                          </Typography>
                          <Typography variant="body2" fontWeight={800} color="success.dark">
                            {reconstructedMatrix.nielsenSummary.compliance !== null
                              ? `${reconstructedMatrix.nielsenSummary.compliance}%`
                              : 'Sin criterios evaluados'}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" fontWeight={600} color="text.secondary">
                            WCAG 2.2 ({reconstructedMatrix.wcagSummary.passCount}/{reconstructedMatrix.wcagSummary.evaluatedCount} PASS):
                          </Typography>
                          <Typography variant="body2" fontWeight={800} color="primary.dark">
                            {reconstructedMatrix.wcagSummary.compliance !== null
                              ? `${reconstructedMatrix.wcagSummary.compliance}%`
                              : 'Sin criterios evaluados'}
                          </Typography>
                        </Box>
                      </Box>
                    ) : (
                      <Typography variant="caption" color="text.secondary" display="block">
                        Consulte la matriz de criterios para revisar el desglose reconstruido por dominio.
                      </Typography>
                    )}
                  </>
                ) : (
                  <>
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
                    {(report.nielsenCoverage !== undefined || report.wcagCoverage !== undefined) && (
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                        Cobertura por dominio: Nielsen {report.nielsenCoverage ?? 0}% · WCAG {report.wcagCoverage ?? 0}%
                      </Typography>
                    )}
                  </>
                )}
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
              {isPrototype ? (
                coverage ? (
                  <Box sx={{ mt: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2" fontWeight={600} color="text.secondary">
                        Criterios evaluados:
                      </Typography>
                      <Typography variant="body2" fontWeight={800} color="info.main">
                        {coverage.evaluatedCriteria} / {coverage.applicableCriteria}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2" fontWeight={600} color="text.secondary">
                        Criterios no evaluables:
                      </Typography>
                      <Typography variant="body2" fontWeight={800} color="text.secondary">
                        {coverage.notEvaluableCriteria}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" fontWeight={600} color="text.secondary">
                        Fuera del alcance visual:
                      </Typography>
                      <Typography variant="body2" fontWeight={800} color="text.primary">
                        {coverage.outOfCoverageCriteria}
                      </Typography>
                    </Box>
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    No disponible para este reporte
                  </Typography>
                )
              ) : (
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
              )}
            </Card>
          </Grid>
        </Grid>
      )}

      {/* ── SECCIÓN 2: DESGLOSE DE CRITERIOS (PASS / FAIL / NOT_EVALUABLE) ── */}
      {report && (
        <Box sx={{ mb: 2.5 }}>
          <Typography
            variant="caption"
            color="text.secondary"
            fontWeight={700}
            display="block"
            sx={{ mb: 0.75, letterSpacing: 0.3 }}
          >
            {isPrototype
              ? 'CONTEOS REGISTRADOS EN EL REPORTE (CRITERIOS EVALUADOS Y OBSERVACIONES NO EVALUABLES):'
              : 'BALANCE A NIVEL DE CRITERIOS DEL CATÁLOGO (20 CRITERIOS: 10 NIELSEN + 10 WCAG):'}
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, alignItems: 'center' }}>
            <Tooltip title="Criterios aplicables con resultado final conforme (PASS)" arrow>
              <Chip
                icon={<CheckCircleOutlineIcon sx={{ color: '#2e7d32 !important' }} />}
                label={`PASS: ${report.passCount ?? 0}`}
                sx={{ bgcolor: '#e8f5e9', color: '#2e7d32', fontWeight: 800, fontSize: 13, px: 1 }}
              />
            </Tooltip>
            <Tooltip title="Criterios aplicables con al menos un incumplimiento detectado (FAIL)" arrow>
              <Chip
                icon={<HighlightOffIcon sx={{ color: '#d32f2f !important' }} />}
                label={`FAIL: ${report.failCount ?? 0}`}
                sx={{ bgcolor: '#ffebee', color: '#d32f2f', fontWeight: 800, fontSize: 13, px: 1 }}
              />
            </Tooltip>
            <Tooltip
              title={
                isPrototype
                  ? 'Observaciones individuales emitidas con estado NOT_EVALUABLE (el total de criterios no evaluables de los 13 aplicables se indica en la tarjeta de Cobertura)'
                  : 'Criterios del catálogo de 20 sin hallazgos concluyentes o con observaciones no evaluables'
              }
              arrow
            >
              <Chip
                icon={<HelpOutlineIcon sx={{ color: '#424242 !important' }} />}
                label={`NOT_EVALUABLE: ${report.notEvaluableCount ?? 0}`}
                sx={{ bgcolor: '#f5f5f5', color: '#424242', fontWeight: 800, fontSize: 13, px: 1 }}
              />
            </Tooltip>
          </Box>
        </Box>
      )}

      {/* ── SECCIÓN 3: CHIPS DE SEVERIDAD (SOLO HALLAZGOS FAIL) Y TRAZABILIDAD ── */}
      <Box sx={{ mb: metrics ? 2.5 : 0 }}>
        {summary.total > 0 && (
          <Typography
            variant="caption"
            color="text.secondary"
            fontWeight={700}
            display="block"
            sx={{ mb: 0.75, letterSpacing: 0.3 }}
          >
            DISTRIBUCIÓN DE HALLAZGOS INDIVIDUALES DE INCUMPLIMIENTO (DOCUMENTOS FINDING CON ESTADO FAIL: {summary.total}):
          </Typography>
        )}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
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
      </Box>

      {/* ── SECCIÓN 4: PANEL DE CONSUMO DE TOKENS Y COSTOS (Colapsable para divulgación progresiva) ── */}
      {metrics && (
        <Accordion
          defaultExpanded={false}
          elevation={0}
          disableGutters
          sx={{
            bgcolor: '#1a103c',
            color: '#ffffff',
            borderRadius: '8px !important',
            border: '1px solid #4a3e75',
            '&:before': { display: 'none' },
          }}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon sx={{ color: '#b39ddb' }} />}
            sx={{ px: 2.5, py: 0.5 }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', pr: 1, flexWrap: 'wrap', gap: 1 }}>
              <Typography variant="subtitle2" fontWeight={800} sx={{ color: '#b39ddb', letterSpacing: 0.5 }}>
                📊 PANEL DE CONSUMO Y COSTOS EN TIEMPO REAL
              </Typography>
              <Typography variant="caption" sx={{ color: '#a5d6a7', fontWeight: 700 }}>
                Modelo: {metrics.modelUsed} · Tokens: {metrics.totalTokens.toLocaleString()} · Costo eval.: ${metrics.estimatedCostUsd.toFixed(6)} USD
              </Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails sx={{ px: 2.5, pb: 2.5, pt: 1 }}>
            <Paper
              elevation={0}
              sx={{
                bgcolor: 'transparent',
                color: '#ffffff',
              }}
            >
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

                {metrics.thinkingTokens !== undefined && metrics.thinkingTokens > 0 && (
                  <Grid size={{ xs: 12 }}>
                    <Typography variant="caption" sx={{ color: '#9fa8da', display: 'block' }}>
                      Tokens de Razonamiento Interno (Thinking):{' '}
                      <strong style={{ color: '#ffffff' }}>{metrics.thinkingTokens.toLocaleString()}</strong>
                      {' '}— Procesamiento interno reportado por la API (no equivale a un registro individual por criterio).
                    </Typography>
                  </Grid>
                )}

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
                    Costo Acumulado Backend (Sesión en memoria)
                  </Typography>
                  <Typography variant="h6" fontWeight={800} sx={{ color: '#ffe082' }}>
                    ${metrics.cumulativeCostUsd.toFixed(6)} USD
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
          </AccordionDetails>
        </Accordion>
      )}
    </Box>
  )
}
