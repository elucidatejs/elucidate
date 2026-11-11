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

## Data palette

For figures only. Categorical colors are the Okabe–Ito hues, tuned per mode so that each has at
least 3:1 contrast with the page background and the surface, and so that neighbors in the order
below stay distinguishable with protanopia and deuteranopia (ΔE ≥ 9 in OKLab, simulated) and with
full color vision (ΔE ≥ 18). Use them in order. The first three also stay apart from each other in any arrangement, so they
suit scatter plots. The ramps change lightness evenly from step to step, and their faintest colored
step still has 2:1 contrast with the page; the diverging midpoint is a faint gray on purpose.

| Token | Light | Dark |
|---|---|---|
| `--el-data-1` blue | #0571B0 | #2C8ACC |
| `--el-data-2` orange | #B97F02 | #C18503 |
| `--el-data-3` green | #009E73 | #23AB7F |
| `--el-data-4` violet | #7B5CC4 | #9274DE |
| `--el-data-5` vermillion | #D45E05 | #E36A1C |
| `--el-data-6` sky blue | #3596CA | #3C9CD0 |
| `--el-data-7` olive | #999008 | #A09600 |
| `--el-data-8` pink | #BF6D9B | #C673A1 |
| `--el-seq-0` … `--el-seq-8` | #87BCE9 → #002843 | #1E4E72 → #C8E5FE |
| `--el-div-0` … `--el-div-8` | #024167 → #E4E4E4 → #5F2E01 | #C2E3FF → #353535 → #FED4B9 |
| `--el-data-grid` | `var(--el-border)` | |
| `--el-data-label` | `var(--el-text-muted)` | |

Scripts read the resolved values with `palette()` from `astro-elucidate/palette`
([components.md](components.md#the-data-palette)).

## Space, widths and other tokens

- Spacing: `--el-space-1` (4px) to `--el-space-10` (96px).
- Widths: `--el-width-text` 680px, `--el-width-wide` 920px, `--el-width-page` 1200px,
  `--el-width-margin` 240px; `--el-gutter` 20px side padding.
- Radii: `--el-radius-sm` 6px, `--el-radius-md` 12px, `--el-radius-pill` 999px.
- Motion: `--el-duration` 180ms (0 with reduced motion), `--el-ease`.
- Layering: `--el-z-header`, `--el-z-toc`, `--el-z-popover`.
- `--el-shadow-overlay`: the only shadow, for overlays.
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
- **Cards**: on the surface color with a hairline border and `--el-radius-sm`, at most 360px wide,
  without a shadow.
- **Appendix**: a full-width band on the surface color, set in the sans face at the small size and
  the muted color; each section has an uppercase monospace label in a left column at 1024px and
  wider. The last section, "Cite this article", shows the citation and BibTeX in monospace boxes on
  the page background.
- **Aside and Note**: a 2px hairline on the left and small muted text, without a background. An
  aside moves into the right margin at 1280px and wider, level with the paragraph after it.
- **Buttons**: pills, only for actions that change the page. Primary is filled with the text
  color; secondary is outlined.
- **Controls** (`el-slider`, `el-segmented`, `el-toggle`): monochrome, with a black (white in dark
  mode) thumb on a gray track, segmented pills, and a switch.
- **Overlays**: a native dialog on the page background with `--el-radius-md` and the overlay
  shadow over `--el-backdrop`; full-window overlays have neither radius nor shadow. A title bar
  with a close button sits on top.
- **Copy controls**: the word COPY in label style, which reads COPIED for two seconds after a
  click; screen readers hear the same through a live region.

## Print

Printed articles use one light column on A4 or Letter, whatever the screen theme: every width
collapses into the text column, a margin figure stays small, and the type is set in points. The
header, footer, contents, sidenotes (the appendix lists the footnotes), buttons and tags are left
out; an interactive figure prints its `fallback` image, and a reference whose link is not its DOI
prints the address after its title. Figures, equations, code blocks and table rows are not split
across pages. Adjust any of it with `@media print` in `src/styles/theme.css`.
