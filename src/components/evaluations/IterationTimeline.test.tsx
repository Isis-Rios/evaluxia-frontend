// src/components/evaluations/IterationTimeline.test.tsx
import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import IterationTimeline from './IterationTimeline'
import type { SnapshotEvidenceItem } from '@services/snapshots/snapshots.service'

afterEach(() => {
  cleanup()
})

describe('IterationTimeline — resolución de capturas y acciones almacenadas en MongoDB', () => {
  it('renders screenshot from persisted screenshotPath and action from persisted action subdocument', () => {
    const snapshots: SnapshotEvidenceItem[] = [
      {
        _id: 'snap-1',
        evaluationId: 'eval-1',
        iteration: 1,
        url: 'https://www.wikipedia.org/',
        screenshotPath: '/uploads/evaluation_eval-1_step_1.png',
        action: {
          actionType: 'CLICK',
          description: 'Acceder al contenido en español',
          targetElement: 'a#js-link-box-es',
        },
        timestamp: '2026-11-14T14:00:00.000Z',
        headings: [{ level: 1, text: 'Wikipedia', selector: 'h1' }],
        images: [{ src: 'logo.png', alt: 'Logo', role: null, selector: 'img' }],
        buttons: [],
        links: [],
        forms: [],
        landmarks: [],
      },
    ]

    render(<IterationTimeline snapshots={snapshots} />)

    const img = screen.getByAltText('Screenshot Iteración 1') as HTMLImageElement
    expect(img).toBeTruthy()
    expect(img.src).toContain('/uploads/evaluation_eval-1_step_1.png')

    expect(screen.getByText('[CLICK] Acceder al contenido en español')).toBeTruthy()
    expect(screen.getByText(/Elemento objetivo: a#js-link-box-es/)).toBeTruthy()
    expect(screen.getByText('Imágenes: 1')).toBeTruthy()
  })

  it('connects evaluation.flowState.previousActions temporally distinguishing reflected action from action executed after capture', () => {
    const snapshots: SnapshotEvidenceItem[] = [
      {
        _id: 'snap-1',
        evaluationId: 'eval-1',
        iteration: 1,
        url: 'https://www.wikipedia.org/',
        screenshotPath: '/uploads/evaluation_eval-1_step_1.png',
        timestamp: '2026-11-14T14:00:00.000Z',
      },
    ]

    const evaluation = {
      _id: 'eval-1',
      userId: 'u-1',
      evaluatorProfileId: 'p-1',
      title: 'Wikipedia',
      type: 'website' as const,
      status: 'completed' as const,
      createdAt: '2026-11-14T14:00:00.000Z',
      updatedAt: '2026-11-14T14:01:00.000Z',
      flowState: {
        currentStep: 1,
        completedSteps: ['Navegar a la URL objetivo'],
        previousActions: [
          { actionType: 'NAVIGATE', description: 'Navegar a https://www.wikipedia.org/', result: 'success' as const },
          { actionType: 'CLICK', description: 'Hacer clic en el botón de búsqueda', result: 'failure' as const },
        ],
        blockingError: 'Timeout 10000ms',
        terminationReason: 'ACTION_FAILED' as const,
      },
    }

    render(<IterationTimeline snapshots={snapshots} evaluation={evaluation} />)

    // Barra de integridad de exploración
    expect(screen.getByText('Exploración parcial / acotada')).toBeTruthy()
    expect(screen.getByText('Acciones: 1 exitosas · 1 fallidas')).toBeTruthy()

    // Acción reflejada en la captura (Paso 1 = NAVIGATE)
    expect(screen.getByText('ACCIÓN QUE CONDUJO A ESTA CAPTURA (REFLEJADA EN PANTALLA)')).toBeTruthy()
    expect(screen.getByText('[NAVIGATE] Navegar a https://www.wikipedia.org/')).toBeTruthy()

    // Acción intentada después de tomar la captura (CLICK fallido)
    expect(screen.getByText('ACCIÓN EJECUTADA DESPUÉS DE ESTA CAPTURA')).toBeTruthy()
    expect(screen.getByText('[CLICK] Hacer clic en el botón de búsqueda')).toBeTruthy()
    expect(
      screen.getByText(/Esta acción se intentó después de guardar la captura del Paso 1 y no pudo completarse/i),
    ).toBeTruthy()
  })
})
