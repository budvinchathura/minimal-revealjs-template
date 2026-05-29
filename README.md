# Minimal Reveal.js Research Template

Local, npm-based Reveal.js setup for research talks with split HTML slides,
chapter-aware TOC generation, MathJax, and citation support.

## Quick start

```bash
npm install
npm run start
```

## Features

- Split slide authoring with per-chapter HTML files
- Beamer-style chapters and subchapters via custom markers
- Auto-generated table of contents slide
- MathJax equations and syntax highlighting
- BibTeX citations rendered into a references slide

## Files

- `index.html` mounts the deck
- `main.js` imports and orders slides
- `slides/` contains per-chapter HTML
- `custom.css` holds the theme and layout helpers
- `public/refs.bib` is the BibTeX source for citations
- `public/assets/` holds static figures referenced by HTML slides

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

To render a table of contents slide, add a placeholder element:

```html
<section>
	<div class="slide-title">
		<h2>Table of Contents</h2>
	</div>
	<div class="slide-content" id="toc-placeholder"></div>
</section>
```

If the placeholder is absent, no TOC is generated.

## Citations

Use the custom element inside slide HTML:

```html
<cite-ref key="smith2024"></cite-ref>
```

Add a references slide with:

```html
<div id="bibliography"></div>
```
