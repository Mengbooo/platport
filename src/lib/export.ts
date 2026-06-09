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
  'width',
  'maxWidth',
  'height',
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

export function inlineComputedStyles(source: HTMLElement): string {
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

    if (target.tagName === 'IMG') {
      target.style.maxWidth = '100%';
      target.style.height = 'auto';
      target.style.display = 'block';
    }

    if (target.tagName === 'P') {
      target.style.textAlign = 'justify';
    }
  });

  return clone.outerHTML;
}

export async function copyRichHtml(element: HTMLElement): Promise<void> {
  const html = inlineComputedStyles(element);
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

export function exportHtml(element: HTMLElement) {
  const html = `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Platport Export</title>
</head>
<body>
${inlineComputedStyles(element)}
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
