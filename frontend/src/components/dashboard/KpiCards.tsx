import type { DashboardSummary } from '../../types';

interface KpiCardsProps {
  summary: DashboardSummary | null;
}

interface KpiDef {
  key: keyof DashboardSummary;
  label: string;
  format?: (val: number) => string;
}

const KPI_DEFS: KpiDef[] = [
  { key: 'total', label: 'Registros no total' },
  { key: 'desafios', label: 'Desafios' },
  { key: 'projetos', label: 'Projetos' },
  { key: 'empresas', label: 'Empresas envolvidas' },
  { key: 'proponentes', label: 'Proponentes únicos' },
  {
    key: 'completude_media',
    label: 'Completude média',
    format: (v) => `${v}%`,
  },
];

export default function KpiCards({ summary }: KpiCardsProps) {
  if (!summary) return null;

  return (
    <div className="kpi-grid">
      {KPI_DEFS.map((kpi) => {
        const rawValue = summary[kpi.key];
        const numericVal = typeof rawValue === 'number' ? rawValue : 0;
        const displayValue = kpi.format ? kpi.format(numericVal) : numericVal;

        return (
          <div className="kpi-card" key={kpi.key}>
            <span className="kpi-value">{displayValue}</span>
            <span className="kpi-label">{kpi.label}</span>
          </div>
        );
      })}
    </div>
  );
}