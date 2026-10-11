import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ResponsiveContainer, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import { getActivity } from '../lib/api';
import type { ActivityReport } from '../types';

type SubTab = 'online' | 'uploads' | 'logins';

const TOOLTIP_STYLE = {
  backgroundColor: '#151c33',
  border: '1px solid rgba(148, 163, 184, 0.22)',
  borderRadius: '8px',
  color: '#fff',
};

const REFRESH_MS = 30_000;

const fmtDate = (iso?: string | null) => (iso ? new Date(iso + 'Z').toLocaleString('pt-BR') : '—');

const fmtSize = (bytes: number) => {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

const fmtRelative = (iso?: string | null) => {
  if (!iso) return 'Nunca';
  const diff = Math.max(0, Date.now() - new Date(iso + 'Z').getTime());
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'agora mesmo';
  if (min < 60) return `há ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `há ${h} h`;
  return `há ${Math.floor(h / 24)} d`;
};

export default function ActivityPage() {
  const [data, setData] = useState<ActivityReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sub, setSub] = useState<SubTab>('uploads');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await getActivity();
      setData(res.data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Não foi possível carregar o relatório de atividade.');
    }
  }, []);

  useEffect(() => {
    load();
    const timer = setInterval(load, REFRESH_MS);
    return () => clearInterval(timer);
  }, [load]);

  const q = search.trim().toLowerCase();

  const uploads = useMemo(
    () =>
      (data?.uploads ?? []).filter((u) => {
        if (statusFilter && u.status !== statusFilter) return false;
        return !q || `${u.arquivo} ${u.nome} ${u.username}`.toLowerCase().includes(q);
      }),
    [data, q, statusFilter]
  );

  const logins = useMemo(
    () =>
      (data?.logins ?? []).filter((l) => {
        if (statusFilter === 'sucesso' && !l.sucesso) return false;
        if (statusFilter === 'erro' && l.sucesso) return false;
        return !q || `${l.username} ${l.nome ?? ''} ${l.ip ?? ''}`.toLowerCase().includes(q);
      }),
    [data, q, statusFilter]
  );

  const usuarios = useMemo(
    () => (data?.usuarios ?? []).filter((u) => !q || `${u.nome} ${u.username}`.toLowerCase().includes(q)),
    [data, q]
  );

  if (error && !data) return <div className="alert-error">{error}</div>;
  if (!data) {
    return (
      <div className="loading-state">
        <div className="spinner"></div>
        <p>Carregando relatório de atividade...</p>
      </div>
    );
  }

  const r = data.resumo;
  const kpis = [
    { label: 'Online agora', value: r.usuarios_online, hint: `últimos ${r.janela_online_min} min`, accent: 'kpi-green' },
    { label: 'Ativos hoje', value: r.usuarios_ativos_hoje, hint: `de ${r.total_usuarios} usuários` },
    { label: 'Planilhas enviadas', value: r.total_uploads, hint: `${r.uploads_com_erro} com erro` },
    { label: 'Registros importados', value: r.registros_importados, hint: 'via upload' },
    { label: 'Falhas de login', value: r.falhas_login_7d, hint: 'últimos 7 dias', accent: r.falhas_login_7d > 0 ? 'kpi-warn' : '' },
  ];

  return (
    <div className="activity-page">
      {error && <div className="alert-error">{error}</div>}

      <div className="kpi-grid" style={{ marginBottom: 28 }}>
        {kpis.map((k) => (
          <div key={k.label} className={`kpi-card ${k.accent ?? ''}`}>
            <span className="kpi-value">{k.value}</span>
            <span className="kpi-label">{k.label}</span>
            <span className="kpi-hint">{k.hint}</span>
          </div>
        ))}
      </div>

      <div className="analytics-grid" style={{ marginBottom: 24 }}>
        <div className="chart-card">
          <h3>Planilhas enviadas — últimos 14 dias</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={data.series.uploads}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(225,225,225,0.1)" />
              <XAxis dataKey="dia" tick={{ fontSize: 10, fill: '#cbd5e1' }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#cbd5e1' }} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Legend wrapperStyle={{ fontSize: '0.75rem' }} />
              <Bar dataKey="uploads" name="Uploads" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="registros" name="Registros" fill="#38bdf8" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>Usuários que fizeram login — últimos 14 dias</h3>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={data.series.logins}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(225,225,225,0.1)" />
              <XAxis dataKey="dia" tick={{ fontSize: 10, fill: '#cbd5e1' }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#cbd5e1' }} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Line type="monotone" dataKey="usuarios" name="Usuários distintos" stroke="#4ade80" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {data.uploads_por_usuario.length > 0 && (
          <div className="chart-card chart-card-wide">
            <h3>Quem mais importa dados</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data.uploads_por_usuario} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(225,225,225,0.1)" />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: '#cbd5e1' }} />
                <YAxis type="category" dataKey="nome" width={130} tick={{ fontSize: 11, fill: '#cbd5e1' }} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Legend wrapperStyle={{ fontSize: '0.75rem' }} />
                <Bar dataKey="uploads" name="Uploads" fill="#6366f1" radius={[0, 4, 4, 0]} />
                <Bar dataKey="registros" name="Registros" fill="#f59e0b" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="table-section">
        <div className="section-header">
          <div>
            <h2 className="section-title">Relatório de atividade</h2>
            <p className="section-subtitle">Atualiza automaticamente a cada 30 segundos.</p>
          </div>
          <button className="btn btn-secondary" onClick={load}>Atualizar agora</button>
        </div>

        <div className="sub-tabs">
          {([
            ['uploads', `Uploads de planilhas (${data.uploads.length})`],
            ['online', `Usuários (${data.usuarios.length})`],
            ['logins', `Histórico de logins (${data.logins.length})`],
          ] as [SubTab, string][]).map(([id, label]) => (
            <button
              key={id}
              className={`sub-tab ${sub === id ? 'active' : ''}`}
              onClick={() => { setSub(id); setStatusFilter(''); }}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="table-filters">
          <div className="search-input-wrapper">
            <input
              type="text"
              placeholder="Pesquisar por nome, usuário, arquivo ou IP..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {sub !== 'online' && (
            <div className="select-group">
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="">Todos os status</option>
                <option value="sucesso">Sucesso</option>
                <option value="erro">{sub === 'uploads' ? 'Com erro' : 'Falhas'}</option>
              </select>
            </div>
          )}
        </div>

        <div className="table-wrapper">
          {sub === 'uploads' && (
            <table>
              <thead>
                <tr>
                  <th>Data</th><th>Enviado por</th><th>Arquivo</th><th>Formato</th>
                  <th>Tamanho</th><th>Registros</th><th>Status</th>
                </tr>
              </thead>
              <tbody>
                {uploads.length === 0 ? (
                  <tr><td colSpan={7} className="table-empty">Nenhum upload encontrado.</td></tr>
                ) : uploads.map((u) => (
                  <tr key={u.id}>
                    <td style={{ whiteSpace: 'nowrap' }}>{fmtDate(u.criado_em)}</td>
                    <td><strong>{u.nome}</strong><div className="cell-sub">@{u.username}</div></td>
                    <td title={u.mensagem || u.arquivo}>{u.arquivo}</td>
                    <td><span className="badge badge-blue">{(u.formato || '—').toUpperCase()}</span></td>
                    <td>{fmtSize(u.tamanho_bytes)}</td>
                    <td>{u.registros_importados}</td>
                    <td>
                      <span className={`badge ${u.status === 'sucesso' ? 'badge-ok' : 'badge-err'}`}>
                        {u.status === 'sucesso' ? 'Sucesso' : 'Erro'}
                      </span>
                      {u.status === 'erro' && u.mensagem && <div className="cell-sub">{u.mensagem}</div>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {sub === 'online' && (
            <table>
              <thead>
                <tr>
                  <th>Usuário</th><th>Papel</th><th>Situação</th><th>Última atividade</th><th>Último login</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.length === 0 ? (
                  <tr><td colSpan={5} className="table-empty">Nenhum usuário encontrado.</td></tr>
                ) : usuarios.map((u) => (
                  <tr key={u.id}>
                    <td><strong>{u.nome}</strong><div className="cell-sub">@{u.username}</div></td>
                    <td>
                      <span className={`badge ${u.role === 'admin' ? 'badge-blue' : 'badge-orange'}`}>
                        {u.role === 'admin' ? 'Administrador' : 'Usuário'}
                      </span>
                    </td>
                    <td>
                      {!u.ativo ? (
                        <span className="badge badge-off">Desativado</span>
                      ) : u.online ? (
                        <span className="presence"><span className="presence-dot online" />Online</span>
                      ) : (
                        <span className="presence"><span className="presence-dot" />Offline</span>
                      )}
                    </td>
                    <td>{fmtRelative(u.ultima_atividade)}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>{fmtDate(u.ultimo_login)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {sub === 'logins' && (
            <table>
              <thead>
                <tr><th>Data</th><th>Usuário</th><th>Resultado</th><th>IP</th><th>Navegador</th></tr>
              </thead>
              <tbody>
                {logins.length === 0 ? (
                  <tr><td colSpan={5} className="table-empty">Nenhum login encontrado.</td></tr>
                ) : logins.map((l) => (
                  <tr key={l.id}>
                    <td style={{ whiteSpace: 'nowrap' }}>{fmtDate(l.criado_em)}</td>
                    <td><strong>{l.nome || '—'}</strong><div className="cell-sub">@{l.username}</div></td>
                    <td>
                      <span className={`badge ${l.sucesso ? 'badge-ok' : 'badge-err'}`}>
                        {l.sucesso ? 'Sucesso' : 'Falha'}
                      </span>
                      {!l.sucesso && l.motivo && <div className="cell-sub">{l.motivo}</div>}
                    </td>
                    <td>{l.ip || '—'}</td>
                    <td className="cell-ua" title={l.navegador || ''}>{l.navegador || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
