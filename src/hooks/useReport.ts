// src/hooks/useReport.ts
import { useCallback, useState } from 'react'
import { reportsService } from '@services/reports/reports.service'
import { snapshotsService, type SnapshotEvidenceItem } from '@services/snapshots/snapshots.service'
import type { Report } from '@/types/evaluation.types'

export function useReport() {
  const [report, setReport] = useState<Report | null>(null)
  const [snapshots, setSnapshots] = useState<SnapshotEvidenceItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchReportData = useCallback(async (evaluationId: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const [reportRes, snapshotsRes] = await Promise.all([
        reportsService.getByEvaluationId(evaluationId).catch(() => null),
        snapshotsService.getByEvaluationId(evaluationId).catch(() => []),
      ])
      setReport(reportRes)
      setSnapshots(snapshotsRes)
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Error al obtener el reporte de la evaluación')
    } finally {
      setIsLoading(false)
    }
  }, [])

  return {
    report,
    snapshots,
    isLoading,
    error,
    fetchReportData,
  }
}
