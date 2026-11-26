// src/components/evaluations/CriteriaCoverageMatrix.test.tsx
import { useState } from 'react'
import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import CriteriaCoverageMatrix from './CriteriaCoverageMatrix'
import FindingsAccordion from './FindingsAccordion'
import type { Finding } from '@/types/evaluation.types'

afterEach(() => {
  cleanup()
})

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
    description: 'Descripción de prueba',
    createdAt: '2026-11-14T14:00:00.000Z',
    updatedAt: '2026-11-14T14:00:00.000Z',
    ...overrides,
  }
}

describe('CriteriaCoverageMatrix + FindingsAccordion integration', () => {
  it('renders all 10 Nielsen heuristics in web mode and distinguishes FAIL, NOT_EVALUABLE with observation, and NOT_EVALUABLE without finding', () => {
    const findings: Finding[] = [
      makeFinding({
        _id: 'f-n04',
        heuristicCode: 'N-04',
        heuristicName: 'Consistencia y estándares',
        status: 'FAIL',
        description: 'Botones con terminología inconsistente.',
      }),
      makeFinding({
        _id: 'f-n01-ne',
        heuristicCode: 'N-01',
        heuristicName: 'Visibilidad del estado del sistema',
        status: 'NOT_EVALUABLE',
        severity: 'info',
        confidence: 'low',
        description: 'No se pudo comprobar feedback dinámico tras la acción.',
      }),
    ]

    render(<CriteriaCoverageMatrix findings={findings} evaluationType="website" />)

    // Verifica presencia de las 10 heurísticas N-01 a N-10
    for (const code of ['N-01', 'N-02', 'N-03', 'N-04', 'N-05', 'N-06', 'N-07', 'N-08', 'N-09', 'N-10']) {
      expect(screen.getByText(code)).toBeTruthy()
    }

    // Caso A (con veredicto): N-04 tiene botón "Ver hallazgos (1)"
    expect(screen.getByText('Incumplimiento detectado')).toBeTruthy()
    // Caso C (NOT_EVALUABLE con observación): N-01 tiene "Con observación registrada"
    expect(screen.getByText('Con observación registrada')).toBeTruthy()
    // Caso B (NOT_EVALUABLE sin hallazgo): las otras 8 heurísticas muestran "Sin hallazgos generados"
    expect(screen.getAllByText('Sin hallazgos generados')).toHaveLength(8)
  })

  it('shows excluded criteria (OUT_OF_COVERAGE) and WCAG 3.2.2 methodological note in prototype mode', () => {
    render(<CriteriaCoverageMatrix findings={[]} evaluationType="prototype" />)

    // En la pestaña Nielsen (6 aplicables, 4 excluidas)
    expect(screen.getAllByText('FUERA DE COBERTURA')).toHaveLength(4)

    // Cambiar a la pestaña WCAG (7 aplicables, 2 excluidos)
    fireEvent.click(screen.getByRole('tab', { name: /Criterios WCAG 2\.2/i }))

    expect(screen.getAllByText('FUERA DE COBERTURA')).toHaveLength(2)
    expect(screen.getByText('WCAG 4.1.2')).toBeTruthy()
    expect(screen.getByText('WCAG 2.1.1')).toBeTruthy()
    // WCAG 3.2.2 solo aparece en la nota metodológica al pie, nunca como fila de la tabla
    expect(screen.queryByText('WCAG 3.2.2')).toBeNull()
    expect(screen.getByText(/El criterio WCAG 3\.2\.2 \(Al recibir entradas/i)).toBeTruthy()
  })

  it('allows consulting the cross-domain N-04 + WCAG 1.3.1 finding from BOTH tabs and filters FindingsAccordion', () => {
    const crossFinding = makeFinding({
      _id: 'f-cross',
      findingGroup: 'ux',
      type: 'usability',
      status: 'FAIL',
      severity: 'medium',
      heuristicCode: 'N-04',
      heuristicName: 'Consistencia y estándares',
      wcagCriterion: 'WCAG 1.3.1 Información y relaciones',
      description: 'La página evaluada carece de un encabezado principal de primer nivel (<h1>).',
      evidence: [{ type: 'HEADING_STRUCTURE', value: 'h1_count: 0', selector: 'body' }],
    })
    const otherFinding = makeFinding({
      _id: 'f-other',
      findingGroup: 'accessibility',
      type: 'wcag',
      status: 'FAIL',
      severity: 'high',
      wcagCriterion: 'WCAG 1.1.1 Contenido no textual',
      description: 'La imagen carece de atributo alt.',
    })

    function Wrapper() {
      const [selected, setSelected] = useState<string | null>(null)
      return (
        <div>
          <CriteriaCoverageMatrix
            findings={[crossFinding, otherFinding]}
            evaluationType="website"
            selectedCriterion={selected}
            onSelectCriterion={setSelected}
          />
          <FindingsAccordion
            findings={[crossFinding, otherFinding]}
            evaluationType="website"
            selectedCriterion={selected}
            onClearCriterion={() => setSelected(null)}
          />
        </div>
      )
    }

    render(<Wrapper />)

    // Inicialmente están ambos hallazgos en el acordeón
    expect(screen.getByText(/carece de un encabezado principal de primer nivel/i)).toBeTruthy()
    expect(screen.getByText(/La imagen carece de atributo alt/i)).toBeTruthy()

    // En la pestaña Nielsen, N-04 tiene el botón "Filtrar por criterio (1)"
    fireEvent.click(screen.getByRole('button', { name: /Filtrar por criterio \(1\)/i }))

    // Ahora el acordeón filtra por N-04: el hallazgo transversal sigue visible y el de 1.1.1 se oculta
    expect(screen.getByText(/carece de un encabezado principal de primer nivel/i)).toBeTruthy()
    expect(screen.queryByText(/La imagen carece de atributo alt/i)).toBeNull()

    // Cambiar a la pestaña WCAG y filtrar por WCAG 1.3.1
    fireEvent.click(screen.getByRole('tab', { name: /Criterios WCAG 2\.2/i }))
    const verHallazgosButtons = screen.getAllByRole('button', { name: /Filtrar por criterio \(1\)/i })
    // Hay dos criterios con 1 hallazgo en WCAG: 1.1.1 y 1.3.1 (segundo botón)
    fireEvent.click(verHallazgosButtons[1])

    // El mismo hallazgo transversal se muestra bajo el filtro WCAG 1.3.1
    expect(screen.getByText(/carece de un encabezado principal de primer nivel/i)).toBeTruthy()
    expect(screen.queryByText(/La imagen carece de atributo alt/i)).toBeNull()
  })

  it('expands "Ver contexto y alcance" for a NOT_EVALUABLE heuristic showing all 4 sections (resultado, información recopilada, limitaciones y verificación humana)', () => {
    const snapshots = [
      {
        _id: 'snap-1',
        evaluationId: 'eval-1',
        iteration: 1,
        url: 'https://example.com',
        timestamp: '2026-11-14T14:00:00.000Z',
        headings: [{ level: 1, text: 'Título Principal', selector: 'h1' }],
        forms: [],
        buttons: [{ text: 'Cancelar', ariaLabel: null, selector: 'button.cancel' }],
        links: [{ href: '/faq', text: 'Preguntas frecuentes (FAQ)', ariaLabel: null, selector: 'a.faq' }],
      },
    ]

    render(<CriteriaCoverageMatrix findings={[]} evaluationType="website" snapshots={snapshots} />)

    // Abrir el contexto de N-04 (Consistencia y estándares)
    fireEvent.click(screen.getByRole('button', { name: /Ver contexto y alcance de N-04/i }))

    expect(screen.getByText('1. Resultado de la evaluación')).toBeTruthy()
    expect(screen.getByText('2. Información recopilada')).toBeTruthy()
    expect(screen.getByText('3. Limitaciones de la revisión')).toBeTruthy()
    expect(screen.getByText('4. Verificación humana recomendada')).toBeTruthy()

    // Verifica explicación honesta de NOT_EVALUABLE sin hallazgo y comprobación puntual de <h1>
    expect(
      screen.getByText(/Esta heurística formó parte del análisis de EvalUXIA, pero no se generó una observación individual/i),
    ).toBeTruthy()
    expect(
      screen.getByText(/Comprobación determinística puntual de encabezado principal \(<h1>\):/i),
    ).toBeTruthy()
    expect(
      screen.getByText(/Contrastando varias pantallas o secciones del producto, verificar que los botones/i),
    ).toBeTruthy()
  })
})
