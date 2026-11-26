// src/components/evaluations/FindingsAccordion.tsx
import React, { useEffect, useMemo, useState } from 'react'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Chip,
  Collapse,
  Divider,
  Link as MuiLink,
  Pagination,
  Paper,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import ImageIcon from '@mui/icons-material/Image'
import CodeIcon from '@mui/icons-material/Code'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import HighlightOffIcon from '@mui/icons-material/HighlightOff'
import HelpOutlineIcon from '@mui/icons-material/HelpOutline'
import SmartToyIcon from '@mui/icons-material/SmartToy'
import SettingsSuggestIcon from '@mui/icons-material/SettingsSuggest'
import FilterAltOffIcon from '@mui/icons-material/FilterAltOff'
import CompareArrowsIcon from '@mui/icons-material/CompareArrows'
import LinkIcon from '@mui/icons-material/Link'
import ViewAgendaOutlinedIcon from '@mui/icons-material/ViewAgendaOutlined'
import ViewListOutlinedIcon from '@mui/icons-material/ViewListOutlined'
import LayersOutlinedIcon from '@mui/icons-material/LayersOutlined'
import type {
  EvaluationType,
  Finding,
  FindingConfidence,
  FindingSeverity,
  FindingStatus,
} from '@/types/evaluation.types'
import {
  findingMatchesCriterion,
  formatVisualRegionLabel,
  hasDualDomainCodes,
  isCrossDomainHeadingFinding,
  resolveFindingOrigin,
  type ResolvedFindingOrigin,
} from '@utils/criteriaCoverage'
import {
  buildFindingCriterionLabels,
  groupFindingsForPresentation,
  sortFindingsDeterministically,
  type PresentationFindingGroup,
} from '@utils/findingGrouping'

interface Props {
  findings: Finding[]
  evaluationType?: EvaluationType
  selectedCriterion?: string | null
  onClearCriterion?: () => void
  /** Filtro inicial de estado; por defecto 'FAIL' para priorizar incumplimientos. */
  initialStatusFilter?: 'FAIL' | 'NOT_EVALUABLE' | 'PASS' | 'ALL'
}

const GROUPS_PAGE_SIZE = 20
const INDIVIDUAL_PAGE_SIZE = 20
const INSTANCES_PAGE_SIZE = 10

// Paleta con contraste verificado WCAG 1.4.3 (>= 4.5:1)
const SEVERITY_CONFIG: Record<
  FindingSeverity,
  { label: string; color: string; bg: string }
> = {
  critical: { label: 'Crítico', color: '#c62828', bg: '#ffebee' },
  high:     { label: 'Alto', color: '#bf360c', bg: '#fff3e0' },
  medium:   { label: 'Medio', color: '#8d5500', bg: '#fff8e1' },
  low:      { label: 'Bajo', color: '#2e7d32', bg: '#e8f5e9' },
  info:     { label: 'Info', color: '#0277bd', bg: '#e1f5fe' },
}

const CONFIDENCE_CONFIG: Record<
  FindingConfidence,
  { label: string; color: string; bg: string }
> = {
  high:   { label: 'Confianza del sistema: Alta', color: '#1b5e20', bg: '#e8f5e9' },
  medium: { label: 'Confianza del sistema: Media', color: '#bf360c', bg: '#fff3e0' },
  low:    { label: 'Confianza del sistema: Baja', color: '#424242', bg: '#f5f5f5' },
}

const ORIGIN_CONFIG: Record<
  ResolvedFindingOrigin,
  { label: string; color: string; bg: string; tooltip: string }
> = {
  deterministic: {
    label: 'Regla determinística',
    color: '#01579b',
    bg: '#e1f5fe',
    tooltip: 'Hallazgo respaldado por una firma verificable del analizador determinístico sobre el DOM o estilos computados.',
  },
  ai: {
    label: 'Análisis IA',
    color: '#4a148c',
    bg: '#f3e5f5',
    tooltip: 'Observación emitida por el análisis asistido por IA (Gemini) sobre el contexto evaluado.',
  },
  unknown: {
    label: 'Origen no especificado',
    color: '#37474f',
    bg: '#eceff1',
    tooltip: 'El registro histórico no persiste el origen explícito y sus metadatos no permiten atribuirlo con certeza a una regla programática ni a Gemini.',
  },
}

const STATUS_CONFIG: Record<
  FindingStatus,
  { label: string; color: string; bg: string; icon: React.ReactElement }
> = {
  PASS: {
    label: 'PASS',
    color: '#1b5e20',
    bg: '#e8f5e9',
    icon: <CheckCircleOutlineIcon fontSize="small" sx={{ color: '#1b5e20' }} />,
  },
  FAIL: {
    label: 'FAIL',
    color: '#c62828',
    bg: '#ffebee',
    icon: <HighlightOffIcon fontSize="small" sx={{ color: '#c62828' }} />,
  },
  NOT_EVALUABLE: {
    label: 'NOT_EVALUABLE',
    color: '#424242',
    bg: '#f5f5f5',
    icon: <HelpOutlineIcon fontSize="small" sx={{ color: '#424242' }} />,
  },
}

