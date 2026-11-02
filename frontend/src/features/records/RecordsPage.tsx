import { useState } from 'react';
import { clearProjects, errorMessage } from '@/api';
import Dialog from '@/components/ui/Dialog';
import PageHead from '@/components/ui/PageHead';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/features/auth/AuthContext';
import { useDashboardData } from '@/features/dashboard/DashboardDataContext';
import DataToolbar from '@/features/dashboard/DataToolbar';
import RecordsTable from './RecordsTable';

export default function RecordsPage() {
  const { isAdmin } = useAuth();
  const { projects, refresh } = useDashboardData();
  const { notify } = useToast();
  const [confirmClear, setConfirmClear] = useState(false);

  const clearAll = async () => {
    try {
      await clearProjects();
      setConfirmClear(false);
      notify('Todos os registros foram removidos.', 'success');
      refresh();
    } catch (err) {
      notify(errorMessage(err, 'Não foi possível limpar os registros.'), 'error');
    }
  };

  return (
    <>
      <PageHead eyebrow="Base de dados" title="Registros" description="Pesquise, filtre e abra qualquer desafio ou projeto." actions={<DataToolbar />} />
      <RecordsTable projects={projects} isAdmin={isAdmin} onChanged={refresh} onClearAll={() => setConfirmClear(true)} />

      {confirmClear && (
        <Dialog
          title="Apagar todos os registros?"
          message="Todos os desafios e projetos serão removidos definitivamente. O histórico de uploads é mantido."
          confirmLabel="Apagar tudo"
          danger
          onConfirm={clearAll}
          onCancel={() => setConfirmClear(false)}
        />
      )}
    </>
  );
}
