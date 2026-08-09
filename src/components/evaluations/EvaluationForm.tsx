// src/components/evaluations/EvaluationForm.tsx
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  TextField,
  Typography,
} from '@mui/material'
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as Yup from 'yup'

export interface EvaluationFormValues {
  title: string
  url: string
}

interface Props {
  onSubmit: (values: EvaluationFormValues) => void
  isLoading: boolean
  error?: string | null
}

const schema = Yup.object({
  title: Yup.string()
    .min(3, 'El título debe tener al menos 3 caracteres')
    .max(200, 'Máximo 200 caracteres')
    .required('El título es requerido'),
  url: Yup.string()
    .url('Ingresa una URL válida (ej. https://ejemplo.com)')
    .required('La URL es requerida'),
})

/**
 * EvaluationForm — Formulario de evaluación de sitios web.
 * Solo expone los campos necesarios para el MVP: título + URL.
 * El campo "type" se envía internamente como "website".
 */
export default function EvaluationForm({ onSubmit, isLoading, error }: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EvaluationFormValues>({
    resolver: yupResolver(schema),
    defaultValues: { title: '', url: '' },
  })

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <TextField
          label="Título de la evaluación"
          placeholder="Ej. Análisis de accesibilidad en portal bancario"
          fullWidth
          disabled={isLoading}
          error={!!errors.title}
          helperText={errors.title?.message}
          {...register('title')}
        />

        <TextField
          label="URL del sitio a evaluar"
          placeholder="https://ejemplo.com"
          fullWidth
          disabled={isLoading}
          error={!!errors.url}
          helperText={errors.url?.message ?? 'Incluye https:// en la URL'}
          {...register('url')}
        />

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={isLoading}
            startIcon={
              isLoading ? (
                <CircularProgress size={18} color="inherit" />
              ) : (
                <RocketLaunchIcon />
              )
            }
            sx={{ textTransform: 'none', fontWeight: 700 }}
          >
            {isLoading ? 'Evaluando...' : 'Ejecutar evaluación'}
          </Button>

          <Typography variant="caption" color="text.secondary">
            La evaluación puede tardar entre 30 y 90 segundos.
          </Typography>
        </Box>
      </Box>
    </Box>
  )
}
