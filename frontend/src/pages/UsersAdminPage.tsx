import { useEffect, useState, type FormEvent } from 'react';
import * as api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import type { AuthUser } from '../types';

export default function UsersAdminPage() {
  const { user: me } = useAuth();
  const { notify } = useToast();
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const [nome, setNome] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'user'>('user');
  const [saving, setSaving] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.listUsers();
      setUsers(res.data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Não foi possível carregar os usuários.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const resetForm = () => {
    setNome('');
    setUsername('');
    setEmail('');
    setPassword('');
    setRole('user');
  };

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.createUser({ nome, username: username.toLowerCase(), email: email || undefined, password, role });
      resetForm();
      setShowForm(false);
      notify('Usuário criado com sucesso.', 'success');
      await fetchUsers();
    } catch (err: any) {
      notify(err.response?.data?.error || 'Erro ao criar usuário.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleRole = async (u: AuthUser) => {
    const novoRole = u.role === 'admin' ? 'user' : 'admin';
    try {
      await api.updateUser(u.id, { role: novoRole });
      notify(`${u.nome} agora é ${novoRole === 'admin' ? 'administrador' : 'usuário comum'}.`, 'success');
      await fetchUsers();
    } catch (err: any) {
      notify(err.response?.data?.error || 'Erro ao alterar papel do usuário.', 'error');
    }
  };

  const handleToggleAtivo = async (u: AuthUser) => {
    try {
      await api.updateUser(u.id, { ativo: !u.ativo });
      notify(`Conta de ${u.nome} ${u.ativo ? 'desativada' : 'ativada'}.`, 'success');
      await fetchUsers();
    } catch (err: any) {
      notify(err.response?.data?.error || 'Erro ao alterar status do usuário.', 'error');
    }
  };

  const handleResetPassword = async (u: AuthUser) => {
    const novaSenha = prompt(`Nova senha para "${u.username}" (mínimo 6 caracteres):`);
    if (!novaSenha) return;
    try {
      await api.updateUser(u.id, { password: novaSenha });
      notify('Senha atualizada com sucesso.', 'success');
    } catch (err: any) {
      notify(err.response?.data?.error || 'Erro ao redefinir senha.', 'error');
    }
  };

  const handleDelete = async (u: AuthUser) => {
    if (!confirm(`Remover o usuário "${u.username}"? Esta ação não pode ser desfeita.`)) return;
    try {
      await api.deleteUser(u.id);
      notify('Usuário removido.', 'success');
      await fetchUsers();
    } catch (err: any) {
      notify(err.response?.data?.error || 'Erro ao remover usuário.', 'error');
    }
  };

  const q = search.trim().toLowerCase();
  const visibleUsers = users.filter(
    (u) => !q || `${u.nome} ${u.username} ${u.email ?? ''}`.toLowerCase().includes(q)
  );

  return (
    <div className="table-section">
      <div className="section-header">
        <div>
          <h2 className="section-title">Gestão de Usuários</h2>
          <p className="section-subtitle">Somente administradores criam contas. Promova administradores, ative/desative acessos e redefina senhas.</p>
        </div>
        <button className="btn btn-secondary" onClick={() => setShowForm((v) => !v)}>
          {showForm ? 'Cancelar' : '+ Novo usuário'}
        </button>
      </div>

      {showForm && (
        <form className="inline-form" onSubmit={handleCreate}>
          <div className="form-field">
            <label>Nome</label>
            <input value={nome} onChange={(e) => setNome(e.target.value)} required />
          </div>
          <div className="form-field">
            <label>Usuário</label>
            <input value={username} onChange={(e) => setUsername(e.target.value)} required />
          </div>
          <div className="form-field">
            <label>E-mail</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="form-field">
            <label>Senha</label>
            <input type="password" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <div className="form-field">
            <label>Papel</label>
            <select value={role} onChange={(e) => setRole(e.target.value as 'admin' | 'user')}>
              <option value="user">Usuário comum</option>
              <option value="admin">Administrador</option>
            </select>
          </div>
          <button className="btn btn-secondary" type="submit" disabled={saving}>
            {saving ? 'Salvando...' : 'Criar usuário'}
          </button>
        </form>
      )}

      {error && <div className="alert-error">{error}</div>}

      <div className="table-filters">
        <div className="search-input-wrapper">
          <input
            type="text"
            placeholder="Pesquisar por nome, usuário ou e-mail..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <span className="section-subtitle">
          {users.filter((u) => u.online).length} online · {users.length} no total
        </span>
      </div>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Nome</th>
              <th>Usuário</th>
              <th>E-mail</th>
              <th>Papel</th>
              <th>Status</th>
              <th>Último login</th>
              <th style={{ textAlign: 'right' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>Carregando...</td></tr>
            ) : visibleUsers.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>Nenhum usuário encontrado.</td></tr>
            ) : (
              visibleUsers.map((u) => (
                <tr key={u.id}>
                  <td style={{ fontWeight: 500 }}>{u.nome}</td>
                  <td>{u.username}</td>
                  <td>{u.email || '—'}</td>
                  <td>
                    <span className={`badge ${u.role === 'admin' ? 'badge-blue' : 'badge-orange'}`}>
                      {u.role === 'admin' ? 'Administrador' : 'Usuário'}
                    </span>
                  </td>
                  <td>
                    {!u.ativo ? (
                      <span className="badge badge-off">Inativo</span>
                    ) : u.online ? (
                      <span className="presence"><span className="presence-dot online" />Online</span>
                    ) : (
                      <span className="presence"><span className="presence-dot" />Offline</span>
                    )}
                  </td>
                  <td style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                    {u.ultimo_login ? new Date(u.ultimo_login + 'Z').toLocaleString('pt-BR') : 'Nunca'}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div className="row-actions">
                      <button className="btn-icon" title="Alternar papel" onClick={() => handleToggleRole(u)} disabled={u.id === me?.id}>
                        🔁
                      </button>
                      <button className="btn-icon" title="Redefinir senha" onClick={() => handleResetPassword(u)}>
                        🔑
                      </button>
                      <button
                        className="btn-icon"
                        title={u.ativo ? 'Desativar' : 'Ativar'}
                        onClick={() => handleToggleAtivo(u)}
                        disabled={u.id === me?.id}
                      >
                        {u.ativo ? '⏸️' : '▶️'}
                      </button>
                      <button className="btn-icon" title="Remover" onClick={() => handleDelete(u)} disabled={u.id === me?.id}>
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
