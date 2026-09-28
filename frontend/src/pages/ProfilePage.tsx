import { useState, type FormEvent } from 'react';
import * as api from '../lib/api';
import { useAuth } from '../context/AuthContext';

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const [nome, setNome] = useState(user?.nome || '');
  const [email, setEmail] = useState(user?.email || '');
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; message: string } | null>(null);

  if (!user) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (novaSenha && novaSenha !== confirmarSenha) {
      setFeedback({ ok: false, message: 'A confirmação de senha não corresponde à nova senha.' });
      return;
    }
    if (novaSenha && !senhaAtual) {
      setFeedback({ ok: false, message: 'Informe a senha atual para definir uma nova senha.' });
      return;
    }

    setSaving(true);
    try {
      const payload: Record<string, string> = { nome, email };
      if (novaSenha) {
        payload.senha_atual = senhaAtual;
        payload.nova_senha = novaSenha;
      }
      const res = await api.updateMe(payload);
      setUser(res.data);
      setSenhaAtual('');
      setNovaSenha('');
      setConfirmarSenha('');
      setFeedback({ ok: true, message: 'Perfil atualizado com sucesso.' });
    } catch (err: any) {
      setFeedback({ ok: false, message: err.response?.data?.error || 'Erro ao atualizar o perfil.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="table-section profile-section">
      <div className="section-header">
        <div>
          <h2 className="section-title">Minha Conta</h2>
          <p className="section-subtitle">Atualize seus dados pessoais e sua senha de acesso.</p>
        </div>
        <span className={`badge ${user.role === 'admin' ? 'badge-blue' : 'badge-orange'}`}>
          {user.role === 'admin' ? 'Administrador' : 'Usuário comum'}
        </span>
      </div>

      <div className="profile-meta">
        <div>
          <span className="kpi-label">Usuário</span>
          <p>{user.username}</p>
        </div>
        <div>
          <span className="kpi-label">Conta criada em</span>
          <p>{user.criado_em ? new Date(user.criado_em).toLocaleDateString('pt-BR') : '—'}</p>
        </div>
        <div>
          <span className="kpi-label">Último login</span>
          <p>{user.ultimo_login ? new Date(user.ultimo_login).toLocaleString('pt-BR') : 'Este é seu primeiro acesso'}</p>
        </div>
      </div>

      <form className="profile-form" onSubmit={handleSubmit}>
        <div className="form-field">
          <label>Nome completo</label>
          <input value={nome} onChange={(e) => setNome(e.target.value)} required />
        </div>
        <div className="form-field">
          <label>E-mail</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@empresa.com" />
        </div>

        <div className="profile-divider">Alterar senha (opcional)</div>

        <div className="form-field">
          <label>Senha atual</label>
          <input type="password" value={senhaAtual} onChange={(e) => setSenhaAtual(e.target.value)} autoComplete="current-password" />
        </div>
        <div className="form-field">
          <label>Nova senha</label>
          <input type="password" minLength={6} value={novaSenha} onChange={(e) => setNovaSenha(e.target.value)} autoComplete="new-password" />
        </div>
        <div className="form-field">
          <label>Confirmar nova senha</label>
          <input type="password" minLength={6} value={confirmarSenha} onChange={(e) => setConfirmarSenha(e.target.value)} autoComplete="new-password" />
        </div>

        {feedback && (
          <div className={feedback.ok ? 'alert-success' : 'alert-error'}>{feedback.message}</div>
        )}

        <button className="btn btn-secondary" type="submit" disabled={saving}>
          {saving ? 'Salvando...' : 'Salvar alterações'}
        </button>
      </form>
    </div>
  );
}
