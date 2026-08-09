// src/components/evaluations/FindingsAccordion.tsx
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Chip,
  Divider,
  Typography,
} from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import type { Finding, FindingSeverity } from '@/types/evaluation.types'

interface Props {
  findings: Finding[]
}

const SEVERITY_CONFIG: Record<
  FindingSeverity,
  { label: string; color: string; bg: string }
> = {
  critical: { label: 'Crítico',  color: '#d32f2f', bg: '#ffebee' },
  high:     { label: 'Alto',     color: '#e65100', bg: '#fff3e0' },
  medium:   { label: 'Medio',    color: '#f57f17', bg: '#fffde7' },
  low:      { label: 'Bajo',     color: '#2e7d32', bg: '#e8f5e9' },
  info:     { label: 'Info',     color: '#0277bd', bg: '#e1f5fe' },
}

const GROUP_LABELS: Record<string, string> = {
  accessibility: 'Accesibilidad',
  ux: 'UX',
}

/**
 * FindingsAccordion — Lista de findings agrupados por severidad en acordeones.
 * Cada acordeón muestra tipo, descripción, recomendación y criterio WCAG.
 */
export default function FindingsAccordion({ findings }: Props) {
  if (findings.length === 0) {
    return (
      <Typography color="text.secondary" textAlign="center" py={4}>
        No se encontraron hallazgos para esta evaluación.
      </Typography>
    )
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      {findings.map((finding, idx) => {
        const sev = SEVERITY_CONFIG[finding.severity]
        return (
          <Accordion
            key={finding._id ?? idx}
            elevation={0}
            disableGutters
            sx={{
              border: `1px solid ${sev.color}22`,
              borderRadius: '8px !important',
              '&:before': { display: 'none' },
              overflow: 'hidden',
            }}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              sx={{ bgcolor: sev.bg, px: 2, py: 0.5 }}
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
                <Chip
                  label={sev.label}
                  size="small"
                  sx={{
                    bgcolor: sev.color,
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: 11,
                    minWidth: 60,
                  }}
                />
                <Chip
                  label={GROUP_LABELS[finding.findingGroup] ?? finding.findingGroup}
                  size="small"
                  variant="outlined"
                  sx={{ borderColor: sev.color, color: sev.color, fontSize: 11 }}
                />
                <Typography
                  variant="body2"
                  fontWeight={600}
                  sx={{ flex: 1, minWidth: 0 }}
                  noWrap
                >
                  {finding.type ?? 'Hallazgo'}
                </Typography>
              </Box>
            </AccordionSummary>

            <AccordionDetails sx={{ px: 2, py: 1.5 }}>
              {/* Descripción */}
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {finding.description}
              </Typography>

              {/* Recomendación */}
              {finding.heuristic && (
                <>
                  <Divider sx={{ my: 1.5 }} />
                  <Typography
                    variant="caption"
                    fontWeight={700}
                    color="text.primary"
                    display="block"
                    gutterBottom
                  >
                    💡 Recomendación
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {finding.heuristic}
                  </Typography>
                </>
              )}

              {/* WCAG */}
              {finding.wcagCriterion && (
                <Box sx={{ mt: 1.5 }}>
                  <Chip
                    label={`WCAG: ${finding.wcagCriterion}`}
                    size="small"
                    sx={{
                      bgcolor: '#e8eaf6',
                      color: '#3949ab',
                      fontWeight: 600,
                      fontSize: 11,
                    }}
                  />
                </Box>
              )}
            </AccordionDetails>
          </Accordion>
        )
      })}
    </Box>
  )
}
