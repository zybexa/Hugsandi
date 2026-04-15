'use client';

import { Suspense, useReducer, useState, useCallback, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { arrayMove } from '@dnd-kit/sortable';
import { BlockData, BlockStyle, BlockType, Design, DesignImage, GlobalStyle } from '@/types/design';
import { DEFAULT_GLOBAL_STYLE, createDefaultBlock, createDefaultBlocks, getSavedGlobalStyle, SavedDefaults } from '@/lib/defaults';
import { useTranslation } from '@/lib/i18n';
import BlockToolbar from '@/components/editor/BlockToolbar';
import EditorCanvas from '@/components/editor/EditorCanvas';
import LivePreview from '@/components/editor/LivePreview';
import ImageGalleryPanel from '@/components/editor/ImageGalleryPanel';
import ColorPickerInput from '@/components/editor/ColorPickerInput';


type Action =
  | { type: 'ADD_BLOCK'; blockType: BlockType; defaults?: SavedDefaults }
  | { type: 'REMOVE_BLOCK'; blockId: string }
  | { type: 'REORDER_BLOCKS'; activeId: string; overId: string }
  | { type: 'UPDATE_BLOCK_DATA'; blockId: string; data: BlockData }
  | { type: 'UPDATE_BLOCK_STYLE'; blockId: string; style: BlockStyle }
  | { type: 'UPDATE_GLOBAL_STYLE'; style: Partial<GlobalStyle> }
  | { type: 'LOAD_DESIGN'; design: Design }
  | { type: 'SET_NAME'; name: string }
  | { type: 'SET_ID'; id: string }
  | { type: 'RESET' };

const DIRTY_ACTIONS = new Set([
  'ADD_BLOCK', 'REMOVE_BLOCK', 'REORDER_BLOCKS',
  'UPDATE_BLOCK_DATA', 'UPDATE_BLOCK_STYLE', 'UPDATE_GLOBAL_STYLE', 'SET_NAME',
]);

function reducer(state: Design, action: Action): Design {
  switch (action.type) {
    case 'ADD_BLOCK': {
      const newBlock = createDefaultBlock(action.blockType, action.defaults);
      const footerIndex = state.blocks.findIndex((b) => b.data.type === 'footer');
      if (footerIndex !== -1) {
        const updated = [...state.blocks];
        updated.splice(footerIndex, 0, newBlock);
        return { ...state, blocks: updated };
      }
      return { ...state, blocks: [...state.blocks, newBlock] };
    }
    case 'REMOVE_BLOCK': {
      const target = state.blocks.find((b) => b.id === action.blockId);
      if (target && (target.data.type === 'header' || target.data.type === 'footer')) return state;
      return { ...state, blocks: state.blocks.filter((b) => b.id !== action.blockId) };
    }
    case 'REORDER_BLOCKS': {
      const oldIndex = state.blocks.findIndex((b) => b.id === action.activeId);
      const newIndex = state.blocks.findIndex((b) => b.id === action.overId);
      if (oldIndex === -1 || newIndex === -1) return state;
      // Don't allow dragging header or footer
      const draggedBlock = state.blocks[oldIndex];
      if (draggedBlock.data.type === 'header' || draggedBlock.data.type === 'footer') return state;
      // Don't allow dropping onto header (index 0) or footer (last) position
      const headerIndex = state.blocks.findIndex((b) => b.data.type === 'header');
      const footerIndex = state.blocks.findIndex((b) => b.data.type === 'footer');
      if (newIndex <= headerIndex || newIndex >= footerIndex) return state;
      return { ...state, blocks: arrayMove(state.blocks, oldIndex, newIndex) };
    }
    case 'UPDATE_BLOCK_DATA':
      return {
        ...state,
        blocks: state.blocks.map((b) =>
          b.id === action.blockId ? { ...b, data: action.data } : b
        ),
      };
    case 'UPDATE_BLOCK_STYLE':
      return {
        ...state,
        blocks: state.blocks.map((b) =>
          b.id === action.blockId ? { ...b, style: action.style } : b
        ),
      };
    case 'UPDATE_GLOBAL_STYLE':
      return { ...state, globalStyle: { ...state.globalStyle, ...action.style } };
    case 'LOAD_DESIGN':
      return action.design;
    case 'SET_NAME':
      return { ...state, name: action.name };
    case 'SET_ID':
      return { ...state, id: action.id };
    case 'RESET':
      return { name: 'Untitled Newsletter', globalStyle: DEFAULT_GLOBAL_STYLE, blocks: [] };
    default:
      return state;
  }
}

export default function EditorPage() {
  const { t } = useTranslation();
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center bg-gray-950 text-gray-400">{t('editor.loading')}</div>}>
      <EditorContent />
    </Suspense>
  );
}

