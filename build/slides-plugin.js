// Vite plugin that provides the deck as virtual modules:
//
//   import slidesHtml from 'virtual:slides';  // the processed slide HTML
//   import 'virtual:slides.css';              // CSS for the rendered math
//
// The same processing runs for `vite` (dev) and `vite build`. In dev, editing a
// slide file or the BibTeX file hot-swaps the slides without a page reload.

import path from 'node:path';
import { normalizePath } from 'vite';

import { buildDeck } from './deck.js';
import { mathStylesheet } from './math.js';

const SLIDES_ID = 'virtual:slides';
const STYLES_ID = 'virtual:slides.css';
const RESOLVED_SLIDES_ID = `\0${SLIDES_ID}`;
const RESOLVED_STYLES_ID = `\0${STYLES_ID}`;

/**
 * @param {object} [userOptions]
 * @param {string} [userOptions.slidesDir='slides'] Folder with the slide files.
 * @param {string} [userOptions.bibFile='refs.bib'] BibTeX file for citations.
 * @param {string} [userOptions.citationStyle='vancouver'] CSL template (apa, vancouver, harvard1).
 * @param {boolean} [userOptions.includeUncited=false] List uncited entries in the bibliography too.
 * @param {object} [userOptions.tex] Extra MathJax TeX options, e.g. { macros: { R: '\\mathbb{R}' } }.
 * @param {boolean} [userOptions.speech] Generate spoken descriptions of math for screen readers.
 *   Defaults to on for `vite build` and off in dev, where it would slow down every save.
 */
export default function slides(userOptions = {}) {
  let options;
  let logger;
  let isBuild;
  let pending = Promise.resolve();

  const isDeckSource = (file) =>
    file === options.bibFile || (path.posix.dirname(file) === options.slidesDir && file.endsWith('.html'));

  return {
    name: 'reveal-slides',

    configResolved(config) {
      logger = config.logger;
      isBuild = config.command === 'build';
      options = {
        slidesDir: normalizePath(path.resolve(config.root, userOptions.slidesDir ?? 'slides')),
        bibFile: normalizePath(path.resolve(config.root, userOptions.bibFile ?? 'refs.bib')),
        citationStyle: userOptions.citationStyle ?? 'vancouver',
        includeUncited: userOptions.includeUncited ?? false,
        tex: userOptions.tex ?? {},
        speech: userOptions.speech ?? isBuild,
        warn: (message) => logger.warn(`[slides] ${message}`, { timestamp: true }),
      };
    },

    resolveId(id) {
      if (id === SLIDES_ID) return RESOLVED_SLIDES_ID;
      if (id === STYLES_ID) return RESOLVED_STYLES_ID;
    },

    async load(id) {
      if (id === RESOLVED_STYLES_ID) {
        return mathStylesheet(options);
      }
      if (id !== RESOLVED_SLIDES_ID) {
        return;
      }
      // Renders share one MathJax instance; run them one at a time.
      const result = pending.then(() => buildDeck(options));
      pending = result.catch(() => {});
      const { html, files } = await result;
      if (isBuild) {
        // For `vite build --watch`; the dev server uses hotUpdate below.
        for (const file of [...files, options.bibFile]) {
          this.addWatchFile(file);
        }
      }
      return `export default ${JSON.stringify(html)};`;
    },

    hotUpdate({ file, timestamp }) {
      if (this.environment.name !== 'client' || !isDeckSource(file)) {
        return;
      }
      const moduleGraph = this.environment.moduleGraph;
      const deckModule = moduleGraph.getModuleById(RESOLVED_SLIDES_ID);
      if (!deckModule) {
        return;
      }
      moduleGraph.invalidateModule(deckModule, new Set(), timestamp, true);
      return [deckModule];
    },
  };
}
