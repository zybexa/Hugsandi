'use client';

import { useState } from 'react';
import { FooterBlockData, BlockStyle } from '@/types/design';
import { saveDefault } from '@/lib/defaults';
import { useTranslation } from '@/lib/i18n';
import ColorPickerInput from '../ColorPickerInput';

interface FooterBlockProps {
  data: FooterBlockData;
  onChange: (data: FooterBlockData) => void;
  blockStyle?: BlockStyle;
  onStyleChange?: (style: BlockStyle) => void;
  readOnly?: boolean;
}

export default function FooterBlock({ data, onChange, readOnly }: FooterBlockProps) {
  const { t } = useTranslation();
  const [savedDefault, setSavedDefault] = useState(false);
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);

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

  async function handleUploadLogo(
    e: React.ChangeEvent<HTMLInputElement>,
    field: 'logoSrc' | 'orgLogoSrc' | 'churchLogoSrc',
  ) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingKey(field);
    try {
      const oldUrl = data[field];
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      if (res.ok) {
        const { url } = await res.json();
        onChange({ ...data, [field]: url });
        // Only delete if the old URL was a previously uploaded asset
        if (oldUrl && oldUrl.includes('/newsletter-images/')) deleteStorageFile(oldUrl);
      }
    } finally {
      setUploadingKey(null);
      e.target.value = '';
    }
  }

  function handleResetLogo(field: 'logoSrc' | 'orgLogoSrc' | 'churchLogoSrc') {
    const oldUrl = data[field];
    onChange({ ...data, [field]: '' });
    if (oldUrl && oldUrl.includes('/newsletter-images/')) deleteStorageFile(oldUrl);
  }

  // Sentinel value that tells render-email.ts to omit the logo entirely.
  const HIDDEN = '__hidden__';

  function handleHideLogo(field: 'logoSrc' | 'orgLogoSrc' | 'churchLogoSrc') {
    const oldUrl = data[field];
    onChange({ ...data, [field]: HIDDEN });
    if (oldUrl && oldUrl.includes('/newsletter-images/')) deleteStorageFile(oldUrl);
  }

  function handleShowLogo(field: 'logoSrc' | 'orgLogoSrc' | 'churchLogoSrc') {
    onChange({ ...data, [field]: '' });
  }

  function renderLogoField(
    label: string,
    field: 'logoSrc' | 'orgLogoSrc' | 'churchLogoSrc',
    defaultPath: string,
    alt: string,
  ) {
    const current = data[field];
    const isHidden = current === HIDDEN;
    const displaySrc = isHidden ? '' : (current || defaultPath);
    const isCustom = !!current && current !== HIDDEN && current.includes('/newsletter-images/');
    const isUploading = uploadingKey === field;
    return (
      <div>
        <label className="text-xs text-skin-text-secondary uppercase tracking-wide">{label}</label>
        {isHidden ? (
          <div className="mt-1 flex items-center gap-3">
            <span className="text-xs text-skin-text-muted italic">{t('footer.logoHidden')}</span>
            {!readOnly && (
              <button
                type="button"
                onClick={() => handleShowLogo(field)}
                className="px-3 py-1 text-xs font-medium rounded-md border border-skin-text-muted bg-skin-tertiary hover:bg-skin-elevated text-skin-text-secondary transition-colors"
              >
                {t('footer.showLogo')}
              </button>
            )}
          </div>
        ) : (
          <div className="mt-1 flex items-center gap-3">
            <label className="px-3 py-1.5 bg-skin-accent-bg-light border border-skin-accent-border rounded text-sm font-semibold text-skin-text-primary cursor-pointer hover:bg-skin-accent-bg transition-colors">
              {isUploading
                ? t('common.uploading')
                : isCustom
                  ? t('footer.changeLogo')
                  : t('footer.uploadLogo')}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleUploadLogo(e, field)}
                disabled={readOnly || isUploading}
                className="hidden"
              />
            </label>
            <div className="relative">
              <img src={displaySrc} alt={alt} className="h-10 object-contain" />
              {isCustom && !readOnly && (
                <button
                  type="button"
                  onClick={() => handleResetLogo(field)}
                  className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-skin-danger-bg hover:bg-skin-danger border border-skin-danger-bg hover:border-skin-danger rounded-full flex items-center justify-center transition-colors"
                  title={t('footer.resetLogo')}
                >
                  <svg width="8" height="8" viewBox="0 0 16 16" fill="white">
                    <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z" />
                  </svg>
                </button>
              )}
            </div>
            {!readOnly && (
              <button
                type="button"
                onClick={() => handleHideLogo(field)}
                className="text-xs text-skin-danger hover:text-skin-text-primary transition-colors"
                title={t('footer.removeLogoTitle')}
              >
                {t('footer.removeLogo')}
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Background color */}
      <div>
        <label className="text-xs text-skin-text-secondary uppercase tracking-wide">{t('footer.backgroundColor')}</label>
        <ColorPickerInput
          value={data.backgroundColor}
          onChange={(v) => onChange({ ...data, backgroundColor: v })}
          disabled={readOnly}
          fallback="#1F0318"
        />
      </div>

      {/* Organization logo (top-left 56x56) */}
      {renderLogoField(t('footer.orgLogo'), 'logoSrc', '/logo2.png', 'Organization logo')}

      {/* Contact email */}
      <div>
        <label className="text-xs text-skin-text-secondary uppercase tracking-wide">{t('footer.contactEmail')}</label>
        <input
          type="email"
          value={data.contactEmail}
          onChange={(e) => onChange({ ...data, contactEmail: e.target.value })}
          placeholder={t('footer.contactEmailPlaceholder')}
          spellCheck={false}
          autoComplete="off"
          disabled={readOnly}
          className="w-full mt-1 px-3 py-1.5 bg-skin-input border border-skin-border rounded text-skin-text-primary text-sm placeholder-skin-text-muted disabled:opacity-60 disabled:cursor-not-allowed"
        />
      </div>

      {/* Slogan */}
      {renderLogoField(t('footer.slogan'), 'orgLogoSrc', '/slogan.png', 'Slogan')}

      {/* Church Logo */}
      {renderLogoField(t('footer.churchLogo'), 'churchLogoSrc', '/kirkjan.png', 'Church logo')}

      {/* Links */}
      <div>
        <label className="text-xs text-skin-text-secondary uppercase tracking-wide">{t('footer.website')}</label>
        <div className="grid grid-cols-2 gap-2 mt-1">
          <input
            type="text"
            value={data.websiteLabel}
            onChange={(e) => onChange({ ...data, websiteLabel: e.target.value })}
            placeholder={t('footer.websiteLabelPlaceholder')}
            disabled={readOnly}
            className="px-3 py-1.5 bg-skin-input border border-skin-border rounded text-skin-text-primary text-sm placeholder-skin-text-muted disabled:opacity-60 disabled:cursor-not-allowed"
          />
          <input
            type="text"
            value={data.websiteUrl}
            onChange={(e) => onChange({ ...data, websiteUrl: e.target.value })}
            placeholder={t('footer.websiteUrlPlaceholder')}
            disabled={readOnly}
            className="px-3 py-1.5 bg-skin-input border border-skin-border rounded text-skin-text-primary text-sm placeholder-skin-text-muted disabled:opacity-60 disabled:cursor-not-allowed"
          />
        </div>
        <ColorPickerInput
          value={data.websiteColor || ''}
          onChange={(v) => onChange({ ...data, websiteColor: v })}
          disabled={readOnly}
          label={t('common.color')}
          fallback="#FFEDE6"
        />
      </div>

      <div>
        <label className="text-xs text-skin-text-secondary uppercase tracking-wide">{t('footer.unsubscribe')}</label>
        <div className="grid grid-cols-2 gap-2 mt-1">
          <input
            type="text"
            value={data.unsubscribeLabel}
            onChange={(e) => onChange({ ...data, unsubscribeLabel: e.target.value })}
            placeholder={t('footer.unsubscribeTextPlaceholder')}
            disabled={readOnly}
            className="px-3 py-1.5 bg-skin-input border border-skin-border rounded text-skin-text-primary text-sm placeholder-skin-text-muted disabled:opacity-60 disabled:cursor-not-allowed"
          />
          <input
            type="text"
            value={data.unsubscribeUrl}
            onChange={(e) => onChange({ ...data, unsubscribeUrl: e.target.value })}
            placeholder={t('footer.unsubscribeUrlPlaceholder')}
            disabled={readOnly}
            className="px-3 py-1.5 bg-skin-input border border-skin-border rounded text-skin-text-primary text-sm placeholder-skin-text-muted disabled:opacity-60 disabled:cursor-not-allowed"
          />
        </div>
        <ColorPickerInput
          value={data.unsubscribeColor || ''}
          onChange={(v) => onChange({ ...data, unsubscribeColor: v })}
          disabled={readOnly}
          label={t('common.color')}
          fallback="#FFEDE6"
        />
      </div>

      {/* Save as default */}
      {!readOnly && (
      <div className="flex">
        <button
          type="button"
          onClick={() => {
            saveDefault('footer', {
              contactEmail: data.contactEmail,
              websiteUrl: data.websiteUrl,
              websiteLabel: data.websiteLabel,
              unsubscribeLabel: data.unsubscribeLabel,
              unsubscribeUrl: data.unsubscribeUrl,
            }).then(() => {
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
