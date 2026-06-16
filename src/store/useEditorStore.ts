import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  CodeThemeId,
  LayoutMode,
  PosterPaletteId,
  PosterRatio,
  PosterThemeId,
  PreviewMode,
  TypefaceId,
} from '../types/editor';

const INITIAL_TITLE = 'Markdown 卡片语法示范：从标题到表格的一次完整预览';

const INITIAL_BODY = `这是一份用于测试卡片排版的 Markdown 示例。它覆盖了常见写作语法，方便你快速检查不同模板、配色、字体和比例下的显示效果。

## 二级标题：段落与强调

普通段落用于观察正文行高、段间距和换行表现。你可以使用 **加粗文本** 强调重点，也可以使用 *斜体文本* 表示语气变化，还可以使用 ~~删除线~~ 标记被替换的想法。

这里还有一个 [示例链接](https://example.com)，用于检查链接颜色和下划线样式。

### 三级标题：无序列表

- 第一条要点，用来检查圆点是否显示。
- 第二条要点，用来检查多行文本在列表里的缩进是否稳定。
- 第三条要点，可以继续承载更长的解释。

### 有序列表

1. 先写下核心结论。
2. 再补充关键证据。
3. 最后给出行动建议。

### 任务列表

- [x] 支持已完成事项。
- [ ] 支持待完成事项。

> 引用块用于放置观点、摘录或提醒。它应该和正文有清晰区分，但不能抢走正文的阅读节奏。

行内代码示例：使用 \`const card = render(markdown)\` 生成卡片。

\`\`\`ts
type CardStatus = 'draft' | 'ready' | 'exported';

function formatStatus(status: CardStatus) {
  return status.toUpperCase();
}
\`\`\`

| 语法 | 用途 | 状态 |
| --- | --- | --- |
| 标题 | 建立层级 | 支持 |
| 列表 | 梳理结构 | 支持 |
| 表格 | 对比信息 | 支持 |

![示例图片](https://placehold.co/720x360/png?text=Platport)

---

最后一段用于检查分割线后的收尾文本。`;

const INITIAL_TAGS = '#Markdown #卡片设计 #排版测试 #Platport';

const INITIAL_SUMMARY =
  '这是一份覆盖常见 Markdown 语法的卡片示范文案，用于检查标题、列表、引用、代码、表格和图片在不同模板里的显示效果。';

export const buildMarkdown = (title: string, body: string) =>
  `# ${title.trim() || '未命名笔记'}\n\n${body.trim()}\n`;

interface HistoryItem {
  markdown: string;
}

interface EditorState {
  markdown: string;
  noteTitle: string;
  noteSummary: string;
  noteBody: string;
  hashtags: string;
  coverImage: string;
  themeId: string;
  posterThemeId: PosterThemeId;
  posterPaletteId: PosterPaletteId;
  previewMode: PreviewMode;
  layoutMode: LayoutMode;
  posterRatio: PosterRatio;
  typeface: TypefaceId;
  codeTheme: CodeThemeId;
  imageRadius: number;
  showChrome: boolean;
  past: HistoryItem[];
  future: HistoryItem[];
  setMarkdown: (markdown: string) => void;
  setNoteTitle: (noteTitle: string) => void;
  setNoteSummary: (noteSummary: string) => void;
  setNoteBody: (noteBody: string) => void;
  setHashtags: (hashtags: string) => void;
  setCoverImage: (coverImage: string) => void;
  pushHistory: (markdown?: string) => void;
  undo: () => void;
  redo: () => void;
  setThemeId: (themeId: string) => void;
  setPosterThemeId: (posterThemeId: PosterThemeId) => void;
  setPosterPaletteId: (posterPaletteId: PosterPaletteId) => void;
  setPreviewMode: (previewMode: PreviewMode) => void;
  setLayoutMode: (layoutMode: LayoutMode) => void;
  setPosterRatio: (posterRatio: PosterRatio) => void;
  setTypeface: (typeface: TypefaceId) => void;
  setCodeTheme: (codeTheme: CodeThemeId) => void;
  setImageRadius: (imageRadius: number) => void;
  setShowChrome: (showChrome: boolean) => void;
}

