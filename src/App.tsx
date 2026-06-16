import { Copy, ImageDown, LayoutGrid, Palette, Sparkles, Type, Upload, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import './App.css';
import { Button } from './components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './components/ui/select';
import { usePosterPages } from './hooks/usePosterPages';
import { exportPosterImages } from './lib/export';
import { getStats, markdownToHtml } from './lib/markdown';
import {
  CODE_THEMES,
  POSTER_PALETTES,
  POSTER_RATIOS,
  POSTER_THEMES,
  TYPEFACES,
  getCodeTheme,
  getDefaultPaletteId,
  getPosterPalette,
  getPosterTheme,
  getTheme,
} from './lib/themes';
import { APP_VERSION } from './lib/version';
import { buildMarkdown, useEditorStore } from './store/useEditorStore';
import type { CodeThemeId, PosterRatio, PosterThemeId, TypefaceId } from './types/editor';

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
    codeTheme,
    setNoteTitle,
    setNoteSummary,
    setNoteBody,
    setHashtags,
    setCoverImage,
    setPosterThemeId,
    setPosterPaletteId,
    setPosterRatio,
    setTypeface,
    setCodeTheme,
  } = useEditorStore();

  const [html, setHtml] = useState('');
  const [activePoster, setActivePoster] = useState(0);
  const [, setStatus] = useState('Ready');
  const posterRefs = useRef<Array<HTMLElement | null>>([]);
  const posterScrollRef = useRef<HTMLDivElement | null>(null);
  const coverInputRef = useRef<HTMLInputElement | null>(null);

  const articleTheme = getTheme(themeId);
  const posterTheme = getPosterTheme(posterThemeId);
  const availablePalettes = POSTER_PALETTES[posterThemeId];
  const effectivePaletteId = availablePalettes.some((item) => item.id === posterPaletteId)
    ? posterPaletteId
    : getDefaultPaletteId(posterThemeId);
  const palette = getPosterPalette(posterThemeId, effectivePaletteId);
  const codeColors = getCodeTheme(codeTheme, posterThemeId);
  const ratio = POSTER_RATIOS[posterRatio];
  const previewMaxWidth =
    viewportSize.width < 780
      ? viewportSize.width - 68
      : viewportSize.width <= 1180
        ? viewportSize.width - 420
        : viewportSize.width - 520;
  const previewMaxHeight = viewportSize.height - 96;
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

  const scrollPosterIntoView = useCallback((index: number) => {
    const scroller = posterScrollRef.current;
    const target = scroller?.querySelectorAll<HTMLElement>('.poster-shell')[index];
    if (!scroller || !target) return;

    scroller.scrollTo({
      left: Math.max(0, target.offsetLeft - (scroller.clientWidth - target.clientWidth) / 2),
      behavior: 'smooth',
    });
  }, []);

  useEffect(() => {
    scrollPosterIntoView(activeIndex);
  }, [activeIndex, posterPages.length, scrollPosterIntoView]);

  const focusPoster = (index: number) => {
    setActivePoster(index);
    scrollPosterIntoView(index);
    requestAnimationFrame(() => scrollPosterIntoView(index));
  };

  const markSaved = (nextStatus = 'Saved') => {
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
    '--poster-code-bg': codeColors.bg,
    '--poster-code-ink': codeColors.ink,
    '--poster-code-border': codeColors.border,
    '--poster-code-string': codeColors.string,
    '--poster-code-number': codeColors.number,
    '--poster-code-keyword': codeColors.keyword,
    '--poster-quote-bg': codeColors.quoteBg,
    '--poster-quote-ink': codeColors.quoteInk,
    '--poster-quote-border': codeColors.quoteBorder,
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
        onClick={() => focusPoster(index)}
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

      <section className="studio-grid">
        <section className="sidebar-column">
          <Card className="brand-card" size="sm">
            <CardContent className="brand-content">
              <div className="brand">
                <div className="brand-mark">
                  <Sparkles size={16} />
                </div>
                <div>
                  <strong>Platport</strong>
                  <span>v{APP_VERSION}</span>
                </div>
              </div>
            </CardContent>
          </Card>

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

              <label className="field-block settings-field template-field">
                <span>模板</span>
                <div className="field-control">
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
                </div>
              </label>

              <label className="field-block settings-field palette-field">
                <span>配色</span>
                <div className="field-control">
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
                </div>
              </label>

              <label className="field-block settings-field controls-field">
                <span>控制</span>
                <div className="field-control compact-fields">
                  <div className="select-field">
                    <LayoutGrid size={15} />
                    <Select
                      value={posterRatio}
                      onValueChange={(value) => {
                        setPosterRatio(value as PosterRatio);
                        setStatus('Ratio updated');
                      }}
                    >
                      <SelectTrigger className="select-trigger" aria-label="贴图比例">
                        <SelectValue placeholder="贴图比例" />
                      </SelectTrigger>
                      <SelectContent className="select-content" position="popper">
                        {Object.entries(POSTER_RATIOS).map(([id, item]) => (
                          <SelectItem key={id} value={id}>
                            {item.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="select-field">
                    <Type size={15} />
                    <Select
                      value={typeface}
                      onValueChange={(value) => {
                        setTypeface(value as TypefaceId);
                        setStatus('字体已更新');
                      }}
                    >
                      <SelectTrigger className="select-trigger" aria-label="卡片字体">
                        <SelectValue placeholder="卡片字体" />
                      </SelectTrigger>
                      <SelectContent className="select-content" position="popper">
                        {Object.entries(TYPEFACES).map(([id, item]) => (
                          <SelectItem key={id} value={id}>
                            {item.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="select-field">
                    <Palette size={15} />
                    <Select
                      value={codeTheme}
                      onValueChange={(value) => {
                        setCodeTheme(value as CodeThemeId);
                        setStatus('代码颜色已更新');
                      }}
                    >
                      <SelectTrigger className="select-trigger" aria-label="代码颜色主题">
                        <SelectValue placeholder="代码颜色" />
                      </SelectTrigger>
                      <SelectContent className="select-content" position="popper">
                        {Object.entries(CODE_THEMES).map(([id, item]) => (
                          <SelectItem key={id} value={id}>
                            {item.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </label>

              <label className="field-block settings-field cover-field">
                <span>封面</span>
                <div className="field-control">
                  <button
                    type="button"
                    className="cover-uploader"
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      coverInputRef.current?.click();
                    }}
                  >
                    <div className="cover-thumb" data-empty={!coverImage}>
                      {hasCoverImage ? <img src={coverImage} alt="" /> : <span>无图</span>}
                    </div>
                    <div>
                      <strong>{coverImage ? '替换封面图片' : '上传封面图片'}</strong>
                      <span>截图、产品图或海报背景</span>
                    </div>
                    <Upload size={18} />
                  </button>
                  {coverImage ? (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={(event) => {
                        event.preventDefault();
                        setCoverImage('');
                        setStatus('Default cover restored');
                      }}
                    >
                      <X size={15} />
                      移除
                    </Button>
                  ) : null}
                </div>
              </label>
              <input
                ref={coverInputRef}
                className="cover-input"
                type="file"
                accept="image/*"
                onChange={(event) => handleCoverUpload(event.target.files?.[0])}
              />

              <label className="field-block settings-field caption-field">
                <span>文案</span>
                <div className="field-control">
                  <div className="caption-copy-section">
                    <div className="caption-copy-field">
                      <div className="caption-copy-header">
                        <span>标题文案</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          aria-label="复制标题文案"
                          onClick={() => copyText(captionTitle, '标题已复制')}
                        >
                          <Copy size={14} />
                        </Button>
                      </div>
                      <div className="caption-copy-box">
                        <p>{captionTitle}</p>
                      </div>
                    </div>

                    <div className="caption-copy-field">
                      <div className="caption-copy-header">
                        <span>笔记文案</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          aria-label="复制笔记文案"
                          onClick={() => copyText(captionBody, '笔记文案已复制')}
                        >
                          <Copy size={14} />
                        </Button>
                      </div>
                      <div className="caption-copy-box">
                        {coverSummary ? <p>{coverSummary}</p> : null}
                        <div className="caption-tag-list">
                          {tags.slice(0, 8).map((tag) => (
                            <span key={tag}>{tag}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </label>

              <Button className="export-button" onClick={handleExportPosters}>
                <ImageDown size={15} />
                导出卡片
              </Button>
            </CardContent>
          </Card>
        </section>

        <section className="canvas-panel">
          <div className="canvas-toolbar">
            <div>
              <strong>{activeIndex + 1}/{posterPages.length}</strong>
              <span>{posterTheme.name} · {palette.name}</span>
            </div>
          </div>

          <div className="poster-stage">
            <div className="poster-scroll" ref={posterScrollRef}>
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
                onClick={() => focusPoster(index)}
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
