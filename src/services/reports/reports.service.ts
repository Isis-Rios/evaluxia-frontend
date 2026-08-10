// src/services/reports/reports.service.ts
import apiClient from '@services/api/apiClient'
import type { Report } from '@/types/evaluation.types'

const BASE_URL = '/api/v1/reports'

export interface ReportResponse {
  status: 'success'
  data: Report
}

class ReportsService {
  /** GET /api/v1/reports/evaluation/:evaluationId */
  async getByEvaluationId(evaluationId: string): Promise<Report> {
    const { data } = await apiClient.get<ReportResponse>(
      `${BASE_URL}/evaluation/${evaluationId}`,
    )
    return data.data
  }
}

export const reportsService = new ReportsService()
