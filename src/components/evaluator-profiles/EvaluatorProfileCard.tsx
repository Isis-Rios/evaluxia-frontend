// src/components/evaluator-profiles/EvaluatorProfileCard.tsx
import {
  Avatar,
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  IconButton,
  Tooltip,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import {
  EmojiObjects,
  Face,
  Favorite,
  LocationOn,
  Work,
  PhoneAndroid,
  Memory,
} from '@mui/icons-material'
import { useTheme } from '@mui/material/styles'
import { useNavigate } from 'react-router-dom'
import type { EvaluatorProfile } from '@/types/evaluatorProfile.types'

interface Props {
  profile: EvaluatorProfile
  /** true cuando este perfil está siendo activado en este momento */
  isActivating?: boolean
  onDelete: (profile: EvaluatorProfile) => void
  onActivate: (profile: EvaluatorProfile) => void
}

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

export default function EvaluatorProfileCard({
  profile,
  isActivating = false,
  onDelete,
  onActivate,
}: Props) {
  const theme = useTheme()
  const navigate = useNavigate()

  // El perfil activo siempre usa el color destacado
  const cardColor = profile.isActive
    ? '#d995e5'
    : '#ddd8ff'

  const initial = profile.fullName.charAt(0).toUpperCase()

  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 2,
        p: 2,
        bgcolor: cardColor,
        height: '100%',
        boxSizing: 'border-box',
        transition: 'outline 0.2s ease',
      }}
    >
      {/* ── Header: avatar + indicador activo + acciones ── */}
      <Box sx={{ backgroundColor: '#fff', p: 2, borderRadius: 2, mb: 2 }}>
        <Box display="flex" justifyContent="center" position="relative">

          {/* ── Indicador de perfil activo / botón activar (esquina izquierda) ── */}
          {profile.isActive ? (
            <Tooltip title="Perfil evaluador activo">
              <CheckCircleIcon
                sx={{
                  fontSize: '2rem',
                  position: 'absolute',
                  top: '-3px',
                  left: '-3px',
                  color: theme.palette.success.light,
                  backgroundColor: '#fff',
                  borderRadius: '50%',
                  pointerEvents: 'none', // sólo informativo
                  border: `3px solid ${theme.palette.info.light}`,
                }}
              />
            </Tooltip>
          ) : (
            <Tooltip title="Seleccionar como perfil evaluador activo">
              <span style={{ position: 'absolute', top: 0, left: 0 }}>
                <IconButton
                  size="small"
                  onClick={() => onActivate(profile)}
                  disabled={isActivating}
                  sx={{
                    color: theme.palette.primary.light,
                    backgroundColor: '#fff',
                    borderRadius: '50%',
                    p: 0,
                    '&:hover': {
                      backgroundColor: theme.palette.primary.light,
                      color: '#fff',
                    },
                  }}
                >
                  {isActivating ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : (
                    <RadioButtonUncheckedIcon sx={{ fontSize: '2rem' }} />
                  )}
                </IconButton>
              </span>
            </Tooltip>
          )}

          {/* Avatar */}
          <Avatar
            alt={profile.fullName}
            sx={{
              width: 90,
              height: 90,
              bgcolor: profile.isActive
                ? theme.palette.success.light
                : theme.palette.primary.main,
              fontSize: 36,
              fontWeight: 700,
              transition: 'background-color 0.3s ease',
            }}
          >
            {initial}
          </Avatar>

          {/* Acciones (esquina derecha): editar + eliminar */}
          <Box sx={{ position: 'absolute', top: 0, right: 0, display: 'flex', gap: 0.5 }}>
            <Tooltip title="Editar perfil">
              <IconButton
                size="small"
                onClick={() => navigate(`/perfiles/${profile._id}/editar`)}
                sx={{
                  bgcolor: theme.palette.primary.main,
                  color: '#fff',
                  '&:hover': { bgcolor: theme.palette.primary.dark },
                }}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Eliminar perfil">
              <IconButton
                size="small"
                onClick={() => onDelete(profile)}
                sx={{
                  bgcolor: theme.palette.error.light,
                  color: '#fff',
                  '&:hover': { bgcolor: theme.palette.error.main },
                }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        <Typography variant="h6" align="center" fontWeight={700} mt={1}>
          {profile.fullName}
        </Typography>
        <Typography variant="body2" align="center" color="text.secondary">
          {profile.phrase}
        </Typography>
      </Box>

      {/* ── Chips de datos ── */}
      <CardContent sx={{ p: 0, pb: '0 !important' }}>
        <Box sx={{ backgroundColor: '#fff', p: 2, borderRadius: 2, mb: 2 }}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8, justifyContent: 'center' }}>
            <Chip icon={<Face />} label={`${profile.age} años`} size="small" />
            <Chip icon={<Work />} label={profile.profession} size="small" />
            <Chip icon={<Favorite />} label={profile.maritalStatus} size="small" />
            <Chip icon={<LocationOn />} label={profile.city} size="small" />
            <Chip icon={<PhoneAndroid />} label={DEVICE_LABELS[profile.preferredDevice]} size="small" />
            <Chip icon={<Memory />} label={TECH_LABELS[profile.techSavviness]} size="small" />
            <Tooltip title={`Arquetipo: ${profile.archetype}`}>
              <Chip
                icon={<EmojiObjects />}
                label={profile.archetype}
                color="secondary"
                size="small"
                sx={{ cursor: 'help' }}
              />
            </Tooltip>
          </Box>
        </Box>

        {/* ── Accordions de texto ── */}
        <Box sx={{ borderRadius: 2, overflow: 'hidden', backgroundColor: '#fff', p: 1 }}>
          {[
            { label: 'Biografía', content: profile.biography },
            { label: 'Personalidad', content: profile.personality },
            { label: 'Objetivos', content: Array.isArray(profile.goals) ? profile.goals.join('\n') : profile.goals },
            { label: 'Frustraciones', content: Array.isArray(profile.frustrations) ? profile.frustrations.join('\n') : profile.frustrations },
          ].map(({ label, content }) => (
            <Accordion key={label} elevation={0} disableGutters>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography fontWeight={600} variant="body2">{label}</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>{content}</Typography>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      </CardContent>
    </Card>
  )
}
