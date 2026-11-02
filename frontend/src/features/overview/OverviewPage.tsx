import PageHead from '@/components/ui/PageHead';
import { useAuth } from '@/features/auth/AuthContext';
import { useDashboardData } from '@/features/dashboard/DashboardDataContext';
import DataToolbar from '@/features/dashboard/DataToolbar';
import KpiStrip from './KpiStrip';
import SummaryCharts from './SummaryCharts';
import UploadDropzone from './UploadDropzone';

export default function OverviewPage() {
  const { isAdmin } = useAuth();
  const { summary, loading, error, refresh } = useDashboardData();

  return (
    <>
      <PageHead eyebrow="Visão geral" title="Painel" description="Indicadores consolidados dos desafios e projetos importados." actions={<DataToolbar />} />
      {error && <div className="alert alert-error fade" style={{ marginBottom: 16 }}>{error}</div>}
      {isAdmin && <UploadDropzone onImported={refresh} />}
      <KpiStrip summary={summary} loading={loading} />
      <SummaryCharts summary={summary} loading={loading} />
    </>
  );
}
