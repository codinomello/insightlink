import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import type { DashboardSummary } from '../../types';

interface ChartsProps {
  summary: DashboardSummary | null;
}

const COLORS = ['#3b82f6', '#60a5fa', '#93c5fd', '#1d4ed8', '#818cf8', '#38bdf8', '#0ea5e9'];

export default function Charts({ summary }: ChartsProps) {
  if (!summary) return null;
  if (!summary.total) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">📈</div>
        <h3>Nenhum dado disponível</h3>
        <p>Importe arquivos do ENIAC Link+ para visualizar gráficos e indicadores.</p>
      </div>
    );
  }

  return (
    <div className="charts-grid">
      <div className="chart-card">
        <h3>Registros por Empresa</h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={summary.por_empresa}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(225, 225, 225, 0.1)" />
            <XAxis dataKey="nome" tick={{ fontSize: 11, fill: '#cbd5e1' }} interval={0} angle={-15} textAnchor="end" height={50} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#cbd5e1' }} />
            <Tooltip contentStyle={{ backgroundColor: '#151c33', border: '1px solid rgba(148, 163, 184, 0.22)', borderRadius: '8px', color: '#fff' }} />
            <Bar dataKey="quantidade" fill="#6366f1" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="chart-card">
        <h3>Distribuição por Cargo</h3>
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={summary.por_cargo}
              dataKey="quantidade"
              nameKey="nome"
              cx="50%"
              cy="50%"
              outerRadius={90}
              label={({ name, percent = 0}) => `${name} (${(percent * 100).toFixed(0)}%)`}
            >
              {summary.por_cargo.map((_, index) => (
                <Cell key={`cell-cargo-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ backgroundColor: '#151c33', border: '1px solid rgba(148, 163, 184, 0.22)', borderRadius: '8px', color: '#fff' }} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="chart-card">
        <h3>Desafios vs Projetos</h3>
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={summary.por_tipo}
              dataKey="quantidade"
              nameKey="nome"
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={90}
              paddingAngle={4}
            >
              {summary.por_tipo.map((_, index) => (
                <Cell key={`cell-tipo-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
              ))}
            </Pie>
            <Legend verticalAlign="bottom" height={36} />
            <Tooltip contentStyle={{ backgroundColor: '#151c33', border: '1px solid rgba(148, 163, 184, 0.22)', borderRadius: '8px', color: '#fff' }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}