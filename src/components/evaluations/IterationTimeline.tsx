// src/components/evaluations/IterationTimeline.tsx
import { useMemo, useState } from 'react'
import {
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  Link as MuiLink,
  Paper,
  Tab,
  Tabs,
  Typography,
} from '@mui/material'
import ImageIcon from '@mui/icons-material/Image'
import LanguageIcon from '@mui/icons-material/Language'
import TouchAppIcon from '@mui/icons-material/TouchApp'
import TitleIcon from '@mui/icons-material/Title'
import SmartButtonIcon from '@mui/icons-material/SmartButton'
import LinkIcon from '@mui/icons-material/Link'
import DashboardIcon from '@mui/icons-material/Dashboard'
import PhotoLibraryIcon from '@mui/icons-material/PhotoLibrary'
import DynamicFormIcon from '@mui/icons-material/DynamicForm'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline'
import type { SnapshotEvidenceItem } from '@services/snapshots/snapshots.service'
import type { Evaluation, Report } from '@/types/evaluation.types'
import {
  buildExplorationIntegritySummary,
  resolveSnapshotTemporalActions,
} from '@utils/criteriaCoverage'

interface Props {
  snapshots: SnapshotEvidenceItem[]
  evaluation?: Evaluation | null
  report?: Report | null
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

/**
 * IterationTimeline — Timeline Visual e Inspección de Sesión por Iteración.
 * Permite explorar cada pantalla capturada durante la exploración con su captura,
 * URL, integridad de exploración, correspondencia temporal exacta entre capturas y
 * acciones de `evaluation.flowState.previousActions` (o `snapshot.action`), y elementos DOM extraídos.
 */
export default function IterationTimeline({ snapshots, evaluation = null, report = null }: Props) {
  const [selectedTab, setSelectedTab] = useState(0)

  const integrity = useMemo(
    () => buildExplorationIntegritySummary({ evaluation, report, snapshots }),
    [evaluation, report, snapshots],
  )

  if (!snapshots || snapshots.length === 0) {
    return (
      <Paper elevation={0} sx={{ p: 3, border: '1px dashed #cccccc', textAlign: 'center' }}>
        <Typography color="text.secondary">
          No hay evidencias de iteraciones disponibles para esta evaluación.
        </Typography>
      </Paper>
    )
  }

  const currentSnapshot = snapshots[selectedTab] || snapshots[0]

  // Resolve screenshot URL from either `screenshotUrl` or persisted `screenshotPath`
  const rawScreenshotPath = currentSnapshot.screenshotUrl || currentSnapshot.screenshotPath
  let fullScreenshotUrl: string | null = null
  if (rawScreenshotPath) {
    fullScreenshotUrl = rawScreenshotPath.startsWith('http')
      ? rawScreenshotPath
      : `${API_BASE_URL}${rawScreenshotPath.startsWith('/') ? '' : '/'}${rawScreenshotPath}`
  }

  // Correspondencia temporal exacta entre el snapshot del Paso k y `previousActions`
  const temporalActions = resolveSnapshotTemporalActions(
    currentSnapshot,
    snapshots,
    evaluation?.flowState?.previousActions,
  )

  const reflectedAction = temporalActions.actionReflectedInCapture
  const afterAction = temporalActions.actionExecutedAfterCapture

  const reflectedActionLabel = reflectedAction
    ? `${reflectedAction.actionType ? `[${reflectedAction.actionType}] ` : ''}${reflectedAction.description}`
    : 'Sin acción previa registrada'

  const afterActionLabel = afterAction
    ? `${afterAction.actionType ? `[${afterAction.actionType}] ` : ''}${afterAction.description}`
    : null

  return (
    <Card elevation={0} sx={{ border: '1px solid #e0d9f9', borderRadius: 2, bgcolor: '#ffffff', mb: 3 }}>
      <Box sx={{ p: 2.5, bgcolor: '#f8f6ff', borderBottom: '1px solid #e0d9f9' }}>
        <Typography variant="subtitle1" fontWeight={800} color="primary.main">
          🗺️ TIMELINE VISUAL DE LA SIMULACIÓN ({snapshots.length} Iteraciones Capturadas)
        </Typography>
        <Typography variant="caption" color="text.secondary" display="block">
          Inspeccione la captura de pantalla, la secuencia temporal de acciones y los elementos interactivos capturados por Playwright en cada paso del recorrido.
        </Typography>

        {/* Barra de Integridad de Exploración (Sección 3) */}
        <Box
          sx={{
            mt: 1.5,
            p: 1.25,
            bgcolor: '#ffffff',
            border: '1px solid #e0d9f9',
            borderRadius: 1.5,
          }}
        >
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center', mb: 0.5 }}>
            <Chip
              size="small"
              icon={
                integrity.isComplete ? (
                  <CheckCircleOutlineIcon sx={{ color: '#2e7d32 !important' }} />
                ) : (
                  <ErrorOutlineIcon sx={{ color: '#e65100 !important' }} />
                )
              }
              label={integrity.statusLabel}
              sx={{
                fontWeight: 700,
                bgcolor: integrity.isComplete ? '#e8f5e9' : '#fff3e0',
                color: integrity.isComplete ? '#2e7d32' : '#e65100',
              }}
            />
            <Chip
              size="small"
              label={`Cierre: ${integrity.terminationReasonLabel}`}
              variant="outlined"
              sx={{ fontWeight: 600 }}
            />
            <Chip
              size="small"
              label={`Pasos capturados: ${integrity.capturedStepsCount}${
                integrity.maxIterationsUsed ? ` (límite: ${integrity.maxIterationsUsed})` : ''
              }`}
              variant="outlined"
              sx={{ fontWeight: 600 }}
            />
            {integrity.totalActionsCount > 0 && (
              <Chip
                size="small"
                label={`Acciones: ${integrity.successfulActionsCount} exitosas · ${integrity.failedActionsCount} fallidas`}
                variant="outlined"
                sx={{ fontWeight: 600 }}
              />
            )}
          </Box>
          <Typography variant="caption" color="text.secondary" display="block">
            {integrity.integrityNote}
          </Typography>
        </Box>

        {/* Tabs por Iteración */}
        <Tabs
          value={selectedTab}
          onChange={(_e, newValue) => setSelectedTab(newValue)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ mt: 1.5, '& .MuiTab-root': { fontWeight: 700, fontSize: 13 } }}
        >
          {snapshots.map((snap, idx) => (
            <Tab
              key={snap._id || idx}
              label={`Paso ${snap.iteration || idx + 1}`}
              icon={<TouchAppIcon sx={{ fontSize: 16 }} />}
              iconPosition="start"
            />
          ))}
        </Tabs>
      </Box>

      {/* Detalle de la Iteración Seleccionada */}
      <CardContent sx={{ p: 3 }}>
        <Grid container spacing={3}>
          {/* Columna Izquierda: Captura de Pantalla Real */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="caption" fontWeight={700} color="text.secondary" display="block" sx={{ mb: 1 }}>
              📸 CAPTURA DE PANTALLA (ITERACIÓN {currentSnapshot.iteration})
            </Typography>

            <Box
              sx={{
                width: '100%',
                maxHeight: 420,
                borderRadius: 2,
                overflow: 'hidden',
                border: '1px solid #e0e0e0',
                bgcolor: '#f5f5f5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {fullScreenshotUrl ? (
                <MuiLink
                  href={fullScreenshotUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Abrir captura de pantalla de la Iteración ${currentSnapshot.iteration} en una nueva pestaña`}
                  sx={{
                    display: 'flex',
                    width: '100%',
                    alignItems: 'center',
                    justifyContent: 'center',
                    '&:focus-visible': {
                      outline: '2px solid',
                      outlineColor: 'primary.main',
                      outlineOffset: 2,
                    },
                  }}
                >
                  <Box
                    component="img"
                    src={fullScreenshotUrl}
                    alt={`Screenshot Iteración ${currentSnapshot.iteration}`}
                    sx={{
                      width: '100%',
                      height: 'auto',
                      maxHeight: 420,
                      objectFit: 'contain',
                    }}
                  />
                </MuiLink>
              ) : (
                <Box sx={{ py: 6, textAlign: 'center', color: 'text.secondary' }}>
                  <ImageIcon sx={{ fontSize: 48, mb: 1, opacity: 0.5 }} />
                  <Typography variant="caption" display="block">
                    Sin captura de pantalla asociada para este paso
                  </Typography>
                </Box>
              )}
            </Box>
          </Grid>

          {/* Columna Derecha: Detalles Técnicos y Secuencia Temporal de Acciones */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Box sx={{ mb: 2, minWidth: 0 }}>
              <Typography variant="caption" color="text.secondary" fontWeight={700}>
                URL VISITADA
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mt: 0.5, minWidth: 0 }}>
                <LanguageIcon fontSize="small" color="primary" sx={{ flexShrink: 0, mt: 0.25 }} />
                <MuiLink
                  href={currentSnapshot.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="body2"
                  fontWeight={600}
                  sx={{ minWidth: 0, overflowWrap: 'anywhere', wordBreak: 'break-word' }}
                >
                  {currentSnapshot.url}
                </MuiLink>
              </Box>
            </Box>

            {/* 1. Acción que condujo a esta captura (reflejada en la imagen actual) */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" color="text.secondary" fontWeight={700} display="block">
                ACCIÓN QUE CONDUJO A ESTA CAPTURA (REFLEJADA EN PANTALLA)
              </Typography>
              <Box sx={{ mt: 0.5, display: 'flex', alignItems: 'flex-start', gap: 1, flexWrap: 'wrap' }}>
                <Chip
                  label={reflectedActionLabel}
                  color="primary"
                  size="small"
                  sx={{
                    fontWeight: 700,
                    height: 'auto',
                    py: 0.5,
                    '& .MuiChip-label': { whiteSpace: 'normal', display: 'block' },
                  }}
                />
                {reflectedAction?.result && (
                  <Chip
                    label={reflectedAction.result === 'failure' ? 'Resultado: Fallida' : 'Resultado: Exitosa'}
                    size="small"
                    sx={{
                      fontWeight: 700,
                      bgcolor: reflectedAction.result === 'failure' ? '#ffebee' : '#e8f5e9',
                      color: reflectedAction.result === 'failure' ? '#d32f2f' : '#2e7d32',
                    }}
                  />
                )}
              </Box>
              {reflectedAction?.targetElement && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  display="block"
                  sx={{ mt: 0.5, fontFamily: 'monospace', overflowWrap: 'anywhere', wordBreak: 'break-word' }}
                >
                  Elemento objetivo: {reflectedAction.targetElement}
                </Typography>
              )}
            </Box>

            {/* 2. Acción ejecutada DESPUÉS de tomar esta captura (cuando existe en previousActions) */}
            {afterAction && afterActionLabel && (
              <Paper
                elevation={0}
                sx={{
                  mb: 2,
                  p: 1.5,
                  bgcolor: afterAction.result === 'failure' ? '#fff8f8' : '#f8f9fa',
                  border: `1px solid ${afterAction.result === 'failure' ? '#ef9a9a' : '#e0e0e0'}`,
                  borderRadius: 1.5,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 0.5, mb: 0.5 }}>
                  <Typography variant="caption" fontWeight={800} color="text.primary">
                    ACCIÓN EJECUTADA DESPUÉS DE ESTA CAPTURA
                  </Typography>
                  <Chip
                    label={afterAction.result === 'failure' ? 'Fallida' : 'Exitosa'}
                    size="small"
                    sx={{
                      height: 20,
                      fontSize: 11,
                      fontWeight: 800,
                      bgcolor: afterAction.result === 'failure' ? '#ffebee' : '#e8f5e9',
                      color: afterAction.result === 'failure' ? '#d32f2f' : '#2e7d32',
                    }}
                  />
                </Box>
                <Typography variant="caption" color="text.primary" display="block" sx={{ fontWeight: 600, mb: 0.5 }}>
                  {afterActionLabel}
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block" sx={{ fontStyle: 'italic' }}>
                  {afterAction.result === 'failure'
                    ? `Nota temporal: Esta acción se intentó después de guardar la captura del Paso ${currentSnapshot.iteration} y no pudo completarse, deteniendo la navegación.`
                    : temporalActions.afterActionHasSubsequentCapture
                      ? `Nota temporal: La captura del Paso ${currentSnapshot.iteration} es anterior a esta acción; su resultado visual se muestra en el Paso ${(currentSnapshot.iteration || 1) + 1}.`
                      : `Nota temporal: Esta acción se ejecutó después de tomar la captura del Paso ${currentSnapshot.iteration}, justo al finalizar el recorrido, por lo que no tiene una captura posterior asociada.`}
                </Typography>
              </Paper>
            )}

            <Divider sx={{ my: 2 }} />

            {/* Elementos Estructurados Capturados */}
            <Typography variant="caption" fontWeight={700} color="text.secondary" display="block" sx={{ mb: 1.5 }}>
              ⚙️ ELEMENTOS INTERACTIVOS EXTRAÍDOS (DOM SUMMARY)
            </Typography>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
              <Chip
                icon={<TitleIcon fontSize="small" />}
                label={`Headings: ${currentSnapshot.headings?.length || 0}`}
                size="small"
                variant="outlined"
              />
              <Chip
                icon={<PhotoLibraryIcon fontSize="small" />}
                label={`Imágenes: ${currentSnapshot.images?.length || 0}`}
                size="small"
                variant="outlined"
              />
              <Chip
                icon={<SmartButtonIcon fontSize="small" />}
                label={`Botones: ${currentSnapshot.buttons?.length || 0}`}
                size="small"
                variant="outlined"
              />
              <Chip
                icon={<LinkIcon fontSize="small" />}
                label={`Enlaces: ${currentSnapshot.links?.length || 0}`}
                size="small"
                variant="outlined"
              />
              <Chip
                icon={<DynamicFormIcon fontSize="small" />}
                label={`Formularios: ${currentSnapshot.forms?.length || 0}`}
                size="small"
                variant="outlined"
              />
              <Chip
                icon={<DashboardIcon fontSize="small" />}
                label={`Landmarks: ${currentSnapshot.landmarks?.length || 0}`}
                size="small"
                variant="outlined"
              />
            </Box>

            {/* Muestra detalle de encabezados detectados */}
            {currentSnapshot.headings && currentSnapshot.headings.length > 0 && (
              <Paper elevation={0} sx={{ p: 1.5, bgcolor: '#f8f9fa', border: '1px solid #eeeeee', borderRadius: 1.5, mb: 1 }}>
                <Typography variant="caption" fontWeight={700} color="text.primary" display="block" sx={{ mb: 0.5 }}>
                  Estructura de Encabezados:
                </Typography>
                {currentSnapshot.headings.slice(0, 5).map((h, i) => (
                  <Typography
                    key={i}
                    variant="caption"
                    color="text.secondary"
                    display="block"
                    sx={{ fontFamily: 'monospace', overflowWrap: 'anywhere', wordBreak: 'break-word' }}
                  >
                    H{h.level}: "{h.text}" ({h.selector})
                  </Typography>
                ))}
              </Paper>
            )}
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  )
}
