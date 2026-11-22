// src/pages/Evaluations/EvaluateFlowPage.tsx
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  Paper,
  Typography,
} from '@mui/material'
import AccountTreeIcon from '@mui/icons-material/AccountTree'
import WebIcon from '@mui/icons-material/Web'
import CropOriginalIcon from '@mui/icons-material/CropOriginal'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import ConstructionIcon from '@mui/icons-material/Construction'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import { useNavigate } from 'react-router-dom'

export default function EvaluateFlowPage() {
  const navigate = useNavigate()

  const upcomingFeatures = [
    {
      title: 'Simulación guiada por objetivos',
      description:
        'El agente autónomo recorrerá rutas complejas paso a paso (ej. embudos de conversión, carritos de compra o registros) para verificar su cumplimiento.',
    },
    {
      title: 'Validación de transiciones de estado',
      description:
        'Auditoría heurística y de accesibilidad WCAG en cada cambio de vista, apertura de modales y validaciones asíncronas de formularios.',
    },
    {
      title: 'Reporte acumulativo de fricción',
      description:
        'Detección de puntos de abandono, barreras de accesibilidad consecutivas y métricas de esfuerzo cognitivo en todo el trayecto.',
    },
  ]

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4, width: '100%', minWidth: 0, py: 2 }}>
      {/* ── Cabecera ── */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box
          sx={{
            width: 52,
            height: 52,
            borderRadius: 3,
            bgcolor: 'primary.light',
            color: 'primary.main',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <AccountTreeIcon sx={{ fontSize: 32 }} />
        </Box>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Typography variant="h5" fontWeight={700}>
              Evaluar flujo
            </Typography>
            <Chip
              icon={<ConstructionIcon sx={{ fontSize: '16px !important' }} />}
              label="Próximamente"
              color="info"
              size="small"
              sx={{ fontWeight: 700, fontSize: 11 }}
            />
          </Box>
          <Typography variant="body2" color="text.secondary">
            Evaluación end-to-end de flujos de interacción y recorridos multipaso de usuario.
          </Typography>
        </Box>
      </Box>

      {/* ── Contenedor Principal (Coming Soon) ── */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 3, md: 5 },
          borderRadius: 4,
          border: '1px solid #e2ddf8',
          background: 'linear-gradient(135deg, #faf9ff 0%, #ffffff 100%)',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Box
          sx={{
            width: 88,
            height: 88,
            borderRadius: '50%',
            bgcolor: '#f1edff',
            color: 'primary.main',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 2.5,
          }}
        >
          <ConstructionIcon sx={{ fontSize: 44 }} />
        </Box>

        <Typography variant="h4" fontWeight={800} color="secondary.main" gutterBottom>
          Funcionalidad disponible próximamente
        </Typography>

        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ maxWidth: 650, mb: 4, lineHeight: 1.7 }}
        >
          Estamos perfeccionando el motor de evaluación para trayectos completos y tareas secuenciales.
          Muy pronto podrás definir metas de interacción y dejar que los agentes evalúen
          la accesibilidad y usabilidad a través de múltiples pantallas consecutivas.
        </Typography>

        {/* ── Tarjetas con características planeadas ── */}
        <Grid container spacing={2.5} sx={{ maxWidth: 900, mb: 4, textAlign: 'left' }}>
          {upcomingFeatures.map((feat, idx) => (
            <Grid key={idx} size={{ xs: 12, md: 4 }}>
              <Card
                elevation={0}
                sx={{
                  height: '100%',
                  p: 2.5,
                  borderRadius: 3,
                  border: '1px solid #ede7f6',
                  bgcolor: '#ffffff',
                }}
              >
                <CardContent sx={{ p: '0 !important' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <CheckCircleOutlineIcon color="primary" fontSize="small" />
                    <Typography variant="subtitle2" fontWeight={700}>
                      {feat.title}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                    {feat.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* ── Opciones activas alternativas ── */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'center', marginTop: '20px' }}>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/inicio')}
            sx={{ borderRadius: 3, textTransform: 'none', fontWeight: 600 }}
          >
            Volver al inicio
          </Button>

          <Button
            variant="contained"
            startIcon={<WebIcon />}
            onClick={() => navigate('/evaluate/web')}
            sx={{
              borderRadius: 3,
              textTransform: 'none',
              fontWeight: 700,
              bgcolor: 'primary.main',
              '&:hover': { bgcolor: 'primary.dark' },
            }}
          >
            Evaluar sitio web
          </Button>

          <Button
            variant="outlined"
            startIcon={<CropOriginalIcon />}
            onClick={() => navigate('/evaluate/prototype')}
            sx={{ borderRadius: 3, textTransform: 'none', fontWeight: 600 }}
          >
            Evaluar prototipo
          </Button>
        </Box>
      </Paper>
    </Box>
  )
}
