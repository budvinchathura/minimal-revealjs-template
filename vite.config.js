import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

import slides from './build/slides-plugin.js';

export default defineConfig({
  // Relative URLs, so the built deck works from any folder or file://.
  base: './',
  plugins: [
    slides({
      slidesDir: 'slides',
      bibFile: 'refs.bib',
      citationStyle: 'vancouver',
      // Footer with the references cited on each slide: 'short', 'full' or 'none'.
      slideCitations: 'short',
    }),
    // `vite build` emits a single index.html with all JS, CSS and fonts inlined.
    // Files in public/ (figures, videos, ...) are copied next to it as-is.
    viteSingleFile(),
  ],
});
