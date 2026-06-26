import { beforeEach, describe, expect, it } from 'vitest';
import { buildMarkdown, useEditorStore } from './useEditorStore';

describe('useEditorStore history', () => {
  beforeEach(() => {
    const state = useEditorStore.getState();
    useEditorStore.setState({
      noteTitle: 'Title',
      noteSummary: 'Summary',
      noteBody: 'Body',
      hashtags: '#one',
      coverImage: '',
      markdown: buildMarkdown('Title', 'Body'),
      past: [],
      future: [],
      canUndo: false,
      canRedo: false,
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
    });
  });

  it('undo and redo restore the content fields and derived markdown together', () => {
    const store = useEditorStore.getState();
    store.pushHistory();
    store.setNoteTitle('Next title');
    store.setNoteBody('Next body');

    useEditorStore.getState().undo();
    expect(useEditorStore.getState().noteTitle).toBe('Title');
    expect(useEditorStore.getState().noteBody).toBe('Body');
    expect(useEditorStore.getState().markdown).toBe(buildMarkdown('Title', 'Body'));

    useEditorStore.getState().redo();
    expect(useEditorStore.getState().noteTitle).toBe('Next title');
    expect(useEditorStore.getState().noteBody).toBe('Next body');
    expect(useEditorStore.getState().markdown).toBe(buildMarkdown('Next title', 'Next body'));
  });
});
