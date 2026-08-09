// src/components/evaluations/ActiveProfileCard.tsx
import {
  Avatar,
  Box,
  Button,
  Chip,
  Typography,
} from '@mui/material'
import {
  PhoneAndroid,
  Memory,
  AccessibilityNew,
  SwapHoriz,
} from '@mui/icons-material'
import { useTheme } from '@mui/material/styles'
import { useNavigate } from 'react-router-dom'
import type { EvaluatorProfile } from '@/types/evaluatorProfile.types'

interface Props {
  profile: EvaluatorProfile
}

const DEVICE_LABELS: Record<string, string> = {
  desktop: 'Escritorio',
  mobile: 'Móvil',
  tablet: 'Tablet',
}

const TECH_LABELS: Record<string, string> = {
  low: 'Tecnología baja',
  medium: 'Tecnología media',
  high: 'Tecnología alta',
}

/**
 * ActiveProfileCard — Muestra el perfil evaluador activo en la barra lateral
 * de la página de evaluación. Solo lectura, con botón para cambiar perfil.
 */
export default function ActiveProfileCard({ profile }: Props) {
  const theme = useTheme()
  const navigate = useNavigate()
  const initial = profile.fullName.charAt(0).toUpperCase()

  return (
    <Box
      sx={{
        bgcolor: theme.palette.primary.light,
        borderRadius: 2,
        p: 2,
        border: `1px solid ${theme.palette.primary.light}`,
      }}
    >
      {/* Avatar + nombre */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2, backgroundColor: '#fff', borderRadius: '48px', padding: 1 }}>
        <Avatar
          sx={{
            bgcolor: theme.palette.success.light,
            width: 44,
            height: 44,
            fontWeight: 700,
            fontSize: 18,
          }}
        >
          {initial}
        </Avatar>
        <Box>
          <Typography variant="subtitle2" fontWeight={700} lineHeight={1.2}>
            {profile.fullName}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {profile.archetype}
          </Typography>
        </Box>
      </Box>

      {/* Chips */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.6, mb: 2, justifyContent: 'center' }}>
        <Chip
          icon={<Memory sx={{ fontSize: 14 }} />}
          label={`${profile.age} años`}
          size="small"
          sx={{ fontSize: 11, backgroundColor: '#fff' }}
        />
        <Chip
          icon={<PhoneAndroid sx={{ fontSize: 14 }} />}
          label={DEVICE_LABELS[profile.preferredDevice]}
          size="small"
          sx={{ fontSize: 11,  backgroundColor: '#fff'}}
        />
        <Chip
          icon={<Memory sx={{ fontSize: 14 }} />}
          label={TECH_LABELS[profile.techSavviness]}
          size="small"
          sx={{ fontSize: 11,  backgroundColor: '#fff' }}
        />
        {profile.accessibilityNeeds?.length > 0 && (
          <Chip
            icon={<AccessibilityNew sx={{ fontSize: 14 }} />}
            label={`${profile.accessibilityNeeds.length} necesidades`}
            size="small"
            color="secondary"
            sx={{ fontSize: 11 }}
          />
        )}
      </Box>

      {/* Botón cambiar */}
      <Button
        size="small"
        variant="outlined"
        startIcon={<SwapHoriz />}
        onClick={() => navigate('/perfiles')}
        fullWidth
        sx={{ textTransform: 'none', fontSize: 12 }}
      >
        Cambiar perfil
      </Button>
    </Box>
  )
}
