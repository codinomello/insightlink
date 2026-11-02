import type { AnalyticsData, DashboardSummary } from '@/types';
import { request } from './http';

export const getSummary = () => request<DashboardSummary>('/dashboard/summary');

export const getAnalytics = () => request<AnalyticsData>('/dashboard/analytics');

/** Baixa o relatório autenticado (um <a href> não envia o header Authorization). */
export async function downloadReport(kind: 'pdf' | 'xlsx'): Promise<void> {
  const blob = await request<Blob>(`/reports/${kind}`, { as: 'blob' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `insightlink_relatorio.${kind}`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
