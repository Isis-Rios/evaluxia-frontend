// src/components/evaluations/PrototypeEvaluationForm.test.tsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react'
import PrototypeEvaluationForm from './PrototypeEvaluationForm'
import type { PrototypeEvaluationSubmitValues } from './PrototypeEvaluationForm'

// jsdom no implementa createObjectURL/revokeObjectURL — se stubean para que
// el preview de imagen (`URL.createObjectURL(file)`) no lance en el entorno
// de test. Mismo patrón que EvaluationSummary.test.tsx para `cleanup`.
beforeEach(() => {
  global.URL.createObjectURL = vi.fn(() => 'blob:mock-preview-url')
})

afterEach(() => {
  cleanup()
})

function makeImageFile(name = 'prototype.png', type = 'image/png'): File {
  return new File(['fake-image-bytes'], name, { type })
}

describe('PrototypeEvaluationForm (P5 — validación mínima)', () => {
  it('renders the dropzone, title and description fields, and the submit button', () => {
    render(<PrototypeEvaluationForm onSubmit={vi.fn()} isLoading={false} />)

    expect(screen.getByText(/Haz clic para subir una imagen/i)).toBeTruthy()
    expect(screen.getByLabelText(/Título de la evaluación/i)).toBeTruthy()
    expect(screen.getByLabelText(/Descripción del prototipo/i)).toBeTruthy()
    expect(screen.getByRole('button', { name: /Ejecutar evaluación/i })).toBeTruthy()
  })

  it('shows an image preview after selecting a valid file', async () => {
    const { container } = render(<PrototypeEvaluationForm onSubmit={vi.fn()} isLoading={false} />)
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement
    expect(fileInput).toBeTruthy()

    fireEvent.change(fileInput, { target: { files: [makeImageFile()] } })

    await waitFor(() => {
      expect(screen.getByAltText(/Vista previa del prototipo/i)).toBeTruthy()
    })
  })

  it('rejects an unsupported file type client-side (e.g. SVG) without calling onSubmit', async () => {
    const onSubmit = vi.fn()
    const { container } = render(<PrototypeEvaluationForm onSubmit={onSubmit} isLoading={false} />)
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement

    fireEvent.change(fileInput, { target: { files: [makeImageFile('evil.svg', 'image/svg+xml')] } })

    await waitFor(() => {
      expect(screen.getByText(/Formato no soportado/i)).toBeTruthy()
    })
    expect(screen.queryByAltText(/Vista previa del prototipo/i)).toBeNull()
  })

  it('requires a description (min 10 chars) and blocks submit when missing', async () => {
    const onSubmit = vi.fn()
    const { container } = render(<PrototypeEvaluationForm onSubmit={onSubmit} isLoading={false} />)
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement
    fireEvent.change(fileInput, { target: { files: [makeImageFile()] } })

    fireEvent.click(screen.getByRole('button', { name: /Ejecutar evaluación/i }))

    // yup reporta el mensaje de longitud mínima para un campo vacío (el
    // valor '' no alcanza `.min(10)`) -- se verifica el mensaje REAL que
    // produce la librería, no uno asumido.
    await waitFor(() => {
      expect(screen.getByText(/mínimo 10 caracteres/i)).toBeTruthy()
    })
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('blocks submit and shows an error when no image was selected, even with a valid description', async () => {
    const onSubmit = vi.fn()
    render(<PrototypeEvaluationForm onSubmit={onSubmit} isLoading={false} />)

    fireEvent.change(screen.getByLabelText(/Descripción del prototipo/i), {
      target: { value: 'Pantalla de checkout ficticia con dos problemas controlados.' },
    })
    fireEvent.click(screen.getByRole('button', { name: /Ejecutar evaluación/i }))

    await waitFor(() => {
      expect(screen.getByText(/Selecciona una imagen del prototipo/i)).toBeTruthy()
    })
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('builds the correct submit payload (title, description, image) when the form is valid', async () => {
    let captured: PrototypeEvaluationSubmitValues | null = null
    const onSubmit = vi.fn((values: PrototypeEvaluationSubmitValues) => {
      captured = values
    })
    const { container } = render(<PrototypeEvaluationForm onSubmit={onSubmit} isLoading={false} />)

    const file = makeImageFile()
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement
    fireEvent.change(fileInput, { target: { files: [file] } })

    fireEvent.change(screen.getByLabelText(/Título de la evaluación/i), { target: { value: 'Checkout móvil v2' } })
    fireEvent.change(screen.getByLabelText(/Descripción del prototipo/i), {
      target: { value: 'Pantalla de checkout ficticia con dos problemas controlados.' },
    })

    fireEvent.click(screen.getByRole('button', { name: /Ejecutar evaluación/i }))

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
    expect(captured).toEqual({
      title: 'Checkout móvil v2',
      description: 'Pantalla de checkout ficticia con dos problemas controlados.',
      image: file,
    })
  })

  it('disables the submit button and shows the loading label while isLoading is true', () => {
    render(<PrototypeEvaluationForm onSubmit={vi.fn()} isLoading={true} />)
    const button = screen.getByRole('button', { name: /Evaluando\.\.\./i })
    expect(button).toBeTruthy()
    expect((button as HTMLButtonElement).disabled).toBe(true)
  })

  it('renders the error alert when `error` is provided', () => {
    render(<PrototypeEvaluationForm onSubmit={vi.fn()} isLoading={false} error="El servidor rechazó la solicitud." />)
    expect(screen.getByText('El servidor rechazó la solicitud.')).toBeTruthy()
  })
})
