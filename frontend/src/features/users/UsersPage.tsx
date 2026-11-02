import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { CircleAlert, KeyRound, Plus, Power, Search, ShieldCheck, ShieldOff, Trash2 } from '@/components/ui/icons';
import * as api from '@/api';
import { useAuth } from '@/features/auth/AuthContext';
import { useToast } from '@/context/ToastContext';
import { fmtRelative } from '@/lib/format';
import type { AuthUser } from '@/types';
import PageHead from '@/components/ui/PageHead';
import Sheet from '@/components/ui/Sheet';
import Dialog from '@/components/ui/Dialog';

type Pending =
  | { kind: 'delete'; user: AuthUser }
  | { kind: 'password'; user: AuthUser }
  | { kind: 'toggle'; user: AuthUser }
  | { kind: 'role'; user: AuthUser };

export default function UsersAdminPage() {
  const { user: me } = useAuth();
  const { notify } = useToast();
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [creating, setCreating] = useState(false);
  const [pending, setPending] = useState<Pending | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await api.listUsers();
      setUsers(res);
      setError(null);
    } catch (err) {
      setError(api.errorMessage(err, 'Não foi possível carregar os usuários.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((u) => !q || `${u.nome} ${u.username} ${u.email ?? ''}`.toLowerCase().includes(q));
  }, [users, search]);

  const run = async (action: () => Promise<unknown>, okMessage: string) => {
    try {
      await action();
      notify(okMessage, 'success');
      setPending(null);
      await load();
    } catch (err) {
      notify(api.errorMessage(err, 'Não foi possível concluir a ação.'), 'error');
    }
  };

  const dialog = () => {
    if (!pending) return null;
    const { user: u } = pending;
    switch (pending.kind) {
      case 'delete':
        return <Dialog title="Remover usuário?" message={<>A conta de <strong>{u.nome}</strong> será removida definitivamente.</>} confirmLabel="Remover" danger
          onConfirm={() => run(() => api.deleteUser(u.id), 'Usuário removido.')} onCancel={() => setPending(null)} />;
      case 'password':
        return <Dialog title="Redefinir senha" message={<>Defina uma nova senha para <strong>{u.nome}</strong>.</>} confirmLabel="Salvar senha"
          input={{ label: 'Nova senha', type: 'password', placeholder: 'Mínimo de 6 caracteres', minLength: 6 }}
          onConfirm={(v) => run(() => api.updateUser(u.id, { password: v }), 'Senha atualizada.')} onCancel={() => setPending(null)} />;
      case 'toggle':
        return <Dialog title={u.ativo ? 'Desativar conta?' : 'Reativar conta?'}
          message={u.ativo ? <>{u.nome} perde o acesso imediatamente e a sessão atual é encerrada.</> : <>{u.nome} poderá entrar novamente.</>}
          confirmLabel={u.ativo ? 'Desativar' : 'Reativar'} danger={u.ativo}
          onConfirm={() => run(() => api.updateUser(u.id, { ativo: !u.ativo }), u.ativo ? 'Conta desativada.' : 'Conta reativada.')} onCancel={() => setPending(null)} />;
      case 'role': {
        const next = u.role === 'admin' ? 'user' : 'admin';
        return <Dialog title={next === 'admin' ? 'Tornar administrador?' : 'Tornar usuário comum?'}
          message={next === 'admin' ? <>{u.nome} poderá importar dados, criar contas e ver a atividade.</> : <>{u.nome} perde as permissões de administrador.</>}
          confirmLabel="Confirmar" onConfirm={() => run(() => api.updateUser(u.id, { role: next }), 'Papel atualizado.')} onCancel={() => setPending(null)} />;
      }
    }
  };

  return (
    <>
      <PageHead
        eyebrow="Administração"
        title="Usuários"
        description="Somente administradores criam contas. Defina papéis, ative ou desative acessos e redefina senhas."
        actions={<button className="btn btn-primary" onClick={() => setCreating(true)}><Plus size={16} strokeWidth={2} /> Novo usuário</button>}
      />

      {error && <div className="alert alert-error" style={{ marginBottom: 16 }}><CircleAlert size={16} /> {error}</div>}

      <section className="panel rise">
        <div className="filters">
          <div className="search">
            <Search size={15} strokeWidth={1.8} />
            <input className="input" placeholder="Buscar por nome, usuário ou e-mail" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <span className="count">{users.filter((u) => u.online).length} online · {users.length} no total</span>
        </div>

        <div className="table-wrap">
          <table className="table is-cards">
            <thead><tr><th>Usuário</th><th>E-mail</th><th>Papel</th><th>Situação</th><th>Última atividade</th><th aria-label="Ações" /></tr></thead>
            <tbody>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}><td colSpan={6}><div className="skeleton" style={{ height: 18 }} /></td></tr>
                ))
              ) : visible.length === 0 ? (
                <tr><td className="empty-row" colSpan={6}>Nenhum usuário encontrado.</td></tr>
              ) : visible.map((u, i) => {
                const self = u.id === me?.id;
                return (
                  <tr key={u.id} className="tr-enter" style={{ ['--i' as string]: Math.min(i, 12) }}>
                    <td className="cell-title">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span className="avatar">{u.nome.split(/\s+/).slice(0, 2).map((p) => p[0]).join('').toUpperCase()}</span>
                        <div><div className="cell-main">{u.nome}{self && <span className="cell-sub" style={{ display: 'inline', marginLeft: 6 }}>você</span>}</div><div className="cell-sub">@{u.username}</div></div>
                      </div>
                    </td>
                    <td data-label="E-mail" className="cell-muted">{u.email || '—'}</td>
                    <td data-label="Papel"><span className={`tag ${u.role === 'admin' ? 'tag-accent' : ''}`}>{u.role === 'admin' ? 'Administrador' : 'Usuário'}</span></td>
                    <td data-label="Situação">
                      {!u.ativo ? <span className="tag">Desativado</span> : u.online
                        ? <span className="presence"><span className="presence-dot is-online" />Online</span>
                        : <span className="presence"><span className="presence-dot" />Offline</span>}
                    </td>
                    <td data-label="Última atividade" className="cell-muted">{fmtRelative(u.ultima_atividade)}</td>
                    <td className="cell-actions">
                      <div className="row-actions">
                        <button className="icon-btn" disabled={self} title={u.role === 'admin' ? 'Tornar usuário comum' : 'Tornar administrador'} aria-label="Alterar papel" onClick={() => setPending({ kind: 'role', user: u })}>
                          {u.role === 'admin' ? <ShieldOff size={16} strokeWidth={1.8} /> : <ShieldCheck size={16} strokeWidth={1.8} />}
                        </button>
                        <button className="icon-btn" title="Redefinir senha" aria-label="Redefinir senha" onClick={() => setPending({ kind: 'password', user: u })}><KeyRound size={16} strokeWidth={1.8} /></button>
                        <button className="icon-btn" disabled={self} title={u.ativo ? 'Desativar' : 'Reativar'} aria-label="Ativar ou desativar" onClick={() => setPending({ kind: 'toggle', user: u })}><Power size={16} strokeWidth={1.8} /></button>
                        <button className="icon-btn is-danger" disabled={self} title="Remover" aria-label="Remover" onClick={() => setPending({ kind: 'delete', user: u })}><Trash2 size={16} strokeWidth={1.8} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {creating && <CreateUserSheet onClose={() => setCreating(false)} onCreated={() => { notify('Usuário criado.', 'success'); load(); }} />}
      {dialog()}
    </>
  );
}

function CreateUserSheet({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [nome, setNome] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'user'>('user');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await api.createUser({ nome, username: username.trim().toLowerCase(), email: email || undefined, password, role });
      onCreated();
      onClose();
    } catch (err) {
      setError(api.errorMessage(err, 'Não foi possível criar o usuário.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet title="Novo usuário" description="A pessoa entra com o usuário e a senha definidos aqui." onClose={onClose} onSubmit={submit}
      footer={<>
        <button type="button" className="btn" onClick={onClose}>Cancelar</button>
        <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? <span className="btn-spin" /> : 'Criar usuário'}</button>
      </>}>
      <div className="field"><label>Nome completo <i>*</i></label><input className="input" value={nome} onChange={(e) => setNome(e.target.value)} required autoFocus /></div>
      <div className="field-row">
        <div className="field"><label>Usuário <i>*</i></label><input className="input" value={username} onChange={(e) => setUsername(e.target.value)} required autoCapitalize="none" /></div>
        <div className="field"><label>Papel</label>
          <select className="select" value={role} onChange={(e) => setRole(e.target.value as 'admin' | 'user')}>
            <option value="user">Usuário comum</option>
            <option value="admin">Administrador</option>
          </select>
        </div>
      </div>
      <div className="field"><label>E-mail</label><input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
      <div className="field"><label>Senha inicial <i>*</i></label><input className="input" type="password" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="new-password" /></div>
      {error && <div className="alert alert-error"><CircleAlert size={16} /> {error}</div>}
    </Sheet>
  );
}
