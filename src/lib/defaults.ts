import { nanoid } from 'nanoid';
import { Block, BlockStyle, BlockType, ContentCardBlockData, GlobalStyle } from '@/types/design';

export const DEFAULT_GLOBAL_STYLE: GlobalStyle = {
  backgroundColor: '#FFCBA8',
  contentBackgroundColor: '#ffffff',
  maxWidth: '600px',
  fontFamily: 'Arial, Helvetica, sans-serif',
  paddingTop: '20px',
  paddingBottom: '20px',
  paddingLeft: '0px',
  paddingRight: '0px',
  cardSpacing: '16px',
};

const DEFAULT_BLOCK_STYLE: BlockStyle = {
  paddingTop: '12px',
  paddingBottom: '12px',
  paddingLeft: '20px',
  paddingRight: '20px',
};

export interface SavedDefaults {
  global_style?: Partial<GlobalStyle>;
  header?: { data?: Record<string, unknown>; style?: Record<string, unknown> };
  content_card?: { data?: Record<string, unknown>; style?: Record<string, unknown> };
  footer?: Record<string, unknown>;
}

// Fetch all saved defaults from the server
export async function fetchDefaults(): Promise<SavedDefaults> {
  try {
    const res = await fetch('/api/defaults');
    if (res.ok) return await res.json();
  } catch { /* ignore */ }
  return {};
}

// Save a single default to the server
export async function saveDefault(key: string, value: unknown): Promise<boolean> {
  try {
    const res = await fetch('/api/defaults', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export function getSavedGlobalStyle(defaults?: SavedDefaults): GlobalStyle {
  const saved = defaults?.global_style;
  return saved ? { ...DEFAULT_GLOBAL_STYLE, ...saved } : DEFAULT_GLOBAL_STYLE;
}

export function createDefaultBlock(type: BlockType, defaults?: SavedDefaults): Block {
  const id = nanoid();
  const style = { ...DEFAULT_BLOCK_STYLE };

  switch (type) {
    case 'header': {
      const saved = defaults?.header || null;
      const headerDefaults = {
        type: 'header' as const,
        logoSrc: 'https://bqykvhzbejzftancbusb.supabase.co/storage/v1/object/public/newsletter-images/hugsandi-logo-v2.png',
        logoAlt: 'hugsandi',
        logoWidth: '127.69px',
        logoUrl: 'https://hugsandi.is',
        viewInBrowserText: 'View in browser',
        viewInBrowserFont: 'Arial, Helvetica, sans-serif',
        viewInBrowserColor: '#000000',
        viewInBrowserSize: '12px',
        viewInBrowserBold: false,
        viewInBrowserItalic: false,
        viewInBrowserUnderline: false,
        headline: '',
        headlineColor: '#1f0318',
        headlineFont: 'Arial, Helvetica, sans-serif',
        headlineSize: '28px',
        headlineBold: true,
        headlineItalic: false,
        headlineUnderline: false,
        headlineAlign: 'left' as const,
        backgroundImage: '',
      };
      const headerData = saved?.data
        ? { ...headerDefaults, ...saved.data, type: 'header' as const }
        : headerDefaults;
      const headerStyle = saved?.style
        ? { ...style, ...saved.style, paddingLeft: '0px', paddingRight: '0px' }
        : { ...style, backgroundColor: '#FFCBA8', paddingLeft: '0px', paddingRight: '0px' };
      return { id, data: headerData, style: headerStyle };
    }
    case 'content-card': {
      const saved = defaults?.content_card || null;
      const cardDefaults: ContentCardBlockData = {
        type: 'content-card',
        imageSrc: ' ',
        imageAlt: '',
        title: '',
        titleColor: '#1f0318',
        titleFont: 'Instrument Sans, sans-serif',
        titleSize: '32px',
        titleBold: false,
        titleWeight: '600',
        titleLineHeight: '1.1',
        titleLetterSpacing: '0px',
        titleItalic: false,
        titleUnderline: false,
        body: '',
        bodyColor: '#333333',
        bodyFont: 'Arial, Helvetica, sans-serif',
        bodySize: '15px',
        bodyBold: false,
        bodyItalic: false,
        bodyUnderline: false,
        bodyLineHeight: '1.6',
        bodyAlign: 'left',
        ctaText: 'Read more',
        ctaUrl: '',
        ctaBackgroundColor: '#a0a7e4',
        ctaTextColor: '#000000',
        ctaFont: 'Arial, Helvetica, sans-serif',
        ctaSize: '15px',
        ctaBold: true,
      };
      const savedData = saved?.data ? (() => { const { title: _t, body: _b, ...rest } = saved.data as Record<string, unknown>; return rest; })() : null;
      const cardData: ContentCardBlockData = savedData
        ? { ...cardDefaults, ...savedData, type: 'content-card', imageSrc: ' ', imageAlt: '' }
        : cardDefaults;
      const cardStyle = saved?.style ? { ...style, ...saved.style } : style;
      return { id, data: cardData, style: cardStyle };
    }
    case 'footer': {
      const saved = defaults?.footer || null;
      const footerStyleDefaults = { ...style, paddingTop: '0px', paddingBottom: '0px', paddingLeft: '0px', paddingRight: '0px' };
      const footerDataDefaults = {
        type: 'footer' as const,
        backgroundImage: '',
        backgroundColor: '#1F0318',
        logoSrc: '/logo2.png',
        logoAlt: 'Logo',
        logoWidth: '120px',
        contactEmail: '',
        tagline: '',
        taglineColor: '#ffffff',
        orgLogoSrc: '/slogan.png',
        orgLogoAlt: '',
        orgLogoWidth: '180px',
        churchLogoSrc: '/kirkjan.png',
        churchLogoWidth: '150px',
        websiteUrl: '',
        websiteLabel: '',
        unsubscribeLabel: 'Unsubscribe',
        unsubscribeUrl: '',
        textColor: '#ffffff',
      };
      // Handle both old format { data: {...}, style: {...} } and new flat format
      const savedFields = saved?.data && typeof saved.data === 'object' ? saved.data as Record<string, unknown> : saved;
      const footerData = savedFields
        ? { ...footerDataDefaults, ...savedFields, type: 'footer' as const }
        : footerDataDefaults;
      return { id, data: footerData, style: footerStyleDefaults };
    }
  }
}

export function createDefaultBlocks(defaults?: SavedDefaults): Block[] {
  return [
    createDefaultBlock('header', defaults),
    createDefaultBlock('content-card', defaults),
    createDefaultBlock('footer', defaults),
  ];
}
