import {
  Bar, BarChart, CartesianGrid, PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart,
  ResponsiveContainer, Scatter, ScatterChart, Tooltip, Treemap, XAxis, YAxis, ZAxis,
} from 'recharts';
import { FlaskConical } from '@/components/ui/icons';
import type { AnalyticsData } from '@/types';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { truncate } from '@/lib/format';
import AxisTick from '@/components/charts/AxisTick';
import ChartTooltip from '@/components/charts/ChartTooltip';
import { EmptyState, PanelSkeleton } from '@/components/ui/States';
import { PALETTE } from '@/components/charts/palette';
import Heatmap from './Heatmap';

interface Props {
  analytics: AnalyticsData | null;
  loading: boolean;
}

const AXIS_TICK = { fill: 'var(--text-3)', fontSize: 11.5 };
const SHORT_AXIS: Record<string, string> = {
  'Volume de Registros': 'Volume',
  'Completude Média': 'Completude',
  'Diversidade de Cargos': 'Cargos',
  'Volume de Texto': 'Texto',
};

function Legend({ items }: { items: { name: string; color: string }[] }) {
  return (
    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 12 }}>
      {items.map((i) => (
        <span key={i.name} className="legend-item" style={{ gap: 7 }}>
          <span className="dot" style={{ background: i.color }} />
          <span className="name" style={{ flex: 'none' }}>{i.name}</span>
        </span>
      ))}
    </div>
  );
}

const describeCorr = (r: number) => {
  const a = Math.abs(r);
  const força = a < 0.2 ? 'praticamente nula' : a < 0.4 ? 'fraca' : a < 0.7 ? 'moderada' : 'forte';
  if (a < 0.2) return `Correlação ${força}`;
  return `Correlação ${força} ${r > 0 ? 'positiva' : 'negativa'}`;
};

