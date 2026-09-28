import { useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';

/**
 * Roteador de topo: decide entre tela de login e dashboard com base no
 * estado de autenticação. Toda a estrutura visual de cada página vive em
 * `pages/` e `components/`.
 */
export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-state" style={{ minHeight: '100vh' }}>
        <div className="spinner"></div>
        <p>Carregando InsightLink...</p>
      </div>
    );
  }

  if (!user) return <LoginPage />;

  return <DashboardPage />;
}
