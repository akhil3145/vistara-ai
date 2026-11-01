import React from 'react';
import { Calendar, FileImage, HardDrive, Ruler, Upload, Waves } from 'lucide-react';
import { formatBytes, formatFileType } from '../../lib/imageUtils';
import type { ImageMetadata } from '../../types/prediction';

interface ImageMetadataPanelProps {
  meta: ImageMetadata;
}

export const ImageMetadataPanel: React.FC<ImageMetadataPanelProps> = ({ meta }) => {
  const dimensions =
    meta.width && meta.height
      ? `${meta.width} × ${meta.height} px`
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
      icon: Waves,
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
          className="flex items-start gap-2 rounded-lg border border-line/70 bg-base/30 px-2.5 py-2"
        >
          <item.icon
            className="mt-0.5 h-3 w-3 shrink-0 text-faint"
            aria-hidden="true"
          />
          <div className="min-w-0">
            <div className="text-[8.5px] uppercase tracking-[0.12em] text-faint">
              {item.label}
            </div>
            <div
              className="truncate text-[10.5px] text-muted"
              title={item.title ?? item.value}
            >
              {item.value}
            </div>
          </div>
        </div>
      ))}
      {meta.licenseNote && (
        <div className="rounded-lg border border-cyan/20 bg-cyan/[0.045] px-2.5 py-2 text-[10px] leading-relaxed text-muted sm:col-span-2">
          {meta.licenseNote}
        </div>
      )}
    </div>
  );
};
