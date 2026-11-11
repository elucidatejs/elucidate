# Design language

Elucidate looks calm by default: a white (or near-black) canvas, type-led hierarchy, and color
reserved for figures and data. Every visual decision is a `--el-*` token you can override in
`src/styles/theme.css` (see [customizing.md](customizing.md)).

## Principles

1. Type carries the hierarchy: size, weight and space, not boxes or color.
2. The interface is monochrome. Links use the text color and are underlined.
3. Color means data: colored pixels belong to figures and visuals.
4. Headings use weight 500 with slightly tightened tracking at large sizes.
5. Space over separators: few hairlines, no shadows except on overlays.
6. Technical accents, sparingly: uppercase monospace labels for metadata, `→` for links that go
   somewhere, and a faint grid behind the top of the page.

## Typography

Inter (400–600, variable) for all text and JetBrains Mono (400, 500) for code and labels, both
self-hosted through the Astro Fonts API. Only the Latin subsets of the two regular files are
preloaded.

| Token | Default | Use |
|---|---|---|
| `--el-font-sans` | Inter | Headings, body, interface |
| `--el-font-mono` | JetBrains Mono | Code and the label tier |
| `--el-font-serif` | Source Serif 4 | Optional; load it yourself and set `--el-font-body` |
| `--el-font-body` | `var(--el-font-sans)` | Article body |
| `--el-text-display` | 48px (40px on phones) | Article title |
| `--el-text-h2` / `--el-text-h3` | 28px / 20px | Sections / subsections |
| `--el-text-lead` | 22px | Description under the title |
| `--el-text-body` | 18px | Article body |
| `--el-text-ui` / `--el-text-small` | 16px / 14px | Interface / captions, byline, contents |
| `--el-text-label` | 12px | Uppercase monospace labels |

## Color

Colors are defined once with `light-dark()`, so dark mode follows the system without JavaScript and
the toggle switches `color-scheme`.

| Token | Light | Dark |
|---|---|---|
| `--el-bg` | #FFFFFF | #0D0D0D |
| `--el-surface` | #F7F7F7 | #1A1A1A |
| `--el-border` | #E5E5E5 | #2E2E2E |
| `--el-text-muted` | #6B6B6B | #A3A3A3 |
| `--el-text` | #0D0D0D | #F5F5F5 |
| `--el-accent` | `var(--el-text)` | `var(--el-text)` |
| `--el-backdrop` | rgb(0 0 0 / 0.4) | rgb(0 0 0 / 0.6) |

## Space, widths and other tokens

- Spacing: `--el-space-1` (4px) to `--el-space-10` (96px).
- Widths: `--el-width-text` 680px, `--el-width-wide` 920px, `--el-width-page` 1200px,
  `--el-width-margin` 240px; `--el-gutter` 20px side padding.
- Radii: `--el-radius-sm` 6px, `--el-radius-md` 12px, `--el-radius-pill` 999px.
- Motion: `--el-duration` 180ms (0 with reduced motion), `--el-ease`.
- Layering: `--el-z-header`, `--el-z-toc`, `--el-z-popover`.
- `--el-shadow-overlay`: the only shadow, for cards.
- `--el-motif-grid`: the faint grid behind the page top; set it to `none` to remove it.

## Layout grid

Articles and pages use a CSS grid with named lines, from outside in: `screen`, `page`, `wide` and
`text`. Content sits in `text` by default. Below 640px, wide and page content runs edge to edge;
at 1280px and wider, the table of contents floats in the left margin.

## Scholarly elements

- **Figures**: captions in the small text size, muted, led by an uppercase monospace label
  ("FIGURE 2"). Table captions sit above the table, figure captions below. `width="margin"` floats
  a small figure into the right margin at 1280px and wider.
- **Equations**: display math is centered with its number at the right edge; on phones a long
  equation scrolls sideways and its number follows it.
- **Citations and footnote numbers**: small superscript numbers in the text color, grouped in
  brackets for citations.
- **Sidenotes**: at 1280px and wider, a footnote sits in the right margin next to its reference,
  in the small text size. Below that, footnotes and citations open as cards.
- **Cards**: the one overlay with a shadow, on the page background with a hairline border and
  `--el-radius-md`, at most 420px wide.
- **Appendix**: after one hairline below the article, set in the sans face at the small size and
  the muted color; each section has an uppercase monospace label in a left column at 1024px and
  wider. The citation and BibTeX boxes use the surface color, with a copy button.
