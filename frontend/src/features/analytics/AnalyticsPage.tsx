import PageHead from '@/components/ui/PageHead';
import { useDashboardData } from '@/features/dashboard/DashboardDataContext';
import DataToolbar from '@/features/dashboard/DataToolbar';
import AnalyticsPanels from './AnalyticsPanels';

export default function AnalyticsPage() {
  const { analytics, analyticsLoading } = useDashboardData();

  return (
    <>
      <PageHead eyebrow="Cruzamentos" title="Análises" description="Relações entre empresas, cargos, tipos e qualidade do preenchimento." actions={<DataToolbar />} />
      <AnalyticsPanels analytics={analytics} loading={analyticsLoading} />
    </>
  );
}
