import {
  BookOpen,
  Bold,
  Braces,
  Clipboard,
  Copy,
  Download,
  Eye,
  FileText,
  Hash,
  Heading1,
  Heading2,
  ImageDown,
  ImagePlus,
  LayoutGrid,
  List,
  ListChecks,
  Paperclip,
  Palette,
  Pencil,
  Quote,
  Sparkles,
  Table2,
  Type,
  Undo2,
  Upload,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import './App.css';
import { IPhoneMockup } from './components/IPhoneMockup';
import { MarkdownCodeEditor } from './components/MarkdownCodeEditor';
import type { MarkdownEditorMethods } from './components/MarkdownCodeEditor';
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
import { resolveLocalAssetUrls, saveLocalAsset } from './lib/assets';
import { copyRichHtml, exportHtml, exportMarkdown, exportPosterImages } from './lib/export';
import { getStats, markdownToHtml } from './lib/markdown';
import {
  CODE_THEMES,
  FORMAT_THEMES,
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
const MAX_IMAGE_FILE_SIZE = 2 * 1024 * 1024;
const MAX_ATTACHMENT_FILE_SIZE = 768 * 1024;

type WorkspaceId = 'markdown' | 'xiaohongshu' | 'wechat';
type MarkdownViewMode = 'edit' | 'preview';

const WORKSPACES: Array<{
  id: WorkspaceId;
  name: string;
  description: string;
  icon: typeof FileText;
}> = [
  { id: 'markdown', name: 'MD', description: 'Markdown 编辑器', icon: FileText },
  { id: 'xiaohongshu', name: '小红书', description: '小红书内容', icon: Hash },
  { id: 'wechat', name: '公众号', description: '公众号内容', icon: BookOpen },
];

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

function isWithinFileLimit(file: File, maxSize: number) {
  return file.size <= maxSize;
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
  const [activeWorkspace, setActiveWorkspace] = useState<WorkspaceId>('markdown');
  const [markdownViewMode, setMarkdownViewMode] = useState<MarkdownViewMode>('edit');
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
    canUndo,
    setNoteTitle,
    setNoteSummary,
    setNoteBody,
    setHashtags,
    setCoverImage,
    pushHistory,
    undo,
    setThemeId,
    setPosterThemeId,
    setPosterPaletteId,
    setPosterRatio,
    setTypeface,
    setCodeTheme,
  } = useEditorStore();

  const [html, setHtml] = useState('');
  const [posterHtml, setPosterHtml] = useState('');
  const [activePoster, setActivePoster] = useState(0);
  const [wechatTypeface, setWechatTypeface] = useState<TypefaceId>('system');
  const [, setStatus] = useState('Ready');
  const posterRefs = useRef<Array<HTMLElement | null>>([]);
  const posterScrollRef = useRef<HTMLDivElement | null>(null);
  const coverInputRef = useRef<HTMLInputElement | null>(null);
  const wechatImageInputRef = useRef<HTMLInputElement | null>(null);
  const wechatImageAnchorRef = useRef('');
  const wechatAnchorElementRef = useRef<Element | null>(null);
  const wechatBodyCursorRef = useRef<number | null>(null);
  const wechatBodyTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const markdownImageInputRef = useRef<HTMLInputElement | null>(null);
  const markdownFileInputRef = useRef<HTMLInputElement | null>(null);
  const markdownEditorRef = useRef<MarkdownEditorMethods | null>(null);
  const markdownPreviewRef = useRef<HTMLDivElement | null>(null);
  const wechatPreviewRef = useRef<HTMLElement | null>(null);

  const articleTheme = getTheme(themeId);
  const articleThemeCss = useMemo(
    () => `${articleTheme.css.replace(/\.platport-content/g, '.article-style-scope .platport-content')}
      .article-style-scope .platport-content {
        --format-font: var(--article-font);
        --format-heading: var(--article-heading);
        --format-code-bg: var(--article-code-bg);
        --format-code-ink: var(--article-code-ink);
        --format-code-border: var(--article-code-border);
      }`,
    [articleTheme.css],
  );
  const activeWorkspaceConfig =
    WORKSPACES.find((workspace) => workspace.id === activeWorkspace) ?? WORKSPACES[0];
  const posterTheme = getPosterTheme(posterThemeId);
  const availablePalettes = POSTER_PALETTES[posterThemeId];
  const effectivePaletteId = availablePalettes.some((item) => item.id === posterPaletteId)
    ? posterPaletteId
    : getDefaultPaletteId(posterThemeId);
  const palette = getPosterPalette(posterThemeId, effectivePaletteId);
  const codeColors = getCodeTheme(codeTheme, posterThemeId);
  const articleCodeColors = codeTheme === 'auto' ? null : codeColors;
  const ratio = POSTER_RATIOS[posterRatio];
  const phonePreviewMaxWidth =
    viewportSize.width < 780
      ? Math.max(280, viewportSize.width - 56)
      : viewportSize.width <= 1180
        ? Math.max(320, viewportSize.width - 520)
        : 390;
  const phonePreviewWidth = Math.round(
    Math.max(300, Math.min(390, phonePreviewMaxWidth, (viewportSize.height - 150) * 0.49)),
  );
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
  const wechatTypefaceValue = TYPEFACES[wechatTypeface]?.value ?? GOOGLE_SANS_STACK;
  const markdown = useMemo(() => buildMarkdown(noteTitle, noteBody), [noteTitle, noteBody]);
  const stats = useMemo(() => getStats(markdown), [markdown]);
  const coverSummary = noteSummary.trim();
  const articleHtml = useMemo(() => removeFirstHeading(html), [html]);
  const posterContentHtml = useMemo(() => removeFirstHeading(posterHtml), [posterHtml]);
  const contentPages = usePosterPages(posterContentHtml, posterRatio, typefaceValue);
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
    resolveLocalAssetUrls(markdown).then((resolvedMarkdown) =>
      Promise.all([
        markdownToHtml(resolvedMarkdown),
        markdownToHtml(resolvedMarkdown, { posterTables: true }),
      ]),
    ).then(([nextHtml, nextPosterHtml]) => {
        if (cancelled) return;
        setHtml(nextHtml);
        setPosterHtml(nextPosterHtml);
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

  const saveEditorHistory = useCallback(() => {
    pushHistory();
  }, [pushHistory]);

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
    if (!isWithinFileLimit(file, MAX_IMAGE_FILE_SIZE)) {
      setStatus('图片不能超过 2MB');
      return;
    }

    try {
      const dataUrl = await readFileAsDataUrl(file);
      saveEditorHistory();
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

  const insertMarkdown = (snippet: string) => {
    saveEditorHistory();
    markdownEditorRef.current?.insertMarkdown(snippet);
    setStatus('Markdown updated');
  };

  const wrapMarkdownSelection = (before: string, after = before) => {
    saveEditorHistory();
    markdownEditorRef.current?.wrapSelection(before, after);
    setStatus('Markdown updated');
  };

  const insertMarkdownLinePrefix = (prefix: string) => {
    saveEditorHistory();
    markdownEditorRef.current?.insertAtLineStart(prefix);
    setStatus('Markdown updated');
  };

  const insertMarkdownAsset = async (file?: File) => {
    if (!file) return;
    if (!isWithinFileLimit(file, file.type.startsWith('image/') ? MAX_IMAGE_FILE_SIZE : MAX_ATTACHMENT_FILE_SIZE)) {
      setStatus(file.type.startsWith('image/') ? '图片不能超过 2MB' : '文件不能超过 768KB');
      return;
    }

    try {
      const safeName = file.name.replace(/[[\]()]/g, '-');
      const asset = await saveLocalAsset(file);
      const markdownAsset = file.type.startsWith('image/')
        ? `![${safeName}](${asset.url})`
        : `[${safeName}](${asset.url})`;
      saveEditorHistory();
      markdownEditorRef.current?.insertAtCursor(`\n\n${markdownAsset}\n\n`);
      setStatus(file.type.startsWith('image/') ? '图片已插入' : '文件已插入');
      setMarkdownViewMode('edit');
    } catch {
      setStatus('文件读取失败');
    }
  };

  const insertWechatImage = async (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setStatus('请选择图片文件');
      return;
    }
    if (!isWithinFileLimit(file, MAX_IMAGE_FILE_SIZE)) {
      setStatus('图片不能超过 2MB');
      return;
    }

    try {
      const safeName = file.name.replace(/[[\]()]/g, '-');
      const asset = await saveLocalAsset(file);
      const imageMarkdown = `\n\n![${safeName}](${asset.url})\n`;
      const cursor = wechatBodyCursorRef.current;
      const anchor = wechatImageAnchorRef.current;
      const index = anchor ? noteBody.indexOf(anchor) : -1;
      const nextBody =
        typeof cursor === 'number'
          ? `${noteBody.slice(0, cursor)}${imageMarkdown}${noteBody.slice(cursor)}`
          : index >= 0
          ? `${noteBody.slice(0, index + anchor.length)}${imageMarkdown}${noteBody.slice(index + anchor.length)}`
          : `${noteBody.trim()}${imageMarkdown}`;
      saveEditorHistory();
      setNoteBody(nextBody);
      wechatImageAnchorRef.current = '';
      wechatBodyCursorRef.current = null;
      wechatAnchorElementRef.current?.classList.remove('wechat-insert-anchor');
      wechatAnchorElementRef.current = null;
      setStatus('图片已插入');
    } catch {
      setStatus('图片读取失败');
    }
  };

  const insertMarkdownPastedFiles = async (files: File[]) => {
    const imageFiles = files.filter((file) => file.type.startsWith('image/'));
    if (imageFiles.length === 0) return false;

    const oversized = imageFiles.find((file) => !isWithinFileLimit(file, MAX_IMAGE_FILE_SIZE));
    if (oversized) {
      setStatus('图片不能超过 2MB');
      return true;
    }

    try {
      const assets = await Promise.all(
        imageFiles.map(async (file) => {
          const asset = await saveLocalAsset(file);
          const safeName = file.name.replace(/[[\]()]/g, '-') || 'clipboard-image.png';
          return `![${safeName}](${asset.url})`;
        }),
      );
      saveEditorHistory();
      markdownEditorRef.current?.insertAtCursor(`\n\n${assets.join('\n\n')}\n\n`);
      setStatus('图片已插入');
      return true;
    } catch {
      setStatus('图片读取失败');
      return true;
    }
  };

  const captureWechatImageAnchor = () => {
    const selection = window.getSelection();
    const anchorNode = selection?.anchorNode;
    const selectedText =
      anchorNode && wechatPreviewRef.current?.contains(anchorNode)
        ? selection?.toString().trim()
        : '';
    if (selectedText) wechatImageAnchorRef.current = selectedText;
  };

  const prepareWechatImageUpload = () => {
    const textarea = wechatBodyTextareaRef.current;
    if (textarea && document.activeElement === textarea) {
      saveWechatBodyCursor(textarea);
      return;
    }
    captureWechatImageAnchor();
  };

  const saveWechatBodyCursor = (textarea: HTMLTextAreaElement) => {
    wechatBodyCursorRef.current = textarea.selectionStart;
    wechatImageAnchorRef.current = '';
  };

  const saveWechatPreviewAnchor = (target: EventTarget | null) => {
    wechatBodyCursorRef.current = null;
    const selection = window.getSelection();
    const anchorNode = selection?.anchorNode;
    const selectedText =
      anchorNode && wechatPreviewRef.current?.contains(anchorNode)
        ? selection?.toString().trim()
        : '';
    const element = target instanceof Element ? target : null;
    const block = element?.closest('p, li, h2, h3, h4, blockquote, pre');
    const inContent = Boolean(block?.closest('.wechat-preview-content'));

    wechatAnchorElementRef.current?.classList.remove('wechat-insert-anchor');
    if (block && inContent) {
      block.classList.add('wechat-insert-anchor');
      wechatAnchorElementRef.current = block;
    } else {
      wechatAnchorElementRef.current = null;
    }

    if (selectedText && inContent) {
      wechatImageAnchorRef.current = selectedText;
      return;
    }

    wechatImageAnchorRef.current =
      block && inContent && wechatPreviewRef.current?.contains(block)
        ? block.textContent?.trim() ?? ''
        : '';
  };

  const undoWechatImageInsert = () => {
    undo();
    setStatus('已回退插图');
  };

  const copyMarkdownHtml = async () => {
    if (!markdownPreviewRef.current) return;
    await copyRichHtml(markdownPreviewRef.current);
    setStatus('HTML copied');
  };

  const exportMarkdownHtml = () => {
    if (!markdownPreviewRef.current) return;
    exportHtml(markdownPreviewRef.current);
    setStatus('HTML exported');
  };

  const createWechatExportNode = () => {
    if (!wechatPreviewRef.current) return null;
    const node = wechatPreviewRef.current.cloneNode(true) as HTMLElement;
    node.classList.remove('wechat-phone-article');
    node.classList.add('wechat-export-article');
    node.querySelectorAll('.wechat-insert-anchor').forEach((item) => {
      item.classList.remove('wechat-insert-anchor');
    });
    node.querySelector('.wechat-article-header h1')?.remove();
    node.querySelector('.wechat-article-meta')?.remove();
    const header = node.querySelector('.wechat-article-header');
    if (header && !header.textContent?.trim()) header.remove();
    node.style.cssText =
      'position:fixed;left:-10000px;top:0;width:677px;pointer-events:none;';
    (document.querySelector('.app-shell') ?? document.body).appendChild(node);
    return node;
  };

  const wechatRootCss =
    'position:static;left:auto;top:auto;pointer-events:auto;box-sizing:border-box;width:100%;max-width:677px;height:auto;min-height:0;margin:0 auto;padding:24px 22px 32px;overflow:visible;border-radius:0;box-shadow:none;opacity:1;font-size:15px;line-height:1.8;';

  const copyWechatHtml = async () => {
    const node = createWechatExportNode();
    if (!node) return;
    try {
      await copyRichHtml(node, { rootCssText: wechatRootCss });
      setStatus('公众号 HTML copied');
    } finally {
      node.remove();
    }
  };

  const exportWechatHtml = () => {
    const node = createWechatExportNode();
    if (!node) return;
    exportHtml(node, { rootCssText: wechatRootCss });
    node.remove();
    setStatus('公众号 HTML exported');
  };

  const previewStyle = {
    '--article-bg': articleTheme.tokens.bg,
    '--article-paper': articleTheme.tokens.paper,
    '--article-ink': articleTheme.tokens.ink,
    '--article-muted': articleTheme.tokens.muted,
    '--article-faint': articleTheme.tokens.faint,
    '--article-border': articleTheme.tokens.border,
    '--article-font': wechatTypefaceValue,
    '--article-heading': wechatTypefaceValue,
    '--article-code-bg': articleCodeColors?.bg ?? articleTheme.tokens.codeBg,
    '--article-code-ink': articleCodeColors?.ink ?? articleTheme.tokens.codeInk,
    '--article-code-border': articleCodeColors?.border ?? articleTheme.tokens.border,
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
    '--phone-preview-width': `${phonePreviewWidth}px`,
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
            className="poster-content poster-rich-content"
            style={{ fontFamily: typefaceValue }}
            dangerouslySetInnerHTML={{ __html: page }}
          />
        )}
      </article>
    );
  };

  return (
    <main className="app-shell" style={previewStyle}>
      <style>{articleThemeCss}</style>

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

          <div className="control-shell">
            <nav className="workspace-sidebar" aria-label="内容类型">
              {WORKSPACES.map((workspace) => {
                const Icon = workspace.icon;
                return (
                  <button
                    key={workspace.id}
                    type="button"
                    data-active={workspace.id === activeWorkspace}
                    onClick={() => setActiveWorkspace(workspace.id)}
                    aria-label={workspace.description}
                  >
                    <Icon size={17} />
                    <span>{workspace.name}</span>
                  </button>
                );
              })}
            </nav>

            <Card className="editor-panel" size="sm">
              <CardHeader>
                <CardTitle>{activeWorkspaceConfig.description}</CardTitle>
                <CardDescription>{stats.characters} 字 · {stats.readingMinutes} 分钟</CardDescription>
              </CardHeader>
              <CardContent className="editor-content">
              {activeWorkspace === 'markdown' ? (
                <>
                  <section className="action-section">
                    <span>插入</span>
                    <div className="md-action-grid">
                      <Button className="md-action-button" variant="outline" size="sm" onClick={() => insertMarkdown('# 一级标题')}>
                        <Heading1 size={14} />
                        H1
                      </Button>
                      <Button className="md-action-button" variant="outline" size="sm" onClick={() => insertMarkdown('## 二级标题')}>
                        <Heading2 size={14} />
                        H2
                      </Button>
                      <Button className="md-action-button" variant="outline" size="sm" onClick={() => wrapMarkdownSelection('**')}>
                        <Bold size={14} />
                        加粗
                      </Button>
                      <Button className="md-action-button" variant="outline" size="sm" onClick={() => insertMarkdown('> 引用内容')}>
                        <Quote size={14} />
                        引用
                      </Button>
                      <Button className="md-action-button" variant="outline" size="sm" onClick={() => insertMarkdownLinePrefix('- ')}>
                        <List size={14} />
                        列表
                      </Button>
                      <Button className="md-action-button" variant="outline" size="sm" onClick={() => insertMarkdownLinePrefix('- [ ] ')}>
                        <ListChecks size={14} />
                        待办
                      </Button>
                      <Button className="md-action-button" variant="outline" size="sm" onClick={() => insertMarkdown('```ts\nconst card = render(markdown)\n```')}>
                        <Braces size={14} />
                        代码
                      </Button>
                      <Button className="md-action-button" variant="outline" size="sm" onClick={() => insertMarkdown('| 项目 | 说明 |\n| --- | --- |\n| 示例 | 内容 |')}>
                        <Table2 size={14} />
                        表格
                      </Button>
                      <Button className="md-action-button" variant="outline" size="sm" onClick={() => markdownImageInputRef.current?.click()}>
                        <ImagePlus size={14} />
                        图片
                      </Button>
                      <Button className="md-action-button" variant="outline" size="sm" onClick={() => markdownFileInputRef.current?.click()}>
                        <Paperclip size={14} />
                        文件
                      </Button>
                    </div>
                  </section>

                  <section className="action-section">
                    <span>输出</span>
                    <div className="md-action-grid">
                      <Button className="md-action-button" variant="outline" size="sm" onClick={() => copyText(markdown, 'Markdown copied')}>
                        <Clipboard size={14} />
                        复制 MD
                      </Button>
                      <Button className="md-action-button" variant="outline" size="sm" onClick={copyMarkdownHtml}>
                        <Copy size={14} />
                        复制 HTML
                      </Button>
                      <Button className="md-action-button" variant="outline" size="sm" onClick={() => exportMarkdown(markdown)}>
                        <Download size={14} />
                        导出 MD
                      </Button>
                      <Button className="md-action-button" variant="outline" size="sm" onClick={exportMarkdownHtml}>
                        <FileText size={14} />
                        导出 HTML
                      </Button>
                    </div>
                  </section>
                </>
              ) : null}

              {activeWorkspace === 'wechat' ? (
                <>
                  <label className="field-block title-field">
                    <span>标题</span>
                    <input
                      value={noteTitle}
                      maxLength={90}
                      onFocus={saveEditorHistory}
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
                      onFocus={saveEditorHistory}
                      onChange={(event) => {
                        setNoteSummary(event.target.value);
                        markSaved();
                      }}
                      spellCheck={false}
                    />
                  </label>

                  <label className="field-block body-field markdown-body-field">
                    <span>公众号正文</span>
                    <textarea
                      ref={wechatBodyTextareaRef}
                      value={noteBody}
                      onClick={(event) => saveWechatBodyCursor(event.currentTarget)}
                      onFocus={saveEditorHistory}
                      onKeyUp={(event) => saveWechatBodyCursor(event.currentTarget)}
                      onSelect={(event) => saveWechatBodyCursor(event.currentTarget)}
                      onChange={(event) => {
                        setNoteBody(event.target.value);
                        saveWechatBodyCursor(event.target);
                        markSaved();
                      }}
                      spellCheck={false}
                    />
                  </label>

                  <div className="field-block settings-field template-field">
                    <span>模板</span>
                    <div className="field-control">
                      <div className="theme-list">
                        {FORMAT_THEMES.map((theme) => (
                          <button
                            key={theme.id}
                            type="button"
                            className="theme-row"
                            data-active={theme.id === themeId}
                            onClick={() => {
                              setThemeId(theme.id);
                              setStatus(`${theme.name} applied`);
                            }}
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
                  </div>

                  <div className="field-block settings-field controls-field">
                    <span>控制</span>
                    <div className="field-control compact-fields">
                      <div className="select-field">
                        <Type size={15} />
                        <Select
                          value={wechatTypeface}
                          onValueChange={(value) => {
                            setWechatTypeface(value as TypefaceId);
                            setStatus('字体已更新');
                          }}
                        >
                          <SelectTrigger className="select-trigger" aria-label="公众号字体">
                            <SelectValue placeholder="公众号字体" />
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
                        <Braces size={15} />
                        <Select
                          value={codeTheme}
                          onValueChange={(value) => {
                            setCodeTheme(value as CodeThemeId);
                            setStatus('代码颜色已更新');
                          }}
                        >
                          <SelectTrigger className="select-trigger" aria-label="公众号代码颜色">
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
                      <Button
                        className="wechat-control-button"
                        variant="outline"
                        size="sm"
                        title="先在预览区选中文本，再上传图片"
                        onMouseDown={prepareWechatImageUpload}
                        onClick={() => wechatImageInputRef.current?.click()}
                      >
                        <ImagePlus size={14} />
                        选中处插图
                      </Button>
                      <Button
                        className="wechat-control-button"
                        variant="outline"
                        size="sm"
                        disabled={!canUndo}
                        onClick={undoWechatImageInsert}
                      >
                        <Undo2 size={14} />
                        回退插图
                      </Button>
                      <Button className="wechat-control-button" variant="outline" size="sm" onClick={copyWechatHtml}>
                        <Copy size={14} />
                        复制 HTML
                      </Button>
                      <Button className="wechat-control-button" variant="outline" size="sm" onClick={exportWechatHtml}>
                        <FileText size={14} />
                        导出 HTML
                      </Button>
                      <input
                        ref={wechatImageInputRef}
                        className="cover-input"
                        type="file"
                        accept="image/*"
                        onChange={(event) => {
                          void insertWechatImage(event.target.files?.[0]);
                          event.target.value = '';
                        }}
                      />
                    </div>
                  </div>
                </>
              ) : null}

              {activeWorkspace === 'xiaohongshu' ? (
                <>
              <label className="field-block title-field">
                <span>标题</span>
                <input
                  value={noteTitle}
                  maxLength={90}
                  onFocus={saveEditorHistory}
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
                  onFocus={saveEditorHistory}
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
                  onFocus={saveEditorHistory}
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
                  onFocus={saveEditorHistory}
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
                        saveEditorHistory();
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
                </>
              ) : null}
            </CardContent>
          </Card>
          </div>
        </section>

        {activeWorkspace === 'markdown' ? (
          <section className="canvas-panel markdown-panel">
            <div className="canvas-toolbar markdown-toolbar">
              <div>
                <strong>Markdown 编辑器</strong>
                <span>{stats.characters} 字 · {markdownViewMode === 'edit' ? '编辑中' : '预览中'}</span>
              </div>
              <div className="markdown-toolbar-actions">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setMarkdownViewMode((mode) => (mode === 'edit' ? 'preview' : 'edit'))
                  }
                >
                  {markdownViewMode === 'edit' ? <Eye size={14} /> : <Pencil size={14} />}
                  {markdownViewMode === 'edit' ? '预览' : '编辑'}
                </Button>
              </div>
            </div>

            <div className="markdown-stage">
              <input
                ref={markdownImageInputRef}
                className="cover-input"
                type="file"
                accept="image/*"
                onChange={(event) => {
                  void insertMarkdownAsset(event.target.files?.[0]);
                  event.target.value = '';
                }}
              />
              <input
                ref={markdownFileInputRef}
                className="cover-input"
                type="file"
                onChange={(event) => {
                  void insertMarkdownAsset(event.target.files?.[0]);
                  event.target.value = '';
                }}
              />
              <label className="field-block markdown-title-field">
                <span>标题</span>
                <input
                  value={noteTitle}
                  maxLength={90}
                  onFocus={saveEditorHistory}
                  onChange={(event) => {
                    setNoteTitle(event.target.value);
                    markSaved();
                  }}
                />
              </label>

              <div className="markdown-split" data-view={markdownViewMode}>
                <section className="markdown-pane">
                  <div className="markdown-pane-header">
                    <strong>编辑</strong>
                    <span>Markdown</span>
                  </div>
                  <MarkdownCodeEditor
                    ref={markdownEditorRef}
                    className="markdown-code-host"
                    markdown={noteBody}
                    onFocus={saveEditorHistory}
                    onPasteFiles={insertMarkdownPastedFiles}
                    onChange={(nextMarkdown) => {
                      setNoteBody(nextMarkdown);
                      markSaved();
                    }}
                  />
                </section>

                <section className="markdown-pane">
                  <div className="markdown-pane-header">
                    <strong>预览</strong>
                    <span>HTML</span>
                  </div>
                  <div className="markdown-preview-scroll article-style-scope">
                    <div
                      ref={markdownPreviewRef}
                      className="markdown-preview-content platport-content"
                      dangerouslySetInnerHTML={{ __html: html }}
                    />
                  </div>
                </section>
              </div>
            </div>
          </section>
        ) : activeWorkspace === 'wechat' ? (
          <section className="canvas-panel wechat-panel">
            <div className="canvas-toolbar wechat-toolbar">
              <div>
                <strong>公众号预览</strong>
                <span>{stats.characters} 字 · 阅读需 {stats.readingMinutes} 分钟</span>
              </div>
            </div>

            <div className="wechat-stage">
              <IPhoneMockup screenStyle={{ backgroundColor: articleTheme.tokens.paper }}>
                <article
                  ref={wechatPreviewRef}
                  className="wechat-article-sheet wechat-phone-article article-style-scope"
                  onClick={(event) => saveWechatPreviewAnchor(event.target)}
                  onMouseUp={(event) => saveWechatPreviewAnchor(event.target)}
                >
                  <header className="wechat-article-header">
                    <h1>{noteTitle.trim() || '未命名文章'}</h1>
                    <div className="wechat-article-meta">
                      <span>Platport</span>
                      <span>{new Date().toLocaleDateString('zh-CN')}</span>
                    </div>
                    {coverSummary ? <p>{coverSummary}</p> : null}
                  </header>
                  <div
                    className="wechat-preview-content platport-content"
                    dangerouslySetInnerHTML={{ __html: articleHtml }}
                  />
                </article>
              </IPhoneMockup>
            </div>
          </section>
        ) : (
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
        )}

      </section>
    </main>
  );
}

export default App;
