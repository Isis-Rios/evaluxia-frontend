// src/components/evaluator-profiles/DeleteProfileDialog.tsx
import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import type { EvaluatorProfile } from '@/types/evaluatorProfile.types'

interface Props {
  open: boolean
  profile: EvaluatorProfile | null
  isLoading: boolean
  onConfirm: () => void
  onCancel: () => void
}

/**
 * DeleteProfileDialog — Modal de confirmación antes de eliminar un perfil.
 * Nunca elimina directamente; delega la acción al componente padre via onConfirm.
 */
export default function DeleteProfileDialog({
  open,
  profile,
  isLoading,
  onConfirm,
  onCancel,
}: Props) {
  return (
    <Dialog open={open} onClose={onCancel} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <WarningAmberIcon color="error" />
        Eliminar perfil evaluador
      </DialogTitle>
      <DialogContent>
        <DialogContentText>
          ¿Estás seguro de que deseas eliminar el perfil de{' '}
          <strong>{profile?.fullName}</strong>? Esta acción no se puede deshacer.
        </DialogContentText>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button
          onClick={onCancel}
          disabled={isLoading}
          variant="outlined"
          color="inherit"
        >
          Cancelar
        </Button>
        <Button
          onClick={onConfirm}
          disabled={isLoading}
          variant="contained"
          color="error"
          startIcon={isLoading ? <CircularProgress size={16} color="inherit" /> : null}
        >
          {isLoading ? 'Eliminando...' : 'Eliminar'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
