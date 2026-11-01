import React, { useRef, useState } from 'react';
import { ImagePlus, UploadCloud } from 'lucide-react';

type DropzoneTone = 'teal' | 'sky';

interface FileDropzoneProps {
  id: string;
  title: string;
  description: string;
  hint?: string;
  multiple?: boolean;
  disabled?: boolean;
  tone?: DropzoneTone;
  onFiles: (files: File[]) => void;
}

const TONES: Record<
  DropzoneTone,
  { icon: string; text: string; active: string; glow: string }
> = {
  teal: {
    icon: 'border-accent/30 bg-accent/10 text-accent',
    text: 'text-accent',
    active: 'border-accent/70 bg-accent/[0.07]',
    glow: 'bg-accent/[0.12]',
  },
  sky: {
    icon: 'border-cyan/30 bg-cyan/10 text-cyan',
    text: 'text-cyan',
    active: 'border-cyan/70 bg-cyan/[0.07]',
    glow: 'bg-cyan/[0.12]',
  },
};

export const FileDropzone: React.FC<FileDropzoneProps> = ({
  id,
  title,
  description,
  hint,
  multiple = false,
  disabled = false,
  tone = 'teal',
  onFiles,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const toneClasses = TONES[tone];
  const hintId = `${id}-hint`;

  const openPicker = () => {
    if (!disabled) inputRef.current?.click();
  };

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    onFiles(Array.from(fileList));
  };

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled}
      aria-label={title}
      aria-describedby={hint ? hintId : undefined}
      onClick={openPicker}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          openPicker();
        }
      }}
      onDragEnter={(event) => {
        event.preventDefault();
        if (!disabled) setDragActive(true);
      }}
      onDragOver={(event) => {
        event.preventDefault();
        if (!disabled) setDragActive(true);
      }}
      onDragLeave={(event) => {
        event.preventDefault();
        setDragActive(false);
      }}
      onDrop={(event) => {
        event.preventDefault();
        setDragActive(false);
        if (!disabled) handleFiles(event.dataTransfer.files);
      }}
      className={`group relative overflow-hidden rounded-xl border border-dashed p-6 text-center transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 focus-visible:ring-offset-2 focus-visible:ring-offset-panel sm:p-8 ${
        dragActive
          ? toneClasses.active
          : 'border-line-strong/70 bg-base/35 hover:border-accent/40 hover:bg-base/50'
      } ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
    >
      {dragActive && (
        <div
          className={`pointer-events-none absolute inset-0 opacity-60 blur-2xl ${toneClasses.glow}`}
        />
      )}

      <input
        ref={inputRef}
        id={id}
        type="file"
        accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
        multiple={multiple}
        disabled={disabled}
        tabIndex={-1}
        aria-hidden="true"
        className="sr-only"
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => event.stopPropagation()}
        onChange={(event) => {
          handleFiles(event.currentTarget.files);
          event.currentTarget.value = '';
        }}
      />

      <div className="relative flex flex-col items-center justify-center">
        <div className="relative mb-4">
          <div
            className={`flex h-14 w-14 items-center justify-center rounded-2xl border transition-transform duration-200 group-hover:scale-105 ${toneClasses.icon}`}
          >
            <UploadCloud className="h-6 w-6" aria-hidden="true" />
          </div>
          <div className="absolute -bottom-1.5 -right-1.5 flex h-6 w-6 items-center justify-center rounded-lg border border-line bg-panel text-faint">
            <ImagePlus className="h-3 w-3" aria-hidden="true" />
          </div>
        </div>

        <div className="text-sm font-semibold text-ink">{title}</div>
        <div className="mt-1 text-xs text-muted">{description}</div>

        <span
          className={`mt-4 inline-flex items-center gap-1.5 rounded-lg border border-line bg-raised/70 px-3 py-1.5 text-[11px] font-semibold transition-colors group-hover:border-accent/30 ${toneClasses.text}`}
        >
          Browse files
        </span>

        {hint && (
          <div
            id={hintId}
            className="mt-3 font-mono text-[10px] uppercase tracking-[0.06em] text-faint"
          >
            {hint}
          </div>
        )}
      </div>
    </div>
  );
};