const GROUP_LABELS: Record<string, string> = {
  accessibility: 'Accesibilidad',
  ux: 'UX',
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

function resolveScreenshotUrl(screenshotUrl?: string): string | null {
  if (!screenshotUrl) return null
  return screenshotUrl.startsWith('http') ? screenshotUrl : `${API_BASE_URL}${screenshotUrl}`
}

function OriginChip({ origin }: { origin: ResolvedFindingOrigin }) {
  const originCfg = ORIGIN_CONFIG[origin]
  return (
    <Tooltip title={originCfg.tooltip} arrow>
      <Chip
        icon={
          origin === 'deterministic' ? (
            <SettingsSuggestIcon sx={{ fontSize: '14px !important', color: '#01579b !important' }} />
          ) : origin === 'ai' ? (
            <SmartToyIcon sx={{ fontSize: '14px !important', color: '#4a148c !important' }} />
          ) : (
            <HelpOutlineIcon sx={{ fontSize: '14px !important', color: '#37474f !important' }} />
          )
        }
        label={originCfg.label}
        size="small"
        sx={{
          bgcolor: originCfg.bg,
          color: originCfg.color,
          fontWeight: 700,
          fontSize: 11,
        }}
      />
    </Tooltip>
  )
}

function TechnicalEvidenceList({ evidence }: { evidence?: Finding['evidence'] }) {
  const hasEvidence = Array.isArray(evidence) && evidence.length > 0
  return (
    <Paper elevation={0} sx={{ p: 1.5, mt: 1, bgcolor: '#f8f9fa', border: '1px solid #e0e0e0', borderRadius: 1.5 }}>
      {hasEvidence ? (
        evidence!.map((item, idxEv) => {
          const propName = item.property ?? item.attribute
          return (
            <Box key={idxEv} sx={{ mb: 1, '&:last-child': { mb: 0 }, overflowWrap: 'anywhere', wordBreak: 'break-word' }}>
              <Typography variant="caption" fontWeight={700} color="primary">
                [{item.type}]
              </Typography>
              {item.selector && (
                <Typography variant="caption" color="text.secondary" sx={{ ml: 1, fontFamily: 'monospace', overflowWrap: 'anywhere' }}>
                  Selector: {item.selector}
                </Typography>
              )}
              {item.elementDescription && (
                <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                  Elemento: {item.elementDescription}
                </Typography>
              )}
              {item.region && (
                <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                  Región: {item.region}
                </Typography>
              )}
              {propName && (
                <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                  Property: {propName}
                </Typography>
              )}
              {item.value !== undefined && (
                <Typography variant="caption" fontWeight={600} sx={{ ml: 1, color: '#333' }}>
                  Value: {item.value}
                </Typography>
              )}
              {item.measurement && (
                <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                  ({item.measurement})
                </Typography>
              )}
              {item.relatedValue && (item.relatedValue.property || item.relatedValue.value) && (
                <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                  [{item.relatedValue.property}: {item.relatedValue.value}]
                </Typography>
              )}
              {item.context && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', ml: 1, mt: 0.25, fontStyle: 'italic' }}>
                  {item.context}
                </Typography>
              )}
            </Box>
          )
        })
      ) : (
        <Typography variant="caption" color="text.secondary">
          No hay evidencia técnica disponible.
        </Typography>
      )}
    </Paper>
  )
}

/**
 * Tarjeta individual de un solo documento Finding (usada en vista individual y
 * para grupos de 1 sola instancia sin envoltorios innecesarios).
 */
