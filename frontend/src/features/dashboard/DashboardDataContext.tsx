import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { errorMessage, getAnalytics, getProjects, getSummary } from '@/api';
import type { AnalyticsData, DashboardSummary, Project } from '@/types';

interface DashboardData {
  summary: DashboardSummary | null;
  analytics: AnalyticsData | null;
  projects: Project[];
  loading: boolean;
  analyticsLoading: boolean;
  error: string | null;
  refresh: () => void;
}

const Ctx = createContext<DashboardData | null>(null);

/** Carrega uma vez os dados usados pelas abas Painel, Análises e Registros. */
export function DashboardDataProvider({ children }: { children: ReactNode }) {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadBase = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [s, p] = await Promise.all([getSummary(), getProjects()]);
      setSummary(s);
      setProjects(p);
    } catch (err) {
      setError(errorMessage(err, 'Não foi possível carregar os dados.'));
    } finally {
      setLoading(false);
    }
  }, []);

  const loadAnalytics = useCallback(async () => {
    setAnalyticsLoading(true);
    try {
      setAnalytics(await getAnalytics());
    } catch {
      setAnalytics(null);
    } finally {
      setAnalyticsLoading(false);
    }
  }, []);

  const refresh = useCallback(() => { loadBase(); loadAnalytics(); }, [loadBase, loadAnalytics]);

  useEffect(() => { refresh(); }, [refresh]);

  const value = useMemo(
    () => ({ summary, analytics, projects, loading, analyticsLoading, error, refresh }),
    [summary, analytics, projects, loading, analyticsLoading, error, refresh],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useDashboardData(): DashboardData {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useDashboardData deve ser usado dentro de <DashboardDataProvider>.');
  return ctx;
}
