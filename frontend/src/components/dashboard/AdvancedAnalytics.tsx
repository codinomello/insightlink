import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  ScatterChart, Scatter, ZAxis,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  Treemap,
} from 'recharts';
import type { AnalyticsData } from '../../types';

interface Props {
  analytics: AnalyticsData | null;
  loading: boolean;
}

const RADAR_COLORS = ['#3b82f6', '#f59e0b', '#22c55e', '#ec4899', '#a855f7', '#14b8a6'];
const TREEMAP_COLORS = ['#2563eb', '#3b82f6', '#60a5fa', '#818cf8', '#38bdf8', '#0ea5e9', '#6366f1', '#1d4ed8'];

function HeatmapEmpresaCargo({ data }: { data: AnalyticsData['crosstab_empresa_cargo'] }) {
  if (!data || data.empresas.length === 0) {
    return <p className="chart-empty-msg">Sem dados suficientes de empresa/cargo para montar o heatmap.</p>;
  }
  const lookup = new Map<string, number>();
  let max = 1;
  data.matriz.forEach((cell) => {
    lookup.set(`${cell.empresa}::${cell.cargo}`, cell.quantidade);
    if (cell.quantidade > max) max = cell.quantidade;
  });

  return (
    <div className="heatmap-wrapper">
      <table className="heatmap-table">
        <thead>
          <tr>
            <th></th>
            {data.cargos.map((cargo) => (
              <th key={cargo} title={cargo}>{cargo}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.empresas.map((empresa) => (
            <tr key={empresa}>
              <th className="heatmap-row-label" title={empresa}>{empresa}</th>
              {data.cargos.map((cargo) => {
                const valor = lookup.get(`${empresa}::${cargo}`) || 0;
                const intensity = valor / max;
                return (
                  <td
                    key={cargo}
                    className="heatmap-cell"
                    style={{ backgroundColor: `rgba(59, 130, 246, ${0.08 + intensity * 0.82})` }}
                    title={`${empresa} × ${cargo}: ${valor}`}
                  >
                    {valor > 0 ? valor : ''}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function AdvancedAnalytics({ analytics, loading }: Props) {
  if (loading) {
    return (
      <div className="loading-state">
        <div className="spinner"></div>
        <p>Calculando cruzamentos de dados...</p>
      </div>
    );
  }

  if (!analytics) return null;

  const { crosstab_empresa_cargo, crosstab_empresa_tipo, correlacao_palavras_completude, completude_por_tipo, radar_por_empresa, treemap_empresas } = analytics;

  const semDados =
    crosstab_empresa_cargo.empresas.length === 0 &&
    crosstab_empresa_tipo.length === 0 &&
    correlacao_palavras_completude.pontos.length === 0 &&
    treemap_empresas.length === 0;

  if (semDados) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">🔬</div>
        <h3>Nenhum cruzamento disponível</h3>
        <p>Importe mais registros para habilitar as análises avançadas.</p>
      </div>
    );
  }

  return (
    <div className="analytics-grid">
      <div className="chart-card chart-card-wide">
        <h3>Heatmap — Empresa × Cargo</h3>
        <p className="chart-subtitle">Concentração de registros por combinação de empresa e cargo do proponente.</p>
        <HeatmapEmpresaCargo data={crosstab_empresa_cargo} />
      </div>

      <div className="chart-card">
        <h3>Desafios vs Projetos por Empresa</h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={crosstab_empresa_tipo}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(225, 225, 225, 0.1)" />
            <XAxis dataKey="empresa" tick={{ fontSize: 10, fill: '#cbd5e1' }} interval={0} angle={-20} textAnchor="end" height={60} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#cbd5e1' }} />
            <Tooltip contentStyle={{ backgroundColor: '#151c33', border: '1px solid rgba(148, 163, 184, 0.22)', borderRadius: '8px', color: '#fff' }} />
            <Legend wrapperStyle={{ fontSize: '0.75rem' }} />
            <Bar dataKey="Desafio" stackId="tipo" fill="#3b82f6" radius={[0, 0, 0, 0]} />
            <Bar dataKey="Projeto" stackId="tipo" fill="#f59e0b" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="chart-card">
        <h3>Completude — Média / Mín / Máx por Tipo</h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={completude_por_tipo}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(225, 225, 225, 0.1)" />
            <XAxis dataKey="tipo" tick={{ fontSize: 11, fill: '#cbd5e1' }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#cbd5e1' }} unit="%" />
            <Tooltip contentStyle={{ backgroundColor: '#151c33', border: '1px solid rgba(148, 163, 184, 0.22)', borderRadius: '8px', color: '#fff' }} />
            <Legend wrapperStyle={{ fontSize: '0.75rem' }} />
            <Bar dataKey="minimo" name="Mínimo" fill="#334155" radius={[4, 4, 0, 0]} />
            <Bar dataKey="media" name="Média" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            <Bar dataKey="maximo" name="Máximo" fill="#38bdf8" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="chart-card">
        <h3>Correlação — Volume de Texto × Completude</h3>
        <p className="chart-subtitle">
          Coeficiente de correlação:{' '}
          <strong className={correlacao_palavras_completude.coeficiente >= 0 ? 'text-positive' : 'text-negative'}>
            {correlacao_palavras_completude.coeficiente.toFixed(3)}
          </strong>
        </p>
        <ResponsiveContainer width="100%" height={260}>
          <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(225, 225, 225, 0.1)" />
            <XAxis type="number" dataKey="palavras" name="Palavras" tick={{ fontSize: 11, fill: '#cbd5e1' }} />
            <YAxis type="number" dataKey="completude" name="Completude" unit="%" tick={{ fontSize: 11, fill: '#cbd5e1' }} />
            <ZAxis range={[60, 60]} />
            <Tooltip
              cursor={{ strokeDasharray: '3 3' }}
              contentStyle={{ backgroundColor: '#151c33', border: '1px solid rgba(148, 163, 184, 0.22)', borderRadius: '8px', color: '#fff' }}
              formatter={(value: any, name: any) => [value, name]}
            />
            <Scatter data={correlacao_palavras_completude.pontos} fill="#6366f1" />
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      <div className="chart-card">
        <h3>Radar Comparativo — Top Empresas</h3>
        <ResponsiveContainer width="100%" height={300}>
          <RadarChart data={radar_por_empresa.dados}>
            <PolarGrid stroke="rgba(148, 163, 184, 0.18)" />
            <PolarAngleAxis dataKey="eixo" tick={{ fontSize: 10, fill: '#cbd5e1' }} />
            <PolarRadiusAxis tick={{ fontSize: 9, fill: '#64748b' }} />
            {radar_por_empresa.empresas.map((empresa, index) => (
              <Radar
                key={empresa}
                name={empresa}
                dataKey={empresa}
                stroke={RADAR_COLORS[index % RADAR_COLORS.length]}
                fill={RADAR_COLORS[index % RADAR_COLORS.length]}
                fillOpacity={0.12}
              />
            ))}
            <Legend wrapperStyle={{ fontSize: '0.7rem' }} />
            <Tooltip contentStyle={{ backgroundColor: '#151c33', border: '1px solid rgba(148, 163, 184, 0.22)', borderRadius: '8px', color: '#fff' }} />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      <div className="chart-card chart-card-wide">
        <h3>Treemap — Volume de Registros por Empresa</h3>
        <ResponsiveContainer width="100%" height={300}>
          <Treemap
            data={treemap_empresas}
            dataKey="size"
            nameKey="name"
            stroke="#0f1529"
            fill="#3b82f6"
            content={(props: any) => {
              const { x, y, width, height, index, name, size } = props;
              if (width < 0 || height < 0) return <g />;
              const color = TREEMAP_COLORS[index % TREEMAP_COLORS.length];
              return (
                <g>
                  <rect x={x} y={y} width={width} height={height} style={{ fill: color, stroke: '#0f1529', strokeWidth: 2 }} />
                  {width > 60 && height > 28 && (
                    <text x={x + 8} y={y + 18} fill="#fff" fontSize={11} fontWeight={700}>
                      {name}
                    </text>
                  )}
                  {width > 60 && height > 40 && (
                    <text x={x + 8} y={y + 34} fill="rgba(255,255,255,0.75)" fontSize={10}>
                      {size} registro{size === 1 ? '' : 's'}
                    </text>
                  )}
                </g>
              );
            }}
          />
        </ResponsiveContainer>
      </div>
    </div>
  );
}
