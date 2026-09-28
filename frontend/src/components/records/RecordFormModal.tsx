import { useState, type FormEvent } from 'react';
import * as api from '../../lib/api';
import type { Project } from '../../types';

interface Props {
  record: Project | null; // null = criação
  onClose: () => void;
  onSaved: () => void;
}

const EMPTY: Partial<Project> = {
  tipo: 'Desafio',
  titulo: '',
  proponente: '',
  email: '',
  telefone: '',
  empresa: '',
  cargo: '',
  mentor: '',
  objetivo: '',
  contexto_limitacoes: '',
  requisitos_tecnicos: '',
  restricoes: '',
  entregaveis_sucesso: '',
};

export default function RecordFormModal({ record, onClose, onSaved }: Props) {
  const [form, setForm] = useState<Partial<Project>>(record ? { ...record } : { ...EMPTY });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = (field: keyof Project, value: string) => setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      if (record) {
        await api.editProject(record.id, form);
      } else {
        await api.createProject(form);
      }
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao salvar o registro.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer" onClick={(e) => e.stopPropagation()}>
        <button className="drawer-close" onClick={onClose}>✕</button>
        <h2 style={{ margin: '0 0 4px', fontSize: '1.3rem' }}>{record ? 'Editar registro' : 'Novo registro'}</h2>
        <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: '0 0 24px' }}>
          {record ? 'Atualize as informações abaixo.' : 'Cadastre um desafio ou projeto manualmente, sem precisar de upload.'}
        </p>

        <form onSubmit={handleSubmit} className="record-form">
          <div className="form-row">
            <div className="form-field">
              <label>Tipo *</label>
              <select value={form.tipo || 'Desafio'} onChange={(e) => update('tipo', e.target.value)}>
                <option value="Desafio">Desafio</option>
                <option value="Projeto">Projeto</option>
              </select>
            </div>
            <div className="form-field" style={{ flex: 2 }}>
              <label>Título *</label>
              <input value={form.titulo || ''} onChange={(e) => update('titulo', e.target.value)} required />
            </div>
          </div>

          <div className="form-row">
            <div className="form-field">
              <label>Proponente</label>
              <input value={form.proponente || ''} onChange={(e) => update('proponente', e.target.value)} />
            </div>
            <div className="form-field">
              <label>Empresa</label>
              <input value={form.empresa || ''} onChange={(e) => update('empresa', e.target.value)} />
            </div>
            <div className="form-field">
              <label>Cargo</label>
              <input value={form.cargo || ''} onChange={(e) => update('cargo', e.target.value)} />
            </div>
          </div>

          <div className="form-row">
            <div className="form-field">
              <label>E-mail</label>
              <input type="email" value={form.email || ''} onChange={(e) => update('email', e.target.value)} />
            </div>
            <div className="form-field">
              <label>Telefone</label>
              <input value={form.telefone || ''} onChange={(e) => update('telefone', e.target.value)} />
            </div>
            <div className="form-field">
              <label>Mentor</label>
              <input value={form.mentor || ''} onChange={(e) => update('mentor', e.target.value)} />
            </div>
          </div>

          <div className="form-field">
            <label>Objetivo</label>
            <textarea rows={2} value={form.objetivo || ''} onChange={(e) => update('objetivo', e.target.value)} />
          </div>
          <div className="form-field">
            <label>Contexto e Limitações</label>
            <textarea rows={2} value={form.contexto_limitacoes || ''} onChange={(e) => update('contexto_limitacoes', e.target.value)} />
          </div>
          <div className="form-field">
            <label>Requisitos Técnicos</label>
            <textarea rows={2} value={form.requisitos_tecnicos || ''} onChange={(e) => update('requisitos_tecnicos', e.target.value)} />
          </div>
          <div className="form-field">
            <label>Restrições</label>
            <textarea rows={2} value={form.restricoes || ''} onChange={(e) => update('restricoes', e.target.value)} />
          </div>
          <div className="form-field">
            <label>Entregáveis e Critérios de Sucesso</label>
            <textarea rows={2} value={form.entregaveis_sucesso || ''} onChange={(e) => update('entregaveis_sucesso', e.target.value)} />
          </div>

          {error && <div className="alert-error">{error}</div>}

          <div className="form-actions">
            <button type="button" className="btn" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-secondary" disabled={saving}>
              {saving ? 'Salvando...' : record ? 'Salvar alterações' : 'Criar registro'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
