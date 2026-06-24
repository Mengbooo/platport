import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import {
  javascriptLanguage,
  jsxLanguage,
  tsxLanguage,
  typescriptLanguage,
} from '@codemirror/lang-javascript';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import {
  bracketMatching,
  defaultHighlightStyle,
  foldGutter,
  foldKeymap,
  syntaxHighlighting,
} from '@codemirror/language';
import { EditorState } from '@codemirror/state';
import {
  drawSelection,
  EditorView,
  highlightActiveLine,
  highlightActiveLineGutter,
  keymap,
  lineNumbers,
} from '@codemirror/view';
import {
  Bold,
  Code,
  Eraser,
  Highlighter,
  Italic,
  Link as LinkIcon,
  Strikethrough,
  Subscript,
  Superscript,
} from 'lucide-react';
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

export interface MarkdownEditorMethods {
  getMarkdown: () => string;
  setMarkdown: (markdown: string) => void;
  insertMarkdown: (text: string) => void;
  insertAtLineStart: (prefix: string) => void;
  insertAtCursor: (text: string) => void;
  wrapSelection: (before: string, after?: string) => void;
  focus: () => void;
}

interface MarkdownCodeEditorProps {
  markdown: string;
  onChange: (markdown: string) => void;
  className?: string;
}

interface SelectionToolbarCoords {
  top: number;
  left: number;
  width: number;
  height: number;
}

const HIGHLIGHT_COLORS = [
  { label: '黄色', value: '#fef08a' },
  { label: '绿色', value: '#bbf7d0' },
  { label: '蓝色', value: '#bfdbfe' },
  { label: '粉色', value: '#fbcfe8' },
  { label: '橙色', value: '#fed7aa' },
  { label: '紫色', value: '#e9d5ff' },
];

const platportEditorTheme = EditorView.theme({
  '&': {
    height: '100%',
    backgroundColor: 'var(--background)',
    color: 'var(--foreground)',
    fontSize: '13px',
    fontFamily: '"SFMono-Regular", "Menlo", "Consolas", monospace',
  },
  '.cm-scroller': {
    overflow: 'auto',
    fontFamily: 'inherit',
    lineHeight: '1.72',
  },
  '.cm-content': {
    minHeight: '100%',
    padding: '14px 16px 48px',
    caretColor: 'var(--primary)',
  },
  '.cm-line': {
    padding: '0',
  },
  '.cm-focused': {
    outline: 'none',
  },
  '.cm-editor.cm-focused': {
    outline: 'none',
  },
  '.cm-gutters': {
    minWidth: '44px',
    paddingRight: '8px',
    border: '0',
    backgroundColor: 'var(--background)',
    color: 'var(--muted-foreground)',
  },
  '.cm-activeLineGutter': {
    backgroundColor: 'transparent',
    color: 'var(--foreground)',
  },
  '.cm-activeLine': {
    backgroundColor: 'color-mix(in oklch, var(--primary) 7%, transparent)',
  },
  '.cm-selectionBackground, .cm-content ::selection': {
    backgroundColor: '#dbeafe !important',
    color: '#0f172a !important',
  },
  '.cm-foldGutter .cm-gutterElement': {
    color: 'var(--muted-foreground)',
    cursor: 'pointer',
  },
  '.cm-heading': {
    color: 'var(--foreground)',
    fontWeight: '750',
  },
  '.cm-heading1': {
    fontSize: '1.18em',
  },
  '.cm-heading2': {
    fontSize: '1.08em',
  },
  '.cm-strong': {
    color: 'var(--foreground)',
    fontWeight: '750',
  },
  '.cm-emphasis': {
    color: 'var(--muted-foreground)',
    fontStyle: 'italic',
  },
  '.cm-link, .cm-url': {
    color: 'var(--primary)',
    textDecoration: 'underline',
    textUnderlineOffset: '3px',
  },
  '.cm-quote': {
    color: 'var(--muted-foreground)',
    borderLeft: '3px solid var(--border)',
    paddingLeft: '8px',
  },
  '.cm-monospace': {
    borderRadius: '4px',
    backgroundColor: 'var(--muted)',
    color: 'var(--foreground)',
    padding: '0 3px',
  },
});

const markdownCodeLanguages = (info: string) => {
  const language = info.trim().toLowerCase();
  if (language === 'js' || language === 'javascript') return javascriptLanguage;
  if (language === 'jsx') return jsxLanguage;
  if (language === 'ts' || language === 'typescript') return typescriptLanguage;
  if (language === 'tsx') return tsxLanguage;
  return null;
};

