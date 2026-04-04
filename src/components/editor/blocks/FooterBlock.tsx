'use client';

import { useState } from 'react';
import { FooterBlockData, BlockStyle } from '@/types/design';
import { saveDefault } from '@/lib/defaults';
import { useTranslation } from '@/lib/i18n';

interface FooterBlockProps {
  data: FooterBlockData;
  onChange: (data: FooterBlockData) => void;
  blockStyle?: BlockStyle;
  onStyleChange?: (style: BlockStyle) => void;
}

export default function FooterBlock({ data, onChange }: FooterBlockProps) {
  const { t } = useTranslation();
  const [savedDefault, setSavedDefault] = useState(false);

  return (
    <div className="space-y-3">
      {/* Logo */}
      <div>
        <label className="text-xs text-skin-text-secondary uppercase tracking-wide">{t('footer.orgLogo')}</label>
        <div className="mt-1">
          <img src="/logo2.png" alt="Organization logo" className="h-10 object-contain" />
        </div>
      </div>

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
          className="w-full mt-1 px-3 py-1.5 bg-skin-input border border-skin-border rounded text-skin-text-primary text-sm placeholder-skin-text-muted"
        />
      </div>

      {/* Slogan */}
      <div>
        <label className="text-xs text-skin-text-secondary uppercase tracking-wide">{t('footer.slogan')}</label>
        <div className="mt-1">
          <img src="/slogan.png" alt="Slogan" className="h-10 object-contain" />
        </div>
      </div>

      {/* Church Logo */}
      <div>
        <label className="text-xs text-skin-text-secondary uppercase tracking-wide">{t('footer.churchLogo')}</label>
        <div className="mt-1">
          <img src="/kirkjan.png" alt="Church logo" className="h-10 object-contain" />
        </div>
      </div>

      {/* Links */}
      <div>
        <label className="text-xs text-skin-text-secondary uppercase tracking-wide">{t('footer.website')}</label>
        <div className="grid grid-cols-2 gap-2 mt-1">
          <input
            type="text"
            value={data.websiteLabel}
            onChange={(e) => onChange({ ...data, websiteLabel: e.target.value })}
            placeholder={t('footer.websiteLabelPlaceholder')}
            className="px-3 py-1.5 bg-skin-input border border-skin-border rounded text-skin-text-primary text-sm placeholder-skin-text-muted"
          />
          <input
            type="text"
            value={data.websiteUrl}
            onChange={(e) => onChange({ ...data, websiteUrl: e.target.value })}
            placeholder={t('footer.websiteUrlPlaceholder')}
            className="px-3 py-1.5 bg-skin-input border border-skin-border rounded text-skin-text-primary text-sm placeholder-skin-text-muted"
          />
        </div>
      </div>

      <div>
        <label className="text-xs text-skin-text-secondary uppercase tracking-wide">{t('footer.unsubscribe')}</label>
        <div className="grid grid-cols-2 gap-2 mt-1">
          <input
            type="text"
            value={data.unsubscribeLabel}
            onChange={(e) => onChange({ ...data, unsubscribeLabel: e.target.value })}
            placeholder={t('footer.unsubscribeTextPlaceholder')}
            className="px-3 py-1.5 bg-skin-input border border-skin-border rounded text-skin-text-primary text-sm placeholder-skin-text-muted"
          />
          <input
            type="text"
            value={data.unsubscribeUrl}
            onChange={(e) => onChange({ ...data, unsubscribeUrl: e.target.value })}
            placeholder={t('footer.unsubscribeUrlPlaceholder')}
            className="px-3 py-1.5 bg-skin-input border border-skin-border rounded text-skin-text-primary text-sm placeholder-skin-text-muted"
          />
        </div>
      </div>

      {/* Save as default */}
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
    </div>
  );
}