export const useEditorStore = create<EditorState>()(
  persist(
    (set) => ({
      markdown: buildMarkdown(INITIAL_TITLE, INITIAL_BODY),
      noteTitle: INITIAL_TITLE,
      noteSummary: INITIAL_SUMMARY,
      noteBody: INITIAL_BODY,
      hashtags: INITIAL_TAGS,
      coverImage: '',
      themeId: 'platport-basic',
      posterThemeId: 'dark-reader',
      posterPaletteId: 'obsidian',
      previewMode: 'poster',
      layoutMode: 'split',
      posterRatio: '3:4',
      typeface: 'serif',
      codeTheme: 'auto',
      imageRadius: 12,
      showChrome: true,
      past: [],
      future: [],
      setMarkdown: (markdown) => set({ markdown }),
      setNoteTitle: (noteTitle) =>
        set((state) => ({
          noteTitle,
          markdown: buildMarkdown(noteTitle, state.noteBody),
        })),
      setNoteSummary: (noteSummary) => set({ noteSummary }),
      setNoteBody: (noteBody) =>
        set((state) => ({
          noteBody,
          markdown: buildMarkdown(state.noteTitle, noteBody),
        })),
      setHashtags: (hashtags) => set({ hashtags }),
      setCoverImage: (coverImage) => set({ coverImage }),
      pushHistory: (markdown) =>
        set((state) => {
          const snapshot = markdown ?? state.markdown;
          if (state.past[state.past.length - 1]?.markdown === snapshot) return state;
          return {
            past: [...state.past, { markdown: snapshot }].slice(-60),
            future: [],
          };
        }),
      undo: () =>
        set((state) => {
          const previous = state.past[state.past.length - 1];
          if (!previous) return state;
          return {
            markdown: previous.markdown,
            past: state.past.slice(0, -1),
            future: [{ markdown: state.markdown }, ...state.future],
          };
        }),
      redo: () =>
        set((state) => {
          const next = state.future[0];
          if (!next) return state;
          return {
            markdown: next.markdown,
            past: [...state.past, { markdown: state.markdown }],
            future: state.future.slice(1),
          };
        }),
      setThemeId: (themeId) => set({ themeId }),
      setPosterThemeId: (posterThemeId) => set({ posterThemeId }),
      setPosterPaletteId: (posterPaletteId) => set({ posterPaletteId }),
      setPreviewMode: (previewMode) => set({ previewMode }),
      setLayoutMode: (layoutMode) => set({ layoutMode }),
      setPosterRatio: (posterRatio) => set({ posterRatio }),
      setTypeface: (typeface) => set({ typeface }),
      setCodeTheme: (codeTheme) => set({ codeTheme }),
      setImageRadius: (imageRadius) => set({ imageRadius }),
      setShowChrome: (showChrome) => set({ showChrome }),
    }),
    {
      name: 'platport-editor',
      version: 5,
      migrate: (persisted) => {
        const state = persisted as Partial<EditorState>;
        return {
          noteTitle: state.noteTitle || INITIAL_TITLE,
          noteSummary: state.noteSummary || INITIAL_SUMMARY,
          noteBody: state.noteBody || INITIAL_BODY,
          hashtags: state.hashtags || INITIAL_TAGS,
          coverImage: state.coverImage || '',
          themeId: 'platport-basic',
          posterThemeId: state.posterThemeId || 'dark-reader',
          posterPaletteId: state.posterPaletteId || 'obsidian',
          previewMode: 'poster' as PreviewMode,
          layoutMode: state.layoutMode || 'split',
          posterRatio: '3:4' as PosterRatio,
          typeface: 'serif' as TypefaceId,
          codeTheme: state.codeTheme || 'auto',
          imageRadius: state.imageRadius ?? 12,
          showChrome: state.showChrome ?? true,
          markdown: buildMarkdown(state.noteTitle || INITIAL_TITLE, state.noteBody || INITIAL_BODY),
        };
      },
      partialize: (state) => ({
        noteTitle: state.noteTitle,
        noteSummary: state.noteSummary,
        noteBody: state.noteBody,
        hashtags: state.hashtags,
        coverImage: state.coverImage,
        themeId: state.themeId,
        posterThemeId: state.posterThemeId,
        posterPaletteId: state.posterPaletteId,
        previewMode: state.previewMode,
        layoutMode: state.layoutMode,
        posterRatio: state.posterRatio,
        typeface: state.typeface,
        codeTheme: state.codeTheme,
        imageRadius: state.imageRadius,
        showChrome: state.showChrome,
      }),
    },
  ),
);
