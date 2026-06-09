import hljs from 'highlight.js';
import type { Element, Root } from 'hast';
import type { Node } from 'unist';
import { visit } from 'unist-util-visit';
import rehypeRaw from 'rehype-raw';
import rehypeStringify from 'rehype-stringify';
import remarkGfm from 'remark-gfm';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import { unified } from 'unified';
import type { PosterRatio } from '../types/editor';
import type { Stats } from '../types/editor';

interface ImageNode extends Node {
  type: 'image';
  title?: string | null;
  data?: {
    hProperties?: Record<string, unknown>;
  };
}

function remarkImageSizePlugin() {
  return (tree: Node) => {
    let imageIndex = 0;
    visit(tree, 'image', (node) => {
      const imageNode = node as ImageNode;
      const data = imageNode.data || (imageNode.data = {});
      const widthMatch = imageNode.title?.match(/^width=(\d{1,3})%$/);
      const width = widthMatch ? Math.min(100, Math.max(24, Number(widthMatch[1]))) : null;

      data.hProperties = {
        ...(data.hProperties ?? {}),
        'data-local-image-index': imageIndex,
        ...(width ? { style: `width:${width}%;max-width:100%;height:auto;` } : {}),
      };

      if (widthMatch) imageNode.title = null;
      imageIndex += 1;
    });
  };
}

function rehypeHighlightedCodeBlock() {
  return (tree: Root) => {
    visit(tree, 'element', (node) => {
      if (node.tagName !== 'pre') return;

      const codeNode = node.children.find(
        (child): child is Element => child.type === 'element' && child.tagName === 'code',
      );
      if (!codeNode) return;

      const classNames = (codeNode.properties?.className as string[] | undefined) ?? [];
      const languageClass = classNames.find((name) => name.startsWith('language-'));
      const language = languageClass?.replace('language-', '');
      const raw = codeNode.children
        .map((child) => ('value' in child ? String(child.value) : ''))
        .join('');

      try {
        const highlighted =
          language && hljs.getLanguage(language)
            ? hljs.highlight(raw, { language }).value
            : hljs.highlightAuto(raw).value;
        codeNode.children = [{ type: 'raw', value: highlighted }];
        codeNode.properties = {
          ...codeNode.properties,
          className: [...classNames, 'hljs'],
        };
      } catch {
        codeNode.children = [{ type: 'text', value: raw }];
      }
    });
  };
}

function getElementChildren(element: Element, tagName: string) {
  return element.children.filter(
    (child): child is Element => child.type === 'element' && child.tagName === tagName,
  );
}

function getTableRows(table: Element) {
  const rows: Array<{ cells: Element[]; kind: 'head' | 'body' }> = [];

  table.children.forEach((section) => {
    if (section.type !== 'element') return;

    if (section.tagName === 'thead' || section.tagName === 'tbody') {
      getElementChildren(section, 'tr').forEach((row) => {
        rows.push({
          cells: getElementChildren(row, 'th').concat(getElementChildren(row, 'td')),
          kind: section.tagName === 'thead' ? 'head' : 'body',
        });
      });
      return;
    }

    if (section.tagName === 'tr') {
      const cells = getElementChildren(section, 'th').concat(getElementChildren(section, 'td'));
      rows.push({
        cells,
        kind: cells.some((cell) => cell.tagName === 'th') ? 'head' : 'body',
      });
    }
  });

  return rows.filter((row) => row.cells.length > 0);
}

function getPosterTableColumns(count: number) {
  return `repeat(${Math.max(1, count)}, minmax(0, 1fr))`;
}

function rehypePosterTableRows() {
  return (tree: Root) => {
    visit(tree, 'element', (node, index, parent) => {
      if (node.tagName !== 'table' || typeof index !== 'number' || !parent) return;
      if (!('children' in parent) || !Array.isArray(parent.children)) return;

      const rows = getTableRows(node);
      if (rows.length === 0) return;

      const columnCount = Math.max(...rows.map((row) => row.cells.length));
      const replacement: Element = {
        type: 'element',
        tagName: 'div',
        properties: {
          className: ['poster-table'],
          role: 'table',
          'data-columns': String(columnCount),
          style: `--poster-table-columns: ${getPosterTableColumns(columnCount)}`,
        },
        children: rows.map((row) => ({
          type: 'element',
          tagName: 'div',
          properties: {
            className: [
              'poster-table-row',
              row.kind === 'head' ? 'poster-table-head' : 'poster-table-body-row',
            ],
            role: 'row',
          },
          children: row.cells.map((cell) => ({
            type: 'element',
            tagName: 'div',
            properties: {
              className: ['poster-table-cell'],
              role: row.kind === 'head' ? 'columnheader' : 'cell',
            },
            children: [...cell.children],
          })),
        })),
      };

      parent.children[index] = replacement;
    });
  };
}

export async function markdownToHtml(markdown: string): Promise<string> {
  const normalized = markdown.replace(
    /<!--\s*pagebreak\s*-->/gi,
    '\n<hr data-pagebreak="true" />\n',
  );

  const result = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkImageSizePlugin)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeHighlightedCodeBlock)
    .use(rehypePosterTableRows)
    .use(rehypeStringify, { allowDangerousHtml: true })
    .process(normalized);

  return result.toString();
}

