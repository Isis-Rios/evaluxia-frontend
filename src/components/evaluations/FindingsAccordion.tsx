// src/components/evaluations/FindingsAccordion.tsx
import { useState } from 'react'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Chip,
  Collapse,
  Divider,
  IconButton,
  Link as MuiLink,
  Paper,
  Typography,
} from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ImageIcon from '@mui/icons-material/Image'
import CodeIcon from '@mui/icons-material/Code'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import HighlightOffIcon from '@mui/icons-material/HighlightOff'
import HelpOutlineIcon from '@mui/icons-material/HelpOutline'
import type { Finding, FindingSeverity, FindingStatus } from '@/types/evaluation.types'

interface Props {
  findings: Finding[]
}

const SEVERITY_CONFIG: Record<
  FindingSeverity,
  { label: string; color: string; bg: string }
> = {
  critical: { label: 'Crítico', color: '#d32f2f', bg: '#ffebee' },
  high:     { label: 'Alto', color: '#e65100', bg: '#fff3e0' },
  medium:   { label: 'Medio', color: '#f57f17', bg: '#fffde7' },
  low:      { label: 'Bajo', color: '#2e7d32', bg: '#e8f5e9' },
  info:     { label: 'Info', color: '#0277bd', bg: '#e1f5fe' },
}

const STATUS_CONFIG: Record<
  FindingStatus,
  { label: string; color: string; bg: string; icon: JSX.Element }
> = {
  PASS: {
    label: 'PASS',
    color: '#2e7d32',
    bg: '#e8f5e9',
    icon: <CheckCircleOutlineIcon fontSize="small" sx={{ color: '#2e7d32' }} />,
  },
  FAIL: {
    label: 'FAIL',
    color: '#d32f2f',
    bg: '#ffebee',
    icon: <HighlightOffIcon fontSize="small" sx={{ color: '#d32f2f' }} />,
  },
  NOT_EVALUABLE: {
    label: 'NOT_EVALUABLE',
    color: '#616161',
    bg: '#f5f5f5',
    icon: <HelpOutlineIcon fontSize="small" sx={{ color: '#616161' }} />,
  },
}

