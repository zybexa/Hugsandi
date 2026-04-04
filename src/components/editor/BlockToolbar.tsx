'use client';

import { BlockType } from '@/types/design';
import { useTranslation } from '@/lib/i18n';

interface BlockToolbarProps {
  onAddBlock: (type: BlockType) => void;
  onSave: () => void;
  saving?: boolean;
  readOnly?: boolean;
  onExit?: () => void;
}

const cardBtnClass = "px-3 py-1.5 bg-blue-800/60 hover:bg-blue-700/70 text-blue-100 text-sm font-semibold rounded border border-blue-600 transition-all active:scale-90";

export default function BlockToolbar({ onAddBlock, onSave, saving, readOnly, onExit }: BlockToolbarProps) {
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-skin-secondary border-b border-skin-border">
      <div className={`flex items-center gap-2 flex-wrap ${readOnly ? 'pointer-events-none opacity-60' : ''}`}>
        <button onClick={() => onAddBlock('content-card')} className={cardBtnClass}>{t('toolbar.contentCard')}</button>
      </div>
      <div className="flex items-center gap-2">
        {readOnly ? (
          <button
            onClick={onExit}
            className="px-4 py-1.5 bg-skin-tertiary hover:opacity-80 text-skin-text-primary text-sm rounded border border-skin-border transition-colors"
          >
            {t('toolbar.exit')}
          </button>
        ) : (
          <>
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
          </>
        )}
      </div>
    </div>
  );
}
