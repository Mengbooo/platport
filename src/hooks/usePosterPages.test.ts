import { describe, expect, it, vi } from 'vitest';
import { waitForImages } from './usePosterPages';

describe('waitForImages', () => {
  it('waits for images referenced by poster html before pagination can run', async () => {
    const pendingImages: Array<{ onload: (() => void) | null }> = [];

    vi.stubGlobal(
      'Image',
      class {
        onload: (() => void) | null = null;
        onerror: (() => void) | null = null;
        complete = false;

        set src(_value: string) {
          pendingImages.push(this);
        }
      },
    );

    let resolved = false;
    const promise = waitForImages('<p>Before</p><img src="https://example.com/a.png"><p>After</p>').then(() => {
      resolved = true;
    });

    await Promise.resolve();
    expect(resolved).toBe(false);
    expect(pendingImages).toHaveLength(1);

    pendingImages[0].onload?.();
    await promise;
    expect(resolved).toBe(true);

    vi.unstubAllGlobals();
  });
});
