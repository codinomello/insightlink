import { useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import { CircleAlert, CircleCheck, FileUp } from '@/components/ui/icons';
import { errorMessage, uploadFile } from '@/api';

interface Props {
  onImported: () => void;
}

export default function UploadPanel({ onImported }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; message: string } | null>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setLoading(true);
    setFeedback(null);
    let imported = 0;
    const errors: string[] = [];

    for (const file of Array.from(files)) {
      try {
        const res = await uploadFile(file);
        imported += res.imported;
      } catch (err) {
        errors.push(`${file.name}: ${errorMessage(err, 'erro ao processar')}`);
      }
    }

    setLoading(false);
    if (imported > 0) onImported();
    setFeedback({
      ok: errors.length === 0,
      message: errors.length === 0
        ? `${imported} registro${imported === 1 ? '' : 's'} importado${imported === 1 ? '' : 's'}.`
        : `${imported} importado${imported === 1 ? '' : 's'}. ${errors.join(' · ')}`,
    });
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div
      className={`dropzone rise ${dragging ? 'is-drag' : ''}`}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && inputRef.current?.click()}
      onDragOver={(e: DragEvent) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e: DragEvent) => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
      onClick={() => inputRef.current?.click()}
    >
      <input ref={inputRef} type="file" accept=".pdf,.xlsx,.xls,.csv" multiple hidden
        onChange={(e: ChangeEvent<HTMLInputElement>) => handleFiles(e.target.files)} />
      <span className="dropzone-icon">{loading ? <span className="btn-spin" /> : <FileUp size={19} strokeWidth={1.7} />}</span>
      <div>
        <strong>{loading ? 'Processando arquivos…' : 'Importar dados'}</strong>
        <span>Arraste PDFs, planilhas (.xlsx) ou o CSV do ENIAC Link+, ou clique para escolher.</span>
      </div>
      {feedback && (
        <div className={`alert ${feedback.ok ? 'alert-ok' : 'alert-error'}`} onClick={(e) => e.stopPropagation()}>
          {feedback.ok ? <CircleCheck size={16} /> : <CircleAlert size={16} />} {feedback.message}
        </div>
      )}
    </div>
  );
}
