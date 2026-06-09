import type {
  FormatTheme,
  PosterPalette,
  PosterPaletteId,
  PosterRatio,
  PosterTheme,
  PosterThemeId,
  TypefaceId,
} from '../types/editor';

const BASE_CSS = `
  #chicpage, #chicpage * { box-sizing: border-box; }
  #chicpage {
    color: var(--cp-ink);
    background: var(--cp-paper);
    font-family: var(--cp-font);
    font-size: 16px;
    line-height: 1.86;
    word-break: break-word;
    overflow-wrap: anywhere;
    padding: 36px 38px 44px;
    -webkit-font-smoothing: antialiased;
    text-rendering: optimizeLegibility;
  }
  #chicpage > *:first-child { margin-top: 0; }
  #chicpage > *:last-child { margin-bottom: 0; }
  #chicpage h1,
  #chicpage h2,
  #chicpage h3,
  #chicpage h4 {
    color: var(--cp-ink);
    font-family: var(--cp-heading);
    font-weight: 760;
    letter-spacing: 0;
  }
  #chicpage h1 {
    font-size: 2.08em;
    line-height: 1.18;
    margin: 0.35em 0 0.88em;
  }
  #chicpage h2 {
    font-size: 1.48em;
    line-height: 1.28;
    margin: 1.8em 0 0.7em;
  }
  #chicpage h3 {
    font-size: 1.17em;
    line-height: 1.36;
    margin: 1.45em 0 0.45em;
  }
  #chicpage h4,
  #chicpage h5,
  #chicpage h6 {
    font-size: 1.02em;
    line-height: 1.4;
    margin: 1.25em 0 0.35em;
  }
  #chicpage p {
    margin: 0.98em 0;
    color: var(--cp-ink);
  }
  #chicpage a {
    color: var(--cp-accent);
    text-decoration: underline;
    text-underline-offset: 4px;
    text-decoration-thickness: 1px;
  }
  #chicpage strong {
    color: var(--cp-strong, var(--cp-ink));
    font-weight: 760;
  }
  #chicpage em { color: var(--cp-muted); }
  #chicpage ul,
  #chicpage ol {
    margin: 1em 0;
    padding-left: 1.35em;
  }
  #chicpage li { margin: 0.42em 0; padding-left: 0.15em; }
  #chicpage li::marker { color: var(--cp-accent); font-weight: 700; }
  #chicpage blockquote {
    margin: 1.55em 0;
    padding: 16px 18px;
    border: 0;
    border-left: 4px solid var(--cp-accent);
    border-radius: 8px;
    background: var(--cp-quote-bg);
    color: var(--cp-quote-ink);
  }
  #chicpage blockquote p {
    color: inherit;
    margin: 0.45em 0;
  }
  #chicpage hr {
    border: 0;
    height: 1px;
    margin: 2.4em 0;
    background: linear-gradient(90deg, transparent, var(--cp-border), transparent);
  }
  #chicpage img {
    display: block;
    max-width: 100%;
    height: auto;
    margin: 1.45em auto;
    border-radius: var(--cp-image-radius, 12px);
  }
  #chicpage table {
    width: 100%;
    margin: 1.45em 0;
    border-collapse: collapse;
    overflow: hidden;
    font-size: 0.92em;
  }
  #chicpage th,
  #chicpage td {
    border: 1px solid var(--cp-border);
    padding: 10px 12px;
    text-align: left;
  }
  #chicpage th {
    background: var(--cp-accent-soft);
    color: var(--cp-ink);
    font-weight: 720;
  }
  #chicpage code {
    font-family: var(--cp-mono);
    font-size: 0.88em;
    color: var(--cp-code-ink);
    background: var(--cp-code-bg);
    border: 1px solid color-mix(in srgb, var(--cp-border) 72%, transparent);
    border-radius: 5px;
    padding: 0.12em 0.36em;
  }
  #chicpage pre {
    margin: 1.5em 0;
    padding: 15px 16px;
    overflow: auto;
    border: 1px solid var(--cp-border);
    border-radius: 8px;
    background: var(--cp-code-bg);
  }
  #chicpage pre code {
    display: block;
    padding: 0;
    border: 0;
    border-radius: 0;
    background: transparent;
    color: var(--cp-code-ink);
    line-height: 1.68;
  }
  #chicpage mark {
    padding: 0.1em 0.24em;
    border-radius: 4px;
    color: inherit;
    background: var(--cp-mark, #fff0a8);
  }
  #chicpage kbd {
    display: inline-block;
    padding: 2px 6px;
    border: 1px solid var(--cp-border);
    border-bottom-width: 2px;
    border-radius: 5px;
    background: var(--cp-faint);
    color: var(--cp-ink);
    font-family: var(--cp-mono);
    font-size: 0.76em;
    line-height: 1.35;
  }
  #chicpage input[type="checkbox"] {
    margin-right: 8px;
    accent-color: var(--cp-accent);
  }
  #chicpage .hljs-comment,
  #chicpage .hljs-quote { color: var(--cp-muted); font-style: italic; }
  #chicpage .hljs-keyword,
  #chicpage .hljs-selector-tag,
  #chicpage .hljs-literal,
  #chicpage .hljs-title,
  #chicpage .hljs-section { color: var(--cp-accent); }
  #chicpage .hljs-string,
  #chicpage .hljs-attr,
  #chicpage .hljs-template-variable { color: var(--cp-code-string, #0f766e); }
  #chicpage .hljs-number,
  #chicpage .hljs-symbol,
  #chicpage .hljs-variable { color: var(--cp-code-number, #b45309); }
`;

