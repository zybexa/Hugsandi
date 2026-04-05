import { Design, Block, BlockStyle } from '@/types/design';

function buildInlineStyle(style: BlockStyle): string {
  const parts: string[] = [];
  if (style.backgroundColor) parts.push(`background-color: ${style.backgroundColor}`);
  if (style.color) parts.push(`color: ${style.color}`);
  if (style.fontFamily) parts.push(`font-family: ${style.fontFamily}`);
  if (style.fontSize) parts.push(`font-size: ${style.fontSize}`);
  if (style.textAlign) parts.push(`text-align: ${style.textAlign}`);
  if (style.paddingTop) parts.push(`padding-top: ${style.paddingTop}`);
  if (style.paddingBottom) parts.push(`padding-bottom: ${style.paddingBottom}`);
  if (style.paddingLeft) parts.push(`padding-left: ${style.paddingLeft}`);
  if (style.paddingRight) parts.push(`padding-right: ${style.paddingRight}`);
  return parts.join('; ');
}

function buildMarginStyle(style: BlockStyle): string {
  const parts: string[] = [];
  if (style.marginTop) parts.push(`margin-top: ${style.marginTop}`);
  if (style.marginBottom) parts.push(`margin-bottom: ${style.marginBottom}`);
  if (style.marginLeft) parts.push(`margin-left: ${style.marginLeft}`);
  if (style.marginRight) parts.push(`margin-right: ${style.marginRight}`);
  return parts.join('; ');
}

function hasMargin(style: BlockStyle): boolean {
  return !!(style.marginTop || style.marginBottom || style.marginLeft || style.marginRight);
}

