'use client';

import { useState, memo, useCallback } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Block, BlockData, BlockStyle, DesignImage } from '@/types/design';
import BlockRenderer from './BlockRenderer';
import { useTranslation } from '@/lib/i18n';

interface SortableBlockProps {
  block: Block;
  blockId: string;
  isSelected: boolean;
  onSelectBlock: (id: string) => void;
  onBlockDataChange: (blockId: string, data: BlockData) => void;
  onBlockStyleChange: (blockId: string, style: BlockStyle) => void;
  onRemoveBlock: (blockId: string) => void;
  readOnly?: boolean;
  availableImages?: DesignImage[];
  defaultShowStyling?: boolean;
}

const SortableBlock = memo(function SortableBlock({ block, blockId, isSelected, onSelectBlock, onBlockDataChange, onBlockStyleChange, onRemoveBlock, readOnly, availableImages, defaultShowStyling }: SortableBlockProps) {
  const { t } = useTranslation();
  const [collapsed, setCollapsed] = useState(block.data.type === 'header' || block.data.type === 'footer');
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: blockId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const typeKeys: Record<string, string> = { header: 'canvas.typeHeader', footer: 'canvas.typeFooter', 'content-card': 'canvas.typeContentCard' };
  const typeLabel = t(typeKeys[block.data.type] || block.data.type);

  const handleSelect = useCallback(() => onSelectBlock(blockId), [onSelectBlock, blockId]);
  const handleDataChange = useCallback((data: BlockData) => onBlockDataChange(blockId, data), [onBlockDataChange, blockId]);
  const handleStyleChange = useCallback((style: BlockStyle) => onBlockStyleChange(blockId, style), [onBlockStyleChange, blockId]);
  const handleRemove = useCallback(() => onRemoveBlock(blockId), [onRemoveBlock, blockId]);

  return (
    <div
      ref={setNodeRef}
      style={style}
      onPointerDown={handleSelect}
      className={`bg-skin-secondary rounded-lg border ${
        isSelected ? 'border-blue-500 ring-1 ring-blue-500' : 'border-skin-border'
      } transition-colors`}
    >
      <div className={`flex items-center justify-between px-3 py-2 ${collapsed ? '' : 'border-b border-skin-border'}`}>
        <div className="flex items-center gap-2">
          <button
            {...(block.data.type !== 'header' && block.data.type !== 'footer' ? { ...attributes, ...listeners } : {})}
            className={`p-1 ${block.data.type === 'header' || block.data.type === 'footer' ? 'text-skin-text-muted/30 cursor-default' : 'cursor-grab active:cursor-grabbing text-skin-text-muted hover:text-skin-text-primary'}`}
            title={block.data.type === 'header' || block.data.type === 'footer' ? undefined : t('canvas.dragToReorder')}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
              <circle cx="5" cy="3" r="1.5" />
              <circle cx="11" cy="3" r="1.5" />
              <circle cx="5" cy="8" r="1.5" />
              <circle cx="11" cy="8" r="1.5" />
              <circle cx="5" cy="13" r="1.5" />
              <circle cx="11" cy="13" r="1.5" />
            </svg>
          </button>
          <span className="text-xs text-skin-text-secondary uppercase tracking-wide font-medium">{typeLabel}</span>
          {block.data.type === 'content-card' && block.data.title && (
            <span className="text-xs text-skin-text-primary font-medium truncate max-w-[140px] px-2 py-0.5 bg-skin-accent-bg-light border border-skin-accent-border rounded">{block.data.title}</span>
          )}
          {block.data.type === 'header' && block.data.headline && (
            <span className="text-xs text-skin-text-primary font-medium truncate max-w-[140px] px-2 py-0.5 bg-skin-accent-bg-light border border-skin-accent-border rounded">{block.data.headline}</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setCollapsed(!collapsed);
            }}
            className="text-skin-text-muted hover:text-skin-text-primary p-1 transition-colors"
            title={collapsed ? t('canvas.expandBlock') : t('canvas.collapseBlock')}
          >
            <svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true" style={{ transform: collapsed ? 'rotate(-90deg)' : 'rotate(0deg)', transition: 'transform 0.15s' }}>
              <path d="M3.646 5.646a.5.5 0 0 1 .708 0L8 9.293l3.646-3.647a.5.5 0 0 1 .708.708l-4 4a.5.5 0 0 1-.708 0l-4-4a.5.5 0 0 1 0-.708z" />
            </svg>
          </button>
          {!readOnly && block.data.type !== 'header' && block.data.type !== 'footer' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleRemove();
              }}
              className="text-skin-text-muted hover:text-red-400 p-1 transition-colors"
              title={t('canvas.removeBlock')}
            >
              <svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z" />
              </svg>
            </button>
          )}
        </div>
      </div>
      {!collapsed && (
        <div className={`p-3 ${readOnly ? 'pointer-events-none opacity-60' : ''}`}>
          <BlockRenderer block={block} onDataChange={handleDataChange} onStyleChange={handleStyleChange} readOnly={readOnly} availableImages={availableImages} defaultShowStyling={defaultShowStyling} />
        </div>
      )}
    </div>
  );
});

interface EditorCanvasProps {
  blocks: Block[];
  selectedBlockId: string | null;
  onSelectBlock: (id: string) => void;
  onReorder: (activeId: string, overId: string) => void;
  onBlockDataChange: (blockId: string, data: BlockData) => void;
  onBlockStyleChange: (blockId: string, style: BlockStyle) => void;
  onRemoveBlock: (blockId: string) => void;
  readOnly?: boolean;
  availableImages?: DesignImage[];
  defaultShowStyling?: boolean;
}

export default function EditorCanvas({
  blocks,
  selectedBlockId,
  onSelectBlock,
  onReorder,
  onBlockDataChange,
  onBlockStyleChange,
  onRemoveBlock,
  readOnly,
  availableImages,
  defaultShowStyling,
}: EditorCanvasProps) {
  const { t } = useTranslation();
  const activeSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );
  const emptySensors = useSensors();
  const sensors = readOnly ? emptySensors : activeSensors;

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      onReorder(active.id as string, over.id as string);
    }
  }

  if (blocks.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-skin-text-muted">
        <div className="text-center">
          <p className="text-lg mb-2">{t('canvas.noBlocks')}</p>
          <p className="text-sm">{t('canvas.noBlocksHint')}</p>
        </div>
      </div>
    );
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {blocks.map((block) => (
            <SortableBlock
              key={block.id}
              block={block}
              blockId={block.id}
              isSelected={block.id === selectedBlockId}
              onSelectBlock={onSelectBlock}
              onBlockDataChange={onBlockDataChange}
              onBlockStyleChange={onBlockStyleChange}
              onRemoveBlock={onRemoveBlock}
              readOnly={readOnly}
              availableImages={availableImages}
              defaultShowStyling={defaultShowStyling}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