const fontStacks = {
  sans:
    '"Google Sans", "Product Sans", "Noto Sans SC", "PingFang SC", "Hiragino Sans GB", Arial, sans-serif',
  serif:
    '"Google Sans", "Product Sans", "Noto Sans SC", "PingFang SC", "Hiragino Sans GB", Arial, sans-serif',
  mono:
    '"Google Sans", "Product Sans", "Noto Sans SC", "PingFang SC", "Hiragino Sans GB", Arial, sans-serif',
  kai:
    '"Google Sans", "Product Sans", "Noto Sans SC", "PingFang SC", "Hiragino Sans GB", Arial, sans-serif',
};

const createTheme = (
  theme: Omit<FormatTheme, 'css'> & { extraCss?: string },
): FormatTheme => {
  const cssVars = `
    #chicpage {
      --cp-bg: ${theme.tokens.bg};
      --cp-paper: ${theme.tokens.paper};
      --cp-ink: ${theme.tokens.ink};
      --cp-muted: ${theme.tokens.muted};
      --cp-faint: ${theme.tokens.faint};
      --cp-accent: ${theme.tokens.accent};
      --cp-accent-soft: ${theme.tokens.accentSoft};
      --cp-border: ${theme.tokens.border};
      --cp-quote-bg: ${theme.tokens.quoteBg};
      --cp-quote-ink: ${theme.tokens.quoteInk};
      --cp-code-bg: ${theme.tokens.codeBg};
      --cp-code-ink: ${theme.tokens.codeInk};
      --cp-font: ${theme.fontFamily};
      --cp-heading: ${theme.headingFamily};
      --cp-mono: ${fontStacks.mono};
    }
  `;

  return {
    ...theme,
    css: `${BASE_CSS}${cssVars}${theme.extraCss ?? ''}`,
  };
};

export const FORMAT_THEMES: FormatTheme[] = [
  createTheme({
    id: 'platport-basic',
    name: '基础',
    description: '用于公众号复制和文章预览的稳定基础主题。',
    preview: '#f8fafc',
    fontFamily: fontStacks.sans,
    headingFamily: fontStacks.sans,
    containerStyle:
      'max-width:677px;margin:0 auto;background:#f8fafc;color:#172033;font-family:"Google Sans","Product Sans","Noto Sans SC","PingFang SC","Hiragino Sans GB",Arial,sans-serif;',
    tokens: {
      bg: '#e9eef4',
      paper: '#f8fafc',
      ink: '#172033',
      muted: '#667085',
      faint: '#eef3f8',
      accent: '#2563eb',
      accentSoft: '#dbeafe',
      border: '#d5dee9',
      quoteBg: '#edf6ff',
      quoteInk: '#1d4e89',
      codeBg: '#edf2f7',
      codeInk: '#253347',
      posterBg: '#f8fafc',
      posterFrame: '#ffffff',
    },
    extraCss: `
      #chicpage h1 { font-size: 2em; }
      #chicpage h2 {
        padding-left: 12px;
        border-left: 5px solid var(--cp-accent);
      }
      #chicpage blockquote {
        border-left: 0;
        box-shadow: inset 0 0 0 1px var(--cp-border);
      }
    `,
  }),
];

