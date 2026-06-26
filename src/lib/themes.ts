import type {
  CodeTheme,
  CodeThemeId,
  FormatTheme,
  PosterPalette,
  PosterPaletteId,
  PosterRatio,
  PosterTheme,
  PosterThemeId,
  TypefaceId,
} from '../types/editor';

const BASE_CSS = `
  .platport-content, .platport-content * { box-sizing: border-box; }
  .platport-content {
    color: var(--format-ink);
    background: var(--format-paper);
    font-family: var(--format-font);
    font-size: 16px;
    line-height: 1.86;
    word-break: break-word;
    overflow-wrap: anywhere;
    padding: 36px 38px 44px;
    -webkit-font-smoothing: antialiased;
    text-rendering: optimizeLegibility;
  }
  .platport-content > *:first-child { margin-top: 0; }
  .platport-content > *:last-child { margin-bottom: 0; }
  .platport-content h1,
  .platport-content h2,
  .platport-content h3,
  .platport-content h4 {
    color: var(--format-ink);
    font-family: var(--format-heading);
    font-weight: 760;
    letter-spacing: 0;
  }
  .platport-content h1 {
    font-size: 2.08em;
    line-height: 1.18;
    margin: 0.35em 0 0.88em;
  }
  .platport-content h2 {
    font-size: 1.48em;
    line-height: 1.28;
    margin: 1.8em 0 0.7em;
  }
  .platport-content h3 {
    font-size: 1.17em;
    line-height: 1.36;
    margin: 1.45em 0 0.45em;
  }
  .platport-content h4,
  .platport-content h5,
  .platport-content h6 {
    font-size: 1.02em;
    line-height: 1.4;
    margin: 1.25em 0 0.35em;
  }
  .platport-content p {
    margin: 0.98em 0;
    color: var(--format-ink);
  }
  .platport-content a {
    color: var(--format-accent);
    text-decoration: underline;
    text-underline-offset: 4px;
    text-decoration-thickness: 1px;
  }
  .platport-content strong {
    color: var(--format-strong, var(--format-ink));
    font-weight: 760;
  }
  .platport-content em { color: var(--format-muted); }
  .platport-content ul,
  .platport-content ol {
    margin: 1em 0;
    padding-left: 1.35em;
  }
  .platport-content ul { list-style: disc; }
  .platport-content ol { list-style: decimal; }
  .platport-content li { margin: 0.42em 0; padding-left: 0.15em; }
  .platport-content li { display: list-item; }
  .platport-content li::marker { color: var(--format-accent); font-weight: 700; }
  .platport-content ul.contains-task-list {
    padding-left: 0;
    list-style: none;
  }
  .platport-content li:has(input[type="checkbox"]) {
    display: flex;
    align-items: center;
    gap: 0.5em;
    list-style: none;
    padding-left: 0;
  }
  .platport-content blockquote {
    margin: 1.55em 0;
    padding: 16px 18px;
    background: var(--format-quote-bg);
    color: var(--format-quote-ink);
  }
  .platport-content blockquote p {
    color: inherit;
    margin: 0.45em 0;
  }
  .platport-content hr {
    border: 0;
    height: 1px;
    margin: 2.4em 0;
    background: linear-gradient(90deg, transparent, var(--format-border), transparent);
  }
  .platport-content img {
    display: block;
    max-width: 100%;
    height: auto;
    margin: 1.45em auto;
    border-radius: var(--format-image-radius, 12px);
  }
  .platport-content table {
    width: 100%;
    margin: 1.1em 0;
    table-layout: fixed;
    border-collapse: collapse;
    border-top: 1px solid var(--format-border);
    border-bottom: 1px solid var(--format-border);
    font-size: 0.9em;
    line-height: 1.48;
  }
  .platport-content th,
  .platport-content td {
    border: 0;
    border-bottom: 1px solid var(--format-border);
    padding: 0.68em 0.74em;
    text-align: left;
    vertical-align: top;
    overflow-wrap: anywhere;
    word-break: break-word;
  }
  .platport-content th {
    background: var(--format-faint);
    color: var(--format-ink);
    font-weight: 780;
  }
  .platport-content tbody tr:last-child td {
    border-bottom: 0;
  }
  .platport-content tbody td:first-child {
    color: var(--format-ink);
    font-weight: 760;
  }
  .platport-content .poster-table {
    display: grid;
    width: 100%;
    margin: 1.45em 0;
    border-top: 1px solid var(--format-border);
    font-size: 0.92em;
    line-height: 1.48;
  }
  .platport-content .poster-table-row {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 1.1em;
    align-items: start;
    padding: 0.78em 0;
    border-bottom: 1px solid var(--format-border);
  }
  .platport-content .poster-table-head {
    background: var(--format-accent-soft);
    font-weight: 720;
  }
  .platport-content .poster-table-cell {
    min-width: 0;
    padding: 0 0.2em;
    color: var(--format-ink);
    overflow-wrap: anywhere;
    word-break: break-word;
    text-align: left;
  }
  .platport-content .poster-table-body-row .poster-table-cell:first-child {
    font-weight: 700;
  }
  .platport-content .poster-table[data-columns='1'] .poster-table-row {
    grid-template-columns: 1fr;
  }
  .platport-content .poster-table[data-columns='3'] .poster-table-row {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
  .platport-content .poster-table[data-columns='4'] .poster-table-row,
  .platport-content .poster-table[data-columns='5'] .poster-table-row,
  .platport-content .poster-table[data-columns='6'] .poster-table-row {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .platport-content code {
    font-family: var(--format-mono);
    font-size: 0.88em;
    color: var(--format-code-ink);
    background: var(--format-code-bg);
    border: 1px solid color-mix(in srgb, var(--format-code-border, var(--format-border)) 72%, transparent);
    border-radius: 5px;
    padding: 0.12em 0.36em;
  }
  .platport-content pre {
    margin: 1.5em 0;
    padding: 15px 16px;
    overflow: auto;
    border: 1px solid var(--format-code-border, var(--format-border));
    border-radius: 8px;
    background: var(--format-code-bg);
  }
  .platport-content pre code {
    display: block;
    padding: 0;
    border: 0;
    border-radius: 0;
    background: transparent;
    color: var(--format-code-ink);
    line-height: 1.68;
  }
  .platport-content mark {
    padding: 0.1em 0.24em;
    border-radius: 4px;
    color: inherit;
    background: var(--format-mark, #fff0a8);
  }
  .platport-content kbd {
    display: inline-block;
    padding: 2px 6px;
    border: 1px solid var(--format-border);
    border-bottom-width: 2px;
    border-radius: 5px;
    background: var(--format-faint);
    color: var(--format-ink);
    font-family: var(--format-mono);
    font-size: 0.76em;
    line-height: 1.35;
  }
  .platport-content input[type="checkbox"] {
    margin-right: 8px;
    accent-color: var(--format-accent);
  }
  .platport-content .hljs-comment,
  .platport-content .hljs-quote { color: var(--format-muted); font-style: italic; }
  .platport-content .hljs-keyword,
  .platport-content .hljs-selector-tag,
  .platport-content .hljs-literal,
  .platport-content .hljs-title,
  .platport-content .hljs-section { color: var(--format-accent); }
  .platport-content .hljs-string,
  .platport-content .hljs-attr,
  .platport-content .hljs-template-variable { color: var(--format-code-string, #0f766e); }
  .platport-content .hljs-number,
  .platport-content .hljs-symbol,
  .platport-content .hljs-variable { color: var(--format-code-number, #b45309); }
`;

