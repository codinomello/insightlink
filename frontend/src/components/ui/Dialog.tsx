import { useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface DialogProps {
  title: string;
  message?: ReactNode;
  confirmLabel?: string;
  danger?: boolean;
  /** Quando informado, exibe um campo de texto e envia o valor digitado. */
  input?: { label: string; type?: string; placeholder?: string; minLength?: number };
  onConfirm: (value: string) => void | Promise<void>;
  onCancel: () => void;
}

/** Diálogo de confirmação (substitui window.confirm / window.prompt). */
export default function Dialog({ title, message, confirmLabel = 'Confirmar', danger, input, onConfirm, onCancel }: DialogProps) {
  const [value, setValue] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onCancel();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onCancel]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await onConfirm(value);
    } finally {
      setBusy(false);
    }
  };

  return createPortal(
    <div className="overlay is-center" onMouseDown={(e) => e.target === e.currentTarget && onCancel()}>
      <form className="dialog" role="alertdialog" aria-modal="true" onSubmit={submit}>
        <h3>{title}</h3>
        {message && <p>{message}</p>}
        {input && (
          <div className="field">
            <label>{input.label}</label>
            <input
              className="input"
              type={input.type || 'text'}
              placeholder={input.placeholder}
              minLength={input.minLength}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              required
              autoFocus
            />
          </div>
        )}
        <div className="dialog-actions">
          <button type="button" className="btn" onClick={onCancel} autoFocus={danger && !input}>Cancelar</button>
          <button type="submit" className={`btn ${danger ? 'btn-danger is-solid' : 'btn-primary'}`} disabled={busy} autoFocus={!input && !danger}>
            {busy ? <span className="btn-spin" /> : confirmLabel}
          </button>
        </div>
      </form>
    </div>,
    document.body,
  );
}
