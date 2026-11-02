import { useState, type FormEvent } from 'react';
import { CircleAlert, Eye, EyeOff } from '@/components/ui/icons';
import { errorMessage } from '@/api';
import { useAuth } from '@/features/auth/AuthContext';
import Logo from '@/components/ui/Logo';

export default function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const describe = (err: unknown) => errorMessage(err, 'Não foi possível entrar. Confira os dados e tente de novo.');

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(username.trim().toLowerCase(), password);
    } catch (err) {
      setError(describe(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth">
      <aside className="auth-aside">
        <a className="brand" href="/"><Logo size={32} /><span className="brand-name">InsightLink</span></a>
        <div className="rise">
          <h1>Desafios e projetos, num só painel.</h1>
          <p>Indicadores, cruzamentos e histórico de importações dos dados do ENIAC Link+.</p>
        </div>
        <small>ENIAC Link+</small>
        <svg className="auth-watermark" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <rect x="2" y="7" width="12" height="12" rx="3.5" stroke="currentColor" strokeWidth="0.5" />
          <rect x="10" y="5" width="12" height="12" rx="3.5" stroke="currentColor" strokeWidth="0.5" />
        </svg>
      </aside>

      <main className="auth-main">
        <div className="auth-card rise">
          <a className="brand auth-mobile-brand" href="/"><Logo size={32} /><span className="brand-name">InsightLink</span></a>
          <h2>Entrar</h2>
          <p>Use o usuário e a senha fornecidos pelo administrador.</p>

          <form className="auth-form" onSubmit={submit}>
            <div className="field">
              <label htmlFor="u">Usuário</label>
              <input id="u" className="input" value={username} onChange={(e) => setUsername(e.target.value)} required autoFocus
                autoComplete="username" autoCapitalize="none" spellCheck={false} />
            </div>
            <div className="field">
              <label htmlFor="p">Senha</label>
              <div className="input-wrap">
                <input id="p" className="input" type={show ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
                <button type="button" className="icon-btn" onClick={() => setShow((s) => !s)} aria-label={show ? 'Ocultar senha' : 'Mostrar senha'}>
                  {show ? <EyeOff size={16} strokeWidth={1.8} /> : <Eye size={16} strokeWidth={1.8} />}
                </button>
              </div>
            </div>

            {error && <div className="alert alert-error fade"><CircleAlert size={16} /> {error}</div>}

            <button className="btn btn-primary" type="submit" disabled={loading} style={{ height: 42 }}>
              {loading ? <span className="btn-spin" /> : 'Entrar'}
            </button>
            <p className="auth-note">Sem acesso? Peça a um administrador para criar sua conta.</p>
          </form>
        </div>
      </main>
    </div>
  );
}
