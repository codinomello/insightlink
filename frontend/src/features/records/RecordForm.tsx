import { useState, type FormEvent } from 'react';
import { CircleAlert } from '@/components/ui/icons';
import * as api from '@/api';
import type { Project } from '@/types';
import Sheet from '@/components/ui/Sheet';

interface Props {
  record: Project | null; // null = criação
  onClose: () => void;
  onSaved: () => void;
}

const EMPTY: Partial<Project> = { tipo: 'Desafio', titulo: '' };

const LONG_FIELDS: [keyof Project, string][] = [
  ['objetivo', 'Objetivo'],
  ['contexto_limitacoes', 'Contexto e limitações'],
  ['requisitos_tecnicos', 'Requisitos técnicos'],
  ['restricoes', 'Restrições'],
  ['entregaveis_sucesso', 'Entregáveis e critérios de sucesso'],
];

export default function RecordFormModal({ record, onClose, onSaved }: Props) {
  const [form, setForm] = useState<Partial<Project>>(record ? { ...record } : { ...EMPTY });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (field: keyof Project, value: string) => setForm((f) => ({ ...f, [field]: value }));
  const val = (field: keyof Project) => (form[field] as string | undefined) || '';

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      if (record) await api.editProject(record.id, form);
      else await api.createProject(form);
      onSaved();
      onClose();
    } catch (err) {
      setError(api.errorMessage(err, 'Não foi possível salvar o registro.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet
      title={record ? 'Editar registro' : 'Novo registro'}
      description={record ? 'Atualize as informações abaixo.' : 'Cadastre um desafio ou projeto sem precisar de upload.'}
      onClose={onClose}
      onSubmit={submit}
      footer={
        <>
          <button type="button" className="btn" onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? <span className="btn-spin" /> : record ? 'Salvar' : 'Criar registro'}
          </button>
        </>
      }
    >
      <div className="field-row">
        <div className="field" style={{ flex: '0 0 150px' }}>
          <label>Tipo <i>*</i></label>
          <select className="select" value={val('tipo') || 'Desafio'} onChange={(e) => set('tipo', e.target.value)}>
            <option value="Desafio">Desafio</option>
            <option value="Projeto">Projeto</option>
          </select>
        </div>
        <div className="field" style={{ flex: '2 1 220px' }}>
          <label>Título <i>*</i></label>
          <input className="input" value={val('titulo')} onChange={(e) => set('titulo', e.target.value)} required autoFocus />
        </div>
      </div>

      <div className="field-row">
        <div className="field"><label>Proponente</label><input className="input" value={val('proponente')} onChange={(e) => set('proponente', e.target.value)} /></div>
        <div className="field"><label>Empresa</label><input className="input" value={val('empresa')} onChange={(e) => set('empresa', e.target.value)} /></div>
        <div className="field"><label>Cargo</label><input className="input" value={val('cargo')} onChange={(e) => set('cargo', e.target.value)} /></div>
      </div>

      <div className="field-row">
        <div className="field"><label>E-mail</label><input className="input" type="email" value={val('email')} onChange={(e) => set('email', e.target.value)} /></div>
        <div className="field"><label>Telefone</label><input className="input" value={val('telefone')} onChange={(e) => set('telefone', e.target.value)} /></div>
        <div className="field"><label>Mentor</label><input className="input" value={val('mentor')} onChange={(e) => set('mentor', e.target.value)} /></div>
      </div>

      {LONG_FIELDS.map(([key, label]) => (
        <div className="field" key={key}>
          <label>{label}</label>
          <textarea className="textarea" rows={3} value={val(key)} onChange={(e) => set(key, e.target.value)} />
        </div>
      ))}

      {error && <div className="alert alert-error"><CircleAlert size={16} /> {error}</div>}
    </Sheet>
  );
}
