# Minimal Reveal.js Research Template

Local, npm-based reveal.js setup with split HTML slides and citation support.

## Quick start

```bash
npm install
npm run start
```

## Files

- `index.html` mounts the deck
- `main.js` imports and orders slides
- `slides/` contains per-section HTML
- `custom.css` holds the theme and layout helpers
- `public/refs.bib` is the BibTeX source for citations
- `public/assets/` holds static figures referenced by HTML slides

## Citations

Use the custom element inside slide HTML:

```html
<cite-ref key="smith2024"></cite-ref>
```

Add a references slide with:

```html
<div id="bibliography"></div>
```
