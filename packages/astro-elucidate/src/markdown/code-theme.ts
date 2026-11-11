// Grayscale syntax highlighting: tone and weight, not hue (docs/spec.md §12.6).
function theme(type: 'light' | 'dark', text: string, muted: string) {
  return {
    name: `elucidate-${type}`,
    type,
    colors: { 'editor.foreground': text, 'editor.background': '#00000000' },
    tokenColors: [
      { settings: { foreground: text } },
      {
        scope: ['comment', 'punctuation.definition.comment'],
        settings: { foreground: muted, fontStyle: 'italic' },
      },
      {
        scope: ['string', 'constant.numeric', 'constant.language'],
        settings: { foreground: muted },
      },
      {
        scope: ['keyword', 'storage', 'storage.type', 'storage.modifier'],
        settings: { fontStyle: 'bold' },
      },
    ],
  };
}

export const shikiConfig = {
  themes: {
    light: theme('light', '#0d0d0d', '#6b6b6b'),
    dark: theme('dark', '#f5f5f5', '#a3a3a3'),
  },
  defaultColor: false as const,
};
