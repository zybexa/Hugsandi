'use client';

import { BlockType } from '@/types/design';
import { useTranslation } from '@/lib/i18n';

interface BlockToolbarProps {
  onAddBlock: (type: BlockType) => void;
  onSave: () => void;
  saving?: boolean;
  readOnly?: boolean;
  onExit?: () => void;
  onSendTest?: () => void;
  sendingTest?: boolean;
  canSendTest?: boolean;
  onDownloadHtml?: () => void;
}

const cardBtnClass = "px-3 py-1.5 bg-blue-800/60 hover:bg-blue-700/70 text-blue-100 text-sm font-semibold rounded border border-blue-600 transition-all active:scale-90";

export default function BlockToolbar({ onAddBlock, onSave, saving, readOnly, onExit, onSendTest, sendingTest, canSendTest, onDownloadHtml }: BlockToolbarProps) {
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-skin-secondary border-b border-skin-border">
      <div className={`flex items-center gap-2 flex-wrap ${readOnly ? 'pointer-events-none opacity-60' : ''}`}>
        <button onClick={() => onAddBlock('content-card')} className={cardBtnClass}>{t('toolbar.contentCard')}</button>
      </div>
      <div className="flex items-center gap-2">
        {onSendTest && (
          <button
            onClick={onSendTest}
            disabled={sendingTest || !canSendTest}
            title={!canSendTest ? t('toolbar.sendTestDisabled') : undefined}
            className="px-4 py-1.5 bg-amber-700/70 hover:bg-amber-600/80 text-amber-50 text-sm font-semibold rounded border border-amber-600 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {sendingTest ? t('toolbar.sendingTest') : t('toolbar.sendTest')}
          </button>
        )}
        {onDownloadHtml && (
          <button
            onClick={onDownloadHtml}
            title={t('toolbar.downloadHtmlTitle')}
            className="px-4 py-1.5 bg-slate-700/70 hover:bg-slate-600/80 text-slate-50 text-sm font-semibold rounded border border-slate-600 transition-all"
          >
            {t('toolbar.downloadHtml')}
          </button>
        )}
        <button
          onClick={onExit}
          className="px-4 py-1.5 bg-skin-tertiary hover:opacity-80 text-skin-text-secondary text-sm rounded border border-skin-border transition-colors"
        >
          {t('toolbar.exit')}
        </button>
        <button
          onClick={() => onSave()}
          disabled={saving}
          className="px-4 py-1.5 bg-skin-accent hover:bg-skin-accent-hover text-white text-sm font-semibold rounded-md shadow-skin transition-all disabled:opacity-50"
        >
          {saving ? t('toolbar.saving') : t('common.save')}
        </button>
      </div>
    </div>
  );
}