function IndividualFindingCard({
  finding,
  findingId,
  evaluationType,
}: {
  finding: Finding
  findingId: string
  evaluationType: EvaluationType
}) {
  const [evidenceOpen, setEvidenceOpen] = useState(false)
  const sev = SEVERITY_CONFIG[finding.severity] || SEVERITY_CONFIG.info
  const st = STATUS_CONFIG[finding.status] || STATUS_CONFIG.FAIL
  const conf = CONFIDENCE_CONFIG[finding.confidence] || CONFIDENCE_CONFIG.high
  const hasEvidence = Array.isArray(finding.evidence) && finding.evidence.length > 0
  const origin = resolveFindingOrigin(finding, evaluationType)
  const { primaryLabel, secondaryHeuristicLabel } = buildFindingCriterionLabels(finding)
  const isCrossDomainH1 = isCrossDomainHeadingFinding(finding)
  const isDualDomain = hasDualDomainCodes(finding)
  const fullScreenshotUrl = resolveScreenshotUrl(finding.screenshotUrl)

  return (
    <Accordion
      elevation={0}
      disableGutters
      sx={{
        border: `1px solid ${st.color}33`,
        borderRadius: '8px !important',
        '&:before': { display: 'none' },
        overflow: 'hidden',
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        sx={{ bgcolor: st.bg, px: 2, py: 1, '& .MuiAccordionSummary-content': { my: 0.5, minWidth: 0 } }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, width: '100%', minWidth: 0 }}>
          {/* Fila 1: Badges esenciales limpios (Estado, Severidad, Origen, Iteración) */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
            <Chip
              icon={st.icon}
              label={st.label}
              size="small"
              sx={{
                bgcolor: '#ffffff',
                color: st.color,
                fontWeight: 800,
                fontSize: 11,
                border: `1px solid ${st.color}`,
              }}
            />
            <Chip
              label={sev.label}
              size="small"
              sx={{ bgcolor: sev.color, color: '#fff', fontWeight: 700, fontSize: 11, minWidth: 55 }}
            />
            <OriginChip origin={origin} />
            {evaluationType === 'website' && (
              <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ ml: 0.25 }}>
                Paso {finding.iteration || 1}
              </Typography>
            )}
          </Box>

          {/* Fila 2: Criterio principal + doble código cuando exista */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', minWidth: 0 }}>
            <Typography variant="body2" fontWeight={700} color="text.primary" sx={{ overflowWrap: 'anywhere', lineHeight: 1.35 }}>
              {primaryLabel}
            </Typography>
            {secondaryHeuristicLabel && (
              <Chip
                icon={<LinkIcon sx={{ fontSize: '13px !important' }} />}
                label={secondaryHeuristicLabel}
                size="small"
                sx={{
                  bgcolor: '#ede7f6',
                  color: '#4527a0',
                  border: '1px solid #b39ddb',
                  fontWeight: 700,
                  fontSize: 11,
                  maxWidth: '100%',
                  '& .MuiChip-label': { overflow: 'hidden', textOverflow: 'ellipsis' },
                }}
              />
            )}
          </Box>
        </Box>
      </AccordionSummary>

      <AccordionDetails sx={{ px: 2, py: 2, bgcolor: '#ffffff' }}>
        {/* Metadatos secundarios compactos dentro del detalle (sin saturar la cabecera) */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 1.5 }}>
          <Chip
            label={GROUP_LABELS[finding.findingGroup] ?? finding.findingGroup}
            size="small"
            variant="outlined"
            sx={{ borderColor: sev.color, color: sev.color, fontSize: 11, fontWeight: 700, height: 22 }}
          />
          <Tooltip
            title="Nivel de confianza interna asignado por el motor de evaluación (no equivale a una probabilidad estadística ni a validación humana)."
            arrow
          >
            <Chip
              label={conf.label}
              size="small"
              sx={{ bgcolor: conf.bg, color: conf.color, fontWeight: 600, fontSize: 11, height: 22 }}
            />
          </Tooltip>
          <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace', ml: 'auto' }}>
            ID: {finding._id || finding.id}
          </Typography>
        </Box>

        {/* Aviso transversal */}
        {isCrossDomainH1 ? (
          <Alert severity="info" variant="outlined" sx={{ mb: 1.5, py: 0.25 }}>
            <Typography variant="caption" color="text.primary">
              <strong>Hallazgo transversal:</strong> Esta comprobación determinística (ausencia de <code>&lt;h1&gt;</code>) impacta simultáneamente el
              criterio <strong>{finding.wcagCriterion}</strong> y la heurística{' '}
              <strong>
                {finding.heuristicCode} ({finding.heuristicName || 'Consistencia y estándares'})
              </strong>
              .
            </Typography>
          </Alert>
        ) : isDualDomain ? (
          <Alert severity="info" variant="outlined" sx={{ mb: 1.5, py: 0.25 }}>
            <Typography variant="caption" color="text.primary">
              <strong>Hallazgo con doble clasificación:</strong> Este registro referencia simultáneamente el
              criterio <strong>{finding.wcagCriterion}</strong> y la heurística{' '}
              <strong>
                {finding.heuristicCode} ({finding.heuristicName || 'Heurística de Nielsen'})
              </strong>
              .
            </Typography>
          </Alert>
        ) : null}

        {/* Descripción */}
        <Typography variant="body2" color="text.primary" sx={{ mb: 1.5, lineHeight: 1.6, overflowWrap: 'anywhere' }}>
          {finding.description}
        </Typography>

        {/* Impacto */}
        {finding.impact && (
          <Box sx={{ mb: 1.5, p: 1.25, bgcolor: '#fff8e1', borderRadius: 1.5, borderLeft: '4px solid #8d5500' }}>
            <Typography variant="caption" fontWeight={800} color="#7a4f01" display="block" gutterBottom>
              IMPACTO ESTIMADO EN LA EXPERIENCIA / ACCESIBILIDAD
            </Typography>
            <Typography variant="body2" color="text.primary">
              {finding.impact}
            </Typography>
          </Box>
        )}

        {/* Elemento afectado (WEB) */}
        {finding.affectedElement?.selector && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5, flexWrap: 'wrap', minWidth: 0 }}>
            <CodeIcon fontSize="small" color="action" sx={{ flexShrink: 0 }} />
            <Typography
              variant="caption"
              sx={{
                fontFamily: 'monospace',
                bgcolor: '#f5f5f5',
                p: 0.5,
                borderRadius: 1,
                overflowWrap: 'anywhere',
                wordBreak: 'break-word',
                maxWidth: '100%',
              }}
            >
              Elemento: {finding.affectedElement.selector} {finding.affectedElement.tag ? `<${finding.affectedElement.tag}>` : ''}
            </Typography>
            {finding.affectedElement.role && (
              <Typography variant="caption" sx={{ fontFamily: 'monospace', bgcolor: '#eef2f6', p: 0.5, borderRadius: 1, overflowWrap: 'anywhere' }}>
                role="{finding.affectedElement.role}"
              </Typography>
            )}
            {finding.affectedElement.ariaLabel && (
              <Typography variant="caption" sx={{ fontFamily: 'monospace', bgcolor: '#eef2f6', p: 0.5, borderRadius: 1, overflowWrap: 'anywhere' }}>
                aria-label="{finding.affectedElement.ariaLabel}"
              </Typography>
            )}
            {finding.affectedElement.text && (
              <Typography variant="caption" color="text.secondary" sx={{ bgcolor: '#fafafa', p: 0.5, borderRadius: 1, overflowWrap: 'anywhere' }}>
                Texto: "{finding.affectedElement.text.slice(0, 80)}"
              </Typography>
            )}
          </Box>
        )}

        {/* Elemento afectado (PROTOTYPE) */}
        {finding.affectedElement?.visualReference &&
          (finding.affectedElement.visualReference.description || finding.affectedElement.visualReference.region) && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5, flexWrap: 'wrap', minWidth: 0 }}>
              <CodeIcon fontSize="small" color="action" sx={{ flexShrink: 0 }} />
              <Typography
                variant="caption"
                sx={{
                  fontFamily: 'monospace',
                  bgcolor: '#f5f5f5',
                  p: 0.5,
                  borderRadius: 1,
                  overflowWrap: 'anywhere',
                  wordBreak: 'break-word',
                  maxWidth: '100%',
                }}
              >
                Elemento: {finding.affectedElement.visualReference.description || 'sin descripción'}
                {finding.affectedElement.visualReference.region
                  ? ` · región: ${finding.affectedElement.visualReference.region} (${formatVisualRegionLabel(finding.affectedElement.visualReference.region)})`
                  : ''}
              </Typography>
            </Box>
          )}

        {/* Recomendación accionable */}
        {finding.recommendation && (
          <Box sx={{ mt: 1.5, p: 1.5, bgcolor: '#e8f5e9', borderRadius: 1.5, borderLeft: '4px solid #1b5e20' }}>
            <Typography variant="caption" fontWeight={800} color="#1b5e20" display="block" gutterBottom>
              💡 RECOMENDACIÓN ACCIONABLE
            </Typography>
            <Typography variant="body2" color="#1b5e20">
              {finding.recommendation}
            </Typography>
          </Box>
        )}

        {/* Discrepancia */}
        {finding.discrepancy && (
          <Box sx={{ mt: 1.5, p: 1.5, bgcolor: '#f3e5f5', borderRadius: 1.5, border: '1px solid #ce93d8' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.5 }}>
              <CompareArrowsIcon fontSize="small" sx={{ color: '#6a1b9a' }} />
              <Typography variant="caption" fontWeight={800} color="#6a1b9a">
                DISCREPANCIA REGISTRADA ENTRE MECANISMOS DE EVALUACIÓN
              </Typography>
            </Box>
            <Typography variant="caption" color="text.primary" display="block">
              Para este mismo elemento y criterio, el mecanismo alternativo (
              <strong>{finding.discrepancy.origin === 'ai' ? 'Análisis IA (Gemini)' : 'Regla determinística'}</strong>)
              emitió el estado <strong>{finding.discrepancy.status}</strong> (severidad:{' '}
              <code>{finding.discrepancy.severity}</code>, confianza del sistema:{' '}
              <code>{finding.discrepancy.confidence}</code>):
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5, fontStyle: 'italic' }}>
              «{finding.discrepancy.description}»
            </Typography>
          </Box>
        )}

        {/* Evidencia Técnica */}
        <Box sx={{ mt: 2 }}>
          <Button
            type="button"
            size="small"
            variant="text"
            color="primary"
            onClick={() => setEvidenceOpen((prev) => !prev)}
            aria-expanded={evidenceOpen}
            aria-controls={`evidence-panel-${findingId}`}
            endIcon={evidenceOpen ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
            sx={{ textTransform: 'none', fontWeight: 700, fontSize: 12, px: 0.5, minHeight: 28 }}
          >
            {evidenceOpen ? 'Ocultar Evidencia Técnica' : 'Ver Evidencia Técnica'} ({hasEvidence ? finding.evidence!.length : 0})
          </Button>
          <Collapse in={evidenceOpen} id={`evidence-panel-${findingId}`}>
            <TechnicalEvidenceList evidence={finding.evidence} />
          </Collapse>
        </Box>

        {/* Captura asociada */}
        {fullScreenshotUrl && (
          <Box sx={{ mt: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ImageIcon color="primary" fontSize="small" />
              <MuiLink
                href={fullScreenshotUrl}
                target="_blank"
                rel="noopener noreferrer"
                variant="caption"
                fontWeight={700}
                underline="hover"
              >
                {origin === 'deterministic'
                  ? `Ver captura de pantalla (Iteración ${finding.iteration})`
                  : origin === 'ai'
                    ? `Ver captura contextual del recorrido (Iteración ${finding.iteration} — Vista inicial)`
                    : `Ver captura asociada (Iteración ${finding.iteration})`}
              </MuiLink>
            </Box>
            {origin === 'ai' && evaluationType === 'website' && (
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.25, fontStyle: 'italic' }}>
                Nota: Los hallazgos generados por Gemini en sitios web sintetizan la evidencia acumulada del recorrido y
                referencian la captura inicial como contexto general, no como prueba de un instante único.
              </Typography>
            )}
          </Box>
        )}
      </AccordionDetails>
    </Accordion>
  )
}

