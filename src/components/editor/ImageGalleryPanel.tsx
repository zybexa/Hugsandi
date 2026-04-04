'use client';

import { useState } from 'react';
import { DesignImage } from '@/types/design';
import { useTranslation } from '@/lib/i18n';

interface ImageGalleryPanelProps {
  designId: string | null;
  images: DesignImage[];
  onImagesChange: (images: DesignImage[]) => void;
  onEnsureSaved: () => Promise<string | undefined>;
  readOnly?: boolean;
  selectedImageUrl?: string;
  onSelectImage?: (url: string, filename: string) => void;
  onImageDeleted?: (url: string) => void;
}

export default function ImageGalleryPanel({
  designId,
  images,
  onImagesChange,
  onEnsureSaved,
  readOnly,
  selectedImageUrl,
  onSelectImage,
  onImageDeleted,
}: ImageGalleryPanelProps) {
  const { t, tp } = useTranslation();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setError('');
    try {
      // Ensure design is saved first
      let id = designId;
      if (!id) {
        id = (await onEnsureSaved()) || null;
        if (!id) {
          setError(t('gallery.saveFailed'));
          return;
        }
      }

      const newImages: DesignImage[] = [];
      let failCount = 0;
      const fileArray = Array.from(files);

      // Upload in parallel batches of 3
      const BATCH = 3;
      for (let i = 0; i < fileArray.length; i += BATCH) {
        const batch = fileArray.slice(i, i + BATCH);
        const results = await Promise.allSettled(
          batch.map(async (file) => {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('designId', id!);
            const res = await fetch('/api/upload', { method: 'POST', body: formData });
            if (!res.ok) throw new Error('Upload failed');
            return res.json();
          })
        );
        for (const result of results) {
          if (result.status === 'fulfilled' && result.value.imageId) {
            newImages.push({
              id: result.value.imageId,
              url: result.value.url,
              filename: result.value.filename,
              createdAt: result.value.createdAt || new Date().toISOString(),
            });
          } else {
            failCount++;
          }
        }
      }

      if (newImages.length > 0) {
        onImagesChange([...newImages, ...images]);
      } else if (id) {
        // All failed or no imageIds — re-fetch gallery
        const imgRes = await fetch(`/api/designs/${id}/images`);
        if (imgRes.ok) onImagesChange(await imgRes.json());
      }

      if (failCount > 0) {
        setError(tp('gallery.uploadFailed', failCount));
        setTimeout(() => setError(''), 3000);
      }
    } catch {
      setError(t('gallery.uploadFailed'));
      setTimeout(() => setError(''), 3000);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  async function handleDelete(imageId: string) {
    if (!designId) return;
    const deletedImg = images.find((img) => img.id === imageId);
    try {
      await fetch(`/api/designs/${designId}/images`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageId }),
      });
      onImagesChange(images.filter((img) => img.id !== imageId));
      if (deletedImg && onImageDeleted) onImageDeleted(deletedImg.url);
    } catch {
      // Silently fail — image stays in gallery
    }
  }

  return (
    <div className="space-y-2">
      <h3 className="text-xs text-skin-text-secondary uppercase tracking-wide font-semibold">
        {t('gallery.title')}
      </h3>
      {onSelectImage && images.length > 0 && (
        <p className="text-xs text-skin-text-secondary">{t('gallery.selectHint')}</p>
      )}

      {!readOnly && (
        <label className="inline-block">
          <span className="px-3 py-1.5 bg-skin-accent-bg-light border border-skin-accent-border rounded text-sm font-semibold text-skin-text-primary cursor-pointer hover:bg-skin-accent-bg transition-colors inline-block">
            {uploading ? t('common.uploading') : t('gallery.upload')}
          </span>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleUpload}
            className="hidden"
            disabled={uploading}
          />
        </label>
      )}

      {error && <p className="text-red-400 text-xs">{error}</p>}

      {images.length === 0 ? (
        <p className="text-skin-text-muted text-xs text-center py-4">
          {readOnly ? t('gallery.noImages') : t('gallery.noImagesHint')}
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {images.map((img) => {
            return (
              <div
                key={img.id}
                className={`relative group rounded border transition-all ${
                  selectedImageUrl === img.url ? 'border-blue-500 ring-1 ring-blue-500' : 'border-skin-border'
                } ${onSelectImage ? 'cursor-pointer hover:border-skin-accent' : ''}`}
                onClick={onSelectImage ? () => onSelectImage(img.url, img.filename) : undefined}
              >
                <img
                  src={img.url}
                  alt={img.filename}
                  className="w-full h-auto rounded"
                />
                {!readOnly && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(img.id); }}
                    className="absolute top-1 right-1 w-5 h-5 bg-black/70 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-skin-danger"
                    title={t('gallery.removeImage')}
                  >
                    ×
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