export const POSTER_THEMES: PosterTheme[] = [
  {
    id: 'dark-reader',
    name: '暗黑阅读',
    description: '参考黑底信息卡，强调高对比标题和长文沉浸阅读。',
  },
  {
    id: 'classic-paper',
    name: '古典纸纹',
    description: '参考米白纸纹卡，适合知识长文、读书笔记和复盘。',
  },
  {
    id: 'ios-note',
    name: '备忘录',
    description: '参考 iOS 备忘录界面，带顶部工具栏和清爽系统感。',
  },
  {
    id: 'blue-marker',
    name: '蓝色标注',
    description: '参考蓝色强调块，适合观点拆解和教程型内容。',
  },
];

export const POSTER_PALETTES: Record<PosterThemeId, PosterPalette[]> = {
  'dark-reader': [
    {
      id: 'obsidian',
      name: '黑曜',
      description: '冷黑底与浅灰文字。',
      preview: '#111111',
      bg: '#111111',
      frame: '#111111',
      ink: '#f2f2f2',
      muted: '#b8b8b8',
      accent: '#f5f5f5',
      border: '#3f3f3f',
      surface: '#191919',
      imageBackdrop: 'linear-gradient(135deg, #232323, #0d0d0d)',
    },
    {
      id: 'graphite',
      name: '石墨',
      description: '偏灰黑，更柔和。',
      preview: '#1b1d20',
      bg: '#17191c',
      frame: '#1b1d20',
      ink: '#f3f5f7',
      muted: '#aeb4bc',
      accent: '#d7dee8',
      border: '#464d57',
      surface: '#23272d',
      imageBackdrop: 'linear-gradient(135deg, #2d333b, #16191e)',
    },
    {
      id: 'cocoa',
      name: '可可',
      description: '黑棕底，适合观点文。',
      preview: '#18120f',
      bg: '#15110f',
      frame: '#18120f',
      ink: '#fff4e7',
      muted: '#c7b8a7',
      accent: '#f6d09a',
      border: '#4a3a2f',
      surface: '#211914',
      imageBackdrop: 'linear-gradient(135deg, #3b291c, #130f0d)',
    },
  ],
  'classic-paper': [
    {
      id: 'porcelain',
      name: '瓷白',
      description: '白底棕字与浅纸纹。',
      preview: '#f7f4ee',
      bg: '#f7f4ee',
      frame: '#f7f4ee',
      ink: '#34302a',
      muted: '#62594c',
      accent: '#7b4b24',
      border: '#d8c9b5',
      surface: '#fffdf7',
      imageBackdrop: 'linear-gradient(135deg, #f3e7d5, #fffaf0)',
    },
    {
      id: 'sepia',
      name: '褐墨',
      description: '更接近古典书页。',
      preview: '#f2e6d1',
      bg: '#f2e6d1',
      frame: '#fbf3e5',
      ink: '#3a2d20',
      muted: '#705b43',
      accent: '#8a5426',
      border: '#cdb792',
      surface: '#fff6e8',
      imageBackdrop: 'linear-gradient(135deg, #ead1aa, #fff4de)',
    },
    {
      id: 'jade-paper',
      name: '青笺',
      description: '暖纸底配低饱和青色。',
      preview: '#edf0e6',
      bg: '#edf0e6',
      frame: '#fafaf3',
      ink: '#2d332f',
      muted: '#637067',
      accent: '#4f7b69',
      border: '#cbd8cb',
      surface: '#f7faf1',
      imageBackdrop: 'linear-gradient(135deg, #d8e4d6, #fbf8ea)',
    },
  ],
  'ios-note': [
    {
      id: 'ios-blue',
      name: '系统蓝',
      description: '接近 iOS 默认蓝。',
      preview: '#0a84ff',
      bg: '#ffffff',
      frame: '#ffffff',
      ink: '#303033',
      muted: '#575b60',
      accent: '#0a84ff',
      border: '#e5e5ea',
      surface: '#f7f7f8',
      imageBackdrop: 'linear-gradient(135deg, #e8f3ff, #ffffff)',
    },
    {
      id: 'ios-graphite',
      name: '灰阶',
      description: '弱化蓝色，偏沉稳。',
      preview: '#8e8e93',
      bg: '#ffffff',
      frame: '#ffffff',
      ink: '#2c2c2e',
      muted: '#636366',
      accent: '#8e8e93',
      border: '#e4e4e7',
      surface: '#f7f7f8',
      imageBackdrop: 'linear-gradient(135deg, #eceef2, #ffffff)',
    },
    {
      id: 'ios-mint',
      name: '薄荷',
      description: '清爽备忘录感。',
      preview: '#30d158',
      bg: '#ffffff',
      frame: '#ffffff',
      ink: '#233128',
      muted: '#5e6a63',
      accent: '#2fbf62',
      border: '#dfeae2',
      surface: '#f3fbf5',
      imageBackdrop: 'linear-gradient(135deg, #dff6e6, #ffffff)',
    },
  ],
  'blue-marker': [
    {
      id: 'azure',
      name: '天蓝',
      description: '蓝色标题标注。',
      preview: '#0a7cff',
      bg: '#f8fbff',
      frame: '#f8fbff',
      ink: '#1e242c',
      muted: '#526171',
      accent: '#0a7cff',
      border: '#d7e8ff',
      surface: '#e1f0ff',
      imageBackdrop: 'linear-gradient(135deg, #d7ebff, #f8fbff)',
    },
    {
      id: 'navy',
      name: '海军',
      description: '更克制的蓝黑标注。',
      preview: '#1f4e8c',
      bg: '#f7f9fc',
      frame: '#fbfdff',
      ink: '#17212f',
      muted: '#4f6072',
      accent: '#1f4e8c',
      border: '#cddbeb',
      surface: '#dde9f6',
      imageBackdrop: 'linear-gradient(135deg, #dce7f3, #ffffff)',
    },
    {
      id: 'violet',
      name: '紫蓝',
      description: '适合 AI/科技内容。',
      preview: '#5b5ff7',
      bg: '#fafaff',
      frame: '#ffffff',
      ink: '#202134',
      muted: '#5b5d74',
      accent: '#5b5ff7',
      border: '#dddffe',
      surface: '#e8e9ff',
      imageBackdrop: 'linear-gradient(135deg, #e3e5ff, #ffffff)',
    },
  ],
};

