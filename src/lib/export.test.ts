import { describe, expect, it } from 'vitest';
import { inlineComputedStyles } from './export';

describe('inlineComputedStyles', () => {
  it('normalizes images into full-width wechat-safe blocks', () => {
    const source = document.createElement('article');
    source.innerHTML = '<table><tbody><tr><td>A</td></tr></tbody></table><img width="720" height="360" src="https://example.com/a.png" alt="">';
    document.body.appendChild(source);

    const html = inlineComputedStyles(source);
    const template = document.createElement('template');
    template.innerHTML = html;
    const image = template.content.querySelector('img');
    const block = image?.parentElement;

    expect(block?.tagName).toBe('P');
    expect(block?.style.width).toBe('100%');
    expect(block?.style.clear).toBe('both');
    expect(block?.style.textAlign).toBe('center');
    expect(image?.getAttribute('width')).toBeNull();
    expect(image?.getAttribute('height')).toBeNull();
    expect(image?.style.width).toBe('100%');
    expect(image?.style.margin).toBe('0px auto');
    expect(image?.style.float).toBe('none');

    source.remove();
  });

  it('keeps paragraph line height on the block instead of inline text tags', () => {
    const source = document.createElement('article');
    source.innerHTML =
      '<p>普通段落 <strong>加粗文本</strong> <em>斜体文本</em> <del>删除线</del> <a href="#">链接</a></p>';
    document.body.appendChild(source);

    const html = inlineComputedStyles(source);
    const template = document.createElement('template');
    template.innerHTML = html;

    const paragraph = template.content.querySelector('p');
    expect(paragraph?.style.lineHeight).toBe('1.75');
    expect(paragraph?.style.width).toBe('');
    expect(paragraph?.style.height).toBe('');
    expect(template.content.querySelector('strong')?.style.lineHeight).not.toBe('inherit');
    expect(template.content.querySelector('a')?.style.lineHeight).not.toBe('inherit');

    source.remove();
  });
});