export default function AnalyticsPanels({ analytics, loading }: Props) {
  const narrow = useMediaQuery('(max-width: 720px)');

  if (loading) {
    return (
      <div className="grid">
        <div className="span-12"><PanelSkeleton height={220} /></div>
        <div className="span-6"><PanelSkeleton /></div>
        <div className="span-6"><PanelSkeleton /></div>
      </div>
    );
  }
  if (!analytics) {
    return (
      <div className="panel">
        <EmptyState icon={<FlaskConical size={20} strokeWidth={1.6} />} title="Análises indisponíveis">
          Não foi possível carregar os cruzamentos agora. Atualize a página em instantes.
        </EmptyState>
      </div>
    );
  }

  const { crosstab_empresa_cargo: heat, crosstab_empresa_tipo: stacked, correlacao_palavras_completude: corr,
    completude_por_tipo: completude, radar_por_empresa: radar, treemap_empresas: tree } = analytics;

  if (!heat.empresas.length && !stacked.length && !tree.length) {
    return (
      <div className="panel">
        <EmptyState icon={<FlaskConical size={20} strokeWidth={1.6} />} title="Sem dados para cruzar">
          Importe mais registros para liberar as análises avançadas.
        </EmptyState>
      </div>
    );
  }

  const stackKeys = Array.from(new Set(stacked.flatMap((r) => Object.keys(r).filter((k) => k !== 'empresa'))));
  const tipos = Array.from(new Set(corr.pontos.map((p) => p.tipo || 'Sem tipo')));
  const stackHeight = Math.max(120, stacked.length * 34 + 8);

  return (
    <div className="grid">
      <section className="panel span-12 rise" style={{ ['--i' as string]: 0 }}>
        <div className="panel-head">
          <div>
            <h3 className="panel-title">Empresa × cargo</h3>
            <p className="panel-sub">Quantos registros cada empresa enviou por cargo do proponente</p>
          </div>
        </div>
        <div className="panel-body"><Heatmap data={heat} /></div>
      </section>

      <section className="panel span-6 rise" style={{ ['--i' as string]: 1 }}>
        <div className="panel-head">
          <div>
            <h3 className="panel-title">Desafios e projetos por empresa</h3>
            <p className="panel-sub">Composição dos envios das maiores empresas</p>
          </div>
        </div>
        <div className="panel-body">
          <Legend items={stackKeys.map((k, i) => ({ name: k, color: PALETTE[i % PALETTE.length]! }))} />
          <div className="chart-box" style={{ height: stackHeight }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stacked} layout="vertical" margin={{ top: 0, right: 8, bottom: 0, left: 0 }} barCategoryGap={10}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="empresa" width={narrow ? 112 : 176} tickLine={false} axisLine={false} interval={0}
                  tick={<AxisTick max={narrow ? 15 : 28} />} />
                <Tooltip cursor={{ fill: 'var(--hover)' }} content={<ChartTooltip title={(l) => String(l)} />} />
                {stackKeys.map((k, i) => (
                  <Bar key={k} dataKey={k} stackId="a" fill={PALETTE[i % PALETTE.length]} barSize={14}
                    radius={i === stackKeys.length - 1 ? [0, 4, 4, 0] : 0} animationDuration={900} animationEasing="ease-out" />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section className="panel span-6 rise" style={{ ['--i' as string]: 2 }}>
        <div className="panel-head">
          <div>
            <h3 className="panel-title">Completude por tipo</h3>
            <p className="panel-sub">Faixa de mínimo a máximo, com a média marcada</p>
          </div>
        </div>
        <div className="panel-body">
          <div className="range-list">
            {completude.map((c) => (
              <div key={c.tipo}>
                <div className="range-row-head">
                  <strong style={{ fontWeight: 550 }}>{c.tipo} <span>· {c.quantidade} registro{c.quantidade === 1 ? '' : 's'}</span></strong>
                  <strong className="num" style={{ fontWeight: 550 }}>{c.media}% <span>média</span></strong>
                </div>
                <div className="range-track">
                  <div className="range-span" style={{ left: `${c.minimo}%`, width: `${Math.max(1.5, c.maximo - c.minimo)}%` }} />
                  <div className="range-avg" style={{ left: `${c.media}%` }} />
                </div>
                <div className="range-scale"><span>mín {c.minimo}%</span><span>máx {c.maximo}%</span></div>
              </div>
            ))}
            {!completude.length && <p className="panel-sub">Sem dados.</p>}
          </div>
        </div>
      </section>

      <section className="panel span-6 rise" style={{ ['--i' as string]: 3 }}>
        <div className="panel-head">
          <div>
            <h3 className="panel-title">Volume de texto × completude</h3>
            <p className="panel-sub">{describeCorr(corr.coeficiente)} · r = {corr.coeficiente.toFixed(2)}</p>
          </div>
        </div>
        <div className="panel-body">
          {corr.pontos.length < 2 ? (
            <p className="panel-sub">São necessários ao menos 2 registros com texto.</p>
          ) : (
            <>
              <Legend items={tipos.map((t, i) => ({ name: t, color: PALETTE[i % PALETTE.length]! }))} />
              <div className="chart-box" style={{ height: 250 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 6, right: 12, bottom: 4, left: -12 }}>
                    <CartesianGrid stroke="var(--line)" vertical={false} />
                    <XAxis type="number" dataKey="palavras" name="Palavras" tickLine={false} axisLine={{ stroke: 'var(--line-2)' }} tick={AXIS_TICK} />
                    <YAxis type="number" dataKey="completude" name="Completude" unit="%" domain={[0, 100]} tickLine={false} axisLine={false} tick={AXIS_TICK} />
                    <ZAxis range={[64, 64]} />
                    <Tooltip cursor={{ strokeDasharray: '3 3', stroke: 'var(--line-2)' }}
                      content={<ChartTooltip title={(_, p) => p[0]?.payload?.titulo} valueFormat={(v, n) => (n === 'Completude' ? `${v}%` : String(v))} />} />
                    {tipos.map((t, i) => (
                      <Scatter key={t} name={t} data={corr.pontos.filter((p) => (p.tipo || 'Sem tipo') === t)} fill={PALETTE[i % PALETTE.length]}
                        fillOpacity={0.85} animationDuration={800} />
                    ))}
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
        </div>
      </section>

      <section className="panel span-6 rise" style={{ ['--i' as string]: 4 }}>
        <div className="panel-head">
          <div>
            <h3 className="panel-title">Perfil das maiores empresas</h3>
            <p className="panel-sub">Quatro dimensões normalizadas de 0 a 100</p>
          </div>
        </div>
        <div className="panel-body">
          {radar.empresas.length ? (
            <>
              <Legend items={radar.empresas.map((e, i) => ({ name: truncate(e, 24), color: PALETTE[i % PALETTE.length]! }))} />
              <div className="chart-box" style={{ height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radar.dados} outerRadius="72%">
                    <PolarGrid stroke="var(--line-2)" />
                    <PolarAngleAxis dataKey="eixo" tick={{ fill: 'var(--text-2)', fontSize: 12 }} tickFormatter={(v: string) => SHORT_AXIS[v] || v} />
                    <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                    <Tooltip content={<ChartTooltip title={(l) => String(l)} valueFormat={(v) => v.toFixed(0)} />} />
                    {radar.empresas.map((e, i) => (
                      <Radar key={e} name={e} dataKey={e} stroke={PALETTE[i % PALETTE.length]} fill={PALETTE[i % PALETTE.length]}
                        fillOpacity={0.12} strokeWidth={1.75} animationDuration={900} />
                    ))}
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </>
          ) : <p className="panel-sub">Sem dados.</p>}
        </div>
      </section>

      <section className="panel span-12 rise" style={{ ['--i' as string]: 5 }}>
        <div className="panel-head">
          <div>
            <h3 className="panel-title">Peso de cada empresa</h3>
            <p className="panel-sub">Área proporcional ao número de registros</p>
          </div>
        </div>
        <div className="panel-body">
          <div className="chart-box" style={{ height: narrow ? 240 : 290 }}>
            <ResponsiveContainer width="100%" height="100%">
              <Treemap data={tree} dataKey="size" nameKey="name" stroke="none" isAnimationActive animationDuration={700}
                content={<TreeCell total={tree.reduce((s, t) => s + t.size, 0)} />} />
            </ResponsiveContainer>
          </div>
        </div>
      </section>
    </div>
  );
}

function TreeCell(props: any) {
  const { x, y, width, height, index, name, size, total } = props;
  if (width <= 0 || height <= 0 || index === undefined) return null;
  const share = total ? size / total : 0;
  const mix = 22 + Math.round(share * 120);
  return (
    <g>
      <rect x={x + 1} y={y + 1} width={Math.max(0, width - 2)} height={Math.max(0, height - 2)} rx={6} stroke="none"
        style={{ fill: `color-mix(in srgb, var(--c1) ${Math.min(mix, 70)}%, var(--panel-2))` }} />
      {width > 70 && height > 34 && (
        <>
          <text x={x + 12} y={y + 22} fill="var(--text)" stroke="none" fontSize={12.5} fontWeight={550}>{truncate(String(name), Math.floor(width / 7.5))}</text>
          <text x={x + 12} y={y + 39} fill="var(--text-2)" stroke="none" fontSize={12}>{size}</text>
        </>
      )}
    </g>
  );
}