/**
 * Tarjeta agrupada para patrones con > 1 instancia determinística.
 * Muestra la descripción compartida, impacto/recomendación equivalentes,
 * resumen de evidencias comunes y el listado paginado de instancias individuales
 * recuperables al 100 %.
 */
function GroupedFindingCard({
  group,
  evaluationType,
}: {
  group: PresentationFindingGroup
  evaluationType: EvaluationType
}) {
  const [instancesPage, setInstancesPage] = useState(1)
  const [expandedInstanceId, setExpandedInstanceId] = useState<string | null>(null)

  const sev = SEVERITY_CONFIG[group.severity] || SEVERITY_CONFIG.info
  const st = STATUS_CONFIG[group.status] || STATUS_CONFIG.FAIL

  const totalInstancePages = Math.max(1, Math.ceil(group.findings.length / INSTANCES_PAGE_SIZE))
  const safePage = Math.min(instancesPage, totalInstancePages)
  const pageStart = (safePage - 1) * INSTANCES_PAGE_SIZE
  const visibleInstances = group.findings.slice(pageStart, pageStart + INSTANCES_PAGE_SIZE)

  const iterationSummaryText =
    group.iterationBreakdown.length > 0
      ? group.iterationBreakdown.map((it) => `Paso ${it.iteration}: ${it.count}`).join(' · ')
      : null

  return (
    <Accordion
      elevation={0}
      disableGutters
      TransitionProps={{ unmountOnExit: true }}
      sx={{
        border: `1px solid ${st.color}44`,
        borderRadius: '8px !important',
        '&:before': { display: 'none' },
        overflow: 'hidden',
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        sx={{ bgcolor: st.bg, px: 2, py: 1.25, '& .MuiAccordionSummary-content': { my: 0.5, minWidth: 0 } }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, width: '100%', minWidth: 0 }}>
          {/* Fila 1: Estado, severidad, conteo de instancias, origen y distribución por iteración */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
            <Chip
              icon={st.icon}
              label={st.label}
              size="small"
              sx={{
                bgcolor: '#ffffff',
                color: st.color,
                fontWeight: 800,
                fontSize: 11,
                border: `1px solid ${st.color}`,
              }}
            />
            <Chip
              label={sev.label}
              size="small"
              sx={{ bgcolor: sev.color, color: '#fff', fontWeight: 700, fontSize: 11, minWidth: 55 }}
            />
            <Chip
              icon={<LayersOutlinedIcon sx={{ fontSize: '14px !important', color: '#4527a0 !important' }} />}
              label={`${group.count} instancias`}
              size="small"
              sx={{ bgcolor: '#ede7f6', color: '#4527a0', fontWeight: 800, fontSize: 11, border: '1px solid #b39ddb' }}
            />
            <OriginChip origin={group.origin} />
            {iterationSummaryText && evaluationType === 'website' && (
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                {iterationSummaryText}
              </Typography>
            )}
          </Box>

          {/* Fila 2: Criterio + descripción general del patrón */}
          <Box sx={{ minWidth: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <Typography variant="body2" fontWeight={800} color="text.primary" sx={{ overflowWrap: 'anywhere' }}>
                {group.primaryCriterionLabel}
              </Typography>
              {group.secondaryHeuristicLabel && (
                <Chip
                  icon={<LinkIcon sx={{ fontSize: '13px !important' }} />}
                  label={group.secondaryHeuristicLabel}
                  size="small"
                  sx={{ bgcolor: '#ede7f6', color: '#4527a0', fontWeight: 700, fontSize: 11 }}
                />
              )}
            </Box>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mt: 0.25, lineHeight: 1.4, overflowWrap: 'anywhere' }}
            >
              {group.patternSummary}
            </Typography>
          </Box>
        </Box>
      </AccordionSummary>

      <AccordionDetails sx={{ px: 2, py: 2, bgcolor: '#ffffff' }}>
        {/* Descripción compartida + metadatos del patrón */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="caption" fontWeight={800} color="primary.dark" display="block" gutterBottom>
            PATRÓN COMPARTIDO ({group.count} HALLAZGOS ORIGINALES)
          </Typography>
          <Typography variant="body2" color="text.primary" sx={{ lineHeight: 1.6, overflowWrap: 'anywhere' }}>
            {group.patternSummary}
          </Typography>
        </Box>

        {/* Impacto compartido (una sola vez cuando es equivalente) */}
        {group.sharedImpact && (
          <Box sx={{ mb: 1.5, p: 1.25, bgcolor: '#fff8e1', borderRadius: 1.5, borderLeft: '4px solid #8d5500' }}>
            <Typography variant="caption" fontWeight={800} color="#7a4f01" display="block" gutterBottom>
              IMPACTO ESTIMADO EN LA EXPERIENCIA / ACCESIBILIDAD
            </Typography>
            <Typography variant="body2" color="text.primary">
              {group.sharedImpact}
            </Typography>
          </Box>
        )}

        {/* Recomendación compartida (una sola vez cuando es equivalente) */}
        {group.sharedRecommendation && (
          <Box sx={{ mb: 1.5, p: 1.5, bgcolor: '#e8f5e9', borderRadius: 1.5, borderLeft: '4px solid #1b5e20' }}>
            <Typography variant="caption" fontWeight={800} color="#1b5e20" display="block" gutterBottom>
              💡 RECOMENDACIÓN ACCIONABLE GENERAL
            </Typography>
            <Typography variant="body2" color="#1b5e20">
              {group.sharedRecommendation}
            </Typography>
          </Box>
        )}

        {/* Resumen de evidencias comunes */}
        {group.commonEvidenceSummary.length > 0 && (
          <Paper elevation={0} sx={{ p: 1.5, mb: 2, bgcolor: '#f8f6ff', border: '1px solid #e0d9f9', borderRadius: 1.5 }}>
            <Typography variant="caption" fontWeight={800} color="primary.dark" display="block" gutterBottom>
              RESUMEN DE EVIDENCIAS COMUNES
            </Typography>
            <Box component="ul" sx={{ m: 0, pl: 2.25 }}>
              {group.commonEvidenceSummary.map((line, i) => (
                <Typography
                  component="li"
                  key={i}
                  variant="caption"
                  color="text.primary"
                  sx={{ mb: 0.35, lineHeight: 1.45, overflowWrap: 'anywhere' }}
                >
                  {line}
                </Typography>
              ))}
            </Box>
          </Paper>
        )}

        <Divider sx={{ my: 2 }} />

        {/* Listado paginado de instancias individuales */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1, mb: 1.25 }}>
          <Typography variant="caption" fontWeight={800} color="text.primary">
            INSTANCIAS INDIVIDUALES ({pageStart + 1}–{Math.min(pageStart + INSTANCES_PAGE_SIZE, group.count)} de {group.count})
          </Typography>
          {totalInstancePages > 1 && (
            <Pagination
              count={totalInstancePages}
              page={safePage}
              onChange={(_e, nextPage) => {
                setInstancesPage(nextPage)
                setExpandedInstanceId(null)
              }}
              size="small"
              color="primary"
              aria-label={`Paginación de instancias de ${group.primaryCriterionLabel}`}
            />
          )}
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {visibleInstances.map((instance, idxInst) => {
            const instId = instance._id || instance.id || `${group.groupKey}-${pageStart + idxInst}`
            const isOpen = expandedInstanceId === instId
            const screenshotUrl = resolveScreenshotUrl(instance.screenshotUrl)
            const selectorLabel =
              instance.affectedElement?.selector ||
              instance.affectedElement?.visualReference?.description ||
              'Sin selector específico'
            const hrefVal =
              instance.affectedElement?.href ||
              instance.evidence?.find((e) => e.property === 'href')?.value

            return (
              <Paper
                key={instId}
                elevation={0}
                sx={{
                  p: 1.25,
                  border: '1px solid #e0e0e0',
                  borderRadius: 1.5,
                  bgcolor: isOpen ? '#faf8ff' : '#ffffff',
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    flexWrap: 'wrap',
                    gap: 1,
                  }}
                >
                  <Box sx={{ minWidth: 0, flex: '1 1 260px' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap', mb: 0.35 }}>
                      <Chip
                        label={`Paso ${instance.iteration || 1}`}
                        size="small"
                        variant="outlined"
                        sx={{ height: 20, fontSize: 10, fontWeight: 700 }}
                      />
                      <Typography
                        variant="caption"
                        sx={{
                          fontFamily: 'monospace',
                          fontWeight: 700,
                          color: 'text.primary',
                          overflowWrap: 'anywhere',
                          wordBreak: 'break-word',
                        }}
                      >
                        {selectorLabel}
                        {instance.affectedElement?.tag ? ` <${instance.affectedElement.tag}>` : ''}
                      </Typography>
                    </Box>

                    {instance.affectedElement?.text && (
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ overflowWrap: 'anywhere' }}>
                        Texto: "{instance.affectedElement.text.slice(0, 80)}"
                      </Typography>
                    )}

                    {hrefVal && (
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ fontFamily: 'monospace', overflowWrap: 'anywhere' }}>
                        href: {hrefVal}
                      </Typography>
                    )}
                  </Box>

                  <Button
                    type="button"
                    size="small"
                    variant="text"
                    color="primary"
                    onClick={() => setExpandedInstanceId((prev) => (prev === instId ? null : instId))}
                    aria-expanded={isOpen}
                    aria-controls={`instance-detail-${instId}`}
                    endIcon={isOpen ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                    sx={{ textTransform: 'none', fontWeight: 700, fontSize: 11, flexShrink: 0 }}
                  >
                    {isOpen ? 'Ocultar detalle técnico' : 'Ver detalle técnico'}
                  </Button>
                </Box>

                <Collapse in={isOpen} timeout="auto" unmountOnExit id={`instance-detail-${instId}`}>
                  <Box sx={{ mt: 1.25, pt: 1.25, borderTop: '1px dashed #d1c4e9' }}>
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ fontFamily: 'monospace', mb: 0.5 }}>
                      ID original: {instance._id || instance.id} · Iteración: {instance.iteration || 1} · Confianza: {instance.confidence}
                    </Typography>
                    <Typography variant="body2" color="text.primary" sx={{ mb: 1, fontSize: 13, overflowWrap: 'anywhere' }}>
                      {instance.description}
                    </Typography>

                    {!group.sharedRecommendation && instance.recommendation && (
                      <Typography variant="caption" color="#1b5e20" display="block" sx={{ mb: 1, fontWeight: 600 }}>
                        Recomendación: {instance.recommendation}
                      </Typography>
                    )}

                    <TechnicalEvidenceList evidence={instance.evidence} />

                    {screenshotUrl && (
                      <Box sx={{ mt: 1.25, display: 'flex', alignItems: 'center', gap: 0.75 }}>
                        <ImageIcon color="primary" sx={{ fontSize: 16 }} />
                        <MuiLink
                          href={screenshotUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          variant="caption"
                          fontWeight={700}
                          underline="hover"
                        >
                          Ver captura de pantalla (Iteración {instance.iteration || 1})
                        </MuiLink>
                      </Box>
                    )}
                  </Box>
                </Collapse>
              </Paper>
            )
          })}
        </Box>

        {totalInstancePages > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
            <Pagination
              count={totalInstancePages}
              page={safePage}
              onChange={(_e, nextPage) => {
                setInstancesPage(nextPage)
                setExpandedInstanceId(null)
              }}
              size="small"
              color="primary"
              aria-label={`Paginación inferior de instancias de ${group.primaryCriterionLabel}`}
            />
          </Box>
        )}
      </AccordionDetails>
    </Accordion>
  )
}

