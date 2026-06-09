import { Copy, ImageDown, LayoutGrid, Sparkles, Type, Upload, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import './App.css';
import { Button } from './components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { usePosterPages } from './hooks/usePosterPages';
import { exportPosterImages } from './lib/export';
import { getStats, markdownToHtml } from './lib/markdown';
import {
  POSTER_PALETTES,
  POSTER_RATIOS,
  POSTER_THEMES,
  TYPEFACES,
  getDefaultPaletteId,
  getPosterPalette,
  getPosterTheme,
  getTheme,
} from './lib/themes';
import { buildMarkdown, useEditorStore } from './store/useEditorStore';
import type { PosterRatio, PosterThemeId, TypefaceId } from './types/editor';

const GOOGLE_SANS_STACK =
  '"Google Sans", "Product Sans", "Noto Sans SC", "PingFang SC", "Hiragino Sans GB", Arial, sans-serif';

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') resolve(reader.result);
      else reject(new Error('Failed to read image'));
    };
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read image'));
    reader.readAsDataURL(file);
  });
}

function removeFirstHeading(html: string) {
  if (typeof document === 'undefined') {
    return html.replace(/<h1[\s\S]*?<\/h1>/i, '');
  }

  const template = document.createElement('template');
  template.innerHTML = html;
  template.content.querySelector('h1')?.remove();
  return template.innerHTML;
}

