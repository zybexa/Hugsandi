'use client';

import { useState } from 'react';
import { HeaderBlockData, BlockStyle } from '@/types/design';
import { saveDefault } from '@/lib/defaults';
import { useTranslation } from '@/lib/i18n';

interface HeaderBlockProps {
  data: HeaderBlockData;
  onChange: (data: HeaderBlockData) => void;
  blockStyle?: BlockStyle;
  readOnly?: boolean;
}

export default function HeaderBlock({ data, onChange, blockStyle, readOnly }: HeaderBlockProps) {
  const { t } = useTranslation();
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [savedDefault, setSavedDefault] = useState(false);

  async function deleteStorageFile(url: string) {
    if (!url || !url.includes('/newsletter-images/')) return;
    try {
      await fetch('/api/upload/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
    } catch { /* ignore */ }
  }

  async function handleUploadLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    try {
      const oldUrl = data.logoSrc;
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      if (res.ok) {
        const { url } = await res.json();
        onChange({ ...data, logoSrc: url });
        if (oldUrl) deleteStorageFile(oldUrl);
      }
    } finally {
      setUploadingLogo(false);
    }
  }

  function handleRemoveLogo() {
    const oldUrl = data.logoSrc;
    onChange({ ...data, logoSrc: '' });
    if (oldUrl) deleteStorageFile(oldUrl);
  }

  return (
    <div className="space-y-3">
      {/* Logo */}
      <div>
        <label className="text-xs text-skin-text-secondary uppercase tracking-wide">{t('header.logo')}</label>
        <div className="mt-1 flex items-center gap-3">
          <label className="px-3 py-1.5 bg-skin-accent-bg-light border border-skin-accent-border rounded text-sm font-semibold text-skin-text-primary cursor-pointer hover:bg-skin-accent-bg transition-colors">
            {uploadingLogo ? t('common.uploading') : data.logoSrc ? t('header.changeLogo') : t('header.uploadLogo')}
            <input type="file" accept="image/*" onChange={handleUploadLogo} className="hidden" />
          </label>
          {data.logoSrc && (
            <div className="relative">
              <img src={data.logoSrc} alt={data.logoAlt} className="h-8 object-contain" />
              <button
                type="button"
                onClick={handleRemoveLogo}
                className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-skin-danger-bg hover:bg-skin-danger border border-skin-danger-bg hover:border-skin-danger rounded-full flex items-center justify-center transition-colors"
                title={t('header.removeLogo')}
              >
                <svg width="8" height="8" viewBox="0 0 16 16" fill="white">
                  <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z" />
                </svg>
              </button>
            </div>
          )}
        </div>
        {data.logoSrc && <>
        <input
          type="text"
          value={data.logoUrl}
          onChange={(e) => onChange({ ...data, logoUrl: e.target.value })}
          placeholder={t('header.logoUrlPlaceholder')}
          disabled={readOnly}
          className="w-full mt-2 px-3 py-1.5 bg-skin-input border border-skin-border rounded text-skin-text-primary text-sm placeholder-skin-text-muted disabled:opacity-60 disabled:cursor-not-allowed"
        />
        </>}
      </div>

      {/* View in browser */}
      <div>
        <label className="text-xs text-skin-text-secondary uppercase tracking-wide">{t('header.viewInBrowser')}</label>
        <input
          type="text"
          value={data.viewInBrowserText}
          onChange={(e) => onChange({ ...data, viewInBrowserText: e.target.value })}
          placeholder={t('header.viewInBrowserPlaceholder')}
          disabled={readOnly}
          className="w-full mt-1 px-3 py-1.5 bg-skin-input border border-skin-border rounded text-skin-text-primary text-sm placeholder-skin-text-muted disabled:opacity-60 disabled:cursor-not-allowed"
        />
      </div>

      {/* Headline */}
      <div>
        <label className="text-xs text-skin-text-secondary uppercase tracking-wide">{t('header.headline')}</label>
        <input
          type="text"
          value={data.headline}
          onChange={(e) => onChange({ ...data, headline: e.target.value })}
          placeholder={t('header.headlinePlaceholder')}
          disabled={readOnly}
          className="w-full mt-1 px-3 py-2 bg-skin-input border border-skin-border rounded text-skin-text-primary text-sm placeholder-skin-text-muted disabled:opacity-60 disabled:cursor-not-allowed"
        />
      </div>

      {/* Save as default */}
      {!readOnly && (
      <div className="flex">
        <button
          type="button"
          onClick={() => {
            const { headline: _headline, ...dataWithoutContent } = data;
            saveDefault('header', { data: dataWithoutContent, style: blockStyle }).then(() => {
              setSavedDefault(true);
              setTimeout(() => setSavedDefault(false), 2000);
            });
          }}
          className="px-3 py-1.5 bg-skin-accent-bg-light border border-skin-accent-border rounded text-sm font-semibold text-skin-text-primary cursor-pointer hover:bg-skin-accent-bg transition-colors"
        >
          {savedDefault ? t('common.saved') : t('common.saveAsDefault')}
        </button>
      </div>
      )}
    </div>
  );
}
