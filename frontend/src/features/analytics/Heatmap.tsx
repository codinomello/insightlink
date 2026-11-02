import type { AnalyticsData } from '@/types';

/** Mapa de calor empresa × cargo (escala de azul). */
export default function Heatmap({ data }: { data: AnalyticsData['crosstab_empresa_cargo'] }) {
  if (!data.empresas.length) return <p className="panel-sub">Sem dados de empresa e cargo suficientes.</p>;
  const lookup = new Map(data.matriz.map((c) => [`${c.empresa}::${c.cargo}`, c.quantidade]));
  const max = Math.max(1, ...data.matriz.map((c) => c.quantidade));

  return (
    <div className="heat">
      <div className="heat-grid" style={{ gridTemplateColumns: `minmax(110px, 170px) repeat(${data.cargos.length}, minmax(40px, 1fr))` }}>
        <span />
        {data.cargos.map((c) => <span className="heat-col" key={c} title={c}>{c}</span>)}
        {data.empresas.map((emp, r) => (
          <FragmentRow key={emp} empresa={emp} cargos={data.cargos} lookup={lookup} max={max} row={r} />
        ))}
      </div>
    </div>
  );
}

function FragmentRow({ empresa, cargos, lookup, max, row }: {
  empresa: string; cargos: string[]; lookup: Map<string, number>; max: number; row: number;
}) {
  return (
    <>
      <span className="heat-row" title={empresa}>{empresa}</span>
      {cargos.map((c, col) => {
        const v = lookup.get(`${empresa}::${c}`) || 0;
        return (
          <span
            key={c}
            className={`heat-cell ${v ? '' : 'is-empty'}`}
            style={{ ['--v' as string]: v / max, ['--d' as string]: row + col }}
            title={`${empresa} · ${c}: ${v}`}
          >
            {v || ''}
          </span>
        );
      })}
    </>
  );
}
