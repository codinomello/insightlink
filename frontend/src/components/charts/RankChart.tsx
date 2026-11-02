import { Bar, BarChart, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import AxisTick from '@/components/charts/AxisTick';
import ChartTooltip from '@/components/charts/ChartTooltip';

interface Props {
  data: object[];
  dataKey: string;
  name: string;
  color?: string;
}

/** Ranking em barras horizontais: legível mesmo com nomes longos. */
export default function RankChart({ data, dataKey, name, color = 'var(--c1)' }: Props) {
  const narrow = useMediaQuery('(max-width: 720px)');
  const height = Math.max(96, data.length * 34 + 8);

  return (
    <div className="chart-box" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 32, bottom: 0, left: 0 }} barCategoryGap={10}>
          <XAxis type="number" hide domain={[0, 'dataMax']} />
          <YAxis
            type="category"
            dataKey="nome"
            width={narrow ? 120 : 196}
            tickLine={false}
            axisLine={false}
            interval={0}
            tick={<AxisTick max={narrow ? 17 : 30} size={narrow ? 12 : 12.5} />}
          />
          <Tooltip cursor={{ fill: 'var(--hover)' }} content={<ChartTooltip title={(l) => String(l)} />} />
          <Bar dataKey={dataKey} name={name} fill={color} radius={[0, 4, 4, 0]} barSize={14} animationDuration={900} animationEasing="ease-out">
            <LabelList dataKey={dataKey} position="right" fill="var(--text-2)" fontSize={12} offset={8} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
