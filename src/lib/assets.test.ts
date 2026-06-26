import { describe, expect, it, vi } from 'vitest';
import { resolveLocalAssetUrls, saveLocalAsset } from './assets';

describe('local assets', () => {
  it('keeps markdown short and resolves local asset refs for rendering', async () => {
    vi.stubGlobal(
      'FileReader',
      class {
        result: string | null = null;
        onload: (() => void) | null = null;
        onerror: (() => void) | null = null;
        readAsDataURL() {
          this.result = 'data:image/png;base64,aGVsbG8=';
          this.onload?.();
        }
      },
    );

    const file = new File(['hello'], 'Component 56.png', { type: 'image/png' });
    const asset = await saveLocalAsset(file);

    expect(asset.url).toMatch(/^platport-asset:\/\/asset-/);
    expect(asset.url).not.toContain('base64');

    const markdown = `![${asset.name}](${asset.url})`;
    await expect(resolveLocalAssetUrls(markdown)).resolves.toContain(
      'data:image/png;base64,aGVsbG8=',
    );

    vi.unstubAllGlobals();
  });
});
