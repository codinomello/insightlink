import type { ReactNode } from 'react';
import { useAuth } from '../../context/AuthContext';

interface AppHeaderProps {
  /** Ações à direita do header (botões de atualizar, exportar, sair, etc). */
  actions?: ReactNode;
}

/**
 * Barra superior reutilizada em todas as páginas (login, dashboard, etc):
 * marca "InsightLink" à esquerda e, quando informado, um chip com o
 * usuário logado + ações à direita.
 */
export default function AppHeader({ actions }: AppHeaderProps) {
  const { user, isAdmin } = useAuth();

  return (
    <header className="app-header">
      <div className="brand flex-align">
        <span className="brand-logo" aria-hidden="true">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M12 2 L22 20 H2 Z" fill="#ffffff" />
            <path d="M12 2 L17 20 H7 Z" fill="#0f1529" />
          </svg>
        </span>
        <div>
          <h1>InsightLink</h1>
          <p className="sub-title">Painel de desafios ENIAC</p>
        </div>
      </div>

      <div className="header-actions">
        {user && (
          <div className="user-chip" title={user.email || user.username}>
            <span className={`role-dot ${isAdmin ? 'role-admin' : 'role-user'}`} />
            <span>{user.nome}</span>
            <span className="user-chip-role">{isAdmin ? 'Admin' : 'Usuário'}</span>
          </div>
        )}
        {actions}
      </div>
    </header>
  );
}
