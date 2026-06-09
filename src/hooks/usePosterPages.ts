import { useLayoutEffect, useState } from 'react';
import { paginateHtmlByHeight } from '../lib/pagination';
import type { PosterRatio } from '../types/editor';

export function usePosterPages(html: string, ratio: PosterRatio, fontFamily: string) {
  const [pages, setPages] = useState<string[]>([]);

  useLayoutEffect(() => {
    const frame = requestAnimationFrame(() => {
      setPages(html ? paginateHtmlByHeight(html, ratio, fontFamily) : []);
    });

    return () => cancelAnimationFrame(frame);
  }, [fontFamily, html, ratio]);

  return pages;
}
