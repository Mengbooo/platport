import type { PosterRatio } from '../types/editor';

const PAGE_WIDTH = 720;
const PAGE_HEIGHTS: Record<PosterRatio, number> = {
  '1:1': 720,
  '3:4': 960,
  '4:5': 900,
  '9:16': 1280,
};
const SAFE_BOTTOM_GUTTER = 32;

function cloneElement(element: Element) {
  return element.cloneNode(true) as HTMLElement;
}

function nodeToHtml(node: Node) {
  const wrapper = document.createElement('div');
  wrapper.appendChild(node.cloneNode(true));
  return wrapper.innerHTML;
}

function createMeasureRoot(ratio: PosterRatio, fontFamily: string) {
  const root = document.createElement('div');
  root.className = 'poster-measure-root';
  root.style.position = 'fixed';
  root.style.left = '-10000px';
  root.style.top = '0';
  root.style.width = `${PAGE_WIDTH}px`;
  root.style.height = `${PAGE_HEIGHTS[ratio]}px`;
  root.style.visibility = 'hidden';
  root.style.pointerEvents = 'none';
  root.style.contain = 'layout style size';

  const page = document.createElement('article');
  page.className = 'poster-card poster-card-measure';
  page.style.width = `${PAGE_WIDTH}px`;
  page.style.height = `${PAGE_HEIGHTS[ratio]}px`;
  page.style.aspectRatio = `${PAGE_WIDTH} / ${PAGE_HEIGHTS[ratio]}`;

  const content = document.createElement('div');
  content.id = 'chicpage';
  content.className = 'poster-content';
  content.style.fontFamily = fontFamily;

  page.appendChild(content);
  root.appendChild(page);
  const host = document.querySelector('.app-shell') ?? document.body;
  host.appendChild(root);

  return { root, content };
}

function normalizeHtml(html: string) {
  const template = document.createElement('template');
  template.innerHTML = html;
  template.content.querySelectorAll('hr[data-pagebreak="true"]').forEach((hr) => {
    hr.setAttribute('data-explicit-break', 'true');
  });
  return Array.from(template.content.childNodes).filter(
    (node) => node.nodeType === Node.ELEMENT_NODE || Boolean(node.textContent?.trim()),
  );
}

function fits(content: HTMLElement) {
  if (content.scrollHeight > content.clientHeight + 1) return false;

  const children = Array.from(content.children);
  if (children.length === 0) return true;

  const contentBottom = content.getBoundingClientRect().bottom;
  const lastBottom = Math.max(...children.map((child) => child.getBoundingClientRect().bottom));
  return lastBottom <= contentBottom - SAFE_BOTTOM_GUTTER;
}

function appendAndMeasure(content: HTMLElement, node: Node) {
  const clone = node.cloneNode(true);
  content.appendChild(clone);
  const didFit = fits(content);
  if (!didFit) content.removeChild(clone);
  return didFit;
}

function canAppend(content: HTMLElement, node: Node) {
  const clone = node.cloneNode(true);
  content.appendChild(clone);
  const didFit = fits(content);
  content.removeChild(clone);
  return didFit;
}

function appendClone(content: HTMLElement, node: Node) {
  content.appendChild(node.cloneNode(true));
}

function textChunks(text: string, preferredSize: number) {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (!normalized) return [];

  const chunks: string[] = [];
  let buffer = '';
  normalized.split(/(?<=[。！？.!?；;])\s*/).forEach((sentence) => {
    if (!sentence) return;
    if ((buffer + sentence).length > preferredSize && buffer) {
      chunks.push(buffer.trim());
      buffer = sentence;
      return;
    }
    buffer += buffer ? ` ${sentence}` : sentence;
  });

  if (buffer) chunks.push(buffer.trim());
  if (chunks.some((chunk) => chunk.length > preferredSize * 1.4)) {
    return normalized.match(new RegExp(`.{1,${preferredSize}}`, 'g')) ?? [normalized];
  }

  return chunks;
}

function splitTextElement(element: HTMLElement, ratio: PosterRatio) {
  const text = element.textContent?.trim() ?? '';
  if (!text) return [];
  const preferredSize = ratio === '9:16' ? 260 : ratio === '1:1' ? 120 : 170;

  return textChunks(text, preferredSize).map((chunk) => {
    const clone = element.cloneNode(false) as HTMLElement;
    clone.textContent = chunk;
    return clone;
  });
}

function splitList(element: HTMLElement) {
  return Array.from(element.children).map((child, index) =>
    createListChunk(element, [child], index),
  );
}

function createListChunk(source: HTMLElement, items: Element[], startIndex: number) {
  const list = source.cloneNode(false) as HTMLElement;
  if (source.tagName.toLowerCase() === 'ol') {
    const start = Number(source.getAttribute('start') ?? 1);
    list.setAttribute('start', String(start + startIndex));
  }
  items.forEach((item) => list.appendChild(item.cloneNode(true)));
  return list;
}

