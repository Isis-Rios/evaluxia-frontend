// src/components/evaluations/PrototypeEvaluationForm.tsx
import { useRef, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  TextField,
  Typography,
} from '@mui/material'
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch'
import ImageIcon from '@mui/icons-material/Image'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as Yup from 'yup'

export interface PrototypeEvaluationFormValues {
  title?: string
  description: string
}

export interface PrototypeEvaluationSubmitValues extends PrototypeEvaluationFormValues {
  image: File
}

interface Props {
  onSubmit: (values: PrototypeEvaluationSubmitValues) => void
  isLoading: boolean
  error?: string | null
}

const ACCEPTED_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp']
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024 // Debe coincidir con PROTOTYPE_IMAGE_MAX_BYTES del backend.

const schema = Yup.object({
  title: Yup.string().max(200, 'Máximo 200 caracteres').optional(),
  description: Yup.string()
    .min(10, 'Describe el contexto de la pantalla/prototipo (mínimo 10 caracteres)')
    .max(1000, 'Máximo 1000 caracteres')
    .required('La descripción es requerida'),
})

type FormValues = Yup.InferType<typeof schema>

/**
 * PrototypeEvaluationForm — Formulario MVP de evaluación de prototipos
 * visuales (P5, sección 24): imagen + descripción + perfil evaluador
 * (seleccionado fuera de este formulario, igual que WEB). NO implementa
 * bounding boxes, editor visual, múltiples imágenes ni anotaciones manuales.
 */
export default function PrototypeEvaluationForm({ onSubmit, isLoading, error }: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    // Mismo patrón ya usado en UserEvaluatorProfileFormPage.tsx para campos
    // opcionales con yup: el tipo de entrada/salida del resolver difiere en
    // la opcionalidad de `title`, fricción conocida de yup+RHF.
    resolver: yupResolver(schema) as any,
    defaultValues: { title: '', description: '' },
  })

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [image, setImage] = useState<File | null>(null)
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null)
  const [imageError, setImageError] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null
    if (!file) {
      setImage(null)
      setImagePreviewUrl(null)
      return
    }

    if (!ACCEPTED_MIME_TYPES.includes(file.type)) {
      setImageError('Formato no soportado. Usa PNG, JPEG o WEBP.')
      setImage(null)
      setImagePreviewUrl(null)
      return
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setImageError('La imagen excede el tamaño máximo permitido (10MB).')
      setImage(null)
      setImagePreviewUrl(null)
      return
    }

    setImageError(null)
    setImage(file)
    setImagePreviewUrl(URL.createObjectURL(file))
  }

  const submit = (values: FormValues) => {
    if (!image) {
      setImageError('Selecciona una imagen del prototipo.')
      return
    }
    onSubmit({ title: values.title, description: values.description, image })
  }

  return (
    <Box component="form" onSubmit={handleSubmit(submit)} noValidate>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {/* ── Selector de imagen + preview ── */}
        <Box>
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_MIME_TYPES.join(',')}
            hidden
            disabled={isLoading}
            onChange={handleFileChange}
          />
          <Box
            onClick={() => !isLoading && fileInputRef.current?.click()}
            sx={{
              border: '1.5px dashed #c0c0c0',
              borderRadius: 2,
              p: 2,
              textAlign: 'center',
              cursor: isLoading ? 'default' : 'pointer',
              opacity: isLoading ? 0.6 : 1,
              '&:hover': isLoading ? undefined : { borderColor: '#6a57e3' },
            }}
          >
            {imagePreviewUrl ? (
              <Box
                component="img"
                src={imagePreviewUrl}
                alt="Vista previa del prototipo"
                sx={{ maxWidth: '100%', maxHeight: 280, borderRadius: 1 }}
              />
            ) : (
              <Box sx={{ py: 3, color: 'text.secondary' }}>
                <ImageIcon sx={{ fontSize: 36, opacity: 0.4 }} />
                <Typography variant="body2" mt={1}>
                  Haz clic para subir una imagen (PNG, JPEG o WEBP, máx. 10MB)
                </Typography>
              </Box>
            )}
          </Box>
          {imageError && (
            <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
              {imageError}
            </Typography>
          )}
        </Box>

        <TextField
          label="Título de la evaluación (opcional)"
          placeholder="Ej. Checkout móvil v2"
          fullWidth
          disabled={isLoading}
          error={!!errors.title}
          helperText={errors.title?.message}
          {...register('title')}
        />

        <TextField
          label="Descripción del prototipo"
          placeholder="Ej. Pantalla de checkout de una aplicación de comercio electrónico. El usuario debe seleccionar el método de pago y confirmar la compra."
          fullWidth
          multiline
          minRows={3}
          disabled={isLoading}
          error={!!errors.description}
          helperText={errors.description?.message ?? 'Explica el contexto de la pantalla — es la única fuente de intención además de la imagen y el perfil.'}
          {...register('description')}
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
            La evaluación puede tardar entre 20 y 60 segundos.
          </Typography>
        </Box>
      </Box>
    </Box>
  )
}