function formatClock() {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

function App() {
  const [viewportSize, setViewportSize] = useState(() => ({
    width: typeof window === 'undefined' ? 1440 : window.innerWidth,
    height: typeof window === 'undefined' ? 900 : window.innerHeight,
  }));
  const {
    noteTitle,
    noteSummary,
    noteBody,
    hashtags,
    coverImage,
    themeId,
    posterThemeId,
    posterPaletteId,
    posterRatio,
    typeface,
    setNoteTitle,
    setNoteSummary,
    setNoteBody,
    setHashtags,
    setCoverImage,
    setPosterThemeId,
    setPosterPaletteId,
    setPosterRatio,
    setTypeface,
  } = useEditorStore();

  const [html, setHtml] = useState('');
  const [activePoster, setActivePoster] = useState(0);
  const [status, setStatus] = useState('Ready');
  const [savedAt, setSavedAt] = useState(formatClock);
  const posterRefs = useRef<Array<HTMLElement | null>>([]);

  const articleTheme = getTheme(themeId);
  const posterTheme = getPosterTheme(posterThemeId);
  const availablePalettes = POSTER_PALETTES[posterThemeId];
  const effectivePaletteId = availablePalettes.some((item) => item.id === posterPaletteId)
    ? posterPaletteId
    : getDefaultPaletteId(posterThemeId);
  const palette = getPosterPalette(posterThemeId, effectivePaletteId);
  const ratio = POSTER_RATIOS[posterRatio];
  const previewMaxWidth =
    viewportSize.width < 780
      ? viewportSize.width - 68
      : viewportSize.width <= 1180
        ? viewportSize.width - 420
        : viewportSize.width - 520;
  const previewMaxHeight = viewportSize.height - 150;
  const preferredPreviewWidth = posterRatio === '9:16' ? 430 : 520;
  const basePreviewWidth = Math.max(
    320,
    Math.min(
      preferredPreviewWidth,
      previewMaxWidth,
      Math.floor((previewMaxHeight * ratio.width) / ratio.height),
    ),
  );
  const previewWidth = Math.max(220, Math.round(basePreviewWidth * 0.68));
  const previewScale = previewWidth / ratio.width;
  const previewHeight = Math.round(ratio.height * previewScale);
  const typefaceValue = TYPEFACES[typeface]?.value ?? GOOGLE_SANS_STACK;
  const markdown = useMemo(() => buildMarkdown(noteTitle, noteBody), [noteTitle, noteBody]);
  const stats = useMemo(() => getStats(markdown), [markdown]);
  const coverSummary = noteSummary.trim();
  const contentHtml = useMemo(() => removeFirstHeading(html), [html]);
  const contentPages = usePosterPages(contentHtml, posterRatio, typefaceValue);
  const posterPages = useMemo(() => ['__cover__', ...contentPages], [contentPages]);
  const activeIndex = Math.min(activePoster, Math.max(0, posterPages.length - 1));
  const hasCoverImage = Boolean(coverImage);
  const tags = hashtags
    .split(/\s+/)
    .map((tag) => tag.trim())
    .filter(Boolean);
  const captionTitle = noteTitle.trim();
  const captionBody = [coverSummary, tags.join('\n')].filter(Boolean).join('\n\n');

  useEffect(() => {
    let cancelled = false;
    markdownToHtml(markdown).then((nextHtml) => {
      if (!cancelled) setHtml(nextHtml);
    });
    return () => {
      cancelled = true;
    };
  }, [markdown]);

  useEffect(() => {
    const handleResize = () => {
      setViewportSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    posterRefs.current[activeIndex]?.scrollIntoView({
      block: 'nearest',
      inline: 'center',
      behavior: 'smooth',
    });
  }, [activeIndex, posterPages.length]);

  const markSaved = (nextStatus = 'Saved') => {
    setSavedAt(formatClock());
    setStatus(nextStatus);
  };

  const handleThemeChange = (nextThemeId: PosterThemeId) => {
    setPosterThemeId(nextThemeId);
    setPosterPaletteId(getDefaultPaletteId(nextThemeId));
    setStatus('Theme updated');
  };

  const handleCoverUpload = async (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setStatus('请选择图片文件');
      return;
    }

    try {
      const dataUrl = await readFileAsDataUrl(file);
      setCoverImage(dataUrl);
      setActivePoster(0);
      setStatus('Cover updated');
    } catch {
      setStatus('封面图片读取失败');
    }
  };

  const handleExportPosters = async () => {
    const nodes = posterRefs.current.filter(Boolean) as HTMLElement[];
    if (nodes.length === 0) return;
    setStatus('Exporting');
    try {
      await exportPosterImages(nodes);
      setStatus('ZIP generated');
    } catch {
      setStatus('导出失败，请稍后再试');
    }
  };

  const copyText = async (text: string, nextStatus: string) => {
    const value = text.trim();
    if (!value) return;
    await navigator.clipboard.writeText(value);
    setStatus(nextStatus);
  };

  const previewStyle = {
    '--poster-bg': palette.bg,
    '--poster-frame': palette.frame,
    '--poster-ink': palette.ink,
    '--poster-muted': palette.muted,
    '--poster-accent': palette.accent,
    '--poster-border': palette.border,
    '--poster-surface': palette.surface,
    '--poster-image-bg': palette.imageBackdrop,
    '--poster-width': `${ratio.width}px`,
    '--poster-height': `${ratio.height}px`,
    '--typeface': typefaceValue,
  } as CSSProperties;

  const renderPosterCard = (page: string, index: number, preview = false) => {
    const isCover = index === 0;
    return (
      <article
        key={`${posterThemeId}-${posterPaletteId}-${posterRatio}-${index}-${preview ? 'preview' : 'export'}`}
        ref={
          preview
            ? undefined
            : (node) => {
                posterRefs.current[index] = node;
              }
        }
        className="poster-card"
        data-theme={posterThemeId}
        data-cover={isCover}
        data-active={index === activeIndex}
        onClick={() => setActivePoster(index)}
        style={{ aspectRatio: `${ratio.width} / ${ratio.height}` }}
      >
        {isCover ? (
          <div className="cover-layout" data-empty={!hasCoverImage}>
            {hasCoverImage ? (
              <div className="cover-media">
                <img src={coverImage} alt="" />
              </div>
            ) : null}
            <div className="cover-copy">
              <span className="cover-meta">
                全文{stats.characters}字 | 阅读需{stats.readingMinutes}分钟
              </span>
              <h2>{noteTitle}</h2>
              {coverSummary ? <p>{coverSummary}</p> : null}
            </div>
          </div>
        ) : (
          <div
            id="chicpage"
            className="poster-content"
            style={{ fontFamily: typefaceValue }}
            dangerouslySetInnerHTML={{ __html: page }}
          />
        )}
      </article>
    );
  };

  return (
    <main className="app-shell" style={previewStyle}>
      <style>{articleTheme.css}</style>

      <header className="studio-header">
        <div className="brand">
          <div className="brand-mark">
            <Sparkles size={16} />
          </div>
          <div>
            <strong>Platport</strong>
            <span>{posterPages.length} cards · {status} · {savedAt}</span>
          </div>
        </div>
      </header>

      <section className="studio-grid">
        <Card className="editor-panel" size="sm">
          <CardHeader>
            <CardTitle>草稿 / 控制台</CardTitle>
            <CardDescription>{stats.characters} 字 · {stats.readingMinutes} 分钟</CardDescription>
          </CardHeader>
          <CardContent className="editor-content">
            <label className="field-block title-field">
              <span>标题</span>
              <input
                value={noteTitle}
                maxLength={90}
                onChange={(event) => {
                  setNoteTitle(event.target.value);
                  markSaved();
                }}
              />
            </label>

            <label className="field-block summary-field">
              <span>摘要</span>
              <textarea
                value={noteSummary}
                maxLength={180}
                onChange={(event) => {
                  setNoteSummary(event.target.value);
                  markSaved();
                }}
                spellCheck={false}
              />
            </label>

            <label className="field-block tags-field">
              <span>标签</span>
              <input
                value={hashtags}
                onChange={(event) => {
                  setHashtags(event.target.value);
                  markSaved();
                }}
                placeholder="#小红书 #AI"
              />
            </label>

            <label className="field-block body-field">
              <span>Markdown 正文</span>
              <textarea
                value={noteBody}
                onChange={(event) => {
                  setNoteBody(event.target.value);
                  markSaved();
                }}
                spellCheck={false}
              />
            </label>

            <div className="settings-stack embedded-settings">
              <section className="settings-section">
                <span className="section-label">模板</span>
                <div className="theme-list">
                  {POSTER_THEMES.map((theme) => (
                    <button
                      key={theme.id}
                      type="button"
                      className="theme-row"
                      data-active={theme.id === posterThemeId}
                      onClick={() => handleThemeChange(theme.id)}
                    >
                      <span className="theme-swatch" data-theme={theme.id} />
                      <span>
                        <strong>{theme.name}</strong>
                        <small>{theme.description}</small>
                      </span>
                    </button>
                  ))}
                </div>
              </section>

              <section className="settings-section">
                <span className="section-label">配色</span>
                <div className="palette-list">
                  {availablePalettes.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className="palette-card"
                      data-active={item.id === effectivePaletteId}
                      onClick={() => {
                        setPosterPaletteId(item.id);
                        setStatus(`${item.name} applied`);
                      }}
                      title={item.name}
                      aria-label={`配色 ${item.name}`}
                    >
                      <span className="palette-swatch" style={{ background: item.preview }} />
                      <span>
                        <strong>{item.name}</strong>
                        <small>{item.description}</small>
                      </span>
                    </button>
                  ))}
                </div>
              </section>

              <section className="settings-section compact-fields">
                <span className="section-label">控制</span>
                <label className="select-field">
                  <LayoutGrid size={15} />
                  <select
                    value={posterRatio}
                    onChange={(event) => {
                      setPosterRatio(event.target.value as PosterRatio);
                      setStatus('Ratio updated');
                    }}
                    aria-label="贴图比例"
                  >
                    {Object.entries(POSTER_RATIOS).map(([id, item]) => (
                      <option key={id} value={id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="select-field">
                  <Type size={15} />
                  <select
                    value={typeface}
                    onChange={(event) => {
                      setTypeface(event.target.value as TypefaceId);
                      setStatus('字体已更新');
                    }}
                    aria-label="卡片字体"
                  >
                    {Object.entries(TYPEFACES).map(([id, item]) => (
                      <option key={id} value={id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </label>
              </section>

              <section className="settings-section">
                <span className="section-label">封面</span>
                <label className="cover-uploader">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(event) => handleCoverUpload(event.target.files?.[0])}
                  />
                  <div className="cover-thumb" data-empty={!coverImage}>
                    {hasCoverImage ? <img src={coverImage} alt="" /> : <span>无图</span>}
                  </div>
                  <div>
                    <strong>{coverImage ? '替换封面图片' : '上传封面图片'}</strong>
                    <span>截图、产品图或海报背景</span>
                  </div>
                  <Upload size={18} />
                </label>
                {coverImage ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setCoverImage('');
                      setStatus('Default cover restored');
                    }}
                  >
                    <X size={15} />
                    移除
                  </Button>
                ) : null}
              </section>

              <section className="settings-section">
                <span className="section-label">文案</span>
                <div className="caption-copy-section">
                  <div className="caption-copy-card">
                    <div className="caption-copy-header">
                      <span>标题文案</span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => copyText(captionTitle, '标题已复制')}
                      >
                        <Copy size={14} />
                        复制
                      </Button>
                    </div>
                    <p>{captionTitle}</p>
                  </div>

                  <div className="caption-copy-card">
                    <div className="caption-copy-header">
                      <span>摘要和标签</span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => copyText(captionBody, '摘要和标签已复制')}
                      >
                        <Copy size={14} />
                        复制
                      </Button>
                    </div>
                    {coverSummary ? <p>{coverSummary}</p> : null}
                    <div className="caption-tag-list">
                      {tags.slice(0, 8).map((tag) => (
                        <span key={tag}>{tag}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </section>

              <Button className="export-button" onClick={handleExportPosters}>
                <ImageDown size={15} />
                导出卡片
              </Button>
            </div>
          </CardContent>
        </Card>

        <section className="canvas-panel">
          <div className="canvas-toolbar">
            <div>
              <strong>{activeIndex + 1}/{posterPages.length}</strong>
              <span>{posterTheme.name} · {palette.name}</span>
            </div>
          </div>

          <div className="poster-stage">
            <div className="poster-scroll">
              {posterPages.map((page, index) => (
                <div key={`poster-shell-${index}`} className="poster-shell">
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  <div
                    className="poster-preview-frame"
                    style={{ width: previewWidth, height: previewHeight }}
                  >
                    <div
                      className="poster-preview-scale"
                      style={{ transform: `scale(${previewScale})` }}
                    >
                      {renderPosterCard(page, index)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="thumb-strip">
            {posterPages.map((_, index) => (
              <button
                key={index}
                type="button"
                data-active={index === activeIndex}
                onClick={() => setActivePoster(index)}
                aria-label={`第 ${index + 1} 张`}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </section>

      </section>
    </main>
  );
}

export default App;
