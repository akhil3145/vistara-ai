import React, { useRef, useState } from 'react';
import { UploadCloud } from 'lucide-react';

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
  { border: string; icon: string; text: string }
> = {
  teal: {
    border:
      'hover:border-teal-500 focus-visible:border-teal-500 dark:hover:border-teal-400 dark:focus-visible:border-teal-400',
    icon: 'bg-teal-500/10 text-teal-600 dark:text-teal-400',
    text: 'text-teal-600 dark:text-teal-400',
  },
  sky: {
    border:
      'hover:border-sky-500 focus-visible:border-sky-500 dark:hover:border-sky-400 dark:focus-visible:border-sky-400',
    icon: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
    text: 'text-sky-600 dark:text-sky-400',
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
      className={`rounded-xl border-2 border-dashed p-8 text-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-navy-900 ${
        dragActive
          ? 'border-teal-500 bg-teal-500/5 dark:border-teal-400'
          : 'border-slate-300 bg-slate-50/50 dark:border-navy-700 dark:bg-navy-950/40'
      } ${
        disabled
          ? 'cursor-not-allowed opacity-60'
          : `cursor-pointer ${toneClasses.border}`
      }`}
    >
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
      <div className="flex flex-col items-center justify-center space-y-2">
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-full ${toneClasses.icon}`}
        >
          <UploadCloud className="h-6 w-6" aria-hidden="true" />
        </div>
        <div className="text-sm font-medium text-slate-900 dark:text-white">
          {title}
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400">
          {description}
        </div>
        <div className={`text-xs font-medium ${toneClasses.text}`}>
          Browse files
        </div>
        {hint && (
          <div
            id={hintId}
            className="text-[11px] text-slate-400 dark:text-slate-500"
          >
            {hint}
          </div>
        )}
      </div>
    </div>
  );
};
