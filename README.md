# Minimal Reveal.js Research Template

Reveal.js setup for research talks, with slides split across HTML files, a
chapter-aware table of contents, LaTeX math, BibTeX citations and syntax
highlighting.

`npm run build` produces **one self-contained `index.html`**: all JavaScript,
CSS and fonts are inlined and nothing is fetched from a CDN. Only your media
files (figures, videos, …) sit next to it, so you can copy the `dist/` folder
to any machine and present offline, even straight from `file://`.

## Quick start

```bash
npm install
npm start          # dev server with live reload of slides, styles and refs.bib
npm run build      # single-file build in dist/
npm run preview    # serve dist/ locally
```

Requires Node.js 20.19+ or 22.12+.

## Project layout

| Path | Purpose |
| --- | --- |
| `slides/*.html` | Slide files, included in file-name order (`00-cover.html`, `01-…`). Files starting with `_` are skipped (drafts, e.g. `_04-model.html`). |
| `refs.bib` | BibTeX source for citations. |
| `public/media/` | Figures, images, videos. Reference them as `./media/figure.svg`. Copied to `dist/media/` as-is. |
| `styles/custom.css` | Theme colors and layout helpers. |
| `styles/code.css` | Code listing style (dark *a11y-dark* theme). |
| `styles/theme.css` | Local copy of Reveal's *simple* theme (no Google Fonts import). |
| `styles/fonts.css` | Self-hosted fonts (Lato, News Cycle, JetBrains Mono). |
| `main.js` | Reveal setup, TOC navigation. |
| `build/` | Vite plugin that renders math, citations, TOC and code highlighting ahead of time. |

## How it works

The slide files are processed by a Vite plugin (`build/slides-plugin.js`) both in
the dev server and in the build, so what you see in `npm start` is what you
ship:

- **Math**: MathJax v4 runs in Node and turns TeX into SVG. The browser loads
  no MathJax and no math fonts.
- **Screen-reader speech**: in `npm run build`, every equation also gets a spoken
  description (MathJax's speech-rule engine, ClearSpeak) and Nemeth braille as
  ARIA labels. This is skipped in dev because it costs ~0.1 s per equation on
  every save; enable it there with `slides({ speech: true })` in
  `vite.config.js`. MathJax's interactive explorer (keyboard navigation inside an
  equation) is not included, as it needs the full MathJax runtime and a web worker.
- **Citations and bibliography** are resolved from `refs.bib`.
- **Code** is highlighted with highlight.js.
- **Chapters / TOC** are generated from the chapter markers.

Warnings (TeX errors, unknown citation keys, unknown code languages) are
printed in the terminal. TeX errors are also shown in place on the slide.

## Math

Use `$…$` or `\(…\)` inline and `$$…$$` or `\[…\]` for display math. Write a
literal dollar sign as `\$`. Math inside `<pre>`/`<code>` is left alone.

Custom macros go in `vite.config.js`:

```js
slides({ tex: { macros: { R: '\\mathbb{R}', norm: ['\\lVert #1 \\rVert', 1] } } })
```

## Chapters and table of contents

Add chapter markers immediately before the first slide in that chapter:

```html
<x-chapter>Problem</x-chapter>
<section>
	...
</section>
```

Optional subchapters work the same way:

```html
<x-subchapter>Model formulation</x-subchapter>
<section>
	...
</section>
```

Titles may contain math and other inline HTML (`<x-chapter>Training with $L_1$</x-chapter>`).

To render a table of contents slide, add a placeholder element:

```html
<section>
	<div class="slide-title">
		<h2>Table of Contents</h2>
	</div>
	<div class="slide-content" id="toc-placeholder"></div>
</section>
```

If the placeholder is absent, no TOC is generated. The button in the bottom-left
corner jumps back to the TOC slide.

## Citations

```html
<cite-ref key="smith2024"></cite-ref>             <!-- [1] -->
<cite-ref key="smith2024, liu2022"></cite-ref>    <!-- [1, 3] -->
```

References are numbered in order of first citation. Add a references slide with:

```html
<div id="bibliography"></div>
```

Every slide that cites something also gets a footer listing those references,
so the audience can follow them without the references slide:

```
[2] Garcia et al., 2023    [3] Brown, 2021
```

Set the default with `slideCitations` in `vite.config.js` (`'short'`, `'full'`
for the complete reference, or `'none'`), and override it per slide:

```html
<section data-citations="full"> … </section>   <!-- full reference text -->
<section data-citations="none"> … </section>   <!-- no footer, e.g. the title slide -->
```

The citation style (`vancouver` by default; `apa` and `harvard1` are also
available) and whether uncited entries are listed (`includeUncited`) are set in
`vite.config.js`.

## Code

```html
<pre><code class="language-python" data-trim>
def f(x):
    return x ** 2
</code></pre>
```

Supported attributes, as in Reveal's highlight plugin:

- `data-trim` removes surrounding blank lines and common indentation.
- `data-line-numbers` shows line numbers. `data-line-numbers="1|2-3"` steps
  through highlighted lines as fragments, and `data-ln-start-from="10"` sets the
  first line number.
- `data-noescape` treats HTML inside the block as markup instead of code.

HTML inside a code block is shown literally, but `<` and `&` still need to be
written as `&lt;` and `&amp;` where they could be read as markup.
