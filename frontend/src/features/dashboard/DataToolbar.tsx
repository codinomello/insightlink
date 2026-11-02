import { ChevronDown, Download, FileSpreadsheet, FileText, RefreshCw } from '@/components/ui/icons';
import Menu from '@/components/ui/Menu';
import { downloadReport } from '@/api';
import { useToast } from '@/context/ToastContext';
import { useDashboardData } from './DashboardDataContext';

/** Atualizar + exportar: ações comuns às abas de dados. */
export default function DataToolbar() {
  const { loading, refresh } = useDashboardData();
  const { notify } = useToast();

  const exportReport = async (kind: 'pdf' | 'xlsx') => {
    try {
      await downloadReport(kind);
    } catch {
      notify('Não foi possível gerar o relatório.', 'error');
    }
  };

  return (
    <>
      <button className={`icon-btn is-bordered ${loading ? 'is-spinning' : ''}`} onClick={refresh} aria-label="Atualizar dados" title="Atualizar">
        <RefreshCw size={16} strokeWidth={1.8} />
      </button>
      <Menu
        trigger={({ toggle }) => (
          <button className="btn" onClick={toggle}>
            <Download size={16} strokeWidth={1.8} /> Exportar <ChevronDown size={14} strokeWidth={2} />
          </button>
        )}
      >
        {(close) => (
          <>
            <button className="menu-item" onClick={() => { close(); exportReport('xlsx'); }}><FileSpreadsheet size={16} strokeWidth={1.8} /> Planilha Excel</button>
            <button className="menu-item" onClick={() => { close(); exportReport('pdf'); }}><FileText size={16} strokeWidth={1.8} /> Relatório PDF</button>
          </>
        )}
      </Menu>
    </>
  );
}
