import { useEffect, useState, useCallback } from 'react';
import { getSummary, getProjects, getAnalytics, clearProjects, downloadReport } from '../lib/api';
import type { AnalyticsData, DashboardSummary, Project } from '../types';
import { useAuth } from '../context/AuthContext';

import AppHeader from '../components/layout/AppHeader';
import NavTabs, { type NavTabItem } from '../components/layout/NavTabs';
import KpiCards from '../components/dashboard/KpiCards';
import Charts from '../components/dashboard/Charts';
import AdvancedAnalytics from '../components/dashboard/AdvancedAnalytics';
import UploadPanel from '../components/records/UploadPanel';
import ProjectsTable from '../components/records/ProjectsTable';
import UsersAdminPage from './UsersAdminPage';
import ProfilePage from './ProfilePage';

type Tab = 'dashboard' | 'analytics' | 'records' | 'users' | 'profile';

const ALL_TABS: (NavTabItem<Tab> & { adminOnly?: boolean })[] = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'analytics', label: 'Análises Avançadas' },
  { id: 'records', label: 'Registros' },
  { id: 'users', label: 'Usuários', adminOnly: true },
  { id: 'profile', label: 'Minha Conta' },
];

export default function DashboardPage() {
  const { isAdmin, logout } = useAuth();
  const [tab, setTab] = useState<Tab>('dashboard');
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [analyticsLoading, setAnalyticsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [summaryRes, projectsRes] = await Promise.all([getSummary(), getProjects()]);
      setSummary(summaryRes.data);
      setProjects(projectsRes.data);
    } catch (err: any) {
      console.error('Erro ao carregar dados:', err);
      setError('Não foi possível carregar os dados. Verifique se o servidor backend está rodando.');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAnalytics = useCallback(async () => {
    setAnalyticsLoading(true);
    try {
      const res = await getAnalytics();
      setAnalytics(res.data);
    } catch (err) {
      console.error('Erro ao carregar análises avançadas:', err);
    } finally {
      setAnalyticsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    fetchAnalytics();
  }, [fetchData, fetchAnalytics]);

  const handleRefresh = () => {
    fetchData();
    fetchAnalytics();
  };

  const handleClearAll = async () => {
    if (!confirm('Deseja realmente apagar TODOS os registros salvos? Esta ação não pode ser desfeita.')) {
      return;
    }
    try {
      await clearProjects();
      await handleRefresh();
    } catch (err: any) {
      alert('Erro ao apagar registros: ' + (err.response?.data?.error || err.message));
    }
  };

  const visibleTabs = ALL_TABS.filter((t) => !t.adminOnly || isAdmin);

  const headerActions = (
    <>
      <button className="btn btn-secondary" onClick={handleRefresh} title="Atualizar dados">
        Atualizar
      </button>
      <button className="btn" onClick={() => downloadReport('xlsx')} title="Baixar relatório em Excel">
        Excel
      </button>
      <button className="btn" onClick={() => downloadReport('pdf')} title="Baixar relatório em PDF">
        PDF
      </button>
      {isAdmin && projects.length > 0 && (
        <button className="btn btn-danger" onClick={handleClearAll} title="Limpar todos os registros">
          Limpar tudo
        </button>
      )}
      <button className="btn" onClick={logout} title="Encerrar sessão">
        Sair
      </button>
    </>
  );

  return (
    <div className="app-container">
      <AppHeader actions={headerActions} />

      <NavTabs tabs={visibleTabs} active={tab} onChange={setTab} />

      <main className="app-main">
        {error && <div className="alert-error">{error}</div>}

        {tab === 'dashboard' && (
          <>
            {isAdmin && <UploadPanel onImported={handleRefresh} />}
            {loading ? (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Carregando dados do painel...</p>
              </div>
            ) : (
              <>
                <KpiCards summary={summary} />
                <Charts summary={summary} />
              </>
            )}
          </>
        )}

        {tab === 'analytics' && <AdvancedAnalytics analytics={analytics} loading={analyticsLoading} />}

        {tab === 'records' && (
          <ProjectsTable projects={projects} onChanged={fetchData} isAdmin={isAdmin} />
        )}

        {tab === 'users' && isAdmin && <UsersAdminPage />}

        {tab === 'profile' && <ProfilePage />}
      </main>

      <footer className="app-footer">
        <p>InsightLink &copy; {new Date().getFullYear()} — Integrado ao ENIAC Link+</p>
      </footer>
    </div>
  );
}
