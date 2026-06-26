import { describe, expect, it } from 'vitest';
import { paginateHtmlByHeight } from './pagination';

describe('paginateHtmlByHeight', () => {
  it('returns rendered poster pages for ordinary content', () => {
    const html = '<h2>Title</h2><p>First paragraph.</p><p>Second paragraph.</p>';

    const pages = paginateHtmlByHeight(html, '3:4', 'Arial, sans-serif');

    expect(pages.length).toBeGreaterThan(0);
    expect(pages.join('')).toContain('First paragraph.');
  });
});
