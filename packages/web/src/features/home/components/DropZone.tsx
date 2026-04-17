import { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Upload, X, FileText } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { Badge } from '@/shared/components/ui/badge';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB — mirrors server-side multer limit

export const DOCUMENT_MIMETYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
];

interface DropZoneProps {
  readonly label: string;
  readonly hint: string;
  readonly optional?: boolean;
  readonly file: File | null;
  readonly onFile: (file: File | null) => void;
  readonly dropText: string;
  readonly browseText: string;
  readonly acceptedTypes?: string[];
}

export function DropZone({
  label,
  hint,
  optional,
  file,
  onFile,
  dropText,
  browseText,
  acceptedTypes = ['application/pdf'],
}: DropZoneProps) {
  const { t } = useTranslation();
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const dropped = e.dataTransfer.files[0];
      if (dropped && acceptedTypes.includes(dropped.type) && dropped.size <= MAX_FILE_SIZE) onFile(dropped);
    },
    [onFile, acceptedTypes],
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selected = e.target.files?.[0];
      if (selected && selected.size <= MAX_FILE_SIZE) onFile(selected);
    },
    [onFile],
  );

  const removeFile = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onFile(null);
      if (inputRef.current) inputRef.current.value = '';
    },
    [onFile],
  );

  return (
    <div className='flex flex-col gap-2'>
      <div className='flex items-center gap-2'>
        <span className='text-sm font-medium text-foreground'>{label}</span>
        {optional && (
          <Badge variant='muted' className='text-xs'>
            {t('upload.optional')}
          </Badge>
        )}
      </div>
      <p className='text-xs text-muted-foreground'>{hint}</p>

      {file ? (
        <div className='flex items-center justify-between rounded-lg border border-primary/40 bg-primary/5 px-4 py-3'>
          <div className='flex items-center gap-2 min-w-0'>
            <FileText className='h-4 w-4 shrink-0 text-primary' aria-hidden='true' />
            <span className='truncate text-sm text-foreground'>{file.name}</span>
          </div>
          <button
            type='button'
            onClick={removeFile}
            aria-label={t('upload.remove')}
            className='ml-2 shrink-0 rounded text-muted-foreground transition-colors hover:text-destructive'
          >
            <X className='h-4 w-4' aria-hidden='true' />
          </button>
        </div>
      ) : (
        <button
          type='button'
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className={cn(
            'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-6 transition-colors',
            dragging
              ? 'border-primary bg-primary/10'
              : 'border-border bg-card hover:border-primary/50 hover:bg-primary/5',
          )}
          aria-label={`${dropText} — ${label}`}
        >
          <Upload className='h-6 w-6 text-muted-foreground' aria-hidden='true' />
          <span className='text-sm text-muted-foreground'>{dropText}</span>
          <span className='rounded-md bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground'>
            {browseText}
          </span>
        </button>
      )}

      <input
        ref={inputRef}
        type='file'
        accept={acceptedTypes.join(',')}
        className='sr-only'
        onChange={handleChange}
        aria-hidden='true'
        tabIndex={-1}
      />
    </div>
  );
}
