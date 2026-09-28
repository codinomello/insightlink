export interface NavTabItem<T extends string = string> {
  id: T;
  label: string;
}

interface NavTabsProps<T extends string> {
  tabs: NavTabItem<T>[];
  active: T;
  onChange: (id: T) => void;
}

/** Navegação por abas reutilizada no dashboard e na tela de login. */
export default function NavTabs<T extends string>({ tabs, active, onChange }: NavTabsProps<T>) {
  return (
    <nav className="nav-tabs">
      {tabs.map((t) => (
        <button
          key={t.id}
          type="button"
          className={`nav-tab ${active === t.id ? 'active' : ''}`}
          onClick={() => onChange(t.id)}
        >
          {t.label}
        </button>
      ))}
    </nav>
  );
}
