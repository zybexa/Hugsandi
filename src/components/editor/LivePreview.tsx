'use client';

import { useEffect, useRef } from 'react';
import { Design } from '@/types/design';
import { renderEmailHtml } from '@/lib/render-email';
import { useTranslation } from '@/lib/i18n';

interface LivePreviewProps {
  design: Design;
}

export default function LivePreview({ design }: LivePreviewProps) {
  const { t } = useTranslation();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      const html = renderEmailHtml(design);
      const iframe = iframeRef.current;
      if (!iframe) return;

      const doc = iframe.contentDocument;
      if (!doc) return;

      const scrollTop = initializedRef.current
        ? (doc.documentElement?.scrollTop || doc.body?.scrollTop || 0)
        : 0;

      doc.open();
      doc.write(html);
      doc.close();
      initializedRef.current = true;

      // Restore scroll position
      if (scrollTop > 0) {
        requestAnimationFrame(() => {
          if (doc.documentElement) doc.documentElement.scrollTop = scrollTop;
          if (doc.body) doc.body.scrollTop = scrollTop;
        });
      }

      // Disable all links in the preview
      doc.addEventListener('click', (e: Event) => {
        const target = (e.target as HTMLElement).closest('a');
        if (target) e.preventDefault();
      });
    }, 300);
    return () => clearTimeout(timer);
  }, [design]);

  function openInBrowser() {
    // Inject view URL into header blocks for preview
    const viewUrl = design.id ? `${window.location.origin}/view/${design.id}` : '';
    const previewDesign: Design = {
      ...design,
      blocks: design.blocks.map((block) => {
        if (block.data.type === 'header' && block.data.viewInBrowserText && viewUrl) {
          return { ...block, data: { ...block.data, viewInBrowserUrl: viewUrl } };
        }
        return block;
      }),
    };
    const html = renderEmailHtml(previewDesign);
    // Inject <base target="_blank"> so links open in new tabs
    const htmlWithBase = html.replace('<head>', '<head><base target="_blank">');
    const win = window.open('', '_blank');
    if (win) {
      win.document.open();
      win.document.write(htmlWithBase);
      win.document.close();
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-skin-border">
        <h3 className="text-xs text-skin-text-secondary uppercase tracking-wide font-semibold">
          {t('preview.title')}
        </h3>
        <button
          onClick={openInBrowser}
          className="text-xs text-skin-text-muted hover:text-skin-text-primary transition-colors"
        >
          {t('preview.openInBrowser')}
        </button>
      </div>
      <div className="flex-1 bg-gray-100 overflow-auto flex justify-center">
        <iframe
          ref={iframeRef}
          title={t('preview.iframeTitle')}
          className="h-full border-0"
          style={{ width: '402px', maxWidth: '100%' }}
          sandbox="allow-same-origin"
        />
      </div>
    </div>
  );
}
