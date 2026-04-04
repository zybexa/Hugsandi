'use client';

import { Block, BlockData, BlockStyle, DesignImage } from '@/types/design';
import HeaderBlock from './blocks/HeaderBlock';
import ContentCardBlock from './blocks/ContentCardBlock';
import FooterBlock from './blocks/FooterBlock';

interface BlockRendererProps {
  block: Block;
  onDataChange: (data: BlockData) => void;
  onStyleChange?: (style: BlockStyle) => void;
  readOnly?: boolean;
  availableImages?: DesignImage[];
  defaultShowStyling?: boolean;
}

export default function BlockRenderer({ block, onDataChange, onStyleChange, readOnly, availableImages, defaultShowStyling }: BlockRendererProps) {
  switch (block.data.type) {
    case 'header':
      return <HeaderBlock data={block.data} onChange={onDataChange} blockStyle={block.style} />;
    case 'content-card':
      return <ContentCardBlock data={block.data} onChange={onDataChange} blockStyle={block.style} onStyleChange={onStyleChange} availableImages={availableImages} readOnly={readOnly} defaultShowStyling={defaultShowStyling} />;
    case 'footer':
      return <FooterBlock data={block.data} onChange={onDataChange} blockStyle={block.style} onStyleChange={onStyleChange} />;
    default:
      return null;
  }
}