function EditorContent() {
  const { t, lang, rawDefaults: cachedDefaults } = useTranslation();
  const searchParams = useSearchParams();
  const designId = searchParams.get('id');
  const nameParam = searchParams.get('name');

  const [design, baseDispatch] = useReducer(reducer, {
    name: nameParam || 'Untitled Newsletter',
    globalStyle: DEFAULT_GLOBAL_STYLE,
    blocks: [],
  });

  // Dirty tracking
  const isDirtyRef = useRef(false);

  const dispatch = useCallback((action: Action) => {
    baseDispatch(action);
    if (DIRTY_ACTIONS.has(action.type)) {
      isDirtyRef.current = true;
    }
  }, []);

  // beforeunload warning
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirtyRef.current) e.preventDefault();
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, []);

  // Use cached defaults from translation context to create default blocks immediately
  const [savedDefaults, setSavedDefaults] = useState<SavedDefaults>({});
  const initializedRef2 = useRef(false);
  useEffect(() => {
    if (initializedRef2.current || !cachedDefaults) return;
    initializedRef2.current = true;
    const defaults = cachedDefaults as SavedDefaults;
    setSavedDefaults(defaults);
    if (!designId) {
      baseDispatch({ type: 'LOAD_DESIGN', design: {
        name: nameParam || 'Untitled Newsletter',
        globalStyle: getSavedGlobalStyle(defaults),
        blocks: createDefaultBlocks(defaults),
      }});
    }
  }, [cachedDefaults, designId, nameParam]);

  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [notFound, setNotFound] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const currentBgColor = design.globalStyle?.backgroundColor || '#FFECE5';

  // Sent state
  const [isSent, setIsSent] = useState(false);
  const [sentAt, setSentAt] = useState<string | null>(null);

  // Images state
  const [images, setImages] = useState<DesignImage[]>([]);

  // Load design if ?id= is present
  useEffect(() => {
    if (!designId) return;
    Promise.all([
      fetch(`/api/designs/${designId}`).then((res) => {
        if (!res.ok) { setNotFound(true); return null; }
        return res.json();
      }),
      fetch(`/api/designs/${designId}/images`).then((res) => res.ok ? res.json() : []),
    ]).then(([data, imgs]) => {
        if (data?.id) {
          const defaults = (cachedDefaults || {}) as SavedDefaults;
          setSavedDefaults(defaults);
          if (!data.blocks || data.blocks.length === 0) {
            data.blocks = createDefaultBlocks(defaults);
          }
          baseDispatch({ type: 'LOAD_DESIGN', design: data });
          if (data.lastSentAt) {
            setIsSent(true);
            setSentAt(data.lastSentAt);
          }
          if (Array.isArray(imgs)) setImages(imgs);
        }
      });
  }, [designId, cachedDefaults]);

  const selectedBlock = design.blocks.find((b) => b.id === selectedBlockId) || null;

  // Stable callbacks for EditorCanvas — dispatch is stable from useReducer
  const handleBlockDataChange = useCallback((blockId: string, data: BlockData) => {
    dispatch({ type: 'UPDATE_BLOCK_DATA', blockId, data });
  }, [dispatch]);

  const handleBlockStyleChange = useCallback((blockId: string, style: BlockStyle) => {
    dispatch({ type: 'UPDATE_BLOCK_STYLE', blockId, style });
  }, [dispatch]);

  const handleReorder = useCallback((activeId: string, overId: string) => {
    dispatch({ type: 'REORDER_BLOCKS', activeId, overId });
  }, [dispatch]);

  const handleRemoveBlock = useCallback((blockId: string) => {
    dispatch({ type: 'REMOVE_BLOCK', blockId });
    setSelectedBlockId((prev) => prev === blockId ? null : prev);
  }, [dispatch]);

  const handleSave = useCallback(async (redirectTo: string = '/') => {
    setSaving(true);
    setSaveError('');
    try {
      const method = design.id ? 'PUT' : 'POST';
      const url = design.id ? `/api/designs/${design.id}` : '/api/designs';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: design.name,
          globalStyle: design.globalStyle,
          blocks: design.blocks,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.id && !design.id) {
          baseDispatch({ type: 'SET_ID', id: data.id });
        }
        isDirtyRef.current = false;
        // Full navigation to bypass Next.js Router Cache so dashboard shows fresh data
        window.location.href = redirectTo;
      } else {
        setSaveError(t('editor.saveFailed'));
      }
    } catch {
      setSaveError(t('editor.saveFailed'));
    } finally {
      setSaving(false);
    }
  }, [design, t]);

  // Ensure design is saved (for image uploads on unsaved designs)
  const handleEnsureSaved = useCallback(async (): Promise<string | undefined> => {
    if (design.id) return design.id;
    const res = await fetch('/api/designs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: design.name, globalStyle: design.globalStyle, blocks: design.blocks }),
    });
    if (res.ok) {
      const data = await res.json();
      baseDispatch({ type: 'SET_ID', id: data.id });
      isDirtyRef.current = false;
      window.history.replaceState(null, '', `/editor?id=${data.id}`);
      return data.id;
    }
    return undefined;
  }, [design]);

  // Design not found
  if (notFound) {
    return (
      <div className="h-screen flex items-center justify-center text-skin-text-primary">
        <div className="text-center">
          <p className="text-lg mb-2">{t('editor.notFound')}</p>
          <a href="/" className="text-skin-accent text-sm hover:underline">{t('editor.backToDashboard')}</a>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col text-skin-text-primary">
      {/* Editor toolbar area */}
      <div className="border-b border-skin-border-ui bg-[var(--bg-secondary)]">
        <div className="flex items-center px-4 py-2 gap-4 border-b border-skin-border">
          <label className="text-xs font-medium text-skin-text-secondary uppercase tracking-[0.04em] flex-shrink-0">{t('editor.nameLabel')}</label>
          {editingName ? (
            <input
              ref={nameInputRef}
              type="text"
              value={design.name}
              onChange={(e) => dispatch({ type: 'SET_NAME', name: e.target.value })}
              onBlur={() => setEditingName(false)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === 'Escape') setEditingName(false); }}
              autoFocus
              className="px-2 py-1 bg-skin-input text-skin-text-primary text-sm border border-skin-border-focus rounded outline-none placeholder-skin-text-muted"
              placeholder={t('editor.namePlaceholder')}
            />
          ) : (
            <>
              <span className="px-2 py-1 border border-transparent text-skin-text-primary text-sm truncate max-w-[300px]">{design.name || t('editor.namePlaceholder')}</span>
              {!isSent && (
                <button
                  onClick={() => setEditingName(true)}
                  className="px-3 py-1 text-xs font-medium rounded-md border border-skin-text-muted bg-skin-tertiary hover:bg-skin-elevated text-skin-text-secondary transition-colors flex-shrink-0"
                >
                  {t('editor.changeName')}
                </button>
              )}
            </>
          )}
        </div>

        {/* Sent banner */}
        {isSent && sentAt && (
          <div className="bg-skin-warning-bg border-b border-skin-warning-border text-skin-warning text-sm px-4 py-2">
            {t('editor.sentBanner', { date: new Date(sentAt).toLocaleDateString(lang === 'is' ? 'is-IS' : 'en-US', { month: 'long', day: 'numeric', year: 'numeric' }) })}
          </div>
        )}

        <BlockToolbar
          onAddBlock={(type) => {
            dispatch({ type: 'ADD_BLOCK', blockType: type, defaults: savedDefaults });
          }}
          onSave={handleSave}
          saving={saving}
          readOnly={isSent}
          onExit={() => {
            if (isDirtyRef.current) {
              setShowExitModal(true);
            } else {
              window.location.href = '/';
            }
          }}
        />
      </div>

      {/* Save error */}
      {saveError && (
        <div className="bg-skin-danger-bg border-b border-skin-danger-border text-skin-danger text-sm px-4 py-2 flex items-center justify-between">
          {saveError}
          <button onClick={() => setSaveError('')} className="text-skin-danger hover:text-skin-text-primary ml-4">{t('editor.dismiss')}</button>
        </div>
      )}

      {/* Three-column layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left panel: styles */}
        <div className="w-64 border-r border-skin-border overflow-y-auto p-3 space-y-3 bg-skin-secondary">
          <ImageGalleryPanel
            designId={design.id || null}
            images={images}
            onImagesChange={setImages}
            onEnsureSaved={handleEnsureSaved}
            selectedImageUrl={
              selectedBlock?.data.type === 'content-card' && selectedBlock.data.imageSrc?.trim()
                ? selectedBlock.data.imageSrc
                : undefined
            }
            onSelectImage={
              selectedBlock?.data.type === 'content-card'
                ? (url, filename) => {
                    const d = selectedBlock.data;
                    if (d.type === 'content-card') {
                      dispatch({ type: 'UPDATE_BLOCK_DATA', blockId: selectedBlock.id, data: { ...d, imageSrc: url, imageAlt: filename } });
                    }
                  }
                : undefined
            }
            onImageDeleted={(url) => {
              for (const block of design.blocks) {
                if (block.data.type === 'content-card' && block.data.imageSrc === url) {
                  dispatch({ type: 'UPDATE_BLOCK_DATA', blockId: block.id, data: { ...block.data, imageSrc: '', imageAlt: '' } });
                }
              }
            }}
          />
        </div>

        {/* Center: editor canvas */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <EditorCanvas
            blocks={design.blocks}
            selectedBlockId={selectedBlockId}
            onSelectBlock={setSelectedBlockId}
            onReorder={handleReorder}
            onBlockDataChange={handleBlockDataChange}
            onBlockStyleChange={handleBlockStyleChange}
            onRemoveBlock={handleRemoveBlock}
            readOnly={isSent}
            availableImages={images}
            defaultShowStyling={!!(savedDefaults?.content_card as Record<string, unknown>)?.showStyling}
          />
        </div>

        {/* Right: live preview */}
        <div className="w-[648px] border-l border-skin-border flex flex-col">
          <div className="flex items-center gap-3 px-4 py-2 border-b border-skin-border">
            <label className="text-xs font-medium text-skin-text-secondary uppercase tracking-[0.04em]">
              {t('editor.backgroundColor')}
            </label>
            <ColorPickerInput
              value={currentBgColor}
              onChange={(v) => dispatch({ type: 'UPDATE_GLOBAL_STYLE', style: { backgroundColor: v } })}
              disabled={isSent}
              fallback="#FFECE5"
            />
          </div>
          <div className="flex-1 overflow-hidden">
            <LivePreview design={design} />
          </div>
        </div>
      </div>

      {/* Exit confirmation modal */}
      {showExitModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" style={{ overscrollBehavior: 'contain' }} onClick={() => setShowExitModal(false)}>
          <div className="bg-skin-card border border-skin-border-ui rounded-xl shadow-lg p-6 max-w-sm w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-skin-text-primary mb-2">{t('editor.unsavedTitle')}</h3>
            <p className="text-sm text-skin-text-secondary mb-6">{t('editor.unsavedMessage')}</p>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setShowExitModal(false)}
                className="px-4 py-1.5 text-sm text-skin-text-secondary hover:text-skin-text-primary transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={() => {
                  isDirtyRef.current = false;
                  window.location.href = '/';
                }}
                className="px-4 py-1.5 text-sm text-red-400 hover:text-red-300 border border-red-800 rounded transition-colors"
              >
                {t('editor.discard')}
              </button>
              <button
                onClick={() => {
                  setShowExitModal(false);
                  handleSave('/');
                }}
                className="px-4 py-1.5 bg-skin-accent hover:bg-skin-accent-hover text-white text-sm font-semibold rounded-md shadow-skin transition-all"
              >
                {t('editor.saveExit')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
