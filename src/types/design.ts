export type BlockType = 'header' | 'content-card' | 'footer';

export interface BlockStyle {
  backgroundColor?: string;
  color?: string;
  fontFamily?: string;
  fontSize?: string;
  textAlign?: 'left' | 'center' | 'right';
  marginTop?: string;
  marginBottom?: string;
  marginLeft?: string;
  marginRight?: string;
  paddingTop?: string;
  paddingBottom?: string;
  paddingLeft?: string;
  paddingRight?: string;
}

export interface HeaderBlockData {
  type: 'header';
  logoSrc: string;
  logoAlt: string;
  logoWidth: string;
  logoUrl: string;
  viewInBrowserText: string;
  viewInBrowserUrl?: string;
  viewInBrowserFont: string;
  viewInBrowserColor: string;
  viewInBrowserSize: string;
  viewInBrowserBold: boolean;
  viewInBrowserWeight?: string;
  viewInBrowserLineHeight?: string;
  viewInBrowserLetterSpacing?: string;
  viewInBrowserItalic: boolean;
  viewInBrowserUnderline: boolean;
  headline: string;
  headlineColor: string;
  headlineFont: string;
  headlineSize: string;
  headlineBold: boolean;
  headlineWeight?: string;
  headlineLineHeight?: string;
  headlineLetterSpacing?: string;
  headlineItalic: boolean;
  headlineUnderline: boolean;
  headlineAlign: 'left' | 'center' | 'right' | 'justify';
  backgroundImage: string;
}

export interface ContentCardBlockData {
  type: 'content-card';
  imageSrc: string;
  imageAlt: string;
  title: string;
  titleColor: string;
  titleFont: string;
  titleSize: string;
  titleBold: boolean;
  titleWeight?: string;
  titleLineHeight?: string;
  titleLetterSpacing?: string;
  titleItalic: boolean;
  titleUnderline: boolean;
  body: string;
  bodyColor: string;
  bodyFont: string;
  bodySize: string;
  bodyBold: boolean;
  bodyWeight?: string;
  bodyItalic: boolean;
  bodyUnderline: boolean;
  bodyLineHeight: string;
  bodyLetterSpacing?: string;
  bodyAlign: 'left' | 'center' | 'right' | 'justify';
  ctaText: string;
  ctaUrl: string;
  ctaBackgroundColor: string;
  ctaTextColor: string;
  ctaFont: string;
  ctaSize: string;
  ctaLineHeight?: string;
  ctaLetterSpacing?: string;
  ctaBold: boolean;
  ctaWeight?: string;
}

export interface FooterBlockData {
  type: 'footer';
  backgroundImage: string;
  backgroundColor: string;
  logoSrc: string;
  logoAlt: string;
  logoWidth: string;
  contactEmail: string;
  tagline: string;
  taglineColor: string;
  orgLogoSrc: string;
  orgLogoAlt: string;
  orgLogoWidth: string;
  churchLogoSrc: string;
  churchLogoWidth: string;
  websiteUrl: string;
  websiteLabel: string;
  unsubscribeLabel: string;
  unsubscribeUrl: string;
  textColor: string;
}

export type BlockData =
  | HeaderBlockData
  | ContentCardBlockData
  | FooterBlockData;

export interface Block {
  id: string;
  data: BlockData;
  style: BlockStyle;
}

export interface GlobalStyle {
  backgroundColor: string;
  contentBackgroundColor: string;
  maxWidth: string;
  fontFamily: string;
  fontWeight?: string;
  paddingTop: string;
  paddingBottom: string;
  paddingLeft: string;
  paddingRight: string;
  cardSpacing: string;
}

export interface Design {
  id?: string;
  name: string;
  globalStyle: GlobalStyle;
  blocks: Block[];
  createdAt?: string;
  updatedAt?: string;
  lastSentAt?: string | null;
}

export interface DesignImage {
  id: string;
  url: string;
  filename: string;
  createdAt: string;
}