function ensureAbsoluteUrl(url: string): string {
  if (!url || url === '#') return url;
  if (/^https?:\/\//i.test(url) || url.startsWith('mailto:')) return url;
  return `https://${url}`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function wrapWithMarginCell(html: string, style: BlockStyle): string {
  if (!hasMargin(style)) return html;
  const ms = buildMarginStyle(style);
  return `<tr>
  <td style="${ms}">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
${html}
    </table>
  </td>
</tr>`;
}

function renderBlockInner(block: Block): string {
  switch (block.data.type) {
    case 'header': {
      const d = block.data;
      const bgStyle = d.backgroundImage
        ? `background-image: url('${d.backgroundImage}'); background-size: cover; background-position: center;`
        : '';
      const headerStyle = buildInlineStyle({ ...block.style, paddingLeft: undefined, paddingRight: undefined });

      return `<tr>
  <td style="${headerStyle}; ${bgStyle}">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td style="vertical-align: middle;">
          ${d.logoSrc ? `${d.logoUrl ? `<a href="${ensureAbsoluteUrl(d.logoUrl)}" style="text-decoration: none;">` : ''}<img src="${d.logoSrc}" alt="${escapeHtml(d.logoAlt)}" width="128" style="display: block; height: auto; border: 0;" />${d.logoUrl ? '</a>' : ''}` : ''}
        </td>
        <td align="right" style="vertical-align: middle;">
          ${d.viewInBrowserText ? (() => {
            const spanStyle = `font-size: 12px; color: ${d.viewInBrowserColor || '#000000'}; font-family: Instrument Sans, sans-serif; font-weight: 500; font-style: normal; text-decoration: none; border-bottom: 1px solid currentColor; padding-bottom: 2px; line-height: 1.5; letter-spacing: 0px;`;
            return d.viewInBrowserUrl
              ? `<a href="${ensureAbsoluteUrl(d.viewInBrowserUrl)}" style="${spanStyle}">${escapeHtml(d.viewInBrowserText)}</a>`
              : `<span style="${spanStyle}">${escapeHtml(d.viewInBrowserText)}</span>`;
          })() : ''}
        </td>
      </tr>
      <tr>
        <td colspan="2" style="padding-top: 32px; padding-bottom: 16px;">
          <h1 style="margin: 0; font-size: 40px; font-weight: 600; color: #1F0318; font-family: Instrument Sans, sans-serif; font-style: normal; text-decoration: none; text-align: center; line-height: 1.2; letter-spacing: 0px;">${escapeHtml(d.headline)}</h1>
        </td>
      </tr>
    </table>
  </td>
</tr>`;
    }

    case 'content-card': {
      const d = block.data;
      const bodyFont = 'Instrument Sans, sans-serif';
      const bodyColor = '#1f0318';
      const bodySize = '16px';
      const bodyWeight = '400';
      const bodyFontStyle = 'normal';
      const bodyDecoration = 'none';
      const bodyLineHeight = '1.4';
      const bodyAlign = 'left';
      const bodyLetterSpacing = '0px';
      const bodyParaStyle = `margin: 0 0 10px 0; font-size: ${bodySize}; line-height: ${bodyLineHeight}; color: ${bodyColor}; font-family: ${bodyFont}; font-weight: ${bodyWeight}; font-style: ${bodyFontStyle}; text-decoration: ${bodyDecoration}; text-align: ${bodyAlign}; letter-spacing: ${bodyLetterSpacing};`;
      const bodyHtml = d.body.replace(/\n\n/g, `</p><p style="${bodyParaStyle}">`).replace(/\n/g, '<br>');

      const titleFont = 'Instrument Sans, sans-serif';
      const titleSize = '32px';
      const titleWeight = '600';
      const titleFontStyle = 'normal';
      const titleDecoration = 'none';

      const ctaFont = 'Instrument Sans, sans-serif';
      const ctaSize = '20px';
      const ctaWeight = '500';

      const contentBg = '#ffffff';
      return `${d.imageSrc?.trim() ? `<tr>
  <td style="padding: 0; line-height: 0; background-color: ${contentBg}; border-radius: 24px 24px 0 0;">
    <img src="${d.imageSrc}" alt="${escapeHtml(d.imageAlt)}" width="100%" style="display: block; width: 100%; max-width: 100%; height: auto; border: 0; border-radius: 24px 24px 0 0;" />
  </td>
</tr>` : ''}
<tr>
  <td style="background-color: ${contentBg}; padding: 40px 32px 30px 32px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td style="padding-bottom: 24px;">
          <h2 style="margin: 0; font-size: ${titleSize}; font-weight: ${titleWeight}; color: #1f0318; font-family: ${titleFont}; font-style: ${titleFontStyle}; text-decoration: ${titleDecoration}; line-height: 1.1; letter-spacing: 0px;">${escapeHtml(d.title)}</h2>
        </td>
      </tr>
      <tr>
        <td style="padding-bottom: 0;">
          <p style="${bodyParaStyle}">${bodyHtml}</p>
        </td>
      </tr>
    </table>
  </td>
</tr>
${d.ctaText ? (() => {
      const ctaHref = d.ctaUrl?.trim() ? ensureAbsoluteUrl(d.ctaUrl) : '';
      const innerHtml = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="background-color: ${d.ctaBackgroundColor || '#c084fc'}; border-radius: 0 0 24px 24px; padding: 24px 32px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="color: #1f0318; font-size: ${ctaSize}; font-weight: ${ctaWeight}; font-family: ${ctaFont}; line-height: 1.1; letter-spacing: 0.01em;">
                  ${escapeHtml(d.ctaText)}
                </td>
                <td align="right" style="color: #1f0318; font-size: 32px; line-height: 1; vertical-align: middle;">
                  &#x1F806;
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>`;
      return `<tr>
  <td style="padding: 0; background-color: ${d.ctaBackgroundColor || '#c084fc'}; border-radius: 0 0 24px 24px;">
    ${ctaHref ? `<a href="${ctaHref}" style="display: block; text-decoration: none;">${innerHtml}</a>` : innerHtml}
  </td>
</tr>`;
    })() : ''}`;
    }

    case 'footer': {
      const d = block.data;
      const bgStyle = d.backgroundImage
        ? `background-image: url('${d.backgroundImage}'); background-size: cover; background-position: center;`
        : '';
      const bgColor = '#1F0318';

      return `<tr>
  <td style="background-color: ${bgColor}; ${bgStyle} padding: 32px 40px; border-radius: 12px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      ${true ? `<tr>
        <td style="padding-bottom: 24px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="vertical-align: middle; width: 1px;">
                <img src="${d.logoSrc || '/logo2.png'}" alt="Logo" width="56" height="56" style="display: block; width: 56px; height: 56px; border: 0;" />
              </td>
              ${d.contactEmail ? `<td align="right" style="vertical-align: middle;">
                <a href="mailto:${d.contactEmail}" style="color: #FFEDE6; font-family: Instrument Sans, sans-serif; font-weight: 400; font-size: 20px; line-height: 1.3; letter-spacing: 0.02em; text-decoration: none;">${escapeHtml(d.contactEmail)}</a>
              </td>` : ''}
            </tr>
          </table>
        </td>
      </tr>` : ''}
      ${true ? `<tr class="footer-mobile-center">
        <td align="center">
          <img src="${d.orgLogoSrc || '/slogan.png'}" alt="Slogan" width="100%" style="display: block; width: 100%; height: auto; border: 0;" />
        </td>
      </tr>` : ''}
      ${d.churchLogoSrc || d.websiteUrl || d.unsubscribeLabel || d.unsubscribeUrl ? `<tr>
        <td style="padding-top: 56px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="footer-stack">
            <tr>
              <td class="footer-col" style="vertical-align: middle;">
                <img src="${d.churchLogoSrc || '/kirkjan.png'}" alt="" width="183" style="display: block; width: 183px; height: auto; border: 0;" />
              </td>
              ${d.websiteUrl || d.unsubscribeLabel || d.unsubscribeUrl ? `<td class="footer-col footer-col-links" align="right" style="vertical-align: middle;">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    ${d.websiteUrl ? `<td style="padding-right: ${d.unsubscribeLabel || d.unsubscribeUrl ? '24px' : '0'};">
                      <a href="${ensureAbsoluteUrl(d.websiteUrl)}" style="color: #FFEDE6; font-family: Instrument Sans, sans-serif; font-weight: 500; font-size: 12px; line-height: 1.5; letter-spacing: 0px; text-decoration: none; border-bottom: 1px solid #FFEDE6; padding-bottom: 2px;">${escapeHtml(d.websiteLabel || d.websiteUrl)}</a>
                    </td>` : ''}
                    ${d.unsubscribeLabel || d.unsubscribeUrl ? `<td>
                      <a href="${ensureAbsoluteUrl(d.unsubscribeUrl || '#')}" style="color: #FFEDE6; font-family: Instrument Sans, sans-serif; font-weight: 500; font-size: 12px; line-height: 1.5; letter-spacing: 0px; text-decoration: none; border-bottom: 1px solid #FFEDE6; padding-bottom: 2px;">${escapeHtml(d.unsubscribeLabel || 'Unsubscribe')}</a>
                    </td>` : ''}
                  </tr>
                </table>
              </td>` : ''}
            </tr>
          </table>
        </td>
      </tr>` : ''}
    </table>
  </td>
</tr>`;
    }

    default:
      return '';
  }
}

