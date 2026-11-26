// src/components/evaluations/CriterionContextDrawer.tsx
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  Drawer,
  IconButton,
  Paper,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import FilterListIcon from '@mui/icons-material/FilterList'
import type { Evaluation, Report } from '@/types/evaluation.types'
import type { SnapshotEvidenceItem } from '@services/snapshots/snapshots.service'
import {
  buildCriterionEvaluationContext,
  type ReconstructedCriterionRow,
} from '@utils/criteriaCoverage'

interface Props {
  row: ReconstructedCriterionRow | null
  open: boolean
  onClose: () => void
  onFilterByCriterion?: (criterionCode: string) => void
  evaluation?: Evaluation | null
  report?: Report | null
  snapshots?: SnapshotEvidenceItem[]
}

/**
 * CriterionContextDrawer — Presenta los 4 apartados de "Contexto y alcance de la evaluación"
 * en un panel lateral accesible (Drawer derecho en escritorio >= md, Dialog en pantallas pequeñas < md),
 * evitando anidar bloques extensos dentro de tablas y previniendo el desbordamiento horizontal.
 */
export default function CriterionContextDrawer({
  row,
  open,
  onClose,
  onFilterByCriterion,
  evaluation = null,
  report = null,
  snapshots = [],
}: Props) {
  const theme = useTheme()
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'))

  if (!row) {
    return null
  }

  const context = buildCriterionEvaluationContext(row, { evaluation, report, snapshots })
  const titleId = `criterion-context-title-${row.code.replace(/\s+/g, '-')}`

  const headerContent = (
    <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1.5 }}>
      <Box sx={{ minWidth: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap', mb: 0.5 }}>
          <Chip
            label={row.code}
            size="small"
            sx={{
              fontWeight: 800,
              fontSize: 11,
              height: 22,
              bgcolor: row.framework === 'NIELSEN' ? '#ede7f6' : '#e3f2fd',
              color: row.framework === 'NIELSEN' ? '#4527a0' : '#01579b',
            }}
          />
          {row.wcagLevel && (
            <Chip
              label={`Nivel ${row.wcagLevel}`}
              size="small"
              variant="outlined"
              sx={{ height: 20, fontSize: 10, fontWeight: 700 }}
            />
          )}
          <Chip
            label={row.mechanismLabel}
            size="small"
            variant="outlined"
            sx={{ height: 20, fontSize: 10, fontWeight: 600 }}
          />
        </Box>
        <Typography id={titleId} variant="subtitle1" fontWeight={800} color="text.primary" sx={{ lineHeight: 1.3 }}>
          {row.name}
        </Typography>
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5, lineHeight: 1.4 }}>
          {row.scopeNote}
        </Typography>
      </Box>

      <IconButton
        onClick={onClose}
        aria-label={`Cerrar contexto y alcance de ${row.code}`}
        size="small"
        sx={{ flexShrink: 0 }}
      >
        <CloseIcon fontSize="small" />
      </IconButton>
    </Box>
  )

  const bodyContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {row.findingsCount > 0 && onFilterByCriterion && (
        <Button
          variant="contained"
          color="primary"
          size="small"
          startIcon={<FilterListIcon fontSize="small" />}
          onClick={() => {
            onFilterByCriterion(row.code)
            onClose()
          }}
          sx={{ alignSelf: 'flex-start', textTransform: 'none', fontWeight: 700 }}
        >
          Ver {row.findingsCount === 1 ? '1 registro asociado' : `${row.findingsCount} registros asociados`} en Hallazgos
        </Button>
      )}

      {/* Apartado 1: Resultado de la evaluación */}
      <Paper elevation={0} sx={{ p: 2, bgcolor: '#ffffff', border: '1px solid #e0d9f9', borderRadius: 1.5 }}>
        <Typography variant="subtitle2" fontWeight={800} color="primary.dark" gutterBottom>
          1. Resultado de la evaluación
        </Typography>
        <Typography variant="body2" fontWeight={700} color="text.primary" sx={{ mb: 0.5 }}>
          {context.resultSection.statusSummary}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.55 }}>
          {context.resultSection.explanation}
        </Typography>

        {context.resultSection.deterministicHeadingCheckNote && (
          <Box
            sx={{
              mt: 1.25,
              p: 1.25,
              bgcolor: '#f3e5f5',
              borderRadius: 1,
              borderLeft: '3px solid #6a1b9a',
            }}
          >
            <Typography variant="caption" color="text.primary" display="block" sx={{ lineHeight: 1.45 }}>
              {context.resultSection.deterministicHeadingCheckNote}
            </Typography>
          </Box>
        )}
      </Paper>

      {/* Apartado 2: Información recopilada */}
      <Paper elevation={0} sx={{ p: 2, bgcolor: '#ffffff', border: '1px solid #c8e6c9', borderRadius: 1.5 }}>
        <Typography variant="subtitle2" fontWeight={800} color="#1b5e20" gutterBottom>
          2. Información recopilada
        </Typography>
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1, fontStyle: 'italic', lineHeight: 1.4 }}>
          {context.collectedInfoSection.framingDisclaimer}
        </Typography>
        <Box component="ul" sx={{ m: 0, pl: 2.25 }}>
          {context.collectedInfoSection.items.map((item, idxItem) => (
            <Typography
              component="li"
              variant="body2"
              color="text.primary"
              key={idxItem}
              sx={{ mb: 0.5, lineHeight: 1.5, overflowWrap: 'anywhere' }}
            >
              {item}
            </Typography>
          ))}
        </Box>
        {context.collectedInfoSection.availableStepsNote && (
          <Typography variant="caption" color="primary.dark" fontWeight={600} display="block" sx={{ mt: 1 }}>
            {context.collectedInfoSection.availableStepsNote}
          </Typography>
        )}
      </Paper>

      {/* Apartado 3: Limitaciones de la revisión */}
      <Paper elevation={0} sx={{ p: 2, bgcolor: '#ffffff', border: '1px solid #ffe0b2', borderRadius: 1.5 }}>
        <Typography variant="subtitle2" fontWeight={800} color="#bf360c" gutterBottom>
          3. Limitaciones de la revisión
        </Typography>
        <Box component="ul" sx={{ m: 0, pl: 2.25 }}>
          {context.limitationsSection.items.map((lim, idxLim) => (
            <Typography
              component="li"
              variant="body2"
              color="text.secondary"
              key={idxLim}
              sx={{ mb: 0.5, lineHeight: 1.5 }}
            >
              {lim}
            </Typography>
          ))}
        </Box>
      </Paper>

      {/* Apartado 4: Verificación humana recomendada */}
      <Paper elevation={0} sx={{ p: 2, bgcolor: '#ffffff', border: '1px solid #bbdefb', borderRadius: 1.5 }}>
        <Typography variant="subtitle2" fontWeight={800} color="#01579b" gutterBottom>
          4. Verificación humana recomendada
        </Typography>
        <Typography variant="body2" color="text.primary" sx={{ lineHeight: 1.55 }}>
          {context.humanVerificationSection.recommendation}
        </Typography>
      </Paper>
    </Box>
  )

  if (isDesktop) {
    return (
      <Drawer
        anchor="right"
        open={open}
        onClose={onClose}
        aria-labelledby={titleId}
        PaperProps={{
          sx: {
            width: { md: 480, lg: 540 },
            maxWidth: '92vw',
            bgcolor: '#faf8ff',
            display: 'flex',
            flexDirection: 'column',
          },
        }}
      >
        <Box sx={{ p: 2.5, bgcolor: '#ffffff' }}>{headerContent}</Box>
        <Divider />
        <Box sx={{ p: 2.5, overflowY: 'auto', flexGrow: 1 }}>{bodyContent}</Box>
      </Drawer>
    )
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      scroll="paper"
      aria-labelledby={titleId}
      PaperProps={{ sx: { bgcolor: '#faf8ff', m: 1.5 } }}
    >
      <DialogTitle component="div" sx={{ bgcolor: '#ffffff', pb: 2 }}>
        {headerContent}
      </DialogTitle>
      <Divider />
      <DialogContent sx={{ p: 2 }}>{bodyContent}</DialogContent>
    </Dialog>
  )
}
