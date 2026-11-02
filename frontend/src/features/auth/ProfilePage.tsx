import { useState, type FormEvent } from 'react';
import { CircleAlert, CircleCheck } from '@/components/ui/icons';
import * as api from '@/api';
import { useAuth } from '@/features/auth/AuthContext';
import { useToast } from '@/context/ToastContext';
import { fmtDate, fmtDateTime, initials } from '@/lib/format';
import PageHead from '@/components/ui/PageHead';

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const { notify } = useToast();
  const [nome, setNome] = useState(user?.nome || '');
  const [email, setEmail] = useState(user?.email || '');
  const [atual, setAtual] = useState('');
  const [nova, setNova] = useState('');
  const [confirma, setConfirma] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!user) return null;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (nova && nova !== confirma) return setError('A confirmação não corresponde à nova senha.');
    if (nova && !atual) return setError('Informe a senha atual para definir uma nova.');

    setSaving(true);
    try {
      const payload: Record<string, string> = { nome, email };
      if (nova) { payload.senha_atual = atual; payload.nova_senha = nova; }
      const res = await api.updateMe(payload);
      setUser(res);
      setAtual(''); setNova(''); setConfirma('');
      notify('Perfil atualizado.', 'success');
    } catch (err) {
      setError(api.errorMessage(err, 'Não foi possível atualizar o perfil.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHead eyebrow="Conta" title="Minha conta" description="Seus dados e sua senha de acesso." />

      <div className="profile-grid">
        <aside className="panel identity rise">
          <div className="identity-top">
            <span className="avatar is-lg">{initials(user.nome)}</span>
            <div>
              <strong>{user.nome}</strong>
              <span>@{user.username}</span>
            </div>
          </div>
          <dl className="kv">
            <dt>Papel</dt><dd><span className={`tag ${user.role === 'admin' ? 'tag-accent' : ''}`}>{user.role === 'admin' ? 'Administrador' : 'Usuário'}</span></dd>
            <dt>Conta criada</dt><dd>{fmtDate(user.criado_em)}</dd>
            <dt>Último acesso</dt><dd>{fmtDateTime(user.ultimo_login)}</dd>
          </dl>
        </aside>

        <form className="panel rise" style={{ ['--i' as string]: 1 }} onSubmit={submit}>
          <div className="panel-body stack" style={{ gap: 0 }}>
            <div className="form-section">
              <h3>Dados pessoais</h3>
              <div className="field-row">
                <div className="field"><label>Nome completo</label><input className="input" value={nome} onChange={(e) => setNome(e.target.value)} required /></div>
                <div className="field"><label>E-mail</label><input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@empresa.com" /></div>
              </div>
            </div>

            <div className="form-section">
              <h3>Alterar senha <span className="panel-sub" style={{ fontWeight: 400 }}>· opcional</span></h3>
              <div className="field"><label>Senha atual</label><input className="input" type="password" value={atual} onChange={(e) => setAtual(e.target.value)} autoComplete="current-password" /></div>
              <div className="field-row">
                <div className="field"><label>Nova senha</label><input className="input" type="password" minLength={6} value={nova} onChange={(e) => setNova(e.target.value)} autoComplete="new-password" /></div>
                <div className="field"><label>Confirmar nova senha</label><input className="input" type="password" minLength={6} value={confirma} onChange={(e) => setConfirma(e.target.value)} autoComplete="new-password" /></div>
              </div>
            </div>

            {error && <div className="alert alert-error" style={{ marginTop: 16 }}><CircleAlert size={16} /> {error}</div>}

            <div className="form-actions" style={{ marginTop: 20 }}>
              <button className="btn btn-primary" type="submit" disabled={saving}>
                {saving ? <span className="btn-spin" /> : <><CircleCheck size={16} strokeWidth={1.8} /> Salvar alterações</>}
              </button>
            </div>
          </div>
        </form>
      </div>
    </>
  );
}
