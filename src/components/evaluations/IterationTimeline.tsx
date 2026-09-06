// src/components/evaluations/IterationTimeline.tsx
import { useState } from 'react'
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
import type { SnapshotEvidenceItem } from '@services/snapshots/snapshots.service'

interface Props {
  snapshots: SnapshotEvidenceItem[]
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

/**
 * IterationTimeline — Timeline Visual e Inspección de Sesión por Iteración.
 * Permite explorar cada pantalla capturada durante la exploración con su captura, URL, acción y elementos DOM.
 */
export default function IterationTimeline({ snapshots }: Props) {
  const [selectedTab, setSelectedTab] = useState(0)

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

  // Resolve screenshot URL
  let fullScreenshotUrl: string | null = null
  if (currentSnapshot.screenshotUrl) {
    fullScreenshotUrl = currentSnapshot.screenshotUrl.startsWith('http')
      ? currentSnapshot.screenshotUrl
      : `${API_BASE_URL}${currentSnapshot.screenshotUrl}`
  }

  return (
    <Card elevation={0} sx={{ border: '1px solid #e0d9f9', borderRadius: 2, bgcolor: '#ffffff', mb: 3 }}>
      <Box sx={{ p: 2.5, bgcolor: '#f8f6ff', borderBottom: '1px solid #e0d9f9' }}>
        <Typography variant="subtitle1" fontWeight={800} color="primary.main">
          🗺️ TIMELINE VISUAL DE LA SIMULACIÓN ({snapshots.length} Iteraciones Capturadas)
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Inspeccione la captura de pantalla y elementos interactivos capturados por Playwright en cada paso del recorrido.
        </Typography>

        {/* Tabs por Iteración */}
        <Tabs
          value={selectedTab}
          onChange={(_e, newValue) => setSelectedTab(newValue)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ mt: 2, '& .MuiTab-root': { fontWeight: 700, fontSize: 13 } }}
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
                <Box
                  component="img"
                  src={fullScreenshotUrl}
                  alt={`Screenshot Iteración ${currentSnapshot.iteration}`}
                  sx={{
                    width: '100%',
                    height: 'auto',
                    maxHeight: 420,
                    objectFit: 'contain',
                    cursor: 'pointer',
                  }}
                  onClick={() => window.open(fullScreenshotUrl!, '_blank')}
                />
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

          {/* Columna Derecha: Detalles Técnicos de la Iteración */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" color="text.secondary" fontWeight={700}>
                URL VISITADA
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                <LanguageIcon fontSize="small" color="primary" />
                <MuiLink
                  href={currentSnapshot.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="body2"
                  fontWeight={600}
                  noWrap
                >
                  {currentSnapshot.url}
                </MuiLink>
              </Box>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" color="text.secondary" fontWeight={700}>
                ACCIÓN EJECUTADA
              </Typography>
              <Box sx={{ mt: 0.5 }}>
                <Chip
                  label={currentSnapshot.actionExecuted || (currentSnapshot.iteration === 1 ? 'Navegación Inicial' : 'Sin acción registrada')}
                  color="primary"
                  size="small"
                  sx={{ fontWeight: 700 }}
                />
              </Box>
            </Box>

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
                  <Typography key={i} variant="caption" color="text.secondary" display="block" sx={{ fontFamily: 'monospace' }}>
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
