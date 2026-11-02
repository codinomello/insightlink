import { useState, type ReactNode } from 'react';
import { Activity, ChartNoAxesColumn, LayoutGrid, Rows3, Users } from '@/components/ui/icons';
import AppShell, { type ShellTab } from '@/components/layout/AppShell';
import { useAuth } from '@/features/auth/AuthContext';
import ProfilePage from '@/features/auth/ProfilePage';
import { DashboardDataProvider } from '@/features/dashboard/DashboardDataContext';
import OverviewPage from '@/features/overview/OverviewPage';
import AnalyticsPage from '@/features/analytics/AnalyticsPage';
import RecordsPage from '@/features/records/RecordsPage';
import ActivityPage from '@/features/activity/ActivityPage';
import UsersPage from '@/features/users/UsersPage';

type Tab = 'overview' | 'analytics' | 'records' | 'activity' | 'users';
type Route = Tab | 'profile';

const TABS: (ShellTab<Tab> & { adminOnly?: boolean })[] = [
  { id: 'overview', label: 'Painel', icon: LayoutGrid },
  { id: 'analytics', label: 'Análises', icon: ChartNoAxesColumn },
  { id: 'records', label: 'Registros', icon: Rows3 },
  { id: 'activity', label: 'Atividade', icon: Activity, adminOnly: true },
  { id: 'users', label: 'Usuários', icon: Users, adminOnly: true },
];

const PAGES: Record<Route, () => ReactNode> = {
  overview: OverviewPage,
  analytics: AnalyticsPage,
  records: RecordsPage,
  activity: ActivityPage,
  users: UsersPage,
  profile: ProfilePage,
};

/** Área autenticada: navegação entre as abas conforme o papel do usuário. */
export default function Workspace() {
  const { isAdmin } = useAuth();
  const [route, setRoute] = useState<Route>('overview');

  const tabs = TABS.filter((t) => !t.adminOnly || isAdmin);
  // Se o papel mudar (ex.: rebaixamento) e a aba atual deixar de existir, volta ao painel.
  const current: Route = route === 'profile' || tabs.some((t) => t.id === route) ? route : 'overview';
  const Page = PAGES[current];

  return (
    <DashboardDataProvider>
      <AppShell tabs={tabs} active={current} onChange={setRoute}>
        <div key={current}><Page /></div>
      </AppShell>
    </DashboardDataProvider>
  );
}
