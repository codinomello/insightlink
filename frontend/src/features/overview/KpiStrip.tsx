import type { DashboardSummary } from '@/types';
import AnimatedNumber from '@/components/ui/AnimatedNumber';
import { StatsSkeleton } from '@/components/ui/States';

interface Props {
  summary: DashboardSummary | null;
  loading?: boolean;
}

export default function KpiCards({ summary, loading }: Props) {
  if (loading || !summary) return <StatsSkeleton />;

  const pct = (n: number) => (summary.total ? `${Math.round((n / summary.total) * 100)}% do total` : '—');

  const items = [
    { label: 'Registros', value: summary.total, hint: 'importados e cadastrados' },
    { label: 'Desafios', value: summary.desafios, hint: pct(summary.desafios) },
    { label: 'Projetos', value: summary.projetos, hint: pct(summary.projetos) },
    { label: 'Empresas', value: summary.empresas, hint: 'envolvidas' },
    { label: 'Proponentes', value: summary.proponentes, hint: 'pessoas distintas' },
    { label: 'Completude média', value: summary.completude_media, suffix: '%', decimals: 1, hint: 'dos formulários' },
  ];

  return (
    <div className="stats">
      {items.map((k, i) => (
        <div className="stat rise" style={{ ['--i' as string]: i }} key={k.label}>
          <div className="stat-label">{k.label}</div>
          <div className="stat-value">
            <AnimatedNumber value={k.value} decimals={k.decimals} suffix={k.suffix} />
          </div>
          <div className="stat-hint">{k.hint}</div>
        </div>
      ))}
    </div>
  );
}
