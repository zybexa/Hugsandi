'use client';

import { useState } from 'react';
import { ContentCardBlockData, BlockStyle, DesignImage } from '@/types/design';
import { saveDefault } from '@/lib/defaults';
import { useTranslation } from '@/lib/i18n';

interface ContentCardBlockProps {
  data: ContentCardBlockData;
  onChange: (data: ContentCardBlockData) => void;
  blockStyle?: BlockStyle;
  onStyleChange?: (style: BlockStyle) => void;
  availableImages?: DesignImage[];
  readOnly?: boolean;
  defaultShowStyling?: boolean;
}

export default function ContentCardBlock({ data, onChange, readOnly }: ContentCardBlockProps) {
  const { t } = useTranslation();
  const [savedDefault, setSavedDefault] = useState(false);

  return (
    <div className="space-y-3">
      {/* Image */}
      <div>
        <div className="flex items-center gap-3 mb-3">
          <label className="text-xs text-skin-text-secondary uppercase tracking-wide">{t('card.image')}</label>
          {!readOnly && (
            <button
              type="button"
              onClick={() => onChange({ ...data, imageSrc: data.imageSrc ? '' : ' ' })}
              aria-label={data.imageSrc ? t('card.hideImage') : t('card.showImage')}
              role="switch"
              aria-checked={!!data.imageSrc}
              className={`w-9 h-5 rounded-full relative transition-colors cursor-pointer ${data.imageSrc ? 'bg-blue-600' : 'bg-gray-600'}`}
            >
              <span className={`block w-4 h-4 bg-white rounded-full absolute top-0.5 transition-transform ${data.imageSrc ? 'left-4' : 'left-0.5'}`} />
            </button>
          )}
        </div>
        {data.imageSrc && (
          data.imageSrc.trim() ? (
            <img src={data.imageSrc} alt={data.imageAlt || ''} className="max-w-[80px] h-auto rounded border border-skin-border" />
          ) : !readOnly ? (
            <p className="text-xs text-skin-text-muted py-2">{t('card.imageHint')}</p>
          ) : null
        )}
      </div>

      {/* Title */}
      <div>
        <label className="text-xs text-skin-text-secondary uppercase tracking-wide">{t('card.title')}</label>
        <input
          type="text"
          value={data.title}
          onChange={(e) => onChange({ ...data, title: e.target.value })}
          placeholder={t('card.titlePlaceholder')}
          disabled={readOnly}
          className="w-full mt-1 px-3 py-2 bg-skin-input border border-skin-border rounded text-skin-text-primary text-sm placeholder-skin-text-muted disabled:opacity-60 disabled:cursor-not-allowed"
        />
        <div className="mt-1.5 flex items-center gap-2">
          <label className="text-[10px] text-skin-text-muted uppercase tracking-wide">{t('common.color')}</label>
          <input
            type="color"
            value={data.titleColor || '#1f0318'}
            onChange={(e) => onChange({ ...data, titleColor: e.target.value })}
            disabled={readOnly}
            className="w-7 h-7 rounded border border-skin-border bg-transparent cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          />
        </div>
      </div>

      {/* Body */}
      <div>
        <label className="text-xs text-skin-text-secondary uppercase tracking-wide">{t('card.body')}</label>
        <textarea
          value={data.body}
          onChange={(e) => onChange({ ...data, body: e.target.value })}
          placeholder={t('card.bodyPlaceholder')}
          rows={4}
          disabled={readOnly}
          className="w-full mt-1 px-3 py-2 bg-skin-input border border-skin-border rounded text-skin-text-primary text-sm resize-y placeholder-skin-text-muted disabled:opacity-60 disabled:cursor-not-allowed"
        />
        <div className="mt-1.5 flex items-center gap-2">
          <label className="text-[10px] text-skin-text-muted uppercase tracking-wide">{t('common.color')}</label>
          <input
            type="color"
            value={data.bodyColor || '#1f0318'}
            onChange={(e) => onChange({ ...data, bodyColor: e.target.value })}
            disabled={readOnly}
            className="w-7 h-7 rounded border border-skin-border bg-transparent cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          />
        </div>
      </div>

      {/* CTA Button */}
      <div>
        <label className="text-xs text-skin-text-secondary uppercase tracking-wide">{t('card.cta')}</label>
        <div className="grid grid-cols-2 gap-2 mt-1">
          <input
            type="text"
            value={data.ctaText}
            onChange={(e) => onChange({ ...data, ctaText: e.target.value })}
            placeholder={t('card.ctaTextPlaceholder')}
            disabled={readOnly}
            className="px-3 py-1.5 bg-skin-input border border-skin-border rounded text-skin-text-primary text-sm placeholder-skin-text-muted disabled:opacity-60 disabled:cursor-not-allowed"
          />
          <input
            type="text"
            value={data.ctaUrl}
            onChange={(e) => onChange({ ...data, ctaUrl: e.target.value })}
            placeholder={t('card.ctaUrlPlaceholder')}
            disabled={readOnly}
            className="px-3 py-1.5 bg-skin-input border border-skin-border rounded text-skin-text-primary text-sm placeholder-skin-text-muted disabled:opacity-60 disabled:cursor-not-allowed"
          />
        </div>
        <div className="flex items-center gap-1 mt-2">
          {['#a0a7e4', '#f2cc8f', '#e4a0da', '#a0d4b4'].map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => onChange({ ...data, ctaBackgroundColor: color })}
              disabled={readOnly}
              aria-label={`${t('card.ctaColor')} ${color}`}
              aria-pressed={data.ctaBackgroundColor === color}
              className={`w-7 h-7 rounded-full border-2 transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${data.ctaBackgroundColor === color ? 'border-blue-500 scale-110' : 'border-skin-border'}`}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </div>

      {/* Save as default */}
      {!readOnly && (
        <div className="flex">
          <button
            type="button"
            onClick={() => {
              saveDefault('content_card', { data: { ctaText: data.ctaText } }).then(() => {
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