function renderBlock(block: Block): string {
  return wrapWithMarginCell(renderBlockInner(block), block.style);
}

export function renderEmailHtml(design: Design): string {
  const { blocks } = design;
  const spacerRow = `<tr><td style="padding-top: 16px; line-height: 0; font-size: 0; background-color: #FFECE5;">&nbsp;</td></tr>`;
  const blocksHtml = blocks.map((b) => renderBlock(b)).join(`\n${spacerRow}\n`);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <link href="https://fonts.googleapis.com/css2?family=Instrument+Sans:ital,wght@0,400..700;1,400..700&display=swap" rel="stylesheet">
  <title>${escapeHtml(design.name || 'Newsletter')}</title>
  <!--[if mso]>
  <style>table,td{font-family:Arial,sans-serif;}</style>
  <![endif]-->
  <style>
    .content-outer { max-width: 600px !important; }
    .content-inner { max-width: 600px !important; }
    @media only screen and (max-width: 480px) {
      .content-outer { max-width: 100% !important; width: 100% !important; box-sizing: border-box !important; padding-left: 16px !important; padding-right: 16px !important; }
      .content-inner { max-width: 100% !important; }
      .footer-stack td.footer-col { display: block !important; width: 100% !important; text-align: center !important; }
      .footer-stack td.footer-col img { margin: 0 auto !important; }
      .footer-stack td.footer-col table { margin: 0 auto !important; }
      .footer-stack td.footer-col-links { padding-top: 16px !important; }
      .footer-mobile-center td { display: block !important; width: 100% !important; text-align: center !important; }
      .footer-mobile-center td img { margin: 0 auto !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #FFECE5; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #FFECE5;">
    <tr>
      <td align="center" class="content-outer" style="padding-top: 20px; padding-bottom: 20px; padding-left: 16px; padding-right: 16px; max-width: 600px;">
        <table role="presentation" class="content-inner" cellpadding="0" cellspacing="0" border="0" style="font-family: Instrument Sans, sans-serif; width: 100%; max-width: 600px; margin: 0 auto;">
${blocksHtml}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
