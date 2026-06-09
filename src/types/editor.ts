export type PreviewMode = 'article' | 'poster';

export type LayoutMode = 'split' | 'edit' | 'preview';

export type PosterRatio = '3:4' | '4:5' | '9:16' | '1:1';

export type TypefaceId = 'system' | 'serif' | 'mono' | 'kai';

export type PosterThemeId = 'dark-reader' | 'classic-paper' | 'ios-note' | 'blue-marker';

export type PosterPaletteId =
  | 'obsidian'
  | 'graphite'
  | 'cocoa'
  | 'porcelain'
  | 'sepia'
  | 'jade-paper'
  | 'ios-blue'
  | 'ios-graphite'
  | 'ios-mint'
  | 'azure'
  | 'navy'
  | 'violet';

export interface ThemeTokens {
  bg: string;
  paper: string;
  ink: string;
  muted: string;
  faint: string;
  accent: string;
  accentSoft: string;
  border: string;
  quoteBg: string;
  quoteInk: string;
  codeBg: string;
  codeInk: string;
  posterBg: string;
  posterFrame: string;
}

export interface PosterPalette {
  id: PosterPaletteId;
  name: string;
  description: string;
  preview: string;
  bg: string;
  frame: string;
  ink: string;
  muted: string;
  accent: string;
  border: string;
  surface: string;
  imageBackdrop: string;
}

export interface PosterTheme {
  id: PosterThemeId;
  name: string;
  description: string;
}

export interface FormatTheme {
  id: string;
  name: string;
  description: string;
  preview: string;
  fontFamily: string;
  headingFamily: string;
  containerStyle: string;
  tokens: ThemeTokens;
  css: string;
}

export interface Stats {
  characters: number;
  words: number;
  readingMinutes: number;
}
