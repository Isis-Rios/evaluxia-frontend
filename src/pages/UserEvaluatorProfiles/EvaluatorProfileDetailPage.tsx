// src/pages/UserEvaluatorProfiles/EvaluatorProfileDetailPage.tsx
import { useEffect } from 'react'
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  IconButton,
  Typography,
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import EditIcon from '@mui/icons-material/Edit'
import { EmojiObjects, Face, Favorite, LocationOn, Memory, PhoneAndroid, Work } from '@mui/icons-material'
import { useNavigate, useParams } from 'react-router-dom'
import { useTheme } from '@mui/material/styles'

import { useEvaluatorProfiles } from '@hooks/useEvaluatorProfiles'

const TECH_LABELS: Record<string, string> = {
  low: 'Tecnología baja',
  medium: 'Tecnología media',
  high: 'Tecnología alta',
}

const DEVICE_LABELS: Record<string, string> = {
  desktop: 'Escritorio',
  mobile: 'Móvil',
  tablet: 'Tablet',
}

export default function EvaluatorProfileDetailPage() {
  const theme = useTheme()
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { profile, isLoading, error, fetchProfileById } = useEvaluatorProfiles()

  useEffect(() => {
    if (id) fetchProfileById(id)
  }, [id, fetchProfileById])

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Box p={0}>
        <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/perfiles')}
          sx={{ mt: 2 }}
        >
          Volver al listado
        </Button>
      </Box>
    )
  }

  if (!profile) return null

  const initial = profile.fullName.charAt(0).toUpperCase()

  return (
    <Box p={0}>
      {/* ── Header ── */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton onClick={() => navigate('/perfiles')} size="small">
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h5" fontWeight={600}>
            Detalle del perfil
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<EditIcon />}
          onClick={() => navigate(`/perfiles/${profile._id}/editar`)}
        >
          Editar
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* ── Columna izquierda: datos de identidad ── */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card
            elevation={0}
            sx={{ p: 3, bgcolor: '#ddd8ff', borderRadius: 2, textAlign: 'center', height: '100%' }}
          >
            <Avatar
              sx={{
                width: 100,
                height: 100,
                bgcolor: theme.palette.primary.main,
                fontSize: 42,
                fontWeight: 700,
                mx: 'auto',
                mb: 2,
              }}
            >
              {initial}
            </Avatar>
            <Typography variant="h5" fontWeight={700}>{profile.fullName}</Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {profile.phrase}
            </Typography>

            <Divider sx={{ my: 2 }} />

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center' }}>
              <Chip icon={<Face />} label={`${profile.age} años`} />
              <Chip icon={<Work />} label={profile.profession} />
              <Chip icon={<Favorite />} label={profile.maritalStatus} />
              <Chip icon={<LocationOn />} label={`${profile.city}, ${profile.country}`} />
              <Chip icon={<PhoneAndroid />} label={DEVICE_LABELS[profile.preferredDevice]} />
              <Chip icon={<Memory />} label={TECH_LABELS[profile.techSavviness]} />
              <Chip icon={<EmojiObjects />} label={profile.archetype} color="secondary" />
            </Box>
          </Card>
        </Grid>

        {/* ── Columna derecha: descripciones ── */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {[
              { label: 'Biografía', content: profile.biography },
              { label: 'Personalidad', content: profile.personality },
            ].map(({ label, content }) => (
              <Card key={label} elevation={0} sx={{ p: 3, borderRadius: 2 }}>
                <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                  {label}
                </Typography>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                  {content}
                </Typography>
              </Card>
            ))}

            <Grid container spacing={2}>
              {[
                { label: 'Objetivos', items: profile.goals },
                { label: 'Frustraciones', items: profile.frustrations },
              ].map(({ label, items }) => (
                <Grid key={label} size={{ xs: 12, md: 6 }}>
                  <Card elevation={0} sx={{ p: 3, borderRadius: 2, height: '100%' }}>
                    <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                      {label}
                    </Typography>
                    <Box component="ul" sx={{ m: 0, pl: 2 }}>
                      {(Array.isArray(items) ? items : [items]).map((item, i) => (
                        <Typography key={i} component="li" variant="body2" sx={{ mb: 0.5 }}>
                          {item}
                        </Typography>
                      ))}
                    </Box>
                  </Card>
                </Grid>
              ))}
            </Grid>

            {profile.accessibilityNeeds.length > 0 && (
              <Card elevation={0} sx={{ p: 3, borderRadius: 2 }}>
                <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                  Necesidades de accesibilidad
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {profile.accessibilityNeeds.map((need) => (
                    <Chip key={need} label={need} size="small" />
                  ))}
                </Box>
              </Card>
            )}
          </Box>
        </Grid>
      </Grid>
    </Box>
  )
}