const GROUP_LABELS: Record<string, string> = {
  accessibility: 'Accesibilidad',
  ux: 'UX',
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

/**
 * FindingsAccordion — Muestra hallazgos con status PASS/FAIL/NOT_EVALUABLE, recomendación real, evidencia técnica estructurada y capturas.
 */
export default function FindingsAccordion({ findings }: Props) {
  const [openEvidenceId, setOpenEvidenceId] = useState<string | null>(null)

  const toggleEvidence = (id: string) => {
    setOpenEvidenceId((prev) => (prev === id ? null : id))
  }

  if (findings.length === 0) {
    return (
      <Typography color="text.secondary" textAlign="center" py={4}>
        No se encontraron hallazgos para esta evaluación.
      </Typography>
    )
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      {findings.map((finding, idx) => {
        const findingId = finding._id || finding.id || `f-${idx}`
        const sev = SEVERITY_CONFIG[finding.severity] || SEVERITY_CONFIG.info
        const st = STATUS_CONFIG[finding.status] || STATUS_CONFIG.FAIL
        const hasEvidence = Array.isArray(finding.evidence) && finding.evidence.length > 0

        // Resolve screenshot URL
        let fullScreenshotUrl: string | null = null
        if (finding.screenshotUrl) {
          fullScreenshotUrl = finding.screenshotUrl.startsWith('http')
            ? finding.screenshotUrl
            : `${API_BASE_URL}${finding.screenshotUrl}`
        }

        return (
          <Accordion
            key={findingId}
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
              sx={{ bgcolor: st.bg, px: 2, py: 0.5 }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  flexWrap: 'wrap',
                  width: '100%',
                }}
              >
                {/* Badge Status PASS / FAIL / NOT_EVALUABLE */}
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

                {/* Badge Severidad */}
                <Chip
                  label={sev.label}
                  size="small"
                  sx={{
                    bgcolor: sev.color,
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: 11,
                    minWidth: 55,
                  }}
                />

                {/* Grupo UX / Accesibilidad */}
                <Chip
                  label={GROUP_LABELS[finding.findingGroup] ?? finding.findingGroup}
                  size="small"
                  variant="outlined"
                  sx={{ borderColor: sev.color, color: sev.color, fontSize: 11 }}
                />

                {/* Criterio / Heurística */}
                <Typography
                  variant="body2"
                  fontWeight={700}
                  sx={{ flex: 1, minWidth: 150 }}
                  noWrap
                >
                  {finding.wcagCriterion || finding.heuristicName || finding.heuristicCode || 'Criterio General'}
                </Typography>
              </Box>
            </AccordionSummary>

            <AccordionDetails sx={{ px: 2, py: 2, bgcolor: '#ffffff' }}>
              {/* Descripción del problema */}
              <Typography variant="body2" color="text.primary" sx={{ mb: 1.5, lineHeight: 1.6 }}>
                {finding.description}
              </Typography>

              {/* Elemento afectado */}
              {finding.affectedElement?.selector && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                  <CodeIcon fontSize="small" color="action" />
                  <Typography variant="caption" sx={{ fontFamily: 'monospace', bgcolor: '#f5f5f5', p: 0.5, borderRadius: 1 }}>
                    Elemento: {finding.affectedElement.selector} {finding.affectedElement.tag ? `<${finding.affectedElement.tag}>` : ''}
                  </Typography>
                </Box>
              )}

              {/* Recomendación accionable REAL */}
              {finding.recommendation && (
                <Box sx={{ mt: 1.5, p: 1.5, bgcolor: '#e8f5e9', borderRadius: 1.5, borderLeft: '4px solid #2e7d32' }}>
                  <Typography
                    variant="caption"
                    fontWeight={800}
                    color="#1b5e20"
                    display="block"
                    gutterBottom
                  >
                    💡 RECOMENDACIÓN ACCIONABLE
                  </Typography>
                  <Typography variant="body2" color="#2e7d32">
                    {finding.recommendation}
                  </Typography>
                </Box>
              )}

              {/* Evidencia Técnica (Expandible) */}
              <Box sx={{ mt: 2 }}>
                <Box
                  onClick={() => toggleEvidence(findingId)}
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 0.5,
                    cursor: 'pointer',
                    color: 'primary.main',
                    userSelect: 'none',
                    '&:hover': { textDecoration: 'underline' },
                  }}
                >
                  <Typography variant="caption" fontWeight={700}>
                    {openEvidenceId === findingId ? '▼ Ocultar Evidencia Técnica' : '► Ver Evidencia Técnica'} ({hasEvidence ? finding.evidence!.length : 0})
                  </Typography>
                </Box>

                <Collapse in={openEvidenceId === findingId}>
                  <Paper elevation={0} sx={{ p: 1.5, mt: 1, bgcolor: '#f8f9fa', border: '1px solid #e0e0e0', borderRadius: 1.5 }}>
                    {hasEvidence ? (
                      finding.evidence!.map((item, idxEv) => (
                        <Box key={idxEv} sx={{ mb: 1, '&:last-child': { mb: 0 } }}>
                          <Typography variant="caption" fontWeight={700} color="primary">
                            [{item.type}]
                          </Typography>
                          {item.selector && (
                            <Typography variant="caption" color="text.secondary" sx={{ ml: 1, fontFamily: 'monospace' }}>
                              Selector: {item.selector}
                            </Typography>
                          )}
                          {item.property && (
                            <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                              Property: {item.property}
                            </Typography>
                          )}
                          {item.value && (
                            <Typography variant="caption" fontWeight={600} sx={{ ml: 1, color: '#333' }}>
                              Value: {item.value}
                            </Typography>
                          )}
                        </Box>
                      ))
                    ) : (
                      <Typography variant="caption" color="text.secondary">
                        No hay evidencia técnica disponible.
                      </Typography>
                    )}
                  </Paper>
                </Collapse>
              </Box>

              {/* Captura de pantalla traceable */}
              {fullScreenshotUrl && (
                <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ImageIcon color="primary" fontSize="small" />
                  <MuiLink
                    href={fullScreenshotUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    variant="caption"
                    fontWeight={700}
                    underline="hover"
                  >
                    Ver captura de pantalla (Iteración {finding.iteration})
                  </MuiLink>
                </Box>
              )}
            </AccordionDetails>
          </Accordion>
        )
      })}
    </Box>
  )
}
