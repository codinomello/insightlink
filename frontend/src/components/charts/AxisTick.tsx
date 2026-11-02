import { truncate } from '@/lib/format';

/** Rótulo de eixo Y em linha única (o padrão do Recharts quebra o texto em duas linhas). */
export default function AxisTick({ x, y, payload, max = 28, size = 12.5 }: any) {
  return (
    <text x={x} y={y} dy={4} textAnchor="end" fill="var(--text-2)" fontSize={size} stroke="none">
      <title>{payload.value}</title>
      {truncate(String(payload.value), max)}
    </text>
  );
}
