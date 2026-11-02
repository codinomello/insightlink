import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from '@/components/ui/icons';

interface SheetProps {
  title: ReactNode;
  description?: ReactNode;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  /** Quando informado, o corpo + rodapé viram um <form>. */
  onSubmit?: (e: React.FormEvent) => void;
}

/** Gaveta lateral (vira "bottom sheet" no celular). */
export default function Sheet({ title, description, onClose, children, footer, onSubmit }: SheetProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const inner = (
    <>
      <div className="sheet-head">
        <div>
          <h2>{title}</h2>
          {description && <p>{description}</p>}
        </div>
        <button type="button" className="icon-btn" onClick={onClose} aria-label="Fechar">
          <X size={18} />
        </button>
      </div>
      <div className="sheet-body">{children}</div>
      {footer && <div className="sheet-foot">{footer}</div>}
    </>
  );

  return createPortal(
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="sheet" role="dialog" aria-modal="true" style={{ minHeight: 0 }}>
        {onSubmit ? (
          <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', minHeight: 0, height: '100%' }}>
            {inner}
          </form>
        ) : (
          inner
        )}
      </div>
    </div>,
    document.body,
  );
}