export const TYPEFACES: Record<TypefaceId, { name: string; value: string }> = {
  system: { name: '系统', value: fontStacks.sans },
  serif: { name: '宋体', value: fontStacks.serif },
  mono: { name: '等宽', value: fontStacks.mono },
  kai: { name: '手写', value: fontStacks.kai },
};

export const POSTER_RATIOS: Record<PosterRatio, { name: string; width: number; height: number }> = {
  '3:4': { name: '3:4', width: 720, height: 960 },
  '4:5': { name: '4:5', width: 720, height: 900 },
  '9:16': { name: '9:16', width: 720, height: 1280 },
  '1:1': { name: '1:1', width: 720, height: 720 },
};

export const getTheme = (id: string) =>
  FORMAT_THEMES.find((theme) => theme.id === id) ?? FORMAT_THEMES[0];

export const getPosterTheme = (id: PosterThemeId) =>
  POSTER_THEMES.find((theme) => theme.id === id) ?? POSTER_THEMES[0];

export const getPosterPalette = (themeId: PosterThemeId, paletteId: PosterPaletteId) =>
  POSTER_PALETTES[themeId].find((palette) => palette.id === paletteId) ??
  POSTER_PALETTES[themeId][0];

export const getDefaultPaletteId = (themeId: PosterThemeId): PosterPaletteId =>
  POSTER_PALETTES[themeId][0].id;