function splitTable(element: HTMLElement) {
  const table = element as HTMLTableElement;
  const head = table.querySelector('thead')?.cloneNode(true);
  const bodyRows = Array.from(table.tBodies).flatMap((body) => Array.from(body.rows));
  const rows = bodyRows.length > 0 ? bodyRows : Array.from(table.rows).filter((row) => !row.closest('thead'));

  if (rows.length === 0) return [cloneElement(element)];

  return rows.map((row) => {
    const nextTable = document.createElement('table');
    if (head) nextTable.appendChild(head.cloneNode(true));
    const tbody = document.createElement('tbody');
    tbody.appendChild(row.cloneNode(true));
    nextTable.appendChild(tbody);
    return nextTable;
  });
}

function splitPosterTable(element: HTMLElement) {
  const rows = Array.from(element.children).filter((child) =>
    child.classList.contains('poster-table-row'),
  );

  if (rows.length === 0) return [cloneElement(element)];

  return rows.map((row) => {
    const table = element.cloneNode(false) as HTMLElement;
    table.appendChild(row.cloneNode(true));
    return table;
  });
}

function createPosterTableChunk(source: HTMLElement, rows: Element[], headRows: Element[]) {
  const table = source.cloneNode(false) as HTMLElement;
  headRows.forEach((row) => table.appendChild(row.cloneNode(true)));
  rows.forEach((row) => table.appendChild(row.cloneNode(true)));
  return table;
}

function paginatePosterTable(
  element: HTMLElement,
  content: HTMLElement,
  pages: string[],
) {
  const rows = Array.from(element.children).filter((child) =>
    child.classList.contains('poster-table-row'),
  );
  const headRows = rows.filter((row) => row.classList.contains('poster-table-head'));
  const bodyRows = rows.filter((row) => !row.classList.contains('poster-table-head'));
  const rowsToPack = bodyRows.length > 0 ? bodyRows : rows;

  if (rowsToPack.length === 0) return false;

  let packedRows: Element[] = [];

  rowsToPack.forEach((row) => {
    const nextRows = [...packedRows, row];
    const nextChunk = createPosterTableChunk(element, nextRows, bodyRows.length > 0 ? headRows : []);

    if (canAppend(content, nextChunk)) {
      packedRows = nextRows;
      return;
    }

    if (packedRows.length > 0) {
      appendClone(
        content,
        createPosterTableChunk(element, packedRows, bodyRows.length > 0 ? headRows : []),
      );
      flushPage(pages, content);
      packedRows = [];
    } else {
      flushPage(pages, content);
    }

    const singleRow = createPosterTableChunk(element, [row], bodyRows.length > 0 ? headRows : []);
    if (canAppend(content, singleRow)) {
      packedRows = [row];
      return;
    }

    singleRow.classList.add('poster-scale-down');
    appendClone(content, singleRow);
    flushPage(pages, content);
  });

  if (packedRows.length > 0) {
    appendClone(
      content,
      createPosterTableChunk(element, packedRows, bodyRows.length > 0 ? headRows : []),
    );
  }

  return true;
}

function createNativeTableChunk(source: HTMLElement, rows: HTMLTableRowElement[]) {
  const table = source.cloneNode(false) as HTMLTableElement;
  const head = (source as HTMLTableElement).querySelector('thead')?.cloneNode(true);
  if (head) table.appendChild(head);

  const tbody = document.createElement('tbody');
  rows.forEach((row) => tbody.appendChild(row.cloneNode(true)));
  table.appendChild(tbody);
  return table;
}

function paginateNativeTable(element: HTMLElement, content: HTMLElement, pages: string[]) {
  const table = element as HTMLTableElement;
  const bodyRows = Array.from(table.tBodies).flatMap((body) => Array.from(body.rows));
  const rows = bodyRows.length > 0 ? bodyRows : Array.from(table.rows).filter((row) => !row.closest('thead'));

  if (rows.length === 0) return false;

  let packedRows: HTMLTableRowElement[] = [];

  rows.forEach((row) => {
    const nextRows = [...packedRows, row];
    const nextChunk = createNativeTableChunk(element, nextRows);

    if (canAppend(content, nextChunk)) {
      packedRows = nextRows;
      return;
    }

    if (packedRows.length > 0) {
      appendClone(content, createNativeTableChunk(element, packedRows));
      flushPage(pages, content);
      packedRows = [];
    } else {
      flushPage(pages, content);
    }

    const singleRow = createNativeTableChunk(element, [row]);
    if (canAppend(content, singleRow)) {
      packedRows = [row];
      return;
    }

    singleRow.classList.add('poster-scale-down');
    appendClone(content, singleRow);
    flushPage(pages, content);
  });

  if (packedRows.length > 0) appendClone(content, createNativeTableChunk(element, packedRows));
  return true;
}

