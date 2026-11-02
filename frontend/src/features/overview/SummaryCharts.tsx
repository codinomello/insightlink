import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { ChartColumn, Inbox } from '@/components/ui/icons';
import type { DashboardSummary } from '@/types';
import ChartTooltip from '@/components/charts/ChartTooltip';
import { EmptyState, PanelSkeleton } from '@/components/ui/States';
import AnimatedNumber from '@/components/ui/AnimatedNumber';
import RankChart from '@/components/charts/RankChart';
import { PALETTE } from '@/components/charts/palette';

interface Props {
  summary: DashboardSummary | null;
  loading?: boolean;
}

export default function Charts({ summary, loading }: Props) {
  if (loading || !summary) {
    return (
      <div className="grid">
        <div className="span-8"><PanelSkeleton /></div>
        <div className="span-4"><PanelSkeleton /></div>
      </div>
    );
  }

  if (!summary.total) {
    return (
      <div className="panel">
        <EmptyState icon={<Inbox size={20} strokeWidth={1.6} />} title="Nenhum dado ainda">
          Importe um PDF ou planilha do ENIAC Link+ para ver indicadores e gráficos.
        </EmptyState>
      </div>
    );
  }

  const tipoTotal = summary.por_tipo.reduce((s, t) => s + t.quantidade, 0);

  return (
    <div className="grid">
      <section className="panel span-8 rise" style={{ ['--i' as string]: 1 }}>
        <div className="panel-head">
          <div>
            <h3 className="panel-title">Registros por empresa</h3>
            <p className="panel-sub">As {summary.por_empresa.length} empresas com mais envios</p>
          </div>
        </div>
        <div className="panel-body">
          <RankChart data={summary.por_empresa} dataKey="quantidade" name="Registros" color="var(--c1)" />
        </div>
      </section>

      <section className="panel span-4 rise" style={{ ['--i' as string]: 2 }}>
        <div className="panel-head">
          <div>
            <h3 className="panel-title">Desafios e projetos</h3>
            <p className="panel-sub">Proporção por tipo</p>
          </div>
        </div>
        <div className="panel-body">
          <div className="donut chart-box" style={{ height: 196 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={summary.por_tipo}
                  dataKey="quantidade"
                  nameKey="nome"
                  innerRadius="66%"
                  outerRadius="92%"
                  paddingAngle={3}
                  cornerRadius={4}
                  stroke="none"
                  startAngle={90}
                  endAngle={-270}
                  animationDuration={900}
                  animationEasing="ease-out"
                >
                  {summary.por_tipo.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="donut-center">
              <strong><AnimatedNumber value={tipoTotal} /></strong>
              <span>registros</span>
            </div>
          </div>
          <div className="legend" style={{ marginTop: 14 }}>
            {summary.por_tipo.map((t, i) => (
              <div className="legend-item" key={t.nome}>
                <span className="dot" style={{ background: PALETTE[i % PALETTE.length] }} />
                <span className="name">{t.nome}</span>
                <span className="val">{t.quantidade}</span>
                <span className="pct">{tipoTotal ? Math.round((t.quantidade / tipoTotal) * 100) : 0}%</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="panel span-8 rise" style={{ ['--i' as string]: 3 }}>
        <div className="panel-head">
          <div>
            <h3 className="panel-title">Cargos dos proponentes</h3>
            <p className="panel-sub">Quem mais propõe desafios e projetos</p>
          </div>
        </div>
        <div className="panel-body">
          {summary.por_cargo.length ? (
            <RankChart data={summary.por_cargo} dataKey="quantidade" name="Registros" color="var(--c2)" />
          ) : (
            <p className="panel-sub">Sem informação de cargo nos registros.</p>
          )}
        </div>
      </section>

      <section className="panel span-4 rise" style={{ ['--i' as string]: 4 }}>
        <div className="panel-head">
          <div>
            <h3 className="panel-title">Qualidade do preenchimento</h3>
            <p className="panel-sub">Quão completos estão os formulários</p>
          </div>
          <ChartColumn size={16} strokeWidth={1.6} style={{ color: 'var(--text-3)' }} />
        </div>
        <div className="panel-body">
          <div className="stat-value" style={{ marginTop: 0 }}>
            <AnimatedNumber value={summary.completude_media} decimals={1} suffix="%" />
          </div>
          <div className="meter" style={{ margin: '12px 0 18px' }}>
            <div className="meter-track"><div className={`meter-fill ${summary.completude_media >= 80 ? 'is-high' : summary.completude_media < 50 ? 'is-low' : ''}`} style={{ width: `${summary.completude_media}%` }} /></div>
          </div>
          <div className="kv" style={{ gridTemplateColumns: '1fr auto' }}>
            <dt>Palavras por registro</dt>
            <dd className="num">{Math.round(summary.palavras_media)}</dd>
            <dt>Registros por empresa</dt>
            <dd className="num">{summary.empresas ? (summary.total / summary.empresas).toFixed(1) : '—'}</dd>
          </div>
        </div>
      </section>
    </div>
  );
}
