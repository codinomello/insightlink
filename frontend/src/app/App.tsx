import Logo from '@/components/ui/Logo';
import { useAuth } from '@/features/auth/AuthContext';
import LoginPage from '@/features/auth/LoginPage';
import Workspace from './Workspace';

/** Decide entre a tela de login e a área autenticada, conforme a sessão. */
export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="boot" role="status" aria-label="Carregando">
        <Logo size={34} />
      </div>
    );
  }

  return user ? <Workspace /> : <LoginPage />;
}
