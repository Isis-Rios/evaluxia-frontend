// src/pages/UserEvaluatorProfiles/UserEvaluatorProfileFormPage.tsx
import { useEffect } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  FormControl,
  FormHelperText,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Snackbar,
  TextField,
  Typography,
} from '@mui/material'
import { Controller, useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as Yup from 'yup'
import { useTheme } from '@mui/material/styles'
import SaveAsIcon from '@mui/icons-material/SaveAs'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import EmojiObjectsIcon from '@mui/icons-material/EmojiObjects'
import { useNavigate, useParams } from 'react-router-dom'

import { useEvaluatorProfiles } from '@hooks/useEvaluatorProfiles'
import type { EvaluatorProfileFormValues } from '@/types/evaluatorProfile.types'

// ─── Constantes de opciones ───────────────────────────────────────────────

const CIVIL_STATUS_OPTIONS = ['Soltero/a', 'Casado/a', 'Conviviente', 'Divorciado/a', 'Separado/a', 'Viudo/a']

const ARCHETYPES = [
  { name: 'El gobernante', description: 'Necesita tener el control de la situación.' },
  { name: 'El inocente', description: 'Despreocupado, soñador con visión positiva.' },
  { name: 'El creador', description: 'Imaginativo y original. Aporta valor con ideas propias.' },
  { name: 'El explorador', description: 'Independiente y curioso. Odia la rutina.' },
  { name: 'El sabio', description: 'Busca el conocimiento y respuestas profundas.' },
  { name: 'El héroe', description: 'Valiente y fuerte. Ayuda a otros superando obstáculos.' },
  { name: 'El mago', description: 'Transformador y perceptivo. Ve más allá de lo evidente.' },
  { name: 'El bufón', description: 'Divertido y positivo. Busca hacer felices a los demás.' },
  { name: 'El rebelde', description: 'Rompe reglas para generar cambios. Audaz.' },
  { name: 'El amigo', description: 'Leal, sincero y siempre dispuesto a ayudar.' },
  { name: 'El amante', description: 'Busca armonía y afecto. Teme al rechazo.' },
  { name: 'El cuidador', description: 'Empático y entregado. Se sacrifica por los demás.' },
]

// ─── Schema de validación ─────────────────────────────────────────────────

const validationSchema = Yup.object({
  fullName: Yup.string().min(2, 'Mínimo 2 caracteres').required('Nombre requerido'),
  phrase: Yup.string().min(5, 'Mínimo 5 caracteres').required('Frase requerida'),
  age: Yup.number().typeError('Ingresa una edad válida').min(1, 'Edad mínima: 1').max(120, 'Edad máxima: 120').required('Edad requerida'),
  profession: Yup.string().min(2).required('Profesión requerida'),
  maritalStatus: Yup.string().required('Estado civil requerido'),
  country: Yup.string().min(2).required('País requerido'),
  city: Yup.string().min(2).required('Ciudad requerida'),
  archetype: Yup.string().required('Arquetipo requerido'),
  biography: Yup.string().min(10, 'Mínimo 10 caracteres').required('Biografía requerida'),
  personality: Yup.string().min(5, 'Mínimo 5 caracteres').required('Personalidad requerida'),
  goals: Yup.string().min(3, 'Ingresa al menos un objetivo').required('Objetivos requeridos'),
  frustrations: Yup.string().min(3, 'Ingresa al menos una frustración').required('Frustraciones requeridas'),
  techSavviness: Yup.string().oneOf(['low', 'medium', 'high']).required(),
  preferredDevice: Yup.string().oneOf(['desktop', 'mobile', 'tablet']).required(),
})

// ─── Componente ────────────────────────────────────────────────────────────

export default function UserEvaluatorProfileFormPage() {
  const theme = useTheme()
  const navigate = useNavigate()
  const { id } = useParams<{ id?: string }>()
  const isEditMode = !!id

  const {
    profile,
    isLoading,
    error,
    successMessage,
    fetchProfileById,
    createProfile,
    updateProfile,
    clearMessages,
  } = useEvaluatorProfiles()

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EvaluatorProfileFormValues>({
    resolver: yupResolver(validationSchema) as any,
    defaultValues: {
      fullName: '', phrase: '', age: 0, profession: '',
      maritalStatus: '', country: '', city: '', archetype: '',
      biography: '', personality: '', goals: '', frustrations: '',
      techSavviness: 'medium', preferredDevice: 'desktop',
    },
  })

  // En modo edición: cargar datos del perfil y precargar el formulario
  useEffect(() => {
    if (isEditMode && id) {
      fetchProfileById(id)
    }
  }, [isEditMode, id, fetchProfileById])

  // Precargar formulario cuando el perfil llega del servidor
  useEffect(() => {
    if (profile && isEditMode) {
      reset({
        fullName: profile.fullName,
        phrase: profile.phrase,
        age: profile.age,
        profession: profile.profession,
        maritalStatus: profile.maritalStatus,
        country: profile.country,
        city: profile.city,
        archetype: profile.archetype,
        biography: profile.biography,
        personality: profile.personality,
        goals: Array.isArray(profile.goals) ? profile.goals.join('\n') : profile.goals,
        frustrations: Array.isArray(profile.frustrations) ? profile.frustrations.join('\n') : profile.frustrations,
        techSavviness: profile.techSavviness,
        preferredDevice: profile.preferredDevice,
      })
    }
  }, [profile, isEditMode, reset])

  const onSubmit = async (data: EvaluatorProfileFormValues) => {
    // Convertir goals y frustrations de texto libre a arrays
    const goalsArray = data.goals.split('\n').map((s) => s.trim()).filter(Boolean)
    const frustrationsArray = data.frustrations.split('\n').map((s) => s.trim()).filter(Boolean)

    const dto = {
      ...data,
      age: Number(data.age),
      goals: goalsArray,
      frustrations: frustrationsArray,
      accessibilityNeeds: [],
    }

    if (isEditMode && id) {
      const updated = await updateProfile(id, dto)
      if (updated) {
        setTimeout(() => navigate('/perfiles'), 1500)
      }
    } else {
      const created = await createProfile(dto)
      if (created) {
        setTimeout(() => navigate('/perfiles'), 1500)
      }
    }
  }

  const sectionBox = { backgroundColor: '#fff', p: 2, borderRadius: 2, mb: 2 }
  const sectionTitle = { fontWeight: 600, pb: 2, pl: '14px' }

  return (
    <Box p={0}>
      {/* ── Header ── */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <IconButton onClick={() => navigate('/perfiles')} size="small">
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h5" fontWeight={600}>
          {isEditMode ? 'Editar perfil evaluador' : 'Nuevo perfil evaluador'}
        </Typography>
      </Box>

      {/* ── Error ── */}
      {error && (
        <Alert severity="error" onClose={clearMessages} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* ── Loading modo edición ── */}
      {isLoading && isEditMode && !profile && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
          <CircularProgress />
        </Box>
      )}

      {(!isLoading || !isEditMode || profile) && (
        <Card elevation={0} sx={{ borderRadius: 2, bgcolor: '#ddd8ff' }}>
          <CardContent sx={{ pb: 2 }}>
            <Box
              component="form"
              onSubmit={handleSubmit(onSubmit)}
              noValidate
            >
              {/* ── Sección 1: Información principal ── */}
              <Box sx={sectionBox}>
                <Typography variant="h6" sx={sectionTitle}>
                  Información principal del evaluador
                </Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Controller
                      name="fullName"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="Nombre y Apellido"
                          error={!!errors.fullName}
                          helperText={errors.fullName?.message}
                          disabled={isSubmitting}
                        />
                      )}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Controller
                      name="phrase"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="Frase que describe al usuario"
                          error={!!errors.phrase}
                          helperText={errors.phrase?.message}
                          disabled={isSubmitting}
                        />
                      )}
                    />
                  </Grid>
                </Grid>
              </Box>

              {/* ── Sección 2: Detalles ── */}
              <Box sx={sectionBox}>
                <Typography variant="h6" sx={sectionTitle}>
                  Detalles del evaluador
                </Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <Controller
                      name="age"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="Edad"
                          type="number"
                          error={!!errors.age}
                          helperText={errors.age?.message}
                          disabled={isSubmitting}
                        />
                      )}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <Controller
                      name="profession"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="Profesión"
                          error={!!errors.profession}
                          helperText={errors.profession?.message}
                          disabled={isSubmitting}
                        />
                      )}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <Controller
                      name="maritalStatus"
                      control={control}
                      render={({ field }) => (
                        <FormControl fullWidth error={!!errors.maritalStatus}>
                          <InputLabel>Estado civil</InputLabel>
                          <Select {...field} label="Estado civil" disabled={isSubmitting}>
                            {CIVIL_STATUS_OPTIONS.map((s) => (
                              <MenuItem key={s} value={s}>{s}</MenuItem>
                            ))}
                          </Select>
                          {errors.maritalStatus && (
                            <FormHelperText>{errors.maritalStatus.message}</FormHelperText>
                          )}
                        </FormControl>
                      )}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Controller
                      name="country"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="País"
                          error={!!errors.country}
                          helperText={errors.country?.message}
                          disabled={isSubmitting}
                        />
                      )}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Controller
                      name="city"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="Ciudad"
                          error={!!errors.city}
                          helperText={errors.city?.message}
                          disabled={isSubmitting}
                        />
                      )}
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <Controller
                      name="archetype"
                      control={control}
                      render={({ field }) => (
                        <FormControl fullWidth error={!!errors.archetype}>
                          <InputLabel>Arquetipo</InputLabel>
                          <Select {...field} label="Arquetipo" disabled={isSubmitting}>
                            {ARCHETYPES.map((a) => (
                              <MenuItem key={a.name} value={a.name}>
                                <Box display="flex" alignItems="center" gap={1}>
                                  <EmojiObjectsIcon fontSize="small" />
                                  {`${a.name}: ${a.description}`}
                                </Box>
                              </MenuItem>
                            ))}
                          </Select>
                          {errors.archetype && (
                            <FormHelperText>{errors.archetype.message}</FormHelperText>
                          )}
                        </FormControl>
                      )}
                    />
                  </Grid>
                </Grid>
              </Box>

              {/* ── Sección 3: Perfil UX ── */}
              <Box sx={sectionBox}>
                <Typography variant="h6" sx={sectionTitle}>
                  Perfil de experiencia tecnológica
                </Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Controller
                      name="techSavviness"
                      control={control}
                      render={({ field }) => (
                        <FormControl fullWidth>
                          <InputLabel>Nivel tecnológico</InputLabel>
                          <Select {...field} label="Nivel tecnológico" disabled={isSubmitting}>
                            <MenuItem value="low">Bajo — Poca experiencia digital</MenuItem>
                            <MenuItem value="medium">Medio — Usuario habitual</MenuItem>
                            <MenuItem value="high">Alto — Usuario avanzado</MenuItem>
                          </Select>
                        </FormControl>
                      )}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Controller
                      name="preferredDevice"
                      control={control}
                      render={({ field }) => (
                        <FormControl fullWidth>
                          <InputLabel>Dispositivo preferido</InputLabel>
                          <Select {...field} label="Dispositivo preferido" disabled={isSubmitting}>
                            <MenuItem value="desktop">Escritorio</MenuItem>
                            <MenuItem value="mobile">Móvil</MenuItem>
                            <MenuItem value="tablet">Tablet</MenuItem>
                          </Select>
                        </FormControl>
                      )}
                    />
                  </Grid>
                </Grid>
              </Box>

              {/* ── Sección 4: Descripción ── */}
              <Box sx={sectionBox}>
                <Typography variant="h6" sx={sectionTitle}>
                  Descripción del perfil evaluador
                </Typography>
                <Grid container spacing={2}>
                  {([
                    { name: 'biography' as const, label: 'Biografía' },
                    { name: 'personality' as const, label: 'Personalidad' },
                  ]).map(({ name, label }) => (
                    <Grid key={name} size={{ xs: 12, md: 6 }}>
                      <Controller
                        name={name}
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            fullWidth
                            multiline
                            minRows={4}
                            label={label}
                            error={!!errors[name]}
                            helperText={errors[name]?.message}
                            disabled={isSubmitting}
                          />
                        )}
                      />
                    </Grid>
                  ))}
                  {([
                    { name: 'goals' as const, label: 'Objetivos (uno por línea)' },
                    { name: 'frustrations' as const, label: 'Frustraciones (una por línea)' },
                  ]).map(({ name, label }) => (
                    <Grid key={name} size={{ xs: 12, md: 6 }}>
                      <Controller
                        name={name}
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            fullWidth
                            multiline
                            minRows={4}
                            label={label}
                            placeholder="Ingresa cada elemento en una línea separada"
                            error={!!errors[name]}
                            helperText={errors[name]?.message}
                            disabled={isSubmitting}
                          />
                        )}
                      />
                    </Grid>
                  ))}
                </Grid>
              </Box>

              {/* ── Acciones ── */}
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 1 }}>
                <Button
                  variant="outlined"
                  color="inherit"
                  onClick={() => navigate('/perfiles')}
                  disabled={isSubmitting}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={
                    isSubmitting
                      ? <CircularProgress size={16} color="inherit" />
                      : <SaveAsIcon />
                  }
                  disabled={isSubmitting}
                  sx={{ bgcolor: theme.palette.primary.main }}
                >
                  {isSubmitting
                    ? 'Guardando...'
                    : isEditMode
                      ? 'Guardar cambios'
                      : 'Crear perfil'}
                </Button>
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* ── Snackbar de éxito ── */}
      <Snackbar
        open={!!successMessage}
        autoHideDuration={3000}
        onClose={clearMessages}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={clearMessages} severity="success" variant="filled">
          {successMessage}
        </Alert>
      </Snackbar>
    </Box>
  )
}