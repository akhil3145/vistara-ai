export const ACCEPTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

export const ACCEPTED_IMAGE_EXTENSIONS = [
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
] as const;

export const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;

export type ImageValidationResult =
  | { ok: true }
  | {
      ok: false;
      code: 'unsupported-type' | 'oversized' | 'empty';
      message: string;
    };

export const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

export const formatFileType = (mimeType: string): string => {
  if (mimeType === 'image/jpeg') return 'JPEG';
  if (mimeType === 'image/png') return 'PNG';
  if (mimeType === 'image/webp') return 'WEBP';
  if (mimeType === 'image/svg+xml') return 'SVG illustration';
  return mimeType || 'Unknown';
};

export const validateImageFile = (file: File): ImageValidationResult => {
  const extensionIndex = file.name.lastIndexOf('.');
  const extension =
    extensionIndex >= 0 ? file.name.slice(extensionIndex).toLowerCase() : '';
  const acceptedType = ACCEPTED_IMAGE_TYPES.includes(
    file.type as (typeof ACCEPTED_IMAGE_TYPES)[number],
  );
  const acceptedExtension = ACCEPTED_IMAGE_EXTENSIONS.includes(
    extension as (typeof ACCEPTED_IMAGE_EXTENSIONS)[number],
  );

  if (!acceptedType && !(file.type === '' && acceptedExtension)) {
    return {
      ok: false,
      code: 'unsupported-type',
      message: 'Unsupported format. Use a JPEG, PNG, or WEBP image.',
    };
  }

  if (file.size === 0) {
    return {
      ok: false,
      code: 'empty',
      message: 'This file is empty and cannot be analyzed.',
    };
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return {
      ok: false,
      code: 'oversized',
      message: 'Image exceeds the 10 MB limit.',
    };
  }

  return { ok: true };
};

export const readImageDimensions = (
  src: string,
): Promise<{ width: number; height: number }> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      resolve({ width: image.naturalWidth, height: image.naturalHeight });
    };
    image.onerror = () => {
      reject(new Error('Unable to decode image'));
    };
    image.src = src;
  });
