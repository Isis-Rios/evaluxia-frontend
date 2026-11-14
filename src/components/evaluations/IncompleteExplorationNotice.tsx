// src/components/evaluations/IncompleteExplorationNotice.tsx
import { useState } from 'react'
import { Alert, Box, Collapse, Link, Typography } from '@mui/material'

type TerminationReason =
  | 'NATURAL_STOP'
  | 'MAX_ITERATIONS_REACHED'
  | 'ACTION_FAILED'
  | 'INVALID_ACTION_DECISION'
  | 'EXPLORATION_ERROR'
  | 'UNKNOWN'

interface Props {
  blockingError?: string | null
  /** P1.2/P1.2.2 (backend): `evaluation.flowState.terminationReason`, ausente en evaluaciones anteriores a ese cambio. */
  terminationReason?: TerminationReason
}

/**
 * P1.3 — mensajes específicos para los motivos de terminación que P1.2/
 * P1.2.2 añadieron en el backend y que antes eran invisibles aquí: una
 * evaluación podía agotar su límite de iteraciones justo tras una acción
 * técnicamente exitosa, sin ningún `blockingError` que lo delatara (casos
 * reales: pilotos 3 y 4 de la auditoría forense P1.2). `NATURAL_STOP` y
 * `ACTION_FAILED` NO tienen entrada aquí a propósito: el primero nunca debe
 * mostrar aviso (exploración genuinamente completa y verificada); el
 * segundo ya lo cubre el mensaje genérico existente (siempre viaja con
 * `blockingError`, igual que antes de P1.2).
 */
const TERMINATION_MESSAGES: Partial<Record<TerminationReason, string>> = {
  MAX_ITERATIONS_REACHED:
    'La exploración automática alcanzó su límite de pasos justo después de ejecutar la última acción, sin llegar a capturar una vista posterior que confirmara su efecto. El análisis se realizó sobre la evidencia capturada hasta ese punto.',
  INVALID_ACTION_DECISION:
    'La exploración automática se detuvo porque el siguiente paso sugerido no pudo ejecutarse (no se identificó un elemento válido de la página). El análisis se realizó sobre la evidencia capturada hasta ese punto.',
  EXPLORATION_ERROR:
    'La exploración automática se interrumpió por un error general del sistema, no por un problema de interacción con un elemento específico de la página. El análisis se realizó sobre la evidencia capturada hasta ese punto.',
  UNKNOWN:
    'La exploración automática terminó de una forma que no se puede clasificar con la información disponible. El análisis se realizó sobre la evidencia capturada hasta ese punto.',
}

/**
 * [Revisión MVP, ampliado en P1.3] Una evaluación `completed`/
 * `auditStatus:'completed'` puede, sin embargo, haber detenido su
 * exploración automática antes de la secuencia prevista — ya sea por un
 * problema de interacción con la página (`flowState.blockingError`,
 * mensaje genérico ya existente) o, desde P1.2/P1.2.2, por agotamiento del
 * límite de iteraciones, una decisión no ejecutable, o un error general
 * (`flowState.terminationReason`, antes solo persistido en el backend, sin
 * ningún consumidor en el frontend). Este componente es deliberadamente
 * "info", no "error": la evaluación y el informe SÍ se completaron
 * correctamente, el aviso es sobre el ALCANCE de la exploración, no sobre
 * un fallo global. No cambia ningún estado — es puramente presentacional.
 */
export default function IncompleteExplorationNotice({ blockingError, terminationReason }: Props) {
  const [expanded, setExpanded] = useState(false)

  const hasNonNaturalTermination = !!terminationReason && terminationReason !== 'NATURAL_STOP'
  if (!blockingError && !hasNonNaturalTermination) return null

  // El mensaje genérico (sin cambios de texto respecto a antes de P1.3) se
  // usa cuando no hay un motivo más específico que mostrar: evaluaciones
  // históricas sin `terminationReason`, y el caso `ACTION_FAILED` (que
  // siempre viaja con `blockingError`, igual que antes).
  const useGenericMessage = !terminationReason || terminationReason === 'ACTION_FAILED'
  const message = useGenericMessage
    ? 'La exploración automática se detuvo antes de completar la secuencia prevista, por un problema de interacción con la página (por ejemplo, una ventana o superposición que no pudo cerrarse). El análisis se realizó sobre la evidencia capturada hasta ese punto.'
    : TERMINATION_MESSAGES[terminationReason] ?? TERMINATION_MESSAGES.UNKNOWN

  return (
    <Alert severity="info" sx={{ mb: 2 }}>
      <Typography variant="body2">
        {message}
        {blockingError && (
          <>
            {' '}
            <Link component="button" variant="body2" onClick={() => setExpanded((v) => !v)}>
              {expanded ? 'Ocultar detalle técnico' : 'Ver detalle técnico'}
            </Link>
          </>
        )}
      </Typography>
      {blockingError && (
        <Collapse in={expanded}>
          <Box
            component="pre"
            sx={{
              mt: 1,
              p: 1,
              bgcolor: 'rgba(0,0,0,0.04)',
              borderRadius: 1,
              fontSize: 11,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              maxHeight: 200,
              overflow: 'auto',
            }}
          >
            {blockingError}
          </Box>
        </Collapse>
      )}
    </Alert>
  )
}