/**
 * FindingsAccordion — Vista agrupada por defecto (determinística, reversible y
 * puramente presentacional) + vista individual completa, filtro inicial en FAIL,
 * ordenamiento determinista por severidad y paginación eficiente.
 */
export default function FindingsAccordion({
  findings,
  evaluationType = 'website',
  selectedCriterion = null,
  onClearCriterion,
  initialStatusFilter = 'FAIL',
}: Props) {
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'FAIL' | 'NOT_EVALUABLE' | 'PASS'>(initialStatusFilter)
  const [viewMode, setViewMode] = useState<'grouped' | 'individual'>('grouped')
  const [currentPage, setCurrentPage] = useState(1)

  // Filtrado por criterio seleccionado desde CriteriaCoverageMatrix (memoizado)
  const criterionFilteredFindings = useMemo(
    () =>
      selectedCriterion
        ? findings.filter((f) => findingMatchesCriterion(f, selectedCriterion, evaluationType))
        : findings,
    [findings, selectedCriterion, evaluationType],
  )

  const { failCount, notEvalCount, passCount } = useMemo(() => {
    let fail = 0
    let notEval = 0
    let pass = 0
    for (const f of criterionFilteredFindings) {
      const s = f.status || 'FAIL'
      if (s === 'FAIL') fail++
      else if (s === 'NOT_EVALUABLE') notEval++
      else if (s === 'PASS') pass++
    }
    return { failCount: fail, notEvalCount: notEval, passCount: pass }
  }, [criterionFilteredFindings])

  // Si el usuario salta desde la matriz a un criterio que no tiene FAIL (ej. solo NOT_EVALUABLE o PASS),
  // ajusta automáticamente el filtro activo para evitar mostrar un listado vacío engañoso.
  useEffect(() => {
    if (!selectedCriterion) return
    if (failCount > 0) {
      setStatusFilter('FAIL')
    } else if (notEvalCount > 0 && passCount === 0) {
      setStatusFilter('NOT_EVALUABLE')
    } else if (passCount > 0 && notEvalCount === 0) {
      setStatusFilter('PASS')
    } else {
      setStatusFilter('ALL')
    }
  }, [selectedCriterion, failCount, notEvalCount, passCount])

  // Filtrado por estado (memoizado)
  const statusFilteredFindings = useMemo(
    () =>
      statusFilter === 'ALL'
        ? criterionFilteredFindings
        : criterionFilteredFindings.filter((f) => (f.status || 'FAIL') === statusFilter),
    [criterionFilteredFindings, statusFilter],
  )

  // Agrupación determinística memoizada (sin recalcular en renders de paginación o expansión)
  const groupedItems = useMemo(
    () => groupFindingsForPresentation(statusFilteredFindings, evaluationType),
    [statusFilteredFindings, evaluationType],
  )

  // Lista individual ordenada determinísticamente (memoizada)
  const individualItems = useMemo(
    () => sortFindingsDeterministically(statusFilteredFindings),
    [statusFilteredFindings],
  )

  // Resetear página cuando cambia el filtro, el criterio o el modo de visualización
  useEffect(() => {
    setCurrentPage(1)
  }, [statusFilter, selectedCriterion, viewMode])

  const pageSize = viewMode === 'grouped' ? GROUPS_PAGE_SIZE : INDIVIDUAL_PAGE_SIZE
  const totalListItems = viewMode === 'grouped' ? groupedItems.length : individualItems.length
  const totalPages = Math.max(1, Math.ceil(totalListItems / pageSize))
  const safePage = Math.min(currentPage, totalPages)
  const pageStart = (safePage - 1) * pageSize

  const paginatedGroups = useMemo(
    () => groupedItems.slice(pageStart, pageStart + pageSize),
    [groupedItems, pageStart, pageSize],
  )

  const paginatedIndividuals = useMemo(
    () => individualItems.slice(pageStart, pageStart + pageSize),
    [individualItems, pageStart, pageSize],
  )

  if (findings.length === 0) {
    return (
      <Typography color="text.secondary" textAlign="center" py={4}>
        No se encontraron hallazgos para esta evaluación.
      </Typography>
    )
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, minWidth: 0 }}>
      {/* ── BARRA DE FILTROS POR ESTADO (conteos reales originales) + CONMUTADOR DE VISTA ── */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 1.25,
          flexWrap: 'wrap',
        }}
      >
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }} role="group" aria-label="Filtrar hallazgos por estado">
          <Chip
            icon={<HighlightOffIcon sx={{ color: statusFilter === 'FAIL' ? '#ffffff !important' : '#c62828 !important' }} />}
            label={`FAIL (${failCount})`}
            clickable
            onClick={() => setStatusFilter('FAIL')}
            sx={{
              fontWeight: 700,
              bgcolor: statusFilter === 'FAIL' ? '#c62828' : '#ffebee',
              color: statusFilter === 'FAIL' ? '#ffffff' : '#c62828',
              border: '1px solid #c62828',
            }}
          />
          <Chip
            icon={<HelpOutlineIcon sx={{ color: statusFilter === 'NOT_EVALUABLE' ? '#ffffff !important' : '#424242 !important' }} />}
            label={`NOT_EVALUABLE (${notEvalCount})`}
            clickable
            onClick={() => setStatusFilter('NOT_EVALUABLE')}
            sx={{
              fontWeight: 700,
              bgcolor: statusFilter === 'NOT_EVALUABLE' ? '#424242' : '#f5f5f5',
              color: statusFilter === 'NOT_EVALUABLE' ? '#ffffff' : '#424242',
              border: '1px solid #424242',
            }}
          />
          <Chip
            icon={<CheckCircleOutlineIcon sx={{ color: statusFilter === 'PASS' ? '#ffffff !important' : '#1b5e20 !important' }} />}
            label={`PASS (${passCount})`}
            clickable
            onClick={() => setStatusFilter('PASS')}
            sx={{
              fontWeight: 700,
              bgcolor: statusFilter === 'PASS' ? '#1b5e20' : '#e8f5e9',
              color: statusFilter === 'PASS' ? '#ffffff' : '#1b5e20',
              border: '1px solid #1b5e20',
            }}
          />
          <Chip
            label={`Todos (${criterionFilteredFindings.length})`}
            clickable
            color={statusFilter === 'ALL' ? 'primary' : 'default'}
            variant={statusFilter === 'ALL' ? 'filled' : 'outlined'}
            onClick={() => setStatusFilter('ALL')}
            sx={{ fontWeight: 700 }}
          />
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          {selectedCriterion && (
            <Chip
              icon={<FilterAltOffIcon fontSize="small" />}
              label={`Criterio filtrado: ${selectedCriterion}`}
              color="secondary"
              onClick={onClearCriterion}
              onDelete={onClearCriterion}
              sx={{ fontWeight: 700 }}
            />
          )}

          <ToggleButtonGroup
            size="small"
            exclusive
            value={viewMode}
            onChange={(_e, next: 'grouped' | 'individual' | null) => {
              if (next) setViewMode(next)
            }}
            aria-label="Modo de visualización de hallazgos"
          >
            <ToggleButton value="grouped" sx={{ textTransform: 'none', fontWeight: 700, fontSize: 12, px: 1.25 }}>
              <ViewAgendaOutlinedIcon sx={{ fontSize: 16, mr: 0.5 }} />
              Vista agrupada
            </ToggleButton>
            <ToggleButton value="individual" sx={{ textTransform: 'none', fontWeight: 700, fontSize: 12, px: 1.25 }}>
              <ViewListOutlinedIcon sx={{ fontSize: 16, mr: 0.5 }} />
              Vista individual
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </Box>

      {/* ── RESUMEN CUANTITATIVO QUE SEPARA HALLAZGOS REALES VS. GRUPOS ── */}
      {statusFilteredFindings.length > 0 && (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 1,
            px: 1.5,
            py: 1,
            bgcolor: '#f8f6ff',
            border: '1px solid #e0d9f9',
            borderRadius: 1.5,
          }}
        >
          <Typography variant="caption" color="text.primary" fontWeight={600}>
            {viewMode === 'grouped' ? (
              <>
                <strong>{statusFilteredFindings.length.toLocaleString()}</strong> hallazgo
                {statusFilteredFindings.length === 1 ? '' : 's'} real{statusFilteredFindings.length === 1 ? '' : 'es'} organizado
                {statusFilteredFindings.length === 1 ? '' : 's'} en{' '}
                <strong>{groupedItems.length.toLocaleString()}</strong>{' '}
                {groupedItems.length === 1 ? 'grupo / elemento' : 'grupos / elementos'}
                {totalPages > 1 ? ` · Página ${safePage} de ${totalPages}` : ''}
              </>
            ) : (
              <>
                Mostrando{' '}
                <strong>
                  {pageStart + 1}–{Math.min(pageStart + pageSize, individualItems.length)}
                </strong>{' '}
                de <strong>{individualItems.length.toLocaleString()}</strong> hallazgos individuales originales
                {totalPages > 1 ? ` · Página ${safePage} de ${totalPages}` : ''}
              </>
            )}
          </Typography>

          {totalPages > 1 && (
            <Pagination
              count={totalPages}
              page={safePage}
              onChange={(_e, nextPage) => setCurrentPage(nextPage)}
              size="small"
              color="primary"
              aria-label="Paginación de listado de hallazgos"
            />
          )}
        </Box>
      )}

      {/* ── CONTENIDO DEL LISTADO ── */}
      {statusFilteredFindings.length === 0 ? (
        <Paper elevation={0} sx={{ p: 3, textAlign: 'center', bgcolor: '#f9f9f9', border: '1px dashed #ccc', borderRadius: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            No se encontraron hallazgos con estado <strong>{statusFilter}</strong>
            {selectedCriterion ? (
              <>
                {' '}para el criterio <strong>{selectedCriterion}</strong>
              </>
            ) : null}{' '}
            en esta evaluación.
          </Typography>
          {statusFilter !== 'ALL' && criterionFilteredFindings.length > 0 && (
            <Button
              type="button"
              size="small"
              variant="outlined"
              onClick={() => setStatusFilter('ALL')}
              sx={{ textTransform: 'none', fontWeight: 700 }}
            >
              Ver todos los estados ({criterionFilteredFindings.length})
            </Button>
          )}
        </Paper>
      ) : viewMode === 'grouped' ? (
        paginatedGroups.map((group) =>
          group.isGrouped ? (
            <GroupedFindingCard
              key={group.groupKey}
              group={group}
              evaluationType={evaluationType}
            />
          ) : (
            <IndividualFindingCard
              key={group.groupKey}
              finding={group.findings[0]}
              findingId={group.findings[0]._id || group.findings[0].id || group.groupKey}
              evaluationType={evaluationType}
            />
          ),
        )
      ) : (
        paginatedIndividuals.map((finding, idx) => {
          const findingId = finding._id || finding.id || `f-${pageStart + idx}`
          return (
            <IndividualFindingCard
              key={findingId}
              finding={finding}
              findingId={findingId}
              evaluationType={evaluationType}
            />
          )
        })
      )}

      {/* Paginación inferior cuando hay más de una página */}
      {totalPages > 1 && statusFilteredFindings.length > 0 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', pt: 1 }}>
          <Pagination
            count={totalPages}
            page={safePage}
            onChange={(_e, nextPage) => setCurrentPage(nextPage)}
            color="primary"
            aria-label="Paginación inferior del listado de hallazgos"
          />
        </Box>
      )}
    </Box>
  )
}
