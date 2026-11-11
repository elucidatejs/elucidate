# Components

Every component on this page works in any MDX file without an import. During development,
`/components/` shows each one rendered, with its source; set `showcase: 'public'` to publish that
page too (it is kept out of search engines).

- [Figure](#figure)
- [Block](#block)
- [Aside](#aside)
- [Note](#note)
- [Button](#button)
- [Overlay](#overlay)
- [Acknowledgments](#acknowledgments), [Contributions](#contributions),
  [AppendixSection](#appendixsection)
- [ArticleList](#articlelist)
- [Controls](#controls) for interactive figures
- [The data palette](#the-data-palette)
- [Blocks for a bespoke article](#blocks-for-a-bespoke-article)

## Figure

A figure or table with a number, a caption, a description and a static fallback.

```mdx
import Explorer from './figures/Explorer.astro';
import explorerStill from './figures/explorer.png';

<Figure
  id="fig:explorer"
  width="wide"
  caption="Gradient descent with and without momentum."
  description="Two paths descend a long valley. The one with momentum …"
  fallback={explorerStill}
>
  <Explorer />
</Figure>
```

| Prop          | Default  | Meaning                                                                                              |
| ------------- | -------- | ---------------------------------------------------------------------------------------------------- |
| `id`          | none     | `fig:…` or `tbl:…`; gives the figure a number and lets the text refer to it (`@fig:explorer`).       |
| `kind`        | `figure` | `figure` ("Figure 2") or `table` ("Table 1"; the caption goes above).                                |
| `width`       | `text`   | `text`, `wide`, `page`, `screen`, or `margin` (beside the text at 1280px and wider).                 |
| `caption`     | none     | Plain caption. For math, code or links, use a `<Fragment slot="caption">` child instead.             |
| `description` | none     | Long description for screen readers, behind a "Description" disclosure. Needed for interactive ones. |
| `fallback`    | none     | Image (imported, or a URL) shown instead of the content in print and without JavaScript.             |
| `credit`      | none     | Source of a reused figure ("Figure from …"); such figures are excluded from the reuse license.      |

A figure that contains a framework island (a component with a `client:` directive) and has no
`description` prints a build warning.

## Block

Puts any content at a wider width. Below 640px, `wide` and `page` content runs edge to edge.

```mdx
<Block width="page">
  …
</Block>
```

| Prop    | Default | Meaning                                  |
| ------- | ------- | ---------------------------------------- |
| `width` | `wide`  | `text`, `wide`, `page` or `screen`.      |
| `class` | none    | Extra classes, for your own CSS.         |

## Aside

A remark beside the text, without a number: in the right margin at 1280px and wider, inline with a
hairline on the left below that. Put it just before the paragraph it belongs to; it lines up with
that paragraph's first line. Use a footnote instead when the reader should see that a note exists.

```mdx
<Aside>Momentum is also called the heavy-ball method.</Aside>

The paragraph the aside belongs to.
```

## Note

A short passage set apart in the text column by a hairline, in small muted text.

```mdx
<Note label="Caveat">This holds for quadratics only.</Note>
```

| Prop    | Default | Meaning                                    |
| ------- | ------- | ------------------------------------------ |
| `label` | none    | A short label above the note, in capitals. |

## Button

A pill for actions that change the page, such as opening an overlay. For navigation, prefer a
plain link.

```mdx
<Button>Run</Button>
<Button variant="secondary">Reset</Button>
```

| Prop      | Default   | Meaning                                                                  |
| --------- | --------- | ------------------------------------------------------------------------ |
| `variant` | `primary` | `primary` (filled) or `secondary` (outlined).                            |
| `href`    | none      | Renders a link that looks like a button.                                 |
| others    |           | Passed to the `<button>` or `<a>`, e.g. `id`, `disabled`, `data-*`.      |

## Overlay

A modal view for tools that need more room: a centered dialog, a drawer on the right, or the full
window. It is a native `<dialog>`, so focus stays inside while it is open.

```mdx
<Overlay id="explorer" title="Momentum explorer" size="full" trigger="Open the explorer">
  <Explorer />
</Overlay>
```

| Prop          | Default  | Meaning                                                                         |
| ------------- | -------- | ------------------------------------------------------------------------------- |
| `id`          | required | Names the overlay in the URL.                                                   |
| `title`       | required | Shown in the title bar and announced when it opens.                             |
| `size`        | `dialog` | `dialog` (centered, at most 720px wide), `drawer` (right side) or `full`.       |
| `trigger`     | none     | Label of a button, placed where the overlay is written, that opens it.          |
| `dismissible` | `true`   | Whether a click on the backdrop closes it. Esc always does.                     |

- Opening sets the URL hash (`#explorer`), so the view can be shared; loading that URL opens it,
  and Back closes it. Any link to `#explorer` opens it too.
- Closing returns focus to whatever opened it.
- Tooltips, menus and legends inside an overlay should use the
  [Popover API](https://developer.mozilla.org/docs/Web/API/Popover_API): popovers sit in the top
  layer, above the overlay, without `z-index`.
- Without JavaScript, the overlay's content is shown in place.

From a script:

```ts
import { close, open } from 'astro-elucidate/client';

open('explorer');
close('explorer'); // or close() for every open overlay
```

## Acknowledgments

Written at the end of an article; the first section of the appendix. See
[writing.md](writing.md#appendix).

```mdx
<Acknowledgments>We thank …</Acknowledgments>
```

## Contributions

Who did what; the second section of the appendix.

```mdx
<Contributions>A.L. wrote the article; C.B. drew the figures.</Contributions>
```

## AppendixSection

Supplementary sections, after the contributions. With an `id` starting with `sec:`, the text can
refer to it (`@sec:proofs`).

| Prop    | Default  | Meaning                                  |
| ------- | -------- | ---------------------------------------- |
| `title` | required | The section's label, e.g. "A. Proofs".   |
| `id`    | none     | `sec:…`, for cross-references.           |

```mdx
<AppendixSection title="A. Proofs" id="sec:proofs">…</AppendixSection>
```

## ArticleList

The rows of the article index (label line, title, description), newest first, anywhere: on a
homepage of your own (`home: 'page'`), say. It lists published articles only.

```mdx
<ArticleList limit={3} tag="graphs" />
```

| Prop    | Default | Meaning                                   |
| ------- | ------- | ----------------------------------------- |
| `limit` | all     | Show at most this many articles.          |
| `tag`   | none    | Only articles with this tag.              |

## Controls

Classes for the controls of interactive figures. They are monochrome, so the figure carries the
color, and show a 2px focus ring.

```html
<input class="el-slider" type="range" min="0" max="1" step="0.01" />

<div class="el-segmented" role="radiogroup" aria-label="Step size">
  <label><input type="radio" name="step" value="0.1" checked /><span>0.1</span></label>
  <label><input type="radio" name="step" value="1" /><span>1</span></label>
</div>

<label class="el-toggle"><input type="checkbox" role="switch" /> Show the path</label>
```

`el-segmented` also styles `<button aria-pressed="true|false">` children.

## The data palette

Colors for figures, chosen so that neighboring colors stay apart for readers with color vision
deficiencies, with separate light and dark versions:

- `--el-data-1` … `--el-data-8`: categorical colors, based on the Okabe–Ito palette. Use them in
  order; each has at least 3:1 contrast with the page.
- `--el-seq-0` … `--el-seq-8`: a sequential blue ramp, from faint to strong. In dark mode, faint
  is dark.
- `--el-div-0` … `--el-div-8`: a diverging ramp, blue to a gray midpoint (`--el-div-4`) to orange.
- `--el-data-grid` for axes and gridlines, `--el-data-label` for tick and axis labels.

In CSS, use the tokens directly. In a script, read them with `palette()`, which resolves the
tokens on the page, so your theme overrides apply:

```ts
import { onThemeChange, palette } from 'astro-elucidate/palette';

let colors = palette();
// colors.categorical: 8 colors   colors.sequential(t), colors.diverging(t): t from 0 to 1
// colors.text, colors.muted, colors.grid, colors.background
onThemeChange(() => {
  colors = palette();
  redraw();
});
```

`diverging(0.5)` is the neutral midpoint. Both ramp functions return colors D3 can use as
interpolators, e.g. `d3.scaleSequential(colors.sequential)`. `palette(element)` resolves tokens
overridden on an element. `onThemeChange` returns a function that stops listening.

## Blocks for a bespoke article

An article with `layout: bespoke` gets only the site header (none with `header: false`) and its
own content. It composes the rest from these blocks, available without an import in that article:

| Block                 | Renders                                                            |
| --------------------- | ------------------------------------------------------------------ |
| `<ArticleTitle />`    | The title block: eyebrow, title, description and hero.             |
| `<Byline />`          | Authors, affiliations, dates and DOI.                              |
| `<Abstract />`        | The abstract from the front matter.                                |
| `<TableOfContents />` | The "Contents" list.                                               |
| `<Appendix />`        | The generated appendix: footnotes, references, citation and more.  |

Numbering, cross-references, citations, footnotes and the scholarly meta tags work as in any
article. The blocks use your [overrides](customizing.md#6-overrides).
