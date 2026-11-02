import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { CircleAlert, RefreshCw, Search } from '@/components/ui/icons';
import { ApiError, getActivity } from '@/api';
import { fmtDateTime, fmtRelative, fmtSize } from '@/lib/format';
import type { ActivityReport } from '@/types';
import PageHead from '@/components/ui/PageHead';
import ChartTooltip from '@/components/charts/ChartTooltip';
import AnimatedNumber from '@/components/ui/AnimatedNumber';
import { PanelSkeleton, StatsSkeleton } from '@/components/ui/States';
import RankChart from '@/components/charts/RankChart';

type SubTab = 'uploads' | 'users' | 'logins';

const REFRESH_MS = 30_000;
const AXIS_TICK = { fill: 'var(--text-3)', fontSize: 11.5 };

interface LoadError { status?: number; message: string }

const explain = (err: unknown): LoadError =>
  err instanceof ApiError
    ? { status: err.status || undefined, message: err.message }
    : { message: 'Não foi possível carregar o relatório de atividade.' };

export default function ActivityPage() {
  const [data, setData] = useState<ActivityReport | null>(null);
  const [error, setError] = useState<LoadError | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadedAt, setLoadedAt] = useState<string | null>(null);
  const [, tick] = useState(0);
  const [sub, setSub] = useState<SubTab>('uploads');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getActivity();
      setData(res);
      setError(null);
      setLoadedAt(new Date().toISOString());
    } catch (err) {
      setError(explain(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const refresh = setInterval(load, REFRESH_MS);
    const rerender = setInterval(() => tick((n) => n + 1), 15_000);
    return () => { clearInterval(refresh); clearInterval(rerender); };
  }, [load]);

  const q = search.trim().toLowerCase();

  const uploads = useMemo(() => (data?.uploads ?? []).filter((u) =>
    (!status || u.status === status) && (!q || `${u.arquivo} ${u.nome} ${u.username}`.toLowerCase().includes(q))), [data, q, status]);
  const logins = useMemo(() => (data?.logins ?? []).filter((l) =>
    (!status || (status === 'sucesso') === l.sucesso) && (!q || `${l.username} ${l.nome ?? ''} ${l.ip ?? ''}`.toLowerCase().includes(q))), [data, q, status]);
  const users = useMemo(() => (data?.usuarios ?? []).filter((u) =>
    !q || `${u.nome} ${u.username}`.toLowerCase().includes(q)), [data, q]);

  const head = (
    <PageHead
      eyebrow="Administração"
      title="Atividade"
      description="Quem acessa a plataforma e quais planilhas foram importadas."
      actions={
        <>
          {loadedAt && <span className="panel-sub">Atualizado {fmtRelative(loadedAt)}</span>}
          <button className={`icon-btn is-bordered ${loading ? 'is-spinning' : ''}`} onClick={load} aria-label="Atualizar" disabled={loading}>
            <RefreshCw size={16} strokeWidth={1.8} />
          </button>
        </>
      }
    />
  );

  if (!data) {
    return (
      <>
        {head}
        {error ? (
          <div className="panel rise">
            <div className="panel-body">
              <div className="alert alert-error">
                <CircleAlert size={17} strokeWidth={1.8} />
                <div>
                  <strong style={{ fontWeight: 600 }}>Não foi possível carregar o relatório{error.status ? ` (${error.status})` : ''}.</strong>
                  <div>{error.message}</div>
                  <div className="alert-actions">
                    <button className="btn btn-sm" onClick={load}>Tentar novamente</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            <StatsSkeleton count={5} />
            <div className="grid"><div className="span-7"><PanelSkeleton height={220} /></div><div className="span-5"><PanelSkeleton height={220} /></div></div>
          </>
        )}
      </>
    );
  }

  const r = data.resumo;
  const stats = [
    { label: 'Online agora', value: r.usuarios_online, hint: `janela de ${r.janela_online_min} min`, cls: r.usuarios_online ? 'is-live' : '' },
    { label: 'Ativos hoje', value: r.usuarios_ativos_hoje, hint: `de ${r.total_usuarios} usuários` },
    { label: 'Planilhas enviadas', value: r.total_uploads, hint: r.uploads_com_erro ? `${r.uploads_com_erro} com erro` : 'nenhuma com erro' },
    { label: 'Registros importados', value: r.registros_importados, hint: 'por upload' },
    { label: 'Falhas de login', value: r.falhas_login_7d, hint: 'últimos 7 dias', cls: r.falhas_login_7d ? 'is-alert' : '' },
  ];

  const subtabs: [SubTab, string, number][] = [
    ['uploads', 'Planilhas', data.uploads.length],
    ['users', 'Usuários', data.usuarios.length],
    ['logins', 'Acessos', data.logins.length],
  ];

  return (
    <>
      {head}

      {error && (
        <div className="alert alert-error" style={{ marginBottom: 16 }}>
          <CircleAlert size={17} strokeWidth={1.8} /> <span>Não foi possível atualizar agora. {error.message}</span>
        </div>
      )}

      <div className="stats">
        {stats.map((s, i) => (
          <div key={s.label} className={`stat rise ${s.cls ?? ''}`} style={{ ['--i' as string]: i }}>
            <div className="stat-label">{s.label}</div>
            <div className="stat-value"><AnimatedNumber value={s.value} /></div>
            <div className="stat-hint">{s.hint}</div>
          </div>
        ))}
      </div>

      <div className="grid" style={{ marginBottom: 16 }}>
        <section className="panel span-7 rise" style={{ ['--i' as string]: 2 }}>
          <div className="panel-head">
            <div><h3 className="panel-title">Registros importados por dia</h3><p className="panel-sub">Últimos 14 dias</p></div>
          </div>
          <div className="panel-body">
            <div className="chart-box" style={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.series.uploads} margin={{ top: 6, right: 4, bottom: 0, left: -18 }}>
                  <CartesianGrid stroke="var(--line)" vertical={false} />
                  <XAxis dataKey="dia" tickLine={false} axisLine={false} tick={AXIS_TICK} interval="preserveStartEnd" minTickGap={18} />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={AXIS_TICK} />
                  <Tooltip cursor={{ fill: 'var(--hover)' }}
                    content={(p: any) => (
                      <ChartTooltip {...p} title={(l: string) => l}
                        payload={p.payload?.length ? [
                          { name: 'Registros', value: p.payload[0].payload.registros, color: 'var(--c1)' },
                          { name: 'Planilhas', value: p.payload[0].payload.uploads, color: 'var(--c2)' },
                        ] : []} />
                    )} />
                  <Bar dataKey="registros" name="Registros" fill="var(--c1)" radius={[4, 4, 0, 0]} maxBarSize={26} animationDuration={800} animationEasing="ease-out" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        <section className="panel span-5 rise" style={{ ['--i' as string]: 3 }}>
          <div className="panel-head">
            <div><h3 className="panel-title">Usuários que entraram por dia</h3><p className="panel-sub">Pessoas distintas, últimos 14 dias</p></div>
          </div>
          <div className="panel-body">
            <div className="chart-box" style={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.series.logins} margin={{ top: 6, right: 4, bottom: 0, left: -18 }}>
                  <CartesianGrid stroke="var(--line)" vertical={false} />
                  <XAxis dataKey="dia" tickLine={false} axisLine={false} tick={AXIS_TICK} interval="preserveStartEnd" minTickGap={18} />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={AXIS_TICK} />
                  <Tooltip cursor={{ stroke: 'var(--line-2)' }} content={<ChartTooltip title={(l) => String(l)} />} />
                  <Area type="monotone" dataKey="usuarios" name="Usuários" stroke="var(--c3)" strokeWidth={2}
                    fill="var(--c3)" fillOpacity={0.1} dot={false} activeDot={{ r: 4, strokeWidth: 0 }} animationDuration={900} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        {data.uploads_por_usuario.length > 0 && (
          <section className="panel span-12 rise" style={{ ['--i' as string]: 4 }}>
            <div className="panel-head">
              <div><h3 className="panel-title">Quem mais importa dados</h3><p className="panel-sub">Planilhas enviadas com sucesso, por pessoa</p></div>
            </div>
            <div className="panel-body">
              <RankChart data={data.uploads_por_usuario} dataKey="uploads" name="Planilhas" color="var(--c5)" />
            </div>
          </section>
        )}
      </div>

      <section className="panel rise" style={{ ['--i' as string]: 5 }}>
        <div className="filters">
          <div className="segmented" role="tablist">
            {subtabs.map(([id, label, n]) => (
              <button key={id} role="tab" className={sub === id ? 'is-active' : ''} onClick={() => { setSub(id); setStatus(''); }}>
                {label}<em>{n}</em>
              </button>
            ))}
          </div>
          <div className="search">
            <Search size={15} strokeWidth={1.8} />
            <input className="input" placeholder="Buscar por nome, arquivo ou IP" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          {sub !== 'users' && (
            <select className="select" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filtrar por resultado">
              <option value="">Todos os resultados</option>
              <option value="sucesso">Sucesso</option>
              <option value="erro">{sub === 'uploads' ? 'Com erro' : 'Falhas'}</option>
            </select>
          )}
        </div>

        <div className="table-wrap" key={sub}>
          {sub === 'uploads' && (
            <table className="table is-cards">
              <thead><tr><th>Quando</th><th>Enviado por</th><th>Arquivo</th><th>Tamanho</th><th className="ta-r">Registros</th><th>Resultado</th></tr></thead>
              <tbody>
                {uploads.length === 0 ? <tr><td className="empty-row" colSpan={6}>Nenhum upload encontrado.</td></tr> :
                  uploads.map((u, i) => (
                    <tr key={u.id} className="tr-enter" style={{ ['--i' as string]: Math.min(i, 12) }}>
                      <td data-label="Quando" className="nowrap cell-muted">{fmtDateTime(u.criado_em)}</td>
                      <td data-label="Enviado por"><div className="cell-main">{u.nome}</div><div className="cell-sub">@{u.username}</div></td>
                      <td data-label="Arquivo"><div className="cell-main" style={{ overflowWrap: 'anywhere' }}>{u.arquivo}</div><div className="cell-sub">{(u.formato || '').toUpperCase()}</div></td>
                      <td data-label="Tamanho" className="cell-muted num">{fmtSize(u.tamanho_bytes)}</td>
                      <td data-label="Registros" className="ta-r num">{u.registros_importados}</td>
                      <td data-label="Resultado">
                        <span className={`tag ${u.status === 'sucesso' ? 'tag-pos' : 'tag-neg'}`}>{u.status === 'sucesso' ? 'Importado' : 'Erro'}</span>
                        {u.status === 'erro' && u.mensagem && <div className="cell-sub" style={{ maxWidth: 260 }}>{u.mensagem}</div>}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}

          {sub === 'users' && (
            <table className="table is-cards">
              <thead><tr><th>Usuário</th><th>Papel</th><th>Situação</th><th>Última atividade</th><th>Último login</th></tr></thead>
              <tbody>
                {users.length === 0 ? <tr><td className="empty-row" colSpan={5}>Nenhum usuário encontrado.</td></tr> :
                  users.map((u, i) => (
                    <tr key={u.id} className="tr-enter" style={{ ['--i' as string]: Math.min(i, 12) }}>
                      <td data-label="Usuário"><div className="cell-main">{u.nome}</div><div className="cell-sub">@{u.username}</div></td>
                      <td data-label="Papel"><span className={`tag ${u.role === 'admin' ? 'tag-accent' : ''}`}>{u.role === 'admin' ? 'Administrador' : 'Usuário'}</span></td>
                      <td data-label="Situação">
                        {!u.ativo ? <span className="tag">Desativado</span> : u.online
                          ? <span className="presence"><span className="presence-dot is-online" />Online</span>
                          : <span className="presence"><span className="presence-dot" />Offline</span>}
                      </td>
                      <td data-label="Última atividade" className="cell-muted">{fmtRelative(u.ultima_atividade)}</td>
                      <td data-label="Último login" className="nowrap cell-muted">{fmtDateTime(u.ultimo_login)}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}

          {sub === 'logins' && (
            <table className="table is-cards">
              <thead><tr><th>Quando</th><th>Usuário</th><th>Resultado</th><th>IP</th><th>Navegador</th></tr></thead>
              <tbody>
                {logins.length === 0 ? <tr><td className="empty-row" colSpan={5}>Nenhum acesso encontrado.</td></tr> :
                  logins.map((l, i) => (
                    <tr key={l.id} className="tr-enter" style={{ ['--i' as string]: Math.min(i, 12) }}>
                      <td data-label="Quando" className="nowrap cell-muted">{fmtDateTime(l.criado_em)}</td>
                      <td data-label="Usuário"><div className="cell-main">{l.nome || '—'}</div><div className="cell-sub">@{l.username}</div></td>
                      <td data-label="Resultado">
                        <span className={`tag ${l.sucesso ? 'tag-pos' : 'tag-neg'}`}>{l.sucesso ? 'Entrou' : 'Falhou'}</span>
                        {!l.sucesso && l.motivo && <div className="cell-sub">{l.motivo}</div>}
                      </td>
                      <td data-label="IP" className="cell-muted num">{l.ip || '—'}</td>
                      <td data-label="Navegador" className="cell-ua" title={l.navegador || ''}>{l.navegador || '—'}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </>
  );
}
