import JSZip from 'jszip';
import { toPng } from 'html-to-image';

const STYLE_PROPERTIES = [
  'color',
  'fontSize',
  'fontWeight',
  'fontFamily',
  'fontStyle',
  'lineHeight',
  'letterSpacing',
  'textAlign',
  'textDecoration',
  'textIndent',
  'whiteSpace',
  'wordBreak',
  'overflowWrap',
  'display',
  'boxSizing',
  'margin',
  'marginTop',
  'marginRight',
  'marginBottom',
  'marginLeft',
  'padding',
  'paddingTop',
  'paddingRight',
  'paddingBottom',
  'paddingLeft',
  'maxWidth',
  'maxHeight',
  'overflowX',
  'overflowY',
  'background',
  'backgroundColor',
  'backgroundImage',
  'backgroundSize',
  'backgroundRepeat',
  'backgroundPosition',
  'border',
  'borderTop',
  'borderRight',
  'borderBottom',
  'borderLeft',
  'borderRadius',
  'borderCollapse',
  'boxShadow',
  'opacity',
  'listStyleType',
  'listStylePosition',
  'verticalAlign',
] as const;

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function timestamp() {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(
    now.getHours(),
  )}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
}

function setDarkModeAttrs(element: HTMLElement, computed: CSSStyleDeclaration) {
  if (computed.backgroundColor && computed.backgroundColor !== 'rgba(0, 0, 0, 0)') {
    element.setAttribute('data-darkmode-bgcolor', computed.backgroundColor);
    element.setAttribute('data-darkmode-original-bgcolor', computed.backgroundColor);
  }

  if (computed.color) {
    element.setAttribute('data-darkmode-color', computed.color);
    element.setAttribute('data-darkmode-original-color', computed.color);
  }
}

function applyWechatOptimizations(element: HTMLElement, computed: CSSStyleDeclaration) {
  const tag = element.tagName;

  if (tag === 'IMG') {
    element.style.maxWidth = '100%';
    element.style.height = 'auto';
    element.style.display = 'block';
    element.style.margin = element.style.margin || '1.5em auto';
    element.style.border = 'none';
    element.style.outline = 'none';
    element.setAttribute('data-darkmode-bgcolor', 'transparent');
    element.setAttribute('data-darkmode-original-bgcolor', 'transparent');
    return;
  }

  if (tag === 'PRE') {
    element.style.maxWidth = '100%';
    element.style.maxHeight = '360px';
    element.style.overflowX = 'auto';
    element.style.overflowY = 'auto';
    element.style.whiteSpace = 'pre';
    setDarkModeAttrs(element, computed);
    return;
  }

  if (tag === 'CODE') {
    const isInline = element.parentElement?.tagName !== 'PRE';
    element.style.fontFamily = 'Consolas, Monaco, "Courier New", monospace';
    if (isInline) {
      element.style.fontSize = element.style.fontSize || '85%';
      element.style.borderRadius = element.style.borderRadius || '3px';
    } else {
      element.style.display = 'block';
      element.style.whiteSpace = 'pre';
      element.style.wordBreak = 'normal';
    }
    setDarkModeAttrs(element, computed);
    return;
  }

  if (tag === 'P') {
    element.style.lineHeight = element.style.lineHeight || '1.75';
    return;
  }

  if (tag === 'A') {
    element.style.wordBreak = 'break-all';
    element.style.textDecoration = element.style.textDecoration || 'underline';
    return;
  }

  if (tag === 'UL' || tag === 'OL') {
    element.style.paddingLeft = element.style.paddingLeft || '2em';
    element.style.margin = element.style.margin || '1.2em 0';
    return;
  }

  if (tag === 'LI') {
    element.style.lineHeight = element.style.lineHeight || '1.75';
    element.style.listStylePosition = element.style.listStylePosition || 'outside';
    return;
  }

  if (tag === 'HR') {
    element.style.border = 'none';
    element.style.height = '1px';
    element.style.margin = element.style.margin || '2em 0';
    return;
  }

  if (tag === 'TABLE') {
    element.style.width = '100%';
    element.style.borderCollapse = 'collapse';
    element.style.maxWidth = '100%';
    return;
  }

  if (tag === 'TH' || tag === 'TD') {
    element.style.wordBreak = 'break-word';
    element.style.overflowWrap = 'anywhere';
    element.style.verticalAlign = 'top';
    return;
  }

  if (tag === 'INPUT' && element.getAttribute('type') === 'checkbox') {
    element.style.pointerEvents = 'none';
  }
}

interface InlineOptions {
  rootCssText?: string;
}

export function inlineComputedStyles(source: HTMLElement, options: InlineOptions = {}): string {
  const clone = source.cloneNode(true) as HTMLElement;
  const sourceNodes = [source, ...Array.from(source.querySelectorAll('*'))] as HTMLElement[];
  const cloneNodes = [clone, ...Array.from(clone.querySelectorAll('*'))] as HTMLElement[];

  sourceNodes.forEach((node, index) => {
    const target = cloneNodes[index];
    if (!target) return;

    if (node.tagName === 'STYLE' || node.tagName === 'SCRIPT') {
      target.remove();
      return;
    }

    const computed = window.getComputedStyle(node);
    STYLE_PROPERTIES.forEach((prop) => {
      const value = computed[prop];
      if (value && value !== 'normal' && value !== 'none' && value !== 'auto') {
        target.style[prop] = value;
      }
    });

    applyWechatOptimizations(target, computed);
  });

  if (options.rootCssText) {
    clone.style.cssText += `;${options.rootCssText}`;
  }

  return clone.outerHTML;
}

export async function copyRichHtml(element: HTMLElement, options: InlineOptions = {}): Promise<void> {
  const html = inlineComputedStyles(element, options);
  const plainText = element.innerText;

  if ('ClipboardItem' in window && navigator.clipboard?.write) {
    await navigator.clipboard.write([
      new ClipboardItem({
        'text/html': new Blob([html], { type: 'text/html' }),
        'text/plain': new Blob([plainText], { type: 'text/plain' }),
      }),
    ]);
    return;
  }

  await navigator.clipboard.writeText(html);
}

export function exportHtml(element: HTMLElement, options: InlineOptions = {}) {
  const html = `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Platport Export</title>
</head>
<body>
${inlineComputedStyles(element, options)}
</body>
</html>`;
  downloadBlob(new Blob([html], { type: 'text/html;charset=utf-8' }), `platport-${timestamp()}.html`);
}

export function exportMarkdown(markdown: string) {
  downloadBlob(
    new Blob([markdown], { type: 'text/markdown;charset=utf-8' }),
    `platport-${timestamp()}.md`,
  );
}

export async function exportPosterImages(nodes: HTMLElement[]) {
  const zip = new JSZip();

  for (const [index, node] of nodes.entries()) {
    const dataUrl = await toPng(node, {
      cacheBust: true,
      pixelRatio: 2,
      backgroundColor: window.getComputedStyle(node).backgroundColor,
    });
    const base64 = dataUrl.split(',')[1];
    zip.file(`poster-${String(index + 1).padStart(2, '0')}.png`, base64, { base64: true });
  }

  const blob = await zip.generateAsync({ type: 'blob' });
  downloadBlob(blob, `platport-posters-${timestamp()}.zip`);
}