function paginateTableAcrossPages(node: Node, content: HTMLElement, pages: string[]) {
  if (node.nodeType !== Node.ELEMENT_NODE) return false;

  const element = node as HTMLElement;
  if (element.classList.contains('poster-table')) return paginatePosterTable(element, content, pages);
  if (element.tagName.toLowerCase() === 'table') return paginateNativeTable(element, content, pages);
  return false;
}

function paginateListAcrossPages(node: Node, content: HTMLElement, pages: string[]) {
  if (node.nodeType !== Node.ELEMENT_NODE) return false;

  const element = node as HTMLElement;
  const tag = element.tagName.toLowerCase();
  if (tag !== 'ul' && tag !== 'ol') return false;

  const items = Array.from(element.children).filter((child) =>
    child.tagName.toLowerCase() === 'li',
  );
  if (items.length === 0) return false;

  let packedItems: Element[] = [];
  let packedStart = 0;

  items.forEach((item, index) => {
    const nextItems = [...packedItems, item];
    const nextChunk = createListChunk(element, nextItems, packedStart);

    if (canAppend(content, nextChunk)) {
      packedItems = nextItems;
      return;
    }

    if (packedItems.length > 0) {
      appendClone(content, createListChunk(element, packedItems, packedStart));
      flushPage(pages, content);
      packedItems = [];
      packedStart = index;
    } else {
      flushPage(pages, content);
      packedStart = index;
    }

    const singleItem = createListChunk(element, [item], index);
    if (canAppend(content, singleItem)) {
      packedItems = [item];
      return;
    }

    singleItem.classList.add('poster-scale-down');
    appendClone(content, singleItem);
    flushPage(pages, content);
    packedStart = index + 1;
  });

  if (packedItems.length > 0) {
    appendClone(content, createListChunk(element, packedItems, packedStart));
  }

  return true;
}

function splitPre(element: HTMLElement, ratio: PosterRatio) {
  const code = element.textContent ?? '';
  const lineLimit = ratio === '9:16' ? 18 : ratio === '1:1' ? 8 : 12;
  const lines = code.split('\n');

  const chunks: HTMLElement[] = [];
  for (let index = 0; index < lines.length; index += lineLimit) {
    const pre = element.cloneNode(false) as HTMLElement;
    const codeElement = document.createElement('code');
    codeElement.textContent = lines.slice(index, index + lineLimit).join('\n');
    pre.appendChild(codeElement);
    chunks.push(pre);
  }
  return chunks;
}

function splitOversizedElement(element: HTMLElement, ratio: PosterRatio) {
  const tag = element.tagName.toLowerCase();
  if (element.classList.contains('poster-table')) return splitPosterTable(element);
  if (tag === 'p' || tag === 'blockquote') return splitTextElement(element, ratio);
  if (tag === 'ul' || tag === 'ol') return splitList(element);
  if (tag === 'table') return splitTable(element);
  if (tag === 'pre') return splitPre(element, ratio);
  return [element];
}

function flushPage(pages: string[], content: HTMLElement) {
  if (!content.childNodes.length) return;
  pages.push(Array.from(content.childNodes).map(nodeToHtml).join(''));
  content.replaceChildren();
}

export function paginateHtmlByHeight(html: string, ratio: PosterRatio, fontFamily: string) {
  if (typeof document === 'undefined') return [html];

  const { root, content } = createMeasureRoot(ratio, fontFamily);
  const pages: string[] = [];

  try {
    const nodes = normalizeHtml(html);

    nodes.forEach((node) => {
      if (
        node.nodeType === Node.ELEMENT_NODE &&
        (node as HTMLElement).matches('hr[data-explicit-break="true"]')
      ) {
        flushPage(pages, content);
        return;
      }

      if (appendAndMeasure(content, node)) return;

      if (paginateTableAcrossPages(node, content, pages)) return;
      if (paginateListAcrossPages(node, content, pages)) return;

      flushPage(pages, content);
      if (appendAndMeasure(content, node)) return;

      if (node.nodeType !== Node.ELEMENT_NODE) {
        content.appendChild(node.cloneNode(true));
        flushPage(pages, content);
        return;
      }

      const pieces = splitOversizedElement(cloneElement(node as Element), ratio);

      pieces.forEach((piece) => {
        if (appendAndMeasure(content, piece)) return;
        flushPage(pages, content);

        if (appendAndMeasure(content, piece)) return;

        piece.classList.add('poster-scale-down');
        content.appendChild(piece.cloneNode(true));
        flushPage(pages, content);
      });
    });

    flushPage(pages, content);
    return pages.length > 0 ? pages : [html];
  } finally {
    root.remove();
  }
}