export const MarkdownCodeEditor = forwardRef<MarkdownEditorMethods, MarkdownCodeEditorProps>(
  ({ markdown: markdownContent, onChange, className }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const viewRef = useRef<EditorView | null>(null);
    const onChangeRef = useRef(onChange);
    const initialMarkdownRef = useRef(markdownContent);
    const applyingExternalChangeRef = useRef(false);
    const [selectionCoords, setSelectionCoords] = useState<SelectionToolbarCoords | null>(null);
    const [showHighlightColors, setShowHighlightColors] = useState(false);

    onChangeRef.current = onChange;

    const updateSelectionToolbar = useCallback((view: EditorView) => {
      const selection = view.state.selection.main;
      if (selection.empty) {
        setSelectionCoords(null);
        setShowHighlightColors(false);
        return;
      }

      const startCoords = view.coordsAtPos(selection.from);
      const endCoords = view.coordsAtPos(selection.to);
      if (!startCoords) {
        setSelectionCoords(null);
        return;
      }

      const left = Math.min(startCoords.left, endCoords?.left ?? startCoords.left);
      const right = Math.max(startCoords.right, endCoords?.right ?? startCoords.right);
      const top = Math.min(startCoords.top, endCoords?.top ?? startCoords.top);
      const bottom = Math.max(startCoords.bottom, endCoords?.bottom ?? startCoords.bottom);

      setSelectionCoords({
        top,
        left,
        width: Math.max(1, right - left),
        height: Math.max(20, bottom - top),
      });
    }, []);

    const unwrapMatchingSelection = (selected: string, before: string, after: string) => {
      if (selected.startsWith(before) && selected.endsWith(after)) {
        return {
          nextText: selected.slice(before.length, selected.length - after.length),
          unwrapped: true,
        };
      }

      return { nextText: `${before}${selected}${after}`, unwrapped: false };
    };

    const wrapCurrentSelection = useCallback((before: string, after = before) => {
      const view = viewRef.current;
      if (!view) return;

      const { from, to } = view.state.selection.main;
      if (from === to) return;

      const selected = view.state.doc.sliceString(from, to);
      const { nextText } = unwrapMatchingSelection(selected, before, after);
      const selectionStart = from;
      const selectionEnd = from + nextText.length;

      view.dispatch({
        changes: { from, to, insert: nextText },
        selection: {
          anchor: selectionStart,
          head: selectionEnd,
        },
      });
      view.focus();
      requestAnimationFrame(() => updateSelectionToolbar(view));
    }, [updateSelectionToolbar]);

    const clearCurrentSelectionFormatting = useCallback(() => {
      const view = viewRef.current;
      if (!view) return;

      const { from, to } = view.state.selection.main;
      if (from === to) return;

      const selected = view.state.doc.sliceString(from, to);
      const cleaned = selected
        .replace(/<mark\b[^>]*>([\s\S]*?)<\/mark>/gi, '$1')
        .replace(/<sup>([\s\S]*?)<\/sup>/gi, '$1')
        .replace(/<sub>([\s\S]*?)<\/sub>/gi, '$1')
        .replace(/\[([^\]]+)]\([^)]+\)/g, '$1')
        .replace(/\*\*([^*]+)\*\*/g, '$1')
        .replace(/~~([^~]+)~~/g, '$1')
        .replace(/`([^`]+)`/g, '$1')
        .replace(/\*([^*]+)\*/g, '$1');

      view.dispatch({
        changes: { from, to, insert: cleaned },
        selection: { anchor: from, head: from + cleaned.length },
      });
      view.focus();
      requestAnimationFrame(() => updateSelectionToolbar(view));
    }, [updateSelectionToolbar]);

    useImperativeHandle(ref, () => ({
      getMarkdown: () => viewRef.current?.state.doc.toString() ?? '',
      setMarkdown: (nextMarkdown) => {
        const view = viewRef.current;
        if (!view) return;
        const current = view.state.doc.toString();
        if (current === nextMarkdown) return;

        applyingExternalChangeRef.current = true;
        view.dispatch({ changes: { from: 0, to: current.length, insert: nextMarkdown } });
        applyingExternalChangeRef.current = false;
      },
      insertMarkdown: (text) => {
        const view = viewRef.current;
        if (!view) return;
        const { from, to } = view.state.selection.main;
        const docText = view.state.doc.toString();
        const prefix = from > 0 && docText[from - 1] !== '\n' ? '\n\n' : '';
        const suffix = to < docText.length && docText[to] !== '\n' ? '\n\n' : '';
        const insert = `${prefix}${text}${suffix}`;
        view.dispatch({
          changes: { from, to, insert },
          selection: { anchor: from + prefix.length + text.length },
        });
        view.focus();
      },
      insertAtCursor: (text) => {
        const view = viewRef.current;
        if (!view) return;
        const { from, to } = view.state.selection.main;
        view.dispatch({
          changes: { from, to, insert: text },
          selection: { anchor: from + text.length },
        });
        view.focus();
      },
      insertAtLineStart: (prefix) => {
        const view = viewRef.current;
        if (!view) return;

        const { from, to } = view.state.selection.main;
        const doc = view.state.doc;
        const startLine = doc.lineAt(from);
        const adjustedTo = to > from && to === doc.lineAt(to).from ? Math.max(from, to - 1) : to;
        const endLine = doc.lineAt(adjustedTo);
        const replaceablePrefix = /^(\s*)(?:(?:-\s+\[[ xX]\]\s+)|(?:[-*+]\s+)|(?:\d+\.\s+)|(?:>\s*))/;
        const changes = [];
        let totalDelta = 0;
        let firstLineDelta = 0;

        for (let lineNumber = startLine.number; lineNumber <= endLine.number; lineNumber += 1) {
          const line = doc.line(lineNumber);
          const index = lineNumber - startLine.number;
          const nextPrefix = prefix === '1. ' ? `${index + 1}. ` : prefix;
          const match = line.text.match(replaceablePrefix);

          if (match) {
            const change = {
              from: line.from + match[1].length,
              to: line.from + match[0].length,
              insert: nextPrefix,
            };
            const delta = nextPrefix.length - (change.to - change.from);
            if (lineNumber === startLine.number) firstLineDelta = delta;
            totalDelta += delta;
            changes.push(change);
          } else {
            const change = { from: line.from, to: line.from, insert: nextPrefix };
            if (lineNumber === startLine.number) firstLineDelta = nextPrefix.length;
            totalDelta += nextPrefix.length;
            changes.push(change);
          }
        }

        view.dispatch({
          changes,
          selection: {
            anchor: from + firstLineDelta,
            head: to + totalDelta,
          },
        });
        view.focus();
      },
      wrapSelection: (before, after = before) => {
        const view = viewRef.current;
        if (!view) return;

        const { from, to } = view.state.selection.main;
        const selected = view.state.doc.sliceString(from, to) || '文本';
        const { nextText } = unwrapMatchingSelection(selected, before, after);
        const selectionStart = from;
        const selectionEnd = from + nextText.length;

        view.dispatch({
          changes: { from, to, insert: nextText },
          selection: {
            anchor: selectionStart,
            head: selectionEnd,
          },
        });
        view.focus();
      },
      focus: () => viewRef.current?.focus(),
    }));

    useEffect(() => {
      const view = viewRef.current;
      if (!view) return;

      const current = view.state.doc.toString();
      if (current === markdownContent) return;

      applyingExternalChangeRef.current = true;
      view.dispatch({ changes: { from: 0, to: current.length, insert: markdownContent } });
      applyingExternalChangeRef.current = false;
    }, [markdownContent]);

    useEffect(() => {
      if (!containerRef.current) return;

      const state = EditorState.create({
        doc: initialMarkdownRef.current,
        extensions: [
          lineNumbers(),
          foldGutter(),
          highlightActiveLine(),
          highlightActiveLineGutter(),
          drawSelection(),
          bracketMatching(),
          history(),
          syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
          markdown({
            base: markdownLanguage,
            codeLanguages: markdownCodeLanguages,
          }),
          keymap.of([...defaultKeymap, ...historyKeymap, ...foldKeymap, indentWithTab]),
          platportEditorTheme,
          EditorView.lineWrapping,
          EditorView.updateListener.of((update) => {
            if (update.docChanged && !applyingExternalChangeRef.current) {
              onChangeRef.current(update.state.doc.toString());
            }
            if (update.selectionSet || update.docChanged || update.viewportChanged) {
              updateSelectionToolbar(update.view);
            }
          }),
          EditorView.domEventHandlers({
            blur: () => {
              setSelectionCoords(null);
              setShowHighlightColors(false);
              return false;
            },
            mouseup: (_event, view) => {
              updateSelectionToolbar(view);
              return false;
            },
            keyup: (_event, view) => {
              updateSelectionToolbar(view);
              return false;
            },
          }),
        ],
      });

      const view = new EditorView({ state, parent: containerRef.current });
      viewRef.current = view;
      const handleScroll = () => updateSelectionToolbar(view);
      view.scrollDOM.addEventListener('scroll', handleScroll, { passive: true });

      return () => {
        view.scrollDOM.removeEventListener('scroll', handleScroll);
        view.destroy();
        viewRef.current = null;
      };
    }, [updateSelectionToolbar]);

    const baseToolbarWidth = showHighlightColors ? 276 : 340;
    const toolbarHeight = 44;
    const toolbarGap = 8;
    const viewportPadding = 10;
    const viewportWidth = typeof window === 'undefined' ? baseToolbarWidth : window.innerWidth;
    const toolbarWidth = Math.min(baseToolbarWidth, Math.max(0, viewportWidth - viewportPadding * 2));
    const toolbarTop = selectionCoords
      ? selectionCoords.top - toolbarHeight - toolbarGap < viewportPadding
        ? selectionCoords.top + selectionCoords.height + toolbarGap
        : selectionCoords.top - toolbarHeight - toolbarGap
      : 0;
    const toolbarCenter = selectionCoords
      ? Math.min(
          Math.max(selectionCoords.left + selectionCoords.width / 2, toolbarWidth / 2 + viewportPadding),
          window.innerWidth - toolbarWidth / 2 - viewportPadding,
        )
      : 0;

    return (
      <div className={cn('markdown-code-editor', className)}>
        <div ref={containerRef} className="markdown-code-editor-surface" />
        {selectionCoords ? (
          <div
            className="selection-toolbar"
            data-colors={showHighlightColors}
            onMouseDown={(event) => event.preventDefault()}
            style={{
              left: toolbarCenter,
              top: toolbarTop,
              maxWidth: toolbarWidth,
            }}
          >
            {showHighlightColors ? (
              <>
                <button
                  type="button"
                  aria-label="返回格式工具"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => setShowHighlightColors(false)}
                >
                  <span className="toolbar-dot" />
                  <span className="toolbar-dot" />
                </button>
                {HIGHLIGHT_COLORS.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    className="toolbar-swatch"
                    aria-label={`荧光笔 ${color.label}`}
                    title={color.label}
                    style={{ backgroundColor: color.value }}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => {
                      wrapCurrentSelection(`<mark style="background:${color.value}">`, '</mark>');
                      setShowHighlightColors(false);
                    }}
                  />
                ))}
                <button
                  type="button"
                  aria-label="清除格式"
                  title="清除格式"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => {
                    clearCurrentSelectionFormatting();
                    setShowHighlightColors(false);
                  }}
                >
                  <Eraser size={14} />
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  aria-label="加粗"
                  title="加粗"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => wrapCurrentSelection('**')}
                >
                  <Bold size={18} />
                </button>
                <button
                  type="button"
                  aria-label="斜体"
                  title="斜体"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => wrapCurrentSelection('*')}
                >
                  <Italic size={18} />
                </button>
                <button
                  type="button"
                  aria-label="删除线"
                  title="删除线"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => wrapCurrentSelection('~~')}
                >
                  <Strikethrough size={17} />
                </button>
                <button
                  type="button"
                  aria-label="行内代码"
                  title="行内代码"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => wrapCurrentSelection('`')}
                >
                  <Code size={18} />
                </button>
                <button
                  type="button"
                  aria-label="链接"
                  title="链接"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => wrapCurrentSelection('[', '](url)')}
                >
                  <LinkIcon size={18} />
                </button>
                <span className="toolbar-separator" />
                <button
                  type="button"
                  aria-label="上标"
                  title="上标"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => wrapCurrentSelection('<sup>', '</sup>')}
                >
                  <Superscript size={17} />
                </button>
                <button
                  type="button"
                  aria-label="下标"
                  title="下标"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => wrapCurrentSelection('<sub>', '</sub>')}
                >
                  <Subscript size={17} />
                </button>
                <span className="toolbar-separator" />
                <button
                  type="button"
                  aria-label="荧光笔"
                  title="荧光笔"
                  className="toolbar-highlight-button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => setShowHighlightColors(true)}
                >
                  <Highlighter size={18} />
                </button>
              </>
            )}
          </div>
        ) : null}
      </div>
    );
  },
);

MarkdownCodeEditor.displayName = 'MarkdownCodeEditor';
