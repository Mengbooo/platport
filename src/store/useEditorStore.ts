import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  LayoutMode,
  PosterPaletteId,
  PosterRatio,
  PosterThemeId,
  PreviewMode,
  TypefaceId,
} from '../types/editor';

const INITIAL_TITLE = '苹果 WWDC 2026 个人解读：Siri AI、Gemini 合作与 Apple 的 AI 路线图';

const INITIAL_BODY = `WWDC 2026 于 2026 年 6 月 8 日在 Apple Park 举行，主题演讲约 90 分钟，仅发布软件更新，无新硬件。

本文按发布内容、底层架构、竞争格局和战略判断四个层次展开，试图提供一个比功能清单更完整的阅读视角。

## Siri AI：2011 年以来最彻底的重构

Siri AI 是 WWDC 2026 最重要的发布。Apple 宣布了 Siri 自诞生以来最根本的重新构建，核心变化不在于它说话更自然，而在于它的角色从语音命令入口变成了覆盖全平台的对话式操作系统接口。

底层架构上，Apple 采用三层模型架构来支撑 Siri AI：

- Apple Foundation Models：新一代 Apple 智能，与 Google Gemini 合作构建。
- 隐私架构：端侧处理 + Private Cloud Compute，个人数据不离开设备或仅用于加密推理。
- 更强的端侧模型：在 Apple Silicon 设备上运行第二层更强大的本地模型。

## 核心能力

能力描述自然多轮对话，支持打字和语音输入，连续追问和澄清个人上下文，理解邮件、短信、照片、日历、备忘录，提供个性化答案。

## 我的判断

这场发布会的信息密度并不低。Apple 的 AI 路线不是追求聊天机器人本身，而是把 AI 重新嵌进系统级操作入口。真正值得观察的是：Siri 能不能成为下一代 iOS 的操作层。`;

const INITIAL_TAGS = '#WWDC2026 #AppleIntelligence #SiriAI #Gemini #科技观察';

const INITIAL_SUMMARY =
  'WWDC 2026 推出 Siri AI 重构、Gemini 合作和新的端侧模型策略，Apple 正在把 AI 重新嵌入系统级操作入口。';

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
      posterRatio: '4:5',
      typeface: 'system',
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
      setImageRadius: (imageRadius) => set({ imageRadius }),
      setShowChrome: (showChrome) => set({ showChrome }),
    }),
    {
      name: 'platport-editor',
      version: 2,
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
          posterRatio: state.posterRatio || '4:5',
          typeface: state.typeface || 'system',
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
        imageRadius: state.imageRadius,
        showChrome: state.showChrome,
      }),
    },
  ),
);
