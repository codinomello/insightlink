import { useState, type FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import AppHeader from '../components/layout/AppHeader';

export default function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const describeError = (err: any): string => {
    // Sem resposta: backend fora do ar, proxy mal configurado, etc.
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
      await login(username.trim().toLowerCase(), password);
    } catch (err: any) {
      setError(describeError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      <AppHeader />

      <main className="app-main">
        <div className="auth-page-wrapper">
          <div className="table-section auth-section">
            <div className="section-header">
              <div>
                <h2 className="section-title">Acessar a plataforma</h2>
                <p className="section-subtitle">Entre com seu usuário e senha para ver o dashboard.</p>
              </div>
            </div>

            <form className="record-form" onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-field">
                  <label>Usuário</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    autoFocus
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
                    placeholder="••••••••"
                    autoComplete="current-password"
                  />
                </div>
              </div>

              {error && <div className="alert-error">{error}</div>}

              <div className="form-actions" style={{ justifyContent: 'flex-start' }}>
                <button className="btn btn-secondary" type="submit" disabled={loading}>
                  {loading ? 'Aguarde...' : 'Entrar'}
                </button>
              </div>

              <p className="auth-hint">
                Não possui acesso? As contas são criadas por um administrador da plataforma — solicite o seu.
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
