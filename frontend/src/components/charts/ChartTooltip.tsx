interface Props {
  active?: boolean;
  payload?: any[];
  label?: string | number;
  title?: (label: any, payload: any[]) => string;
  valueFormat?: (v: number, name: string) => string;
}

/** Tooltip único para todos os gráficos, no mesmo estilo dos painéis. */
export default function ChartTooltip({ active, payload, label, title, valueFormat }: Props) {
  if (!active || !payload || payload.length === 0) return null;
  const heading = title ? title(label, payload) : label;
  return (
    <div className="tt">
      {heading !== undefined && heading !== '' && <div className="tt-label">{heading}</div>}
      {payload.map((p, i) => (
        <div className="tt-row" key={i}>
          <span className="dot" style={{ background: p.color || p.payload?.fill || p.fill }} />
          <span className="name">{p.name ?? p.dataKey}</span>
          <span className="val">{valueFormat ? valueFormat(Number(p.value), String(p.name)) : Number(p.value).toLocaleString('pt-BR')}</span>
        </div>
      ))}
    </div>
  );
}
