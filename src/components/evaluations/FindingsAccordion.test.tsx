// src/components/evaluations/FindingsAccordion.test.tsx
import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import FindingsAccordion from './FindingsAccordion'
import type { Finding } from '@/types/evaluation.types'

afterEach(() => {
  cleanup()
})

/**
 * [Revisión MVP] FindingsAccordion renderizaba `type`/`selector`/`property`/
 * `value` de cada ítem de evidencia pero nunca `elementDescription`/`region`/
 * `context` -- para evidencia `VISUAL_OBSERVATION` (prototipos) estos son a
 * menudo los ÚNICOS campos presentes (el prompt del backend instruye
 * explícitamente a Gemini a citar solo elementDescription/context cuando
 * ninguna property de la whitelist representa fielmente lo observado), así
 * que el panel de "Evidencia Técnica" aparecía vacío aunque hasEvidence
 * fuera true.
 */
function makeFinding(overrides: Partial<Finding> = {}): Finding {
  return {
    _id: 'finding-1',
    id: 'finding-1',
    evaluationId: 'eval-1',
    iteration: 1,
    findingGroup: 'ux',
    status: 'FAIL',
    severity: 'medium',
    confidence: 'high',
    description: 'Dos botones distintos usan el mismo texto "Enviar".',
    recommendation: 'Diferenciar el texto de cada botón.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  }
}

describe('FindingsAccordion — evidencia VISUAL_OBSERVATION (prototipos)', () => {
  it('renders elementDescription, region and context even when property/value are absent', () => {
    const finding = makeFinding({
      evidence: [
        {
          type: 'VISUAL_OBSERVATION',
          elementDescription: 'botón Enviar del formulario de contacto',
          region: 'center',
          context: 'Pertenece a la tarjeta del formulario de contacto.',
        },
      ],
    })

    render(<FindingsAccordion findings={[finding]} />)

    expect(screen.getByText(/botón Enviar del formulario de contacto/)).toBeTruthy()
    expect(screen.getByText(/Región: center/)).toBeTruthy()
    expect(screen.getByText(/Pertenece a la tarjeta del formulario de contacto\./)).toBeTruthy()
  })

  it('still renders property/value for evidence that has them, alongside the new fields', () => {
    const finding = makeFinding({
      evidence: [
        {
          type: 'VISUAL_OBSERVATION',
          elementDescription: "Ícono de guion '-' en la esquina superior derecha",
          property: 'visibleText',
          value: '',
          context: 'El ícono es pequeño y se presenta de forma aislada sin texto acompañante.',
        },
      ],
    })

    render(<FindingsAccordion findings={[finding]} />)

    expect(screen.getByText(/Ícono de guion/)).toBeTruthy()
    expect(screen.getByText(/Property: visibleText/)).toBeTruthy()
  })

  it('does not render an evidence item for findings with no evidence at all', () => {
    const finding = makeFinding({ evidence: [] })
    render(<FindingsAccordion findings={[finding]} />)
    expect(screen.getByText('No hay evidencia técnica disponible.')).toBeTruthy()
  })
})

/**
 * P1.5.2 — desde que el backend persiste también `NOT_EVALUABLE` (antes
 * `findings` solo podía traer `FAIL`), confirma que ambos estados aparecen
 * correctamente en el listado, cada uno con su propio badge -- este
 * componente nunca filtró por status, así que esto confirma que ya estaba
 * listo para el cambio sin necesitar ningún ajuste propio.
 */
describe('FindingsAccordion — hallazgos FAIL y NOT_EVALUABLE conviven en el listado (P1.5.2)', () => {
  it('renders both a FAIL and a NOT_EVALUABLE finding, each with its own status badge', () => {
    const findings = [
      makeFinding({ _id: 'f1', status: 'FAIL', description: 'El botón "Enviar" carece de nombre accesible.' }),
      makeFinding({
        _id: 'f2',
        status: 'NOT_EVALUABLE',
        description: 'No fue posible determinar si el ícono tiene un texto alternativo equivalente.',
      }),
    ]
    render(<FindingsAccordion findings={findings} />)

    expect(screen.getByText('El botón "Enviar" carece de nombre accesible.')).toBeTruthy()
    expect(screen.getByText('No fue posible determinar si el ícono tiene un texto alternativo equivalente.')).toBeTruthy()
    expect(screen.getAllByText('FAIL').length).toBeGreaterThan(0)
    expect(screen.getAllByText('NOT_EVALUABLE').length).toBeGreaterThan(0)
  })
})

describe('FindingsAccordion — filtrado interactivo por estado (Todos, FAIL, NOT_EVALUABLE, PASS)', () => {
  it('renders filter chips with accurate counts for each status', () => {
    const findings = [
      makeFinding({ _id: 'f1', status: 'FAIL', description: 'Fallo de contraste 1.3:1' }),
      makeFinding({ _id: 'f2', status: 'FAIL', description: 'Fallo de etiqueta ausente' }),
      makeFinding({ _id: 'f3', status: 'NOT_EVALUABLE', description: 'Contraste no determinable' }),
      makeFinding({ _id: 'f4', status: 'PASS', description: 'Enlace con texto accesible' }),
    ]

    render(<FindingsAccordion findings={findings} />)

    expect(screen.getByText('Todos (4)')).toBeTruthy()
    expect(screen.getByText('FAIL (2)')).toBeTruthy()
    expect(screen.getByText('NOT_EVALUABLE (1)')).toBeTruthy()
    expect(screen.getByText('PASS (1)')).toBeTruthy()
  })

  it('filters list when clicking on a specific status chip', async () => {
    const { fireEvent } = await import('@testing-library/react')
    const findings = [
      makeFinding({ _id: 'f1', status: 'FAIL', description: 'Fallo de contraste 1.3:1' }),
      makeFinding({ _id: 'f2', status: 'NOT_EVALUABLE', description: 'Contraste no determinable' }),
      makeFinding({ _id: 'f3', status: 'PASS', description: 'Enlace con texto accesible' }),
    ]

    render(<FindingsAccordion findings={findings} />)

    // Inicialmente todos están presentes
    expect(screen.getByText('Fallo de contraste 1.3:1')).toBeTruthy()
    expect(screen.getByText('Contraste no determinable')).toBeTruthy()
    expect(screen.getByText('Enlace con texto accesible')).toBeTruthy()

    // Clic en filtro FAIL
    fireEvent.click(screen.getByText('FAIL (1)'))
    expect(screen.getByText('Fallo de contraste 1.3:1')).toBeTruthy()
    expect(screen.queryByText('Contraste no determinable')).toBeNull()
    expect(screen.queryByText('Enlace con texto accesible')).toBeNull()

    // Clic en filtro PASS
    fireEvent.click(screen.getByText('PASS (1)'))
    expect(screen.queryByText('Fallo de contraste 1.3:1')).toBeNull()
    expect(screen.queryByText('Contraste no determinable')).toBeNull()
    expect(screen.getByText('Enlace con texto accesible')).toBeTruthy()

    // Clic en filtro NOT_EVALUABLE
    fireEvent.click(screen.getByText('NOT_EVALUABLE (1)'))
    expect(screen.queryByText('Fallo de contraste 1.3:1')).toBeNull()
    expect(screen.getByText('Contraste no determinable')).toBeTruthy()
    expect(screen.queryByText('Enlace con texto accesible')).toBeNull()

    // Clic en Todos
    fireEvent.click(screen.getByText('Todos (3)'))
    expect(screen.getByText('Fallo de contraste 1.3:1')).toBeTruthy()
    expect(screen.getByText('Contraste no determinable')).toBeTruthy()
    expect(screen.getByText('Enlace con texto accesible')).toBeTruthy()
  })

  it('shows an empty state message when a status filter has 0 matching findings', async () => {
    const { fireEvent } = await import('@testing-library/react')
    const findings = [
      makeFinding({ _id: 'f1', status: 'FAIL', description: 'Fallo único' }),
    ]

    render(<FindingsAccordion findings={findings} />)

    // Clic en PASS (que tiene 0)
    fireEvent.click(screen.getByText('PASS (0)'))
    expect(screen.getByText(/No se encontraron hallazgos con estado/)).toBeTruthy()
    expect(screen.getByText('PASS')).toBeTruthy()
  })
})