const fontStacks = {
  sans:
    '"Google Sans", "Product Sans", "Noto Sans SC", "PingFang SC", "Hiragino Sans GB", Arial, sans-serif',
  serif:
    '"Noto Serif SC", "Songti SC", "STSong", "SimSun", "Times New Roman", serif',
  mono: '"SFMono-Regular", "Menlo", "Consolas", "Liberation Mono", monospace',
  kai: '"Kaiti SC", "STKaiti", "KaiTi", "楷体", cursive',
};

const createTheme = (
  theme: Omit<FormatTheme, 'css'> & { extraCss?: string },
): FormatTheme => {
  const cssVars = `
    .platport-content {
      --format-bg: ${theme.tokens.bg};
      --format-paper: ${theme.tokens.paper};
      --format-ink: ${theme.tokens.ink};
      --format-muted: ${theme.tokens.muted};
      --format-faint: ${theme.tokens.faint};
      --format-accent: ${theme.tokens.accent};
      --format-accent-soft: ${theme.tokens.accentSoft};
      --format-border: ${theme.tokens.border};
      --format-quote-bg: ${theme.tokens.quoteBg};
      --format-quote-ink: ${theme.tokens.quoteInk};
      --format-code-bg: ${theme.tokens.codeBg};
      --format-code-ink: ${theme.tokens.codeInk};
      --format-code-border: ${theme.tokens.border};
      --format-font: ${theme.fontFamily};
      --format-heading: ${theme.headingFamily};
      --format-mono: ${fontStacks.mono};
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
      .platport-content h1 { font-size: 2em; }
      .platport-content h2 {
        padding-left: 12px;
        border-left: 5px solid var(--format-accent);
      }
    `,
  }),
  createTheme({
    id: 'platport-dark',
    name: '暗黑阅读',
    description: '黑底高对比，适合观点长文和技术复盘。',
    preview: '#111111',
    fontFamily: fontStacks.sans,
    headingFamily: fontStacks.sans,
    containerStyle:
      'max-width:677px;margin:0 auto;background:#111111;color:#f2f2f2;font-family:"Google Sans","Product Sans","Noto Sans SC","PingFang SC","Hiragino Sans GB",Arial,sans-serif;',
    tokens: {
      bg: '#191919',
      paper: '#111111',
      ink: '#f2f2f2',
      muted: '#b8b8b8',
      faint: '#1d1d1d',
      accent: '#f5f5f5',
      accentSoft: '#242424',
      border: '#3f3f3f',
      quoteBg: '#191919',
      quoteInk: '#d7d7d7',
      codeBg: '#191919',
      codeInk: '#f3f5f7',
      posterBg: '#111111',
      posterFrame: '#111111',
    },
    extraCss: `
      .platport-content h2 {
        color: var(--format-ink);
        padding-left: 12px;
        border-left: 5px solid var(--format-accent);
      }
      .platport-content blockquote {
        border: 1px solid var(--format-border);
      }
      .platport-content hr {
        background: linear-gradient(90deg, transparent, var(--format-border), transparent);
      }
    `,
  }),
  createTheme({
    id: 'platport-paper',
    name: '古典纸纹',
    description: '米白纸面和宋体标题，适合读书笔记。',
    preview: '#f7f4ee',
    fontFamily: fontStacks.serif,
    headingFamily: fontStacks.serif,
    containerStyle:
      'max-width:677px;margin:0 auto;background:#f7f4ee;color:#2f241b;font-family:"Noto Serif SC","Songti SC","STSong","SimSun","Times New Roman",serif;',
    tokens: {
      bg: '#ede6d8',
      paper: '#f7f4ee',
      ink: '#2f241b',
      muted: '#7c6f61',
      faint: '#eee7da',
      accent: '#7b4b24',
      accentSoft: '#eadcc9',
      border: '#d8c8b6',
      quoteBg: '#efe7da',
      quoteInk: '#5b4635',
      codeBg: '#efe7da',
      codeInk: '#3f3024',
      posterBg: '#f7f4ee',
      posterFrame: '#f7f4ee',
    },
    extraCss: `
      .platport-content {
        background:
          radial-gradient(circle at 18% 8%, rgba(123, 75, 36, 0.08) 0 1px, transparent 2px),
          radial-gradient(circle at 72% 46%, rgba(123, 75, 36, 0.06) 0 1px, transparent 2px),
          var(--format-paper);
        background-size: 64px 64px, 90px 90px, auto;
      }
      .platport-content h2 {
        color: var(--format-accent);
      }
      .platport-content blockquote {
        border: 1px solid var(--format-border);
      }
    `,
  }),
  createTheme({
    id: 'platport-note',
    name: '备忘录',
    description: '清爽系统感，适合教程和清单。',
    preview: '#ffffff',
    fontFamily: fontStacks.sans,
    headingFamily: fontStacks.sans,
    containerStyle:
      'max-width:677px;margin:0 auto;background:#ffffff;color:#1f2937;font-family:"Google Sans","Product Sans","Noto Sans SC","PingFang SC","Hiragino Sans GB",Arial,sans-serif;',
    tokens: {
      bg: '#f1f2f4',
      paper: '#ffffff',
      ink: '#1f2937',
      muted: '#6b7280',
      faint: '#f5f5f7',
      accent: '#0a84ff',
      accentSoft: '#eaf4ff',
      border: '#e5e7eb',
      quoteBg: '#f5f5f7',
      quoteInk: '#4b5563',
      codeBg: '#f5f5f7',
      codeInk: '#243042',
      posterBg: '#ffffff',
      posterFrame: '#ffffff',
    },
    extraCss: `
      .platport-content h2 {
        padding-bottom: 8px;
        border-bottom: 1px solid var(--format-border);
      }
      .platport-content blockquote {
        border-left: 4px solid var(--format-accent);
        border-radius: 8px;
      }
    `,
  }),
  createTheme({
    id: 'platport-blue',
    name: '蓝色标注',
    description: '蓝色强调块，适合观点拆解和方法论。',
    preview: '#0a7cff',
    fontFamily: fontStacks.sans,
    headingFamily: fontStacks.sans,
    containerStyle:
      'max-width:677px;margin:0 auto;background:#f8fbff;color:#162033;font-family:"Google Sans","Product Sans","Noto Sans SC","PingFang SC","Hiragino Sans GB",Arial,sans-serif;',
    tokens: {
      bg: '#e9f1fb',
      paper: '#f8fbff',
      ink: '#162033',
      muted: '#5c6b81',
      faint: '#eef6ff',
      accent: '#0a7cff',
      accentSoft: '#dcecff',
      border: '#c9ddf4',
      quoteBg: '#eaf4ff',
      quoteInk: '#1f4e8c',
      codeBg: '#eaf4ff',
      codeInk: '#17324d',
      posterBg: '#f8fbff',
      posterFrame: '#f8fbff',
    },
    extraCss: `
      .platport-content h2 {
        display: inline;
        box-decoration-break: clone;
        -webkit-box-decoration-break: clone;
        background: var(--format-accent-soft);
        line-height: 1.5;
      }
      .platport-content h2 + * {
        margin-top: 1em;
      }
      .platport-content blockquote {
        border-left: 5px solid var(--format-accent);
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
      bg: '#f3f8ff',
      frame: '#f8fbff',
      ink: '#303033',
      muted: '#575b60',
      accent: '#0a84ff',
      border: '#dcecff',
      surface: '#eaf4ff',
      imageBackdrop: 'linear-gradient(135deg, #e8f3ff, #ffffff)',
    },
    {
      id: 'ios-graphite',
      name: '灰阶',
      description: '弱化蓝色，偏沉稳。',
      preview: '#8e8e93',
      bg: '#f4f4f6',
      frame: '#fbfbfc',
      ink: '#2c2c2e',
      muted: '#636366',
      accent: '#8e8e93',
      border: '#d9d9de',
      surface: '#ececef',
      imageBackdrop: 'linear-gradient(135deg, #eceef2, #ffffff)',
    },
    {
      id: 'ios-mint',
      name: '薄荷',
      description: '清爽备忘录感。',
      preview: '#30d158',
      bg: '#f3fbf5',
      frame: '#fbfffc',
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

const DARK_CODE_THEME: CodeTheme = {
  id: 'ink',
  name: '墨色代码',
  bg: '#1f2933',
  ink: '#e9f1f7',
  border: '#3f4d5c',
  string: '#8fe6c6',
  number: '#f5c27a',
  keyword: '#8bb8ff',
  quoteBg: '#1a242d',
  quoteInk: '#d4e2ed',
  quoteBorder: '#6ea8ff',
};

const LIGHT_CODE_THEME: CodeTheme = {
  id: 'paper',
  name: '纸面代码',
  bg: '#eef4fb',
  ink: '#233142',
  border: '#c9d7e6',
  string: '#147d64',
  number: '#9a5a16',
  keyword: '#315db5',
  quoteBg: '#f2f6fa',
  quoteInk: '#33465c',
  quoteBorder: '#7da2cf',
};

export const CODE_THEMES: Record<CodeThemeId, { name: string }> = {
  auto: { name: '跟随模板' },
  ink: { name: DARK_CODE_THEME.name },
  paper: { name: LIGHT_CODE_THEME.name },
};

export function getCodeTheme(id: CodeThemeId, posterThemeId: PosterThemeId) {
  if (id === 'ink') return DARK_CODE_THEME;
  if (id === 'paper') return LIGHT_CODE_THEME;
  return posterThemeId === 'dark-reader' ? DARK_CODE_THEME : LIGHT_CODE_THEME;
}

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
