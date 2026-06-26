import { describe, expect, it } from 'vitest';
import { markdownToHtml } from './markdown';

describe('markdownToHtml', () => {
  it('removes dangerous raw html before rendering', async () => {
    const html = await markdownToHtml(
      '<img src=x onerror="alert(1)"><script>alert(2)</script><a href="javascript:alert(3)">bad</a>',
    );

    expect(html).not.toContain('onerror');
    expect(html).not.toContain('<script');
    expect(html).not.toContain('javascript:');
  });

  it('keeps supported markdown features and poster table metadata', async () => {
    const html = await markdownToHtml(
      [
        '| A | B | C |',
        '| --- | --- | --- |',
        '| 1 | 2 | 3 |',
        '',
        '```ts',
        'const ok = true;',
        '```',
      ].join('\n'),
      { posterTables: true },
    );

    expect(html).toContain('class="poster-table"');
    expect(html).toContain('data-columns="3"');
    expect(html).toContain('class="hljs');
  });

  it('keeps local uploaded image data urls after file-size validation happens at upload', async () => {
    const html = await markdownToHtml('![local](data:image/png;base64,aGVsbG8=)');

    expect(html).toContain('src="data:image/png;base64,aGVsbG8="');
  });

  it('keeps unresolved local asset refs as short image urls', async () => {
    const html = await markdownToHtml('![local](platport-asset://asset-123)');

    expect(html).toContain('src="platport-asset://asset-123"');
  });
});
