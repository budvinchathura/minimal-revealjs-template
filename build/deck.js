// Assembles slides/*.html into one deck and resolves everything that can be
// done ahead of time: chapters + TOC, code highlighting, citations and math.

import fs from 'node:fs/promises';
import path from 'node:path';

import { buildTableOfContents } from './chapters.js';
import { renderCitations } from './citations.js';
import { highlightCode } from './highlight.js';
import { getMathJax, renderMath } from './math.js';

/** Slide files in deck order: sorted by name, skipping files that start with "_". */
export async function listSlideFiles(slidesDir) {
  const names = await fs.readdir(slidesDir);
  return names
    .filter((name) => name.endsWith('.html') && !name.startsWith('_'))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
    .map((name) => path.join(slidesDir, name));
}

export async function buildDeck(options) {
  const { slidesDir, bibFile, citationStyle, includeUncited, slideCitations, warn } = options;

  const files = await listSlideFiles(slidesDir);
  const sources = await Promise.all(files.map((file) => fs.readFile(file, 'utf8')));
  const bibtex = await fs.readFile(bibFile, 'utf8').catch(() => null);

  const MathJax = await getMathJax(options);
  const doc = MathJax.startup.adaptor.parse(
    `<!DOCTYPE html><html><head></head><body>${sources.join('\n')}</body></html>`,
  );

  // Order matters: the TOC copies chapter titles before math is typeset, and
  // code is highlighted before citations so <cite-ref> inside code stays literal.
  buildTableOfContents(doc, warn);
  highlightCode(doc, warn);
  renderCitations(doc, { bibtex, style: citationStyle, includeUncited, slideCitations, warn });
  await renderMath(MathJax, doc, options);

  return { html: doc.body.innerHTML, files };
}
