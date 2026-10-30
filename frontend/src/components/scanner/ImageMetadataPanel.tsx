import React from 'react';
import { Calendar, FileImage, HardDrive, Ruler, Upload } from 'lucide-react';
import { formatBytes, formatFileType } from '../../lib/imageUtils';
import type { ImageMetadata } from '../../types/prediction';

interface ImageMetadataPanelProps {
  meta: ImageMetadata;
}

export const ImageMetadataPanel: React.FC<ImageMetadataPanelProps> = ({ meta }) => {
  const dimensions =
    meta.width && meta.height
      ? `${meta.width} x ${meta.height} px`
      : 'Reading dimensions';
  const size =
    meta.sizeBytes !== undefined ? formatBytes(meta.sizeBytes) : 'Illustrative asset';
  const modified = meta.lastModified
    ? new Date(meta.lastModified).toLocaleString()
    : 'Not applicable';

  const items = [
    {
      icon: FileImage,
      label: 'File',
      value: meta.name,
      title: meta.name,
    },
    {
      icon: Upload,
      label: 'Source',
      value: meta.source === 'upload' ? 'Local upload' : 'Illustrative sample',
    },
    {
      icon: FileImage,
      label: 'Format',
      value: formatFileType(meta.mimeType),
    },
    {
      icon: HardDrive,
      label: 'Size',
      value: size,
    },
    {
      icon: Ruler,
      label: 'Dimensions',
      value: dimensions,
    },
    {
      icon: Calendar,
      label: 'Modified',
      value: modified,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {items.map((item) => (
        <div
          key={item.label}
          className="flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50/60 px-2.5 py-2 dark:border-navy-800 dark:bg-navy-950/40"
        >
          <item.icon
            className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400"
            aria-hidden="true"
          />
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-wide text-slate-400 dark:text-slate-500">
              {item.label}
            </div>
            <div
              className="truncate text-[11px] text-slate-700 dark:text-slate-200"
              title={item.title ?? item.value}
            >
              {item.value}
            </div>
          </div>
        </div>
      ))}
      {meta.licenseNote && (
        <div className="rounded-lg border border-sky-500/20 bg-sky-500/5 px-2.5 py-2 text-[11px] leading-relaxed text-sky-800 dark:text-sky-300 sm:col-span-2">
          {meta.licenseNote}
        </div>
      )}
    </div>
  );
};