export function getStats(markdown: string): Stats {
  const plain = markdown
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`[^`]*`/g, '')
    .replace(/!\[[^\]]*]\([^)]*\)/g, '')
    .replace(/\[[^\]]*]\([^)]*\)/g, '')
    .replace(/[#>*_~|`-]/g, '')
    .replace(/<[^>]+>/g, '')
    .trim();

  const cjk = plain.match(/[\u4e00-\u9fff]/g)?.length ?? 0;
  const latinWords = plain.match(/[A-Za-z0-9]+(?:[-'][A-Za-z0-9]+)*/g)?.length ?? 0;
  const characters = plain.replace(/\s/g, '').length;
  const words = cjk + latinWords;

  return {
    characters,
    words,
    readingMinutes: Math.max(1, Math.ceil(words / 450)),
  };
}

const POSTER_PAGE_LIMITS: Record<PosterRatio, number> = {
  '1:1': 430,
  '3:4': 620,
  '4:5': 570,
  '9:16': 820,
};

function serializeNode(node: globalThis.Node): string {
  const wrapper = document.createElement('div');
  wrapper.appendChild(node.cloneNode(true));
  return wrapper.innerHTML;
}

function getNodeCost(node: globalThis.Node): number {
  if (node.nodeType === globalThis.Node.TEXT_NODE) {
    return Math.ceil((node.textContent?.trim().length ?? 0) * 1.2);
  }

  if (node.nodeType !== globalThis.Node.ELEMENT_NODE) return 0;

  const element = node as HTMLElement;
  const tag = element.tagName.toLowerCase();
  const textLength = (element.textContent ?? '').trim().length;

  if (tag === 'h1') return 140 + textLength * 1.2;
  if (tag === 'h2') return 90 + textLength * 1.1;
  if (tag === 'h3') return 70 + textLength;
  if (tag === 'blockquote') return 92 + textLength * 1.15;
  if (tag === 'pre') return 110 + textLength * 0.74;
  if (tag === 'table') return 118 + element.querySelectorAll('tr').length * 54;
  if (tag === 'ul' || tag === 'ol') {
    return 78 + textLength * 1.08 + element.querySelectorAll('li').length * 18;
  }
  if (tag === 'img') return 270;
  if (tag === 'p') return 44 + textLength * 1.16;

  return 42 + textLength;
}

function splitOversizedTextNode(element: HTMLElement, limit: number): HTMLElement[] {
  if (!['P', 'BLOCKQUOTE'].includes(element.tagName)) return [element];

  const text = (element.textContent ?? '').trim();
  if (text.length < 120) return [element];

  const chunkSize = Math.max(90, Math.floor(limit * 0.72));
  const chunks: string[] = [];
  for (let index = 0; index < text.length; index += chunkSize) {
    chunks.push(text.slice(index, index + chunkSize));
  }

  return chunks.map((chunk) => {
    const clone = element.cloneNode(false) as HTMLElement;
    clone.textContent = chunk;
    return clone;
  });
}

function packNodesIntoPages(nodes: globalThis.Node[], limit: number): string[] {
  const pages: string[] = [];
  let current: globalThis.Node[] = [];
  let currentCost = 0;

  const flush = () => {
    if (current.length === 0) return;
    pages.push(current.map(serializeNode).join(''));
    current = [];
    currentCost = 0;
  };

  const addNode = (node: globalThis.Node) => {
    const cost = getNodeCost(node);
    if (current.length > 0 && currentCost + cost > limit) flush();
    current.push(node);
    currentCost += cost;
  };

  nodes.forEach((node) => {
    if (
      node.nodeType === globalThis.Node.ELEMENT_NODE &&
      getNodeCost(node) > limit * 1.1
    ) {
      splitOversizedTextNode(node as HTMLElement, limit).forEach(addNode);
      return;
    }

    addNode(node);
  });

  flush();
  return pages;
}

export function splitHtmlIntoPosterPages(html: string, ratio: PosterRatio = '4:5'): string[] {
  if (typeof document === 'undefined') return [html];

  const template = document.createElement('template');
  template.innerHTML = html;
  const limit = POSTER_PAGE_LIMITS[ratio];
  const pages: string[] = [];
  let current: globalThis.Node[] = [];

  Array.from(template.content.childNodes).forEach((node) => {
    if (
      node.nodeType === globalThis.Node.ELEMENT_NODE &&
      (node as HTMLElement).matches('hr[data-pagebreak="true"]')
    ) {
      if (current.length > 0) {
        pages.push(...packNodesIntoPages(current, limit));
        current = [];
      }
      return;
    }

    if (node.textContent?.trim() || node.nodeType === globalThis.Node.ELEMENT_NODE) {
      current.push(node.cloneNode(true));
    }
  });

  if (current.length > 0) pages.push(...packNodesIntoPages(current, limit));
  return pages.length > 0 ? pages : [html];
}
