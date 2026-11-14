// src/components/evaluations/IncompleteExplorationNotice.test.tsx
import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'
import IncompleteExplorationNotice from './IncompleteExplorationNotice'

afterEach(() => {
  cleanup()
})

/**
 * [Revisión MVP] Confirma que la evaluación `completed` cuya exploración se
 * detuvo antes (flowState.blockingError) ahora comunica ese hecho, y que
 * una evaluación sin blockingError no muestra ningún aviso nuevo.
 */
describe('IncompleteExplorationNotice', () => {
  it('renders nothing when blockingError is absent', () => {
    const { container } = render(<IncompleteExplorationNotice blockingError={null} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders nothing when blockingError is undefined', () => {
    const { container } = render(<IncompleteExplorationNotice />)
    expect(container.firstChild).toBeNull()
  })

  it('renders an informational (not error) notice when blockingError is present', () => {
    render(<IncompleteExplorationNotice blockingError="Action failed: page.click: Timeout 10000ms exceeded." />)
    expect(screen.getByText(/La exploración automática se detuvo/)).toBeTruthy()
    // Colapsado por defecto: el control para expandir el detalle está presente.
    expect(screen.getByText('Ver detalle técnico')).toBeTruthy()
  })

  it('reveals the raw technical detail when expanded', () => {
    render(<IncompleteExplorationNotice blockingError="Action failed: page.click: Timeout 10000ms exceeded." />)
    fireEvent.click(screen.getByText('Ver detalle técnico'))
    expect(screen.getByText(/Timeout 10000ms exceeded/)).toBeTruthy()
  })

  // [P1.3] terminationReason (P1.2/P1.2.2) — antes invisible en el frontend.
  it('renders nothing when terminationReason is NATURAL_STOP and there is no blockingError', () => {
    const { container } = render(<IncompleteExplorationNotice blockingError={null} terminationReason="NATURAL_STOP" />)
    expect(container.firstChild).toBeNull()
  })

  it('renders a specific notice for MAX_ITERATIONS_REACHED even without blockingError (real piloto 3/4 case)', () => {
    render(<IncompleteExplorationNotice blockingError={null} terminationReason="MAX_ITERATIONS_REACHED" />)
    expect(screen.getByText(/alcanzó su límite de pasos/)).toBeTruthy()
    // Sin blockingError no hay nada que expandir.
    expect(screen.queryByText('Ver detalle técnico')).toBeNull()
  })

  it('renders a specific notice for INVALID_ACTION_DECISION', () => {
    render(<IncompleteExplorationNotice blockingError="Invalid action decision: actionType 'CLICK' requires a targetElement, but none was provided." terminationReason="INVALID_ACTION_DECISION" />)
    expect(screen.getByText(/no pudo ejecutarse/)).toBeTruthy()
    // Aquí sí hay blockingError, así que el detalle técnico sigue disponible.
    expect(screen.getByText('Ver detalle técnico')).toBeTruthy()
  })

  it('renders a specific notice for EXPLORATION_ERROR', () => {
    render(<IncompleteExplorationNotice blockingError="[EVALUATION_ERROR 500] boom" terminationReason="EXPLORATION_ERROR" />)
    expect(screen.getByText(/error general del sistema/)).toBeTruthy()
  })

  it('renders a specific notice for UNKNOWN', () => {
    render(<IncompleteExplorationNotice blockingError={null} terminationReason="UNKNOWN" />)
    expect(screen.getByText(/no se puede clasificar/)).toBeTruthy()
  })

  it('uses the original generic message for ACTION_FAILED, unchanged from before P1.3', () => {
    render(<IncompleteExplorationNotice blockingError="Action failed: page.click: Timeout 10000ms exceeded." terminationReason="ACTION_FAILED" />)
    expect(screen.getByText(/La exploración automática se detuvo antes de completar la secuencia prevista/)).toBeTruthy()
  })

  it('uses the original generic message when terminationReason is absent (historical evaluations, pre-P1.2)', () => {
    render(<IncompleteExplorationNotice blockingError="Action failed: page.click: Timeout 10000ms exceeded." />)
    expect(screen.getByText(/La exploración automática se detuvo antes de completar la secuencia prevista/)).toBeTruthy()
  })
})
