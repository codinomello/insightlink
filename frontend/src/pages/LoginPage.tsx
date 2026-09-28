import { useState, type FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import AppHeader from '../components/layout/AppHeader';
import NavTabs, { type NavTabItem } from '../components/layout/NavTabs';

type Mode = 'login' | 'register';

const MODE_TABS: NavTabItem<Mode>[] = [
  { id: 'login', label: 'Entrar' },
  { id: 'register', label: 'Criar conta' },
];

export default function LoginPage() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [nome, setNome] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const describeError = (err: any): string => {
    // Erro de rede/CORS: a requisição nem chegou a receber uma resposta do
    // servidor (backend fora do ar, proxy mal configurado, etc).
    if (!err?.response) {
      return 'Não foi possível conectar ao servidor. Verifique se o backend está rodando e acessível.';
    }
    return err.response.data?.error || 'Não foi possível concluir. Verifique os dados e tente novamente.';
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(username.trim().toLowerCase(), password);
      } else {
        await register(nome.trim(), username.trim().toLowerCase(), password, email.trim() || undefined);
      }
    } catch (err: any) {
      setError(describeError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      <AppHeader />

      <NavTabs
        tabs={MODE_TABS}
        active={mode}
        onChange={(next) => { setMode(next); setError(null); }}
      />

      <main className="app-main">
        <div className="auth-page-wrapper">
          <div className="table-section auth-section">
            <div className="section-header">
              <div>
                <h2 className="section-title">{mode === 'login' ? 'Acessar a plataforma' : 'Criar uma conta'}</h2>
                <p className="section-subtitle">
                  {mode === 'login'
                    ? 'Entre com seu usuário e senha para ver o dashboard.'
                    : 'Novas contas nascem com acesso de leitura (usuário comum).'}
                </p>
              </div>
            </div>

            <form className="record-form" onSubmit={handleSubmit}>
              {mode === 'register' && (
                <div className="form-row">
                  <div className="form-field">
                    <label>Nome completo</label>
                    <input type="text" value={nome} onChange={(e) => setNome(e.target.value)} required placeholder="Seu nome" />
                  </div>
                  <div className="form-field">
                    <label>E-mail (opcional)</label>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@empresa.com" />
                  </div>
                </div>
              )}

              <div className="form-row">
                <div className="form-field">
                  <label>Usuário</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    placeholder="nome.usuario"
                    autoComplete="username"
                  />
                </div>
                <div className="form-field">
                  <label>Senha</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    placeholder="••••••••"
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  />
                </div>
              </div>

              {error && <div className="alert-error">{error}</div>}

              <div className="form-actions" style={{ justifyContent: 'flex-start' }}>
                <button className="btn btn-secondary" type="submit" disabled={loading}>
                  {loading ? 'Aguarde...' : mode === 'login' ? 'Entrar' : 'Criar conta'}
                </button>
              </div>

              <p className="auth-hint">
                {mode === 'register'
                  ? 'Um administrador pode conceder permissões adicionais depois, na aba Usuários.'
                  : (<>Primeiro acesso? O administrador padrão é <code>admin</code> / <code>admin123</code> (altere a senha em "Minha Conta" depois de entrar).</>)}
              </p>
            </form>
          </div>
        </div>
      </main>

      <footer className="app-footer">
        <p>InsightLink &copy; {new Date().getFullYear()} — Integrado ao ENIAC Link+</p>
      </footer>
    </div>
  );
}
