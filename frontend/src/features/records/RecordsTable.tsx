import { useMemo, useState } from 'react';
import { Inbox, Pencil, Plus, Search, Trash2 } from '@/components/ui/icons';
import { deleteProject, errorMessage } from '@/api';
import { useToast } from '@/context/ToastContext';
import type { Project } from '@/types';
import Dialog from '@/components/ui/Dialog';
import Sheet from '@/components/ui/Sheet';
import { EmptyState } from '@/components/ui/States';
import RecordFormModal from '@/features/records/RecordForm';

interface Props {
  projects?: Project[];
  isAdmin: boolean;
  onChanged: () => void;
  onClearAll?: () => void;
}

const PAGE = 25;

const SECTIONS: [keyof Project, string][] = [
  ['objetivo', 'Objetivo'],
  ['contexto_limitacoes', 'Contexto e limitações'],
  ['requisitos_tecnicos', 'Requisitos técnicos'],
  ['restricoes', 'Restrições'],
  ['entregaveis_sucesso', 'Entregáveis e critérios de sucesso'],
];

const meterClass = (v: number) => (v >= 80 ? 'is-high' : v < 50 ? 'is-low' : '');

export default function ProjectsTable({ projects = [], isAdmin, onChanged, onClearAll }: Props) {
  const { notify } = useToast();
  const [search, setSearch] = useState('');
  const [tipo, setTipo] = useState('');
  const [empresa, setEmpresa] = useState('');
  const [limit, setLimit] = useState(PAGE);
  const [selected, setSelected] = useState<Project | null>(null);
  const [form, setForm] = useState<{ open: boolean; record: Project | null }>({ open: false, record: null });
  const [toDelete, setToDelete] = useState<Project | null>(null);

  const list = useMemo(() => (Array.isArray(projects) ? projects : []), [projects]);
  const empresas = useMemo(() => [...new Set(list.map((p) => p.empresa).filter((e): e is string => Boolean(e)))].sort(), [list]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return list.filter((p) => {
      if (tipo && p.tipo !== tipo) return false;
      if (empresa && p.empresa !== empresa) return false;
      return !q || `${p.titulo || ''} ${p.proponente || ''} ${p.empresa || ''} ${p.cargo || ''}`.toLowerCase().includes(q);
    });
  }, [list, search, tipo, empresa]);

  const visible = filtered.slice(0, limit);

  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      await deleteProject(toDelete.id);
      notify('Registro removido.', 'success');
      if (selected?.id === toDelete.id) setSelected(null);
      setToDelete(null);
      onChanged();
    } catch (err) {
      notify(errorMessage(err, 'Não foi possível remover o registro.'), 'error');
    }
  };

  return (
    <section className="panel rise">
      <div className="filters">
        <div className="search">
          <Search size={15} strokeWidth={1.8} />
          <input className="input" placeholder="Buscar por título, proponente, empresa ou cargo" value={search}
            onChange={(e) => { setSearch(e.target.value); setLimit(PAGE); }} />
        </div>
        <div className="filter-group">
          <select className="select" value={tipo} onChange={(e) => { setTipo(e.target.value); setLimit(PAGE); }} aria-label="Tipo">
            <option value="">Todos os tipos</option>
            <option value="Desafio">Desafio</option>
            <option value="Projeto">Projeto</option>
          </select>
          <select className="select" value={empresa} onChange={(e) => { setEmpresa(e.target.value); setLimit(PAGE); }} aria-label="Empresa">
            <option value="">Todas as empresas</option>
            {empresas.map((e) => <option key={e} value={e}>{e}</option>)}
          </select>
        </div>
        {isAdmin && (
          <div className="filter-group is-actions">
            <button className="btn btn-primary" onClick={() => setForm({ open: true, record: null })}>
              <Plus size={16} strokeWidth={2} /> Novo registro
            </button>
            {onClearAll && list.length > 0 && (
              <button className="btn btn-danger" onClick={onClearAll}>Limpar tudo</button>
            )}
          </div>
        )}
        <span className="count">{filtered.length} de {list.length}</span>
      </div>

      {list.length === 0 ? (
        <EmptyState icon={<Inbox size={20} strokeWidth={1.6} />} title="Nenhum registro">
          {isAdmin ? 'Importe uma planilha na aba Painel ou cadastre um registro manualmente.' : 'Ainda não há registros cadastrados.'}
        </EmptyState>
      ) : (
        <div className="table-wrap">
          <table className="table is-cards">
            <thead>
              <tr>
                <th>Título</th><th>Tipo</th><th>Proponente</th><th>Empresa</th><th>Cargo</th><th>Completude</th>
                {isAdmin && <th aria-label="Ações" />}
              </tr>
            </thead>
            <tbody>
              {visible.length === 0 ? (
                <tr><td className="empty-row" colSpan={isAdmin ? 7 : 6}>Nenhum registro corresponde aos filtros.</td></tr>
              ) : visible.map((p, i) => (
                <tr key={p.id} className="is-clickable tr-enter" style={{ ['--i' as string]: Math.min(i, 12) }} onClick={() => setSelected(p)}>
                  <td className="cell-title cell-main" style={{ maxWidth: 360 }}>{p.titulo}</td>
                  <td data-label="Tipo"><span className={`tag ${p.tipo === 'Desafio' ? 'tag-accent' : 'tag-blue'}`}>{p.tipo}</span></td>
                  <td data-label="Proponente" className="cell-muted">{p.proponente || '—'}</td>
                  <td data-label="Empresa" className="cell-muted">{p.empresa || '—'}</td>
                  <td data-label="Cargo" className="cell-muted">{p.cargo || '—'}</td>
                  <td data-label="Completude">
                    <div className="meter">
                      <div className="meter-track"><div className={`meter-fill ${meterClass(p.completude || 0)}`} style={{ width: `${p.completude || 0}%` }} /></div>
                      <span className="meter-val">{p.completude || 0}%</span>
                    </div>
                  </td>
                  {isAdmin && (
                    <td className="cell-actions" onClick={(e) => e.stopPropagation()}>
                      <div className="row-actions">
                        <button className="icon-btn" title="Editar" aria-label="Editar" onClick={() => setForm({ open: true, record: p })}><Pencil size={15} strokeWidth={1.8} /></button>
                        <button className="icon-btn is-danger" title="Remover" aria-label="Remover" onClick={() => setToDelete(p)}><Trash2 size={15} strokeWidth={1.8} /></button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {filtered.length > limit && (
        <div className="table-foot">
          <button className="btn btn-sm" onClick={() => setLimit((l) => l + PAGE)}>Mostrar mais ({filtered.length - limit})</button>
        </div>
      )}

      {selected && (
        <Sheet
          title={selected.titulo}
          description={<span className={`tag ${selected.tipo === 'Desafio' ? 'tag-accent' : 'tag-blue'}`}>{selected.tipo}</span>}
          onClose={() => setSelected(null)}
          footer={isAdmin && (
            <>
              <button className="btn" onClick={() => setToDelete(selected)}>Remover</button>
              <button className="btn btn-primary" onClick={() => { setForm({ open: true, record: selected }); }}>Editar</button>
            </>
          )}
        >
          <dl className="kv">
            <dt>Proponente</dt><dd>{selected.proponente || '—'}</dd>
            <dt>E-mail</dt><dd>{selected.email || '—'}</dd>
            <dt>Telefone</dt><dd>{selected.telefone || '—'}</dd>
            <dt>Empresa</dt><dd>{selected.empresa || '—'}</dd>
            <dt>Cargo</dt><dd>{selected.cargo || '—'}</dd>
            {selected.mentor && (<><dt>Mentor</dt><dd>{selected.mentor}</dd></>)}
            <dt>Origem</dt><dd>{selected.origem_arquivo || '—'}</dd>
            <dt>Completude</dt><dd>{selected.completude || 0}%</dd>
          </dl>
          {SECTIONS.map(([key, label]) => selected[key] ? (
            <div className="block" key={key}><h4>{label}</h4><p>{String(selected[key])}</p></div>
          ) : null)}
        </Sheet>
      )}

      {form.open && (
        <RecordFormModal
          record={form.record}
          onClose={() => setForm({ open: false, record: null })}
          onSaved={() => { notify(form.record ? 'Registro atualizado.' : 'Registro criado.', 'success'); setSelected(null); onChanged(); }}
        />
      )}

      {toDelete && (
        <Dialog
          title="Remover registro?"
          message={<>“{toDelete.titulo}” será removido definitivamente.</>}
          confirmLabel="Remover"
          danger
          onConfirm={confirmDelete}
          onCancel={() => setToDelete(null)}
        />
      )}
    </section>
  );
}
