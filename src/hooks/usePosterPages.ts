import { useLayoutEffect, useState } from 'react';
import { paginateHtmlByHeight } from '../lib/pagination';
import type { PosterRatio } from '../types/editor';

export const IMAGE_WAIT_TIMEOUT_MS = 1800;

function getImageSources(html: string) {
  const template = document.createElement('template');
  template.innerHTML = html;
  return Array.from(template.content.querySelectorAll('img'))
    .map((image) => image.currentSrc || image.src || image.getAttribute('src') || '')
    .filter(Boolean);
}

function waitForImage(source: string) {
  return new Promise<void>((resolve) => {
    const image = new Image();
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      resolve();
    };
    const timer = window.setTimeout(finish, IMAGE_WAIT_TIMEOUT_MS);
    image.onload = finish;
    image.onerror = finish;
    image.src = source;
    if (image.complete) finish();
  });
}

export async function waitForImages(html: string) {
  const sources = getImageSources(html);
  if (sources.length === 0) return;
  await Promise.all(sources.map(waitForImage));
}

export function usePosterPages(html: string, ratio: PosterRatio, fontFamily: string) {
  const [pages, setPages] = useState<string[]>([]);

  useLayoutEffect(() => {
    let cancelled = false;
    const frame = requestAnimationFrame(() => {
      if (!html) {
        setPages([]);
        return;
      }

      setPages([]);
      waitForImages(html).then(() => {
        if (cancelled) return;
        setPages(paginateHtmlByHeight(html, ratio, fontFamily));
      });
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
    };
  }, [fontFamily, html, ratio]);

  return pages;
}
