import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { LogOut, Moon, Sun, UserRound, type IconComponent } from '@/components/ui/icons';
import { useAuth } from '@/features/auth/AuthContext';
import { useTheme } from '@/hooks/useTheme';
import { initials } from '@/lib/format';
import Logo from '@/components/ui/Logo';
import Menu from '@/components/ui/Menu';

export interface ShellTab<T extends string = string> {
  id: T;
  label: string;
  icon: IconComponent;
}

interface AppShellProps<T extends string> {
  tabs: ShellTab<T>[];
  active: T | 'profile';
  onChange: (id: T | 'profile') => void;
  children: ReactNode;
}

export default function AppShell<T extends string>({ tabs, active, onChange, children }: AppShellProps<T>) {
  const { user, isAdmin, logout } = useAuth();
  const { theme, toggle } = useTheme();

  const navRef = useRef<HTMLElement>(null);
  const [ind, setInd] = useState<{ x: number; w: number } | null>(null);

  // Indicador deslizante sob a aba ativa
  useLayoutEffect(() => {
    const measure = () => {
      const el = navRef.current?.querySelector<HTMLElement>('.nav-item.is-active');
      setInd(el ? { x: el.offsetLeft, w: el.offsetWidth } : null);
    };
    measure();
    window.addEventListener('resize', measure);
    document.fonts?.ready.then(measure);
    return () => window.removeEventListener('resize', measure);
  }, [active, tabs.length]);

  useEffect(() => { window.scrollTo({ top: 0 }); }, [active]);

  return (
    <>
      <header className="topbar">
        <div className="topbar-inner">
          <a className="brand" href="/" onClick={(e) => { e.preventDefault(); onChange(tabs[0]!.id); }}>
            <Logo />
            <span className="brand-name">InsightLink</span>
          </a>

          <nav className="nav" ref={navRef} aria-label="Seções">
            {tabs.map((t) => (
              <button
                key={t.id}
                className={`nav-item ${active === t.id ? 'is-active' : ''}`}
                onClick={() => onChange(t.id)}
                aria-current={active === t.id ? 'page' : undefined}
              >
                <t.icon size={16} strokeWidth={1.8} />
                {t.label}
              </button>
            ))}
            {ind && <span className="nav-ind" style={{ width: ind.w, transform: `translateX(${ind.x}px)` }} />}
          </nav>

          <div className="topbar-actions">
            <button className="icon-btn" onClick={toggle} aria-label="Alternar tema" title={theme === 'dark' ? 'Tema claro' : 'Tema escuro'}>
              {theme === 'dark' ? <Sun size={17} strokeWidth={1.8} /> : <Moon size={17} strokeWidth={1.8} />}
            </button>

            <Menu
              trigger={({ toggle: t }) => (
                <button className="user-btn" onClick={t} aria-label="Menu da conta">
                  <span className="avatar">{initials(user?.nome)}</span>
                  <span className="user-name">{user?.nome?.split(' ')[0]}</span>
                </button>
              )}
            >
              {(close) => (
                <>
                  <div className="menu-head">
                    <strong>{user?.nome}</strong>
                    <span>{isAdmin ? 'Administrador' : 'Usuário'} · @{user?.username}</span>
                  </div>
                  <button className="menu-item" onClick={() => { close(); onChange('profile'); }}>
                    <UserRound size={16} strokeWidth={1.8} /> Minha conta
                  </button>
                  <button className="menu-item is-danger" onClick={logout}>
                    <LogOut size={16} strokeWidth={1.8} /> Sair
                  </button>
                </>
              )}
            </Menu>
          </div>
        </div>
      </header>

      <main className="page">{children}</main>

      <nav className="tabbar" aria-label="Seções">
        {tabs.map((t) => (
          <button
            key={t.id}
            className={`tabbar-item ${active === t.id ? 'is-active' : ''}`}
            onClick={() => onChange(t.id)}
          >
            <t.icon size={19} strokeWidth={1.8} />
            {t.label}
          </button>
        ))}
      </nav>
    </>
  );
}
