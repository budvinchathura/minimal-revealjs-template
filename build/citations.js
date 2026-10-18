// Citations, resolved at build time.
//
//   <cite-ref key="smith2024"></cite-ref>        -> [1]
//   <cite-ref key="smith2024, liu2022"></cite-ref> -> [1, 2]
//   <div id="bibliography"></div>                -> formatted reference list
//
// References are numbered in order of first citation across the whole deck.
//
// Every slide that cites something also gets a footer listing those
// references, so the audience can see them without the references slide:
//
//   short  [1] Smith & Lee, 2024   [3] Garcia et al., 2023   (default)
//   full   [1] Smith J, Lee P. A Minimal Template for ... 2024;12(3):101–15.
//   none   no footer
//
// The default is set with the plugin's `slideCitations` option and can be
// overridden per slide: <section data-citations="full">.

import { Cite } from '@citation-js/core';
import '@citation-js/plugin-bibtex';
import '@citation-js/plugin-csl';

const FOOTER_MODES = ['short', 'full', 'none'];

let parsed = { bibtex: null, entries: [] };

function parseBibtex(bibtex, warn) {
  if (parsed.bibtex !== bibtex) {
    let entries = [];
    try {
      entries = new Cite(bibtex).data;
    } catch (error) {
      warn(`Could not parse the BibTeX file: ${error.message}`);
    }
    parsed = { bibtex, entries };
  }
  return parsed.entries;
}

export function renderCitations(doc, { bibtex, style, includeUncited, slideCitations, warn }) {
  const refs = doc.querySelectorAll('cite-ref');
  const bibliography = doc.getElementById('bibliography');
  if (!refs.length && !bibliography) {
    return;
  }
  if (bibtex === null) {
    warn('The deck uses citations but the BibTeX file was not found');
  }

  const entries = new Map(parseBibtex(bibtex ?? '', warn).map((entry) => [entry.id, entry]));
  const numbers = new Map();
  const unknown = new Set();

  for (const ref of refs) {
    const labels = citedKeys(ref).map((key) => {
      if (!entries.has(key)) {
        unknown.add(key);
        return '?';
      }
      if (!numbers.has(key)) {
        numbers.set(key, numbers.size + 1);
      }
      return numbers.get(key);
    });
    ref.innerHTML = `<sup>[${labels.join(', ')}]</sup>`;
  }

  for (const key of unknown) {
    warn(`Unknown citation key "${key}"`);
  }

  const keys = [...numbers.keys()];
  if (includeUncited) {
    keys.push(...[...entries.keys()].filter((key) => !numbers.has(key)));
  }
  const bibliographyHtml = keys.length
    ? new Cite(keys.map((key) => entries.get(key))).format('bibliography', {
        template: style,
        format: 'html',
        lang: 'en-US',
      })
    : '';

  if (bibliography) {
    bibliography.innerHTML = bibliographyHtml;
  }
  addSlideFooters(doc, {
    defaultMode: slideCitations,
    numbers,
    entries,
    fullReferences: () => referencesById(doc, bibliographyHtml),
    warn,
  });
}

function citedKeys(ref) {
  return (ref.getAttribute('key') ?? '').split(',').map((key) => key.trim()).filter(Boolean);
}

function addSlideFooters(doc, { defaultMode, numbers, entries, fullReferences, warn }) {
  let full = null;

  for (const slide of doc.querySelectorAll('section')) {
    // Vertical stacks: only the inner sections are slides.
    if (slide.querySelector('section')) {
      continue;
    }
    const mode = slide.getAttribute('data-citations') ?? defaultMode;
    if (!FOOTER_MODES.includes(mode)) {
      warn(`data-citations="${mode}" is not one of ${FOOTER_MODES.join(', ')}${slideLabel(slide)}`);
      continue;
    }
    if (mode === 'none') {
      continue;
    }

    const keys = [...new Set([...slide.querySelectorAll('cite-ref')].flatMap(citedKeys))]
      .filter((key) => numbers.has(key))
      .sort((a, b) => numbers.get(a) - numbers.get(b));
    if (!keys.length) {
      continue;
    }

    const footer = doc.createElement('footer');
    footer.className = `slide-citations slide-citations-${mode}`;
    for (const key of keys) {
      const item = doc.createElement('span');
      item.className = 'slide-citation';
      const number = doc.createElement('span');
      number.className = 'slide-citation-number';
      number.textContent = `[${numbers.get(key)}]`;
      const text = doc.createElement('span');
      if (mode === 'full') {
        full ??= fullReferences();
        text.innerHTML = full.get(key) ?? '';
      } else {
        text.textContent = shortCitation(entries.get(key));
      }
      item.append(number, ' ', text);
      footer.append(item);
    }
    slide.append(footer);
    slide.classList.add('has-slide-citations');
  }
}

// "Brown, 2021", "Smith & Lee, 2024", "Garcia et al., 2023"
function shortCitation(entry) {
  const names = (entry.author ?? entry.editor ?? [])
    .map((person) => person.literal ?? [person['non-dropping-particle'], person.family].filter(Boolean).join(' '))
    .filter(Boolean);
  const who =
    names.length === 0 ? entry.title ?? entry.id
    : names.length === 1 ? names[0]
    : names.length === 2 ? `${names[0]} & ${names[1]}`
    : `${names[0]} et al.`;
  const year = entry.issued?.['date-parts']?.[0]?.[0] ?? entry.issued?.literal ?? 'n.d.';
  return `${who}, ${year}`;
}

// Formatted reference text per entry, as in the bibliography (without its number).
function referencesById(doc, bibliographyHtml) {
  const container = doc.createElement('div');
  container.innerHTML = bibliographyHtml;
  const references = new Map();
  for (const entry of container.querySelectorAll('[data-csl-entry-id]')) {
    const text = entry.querySelector('.csl-right-inline') ?? entry;
    references.set(entry.getAttribute('data-csl-entry-id'), text.innerHTML.trim());
  }
  return references;
}

function slideLabel(slide) {
  const title = slide.querySelector('h1, h2, h3')?.textContent.trim();
  return title ? ` (slide "${title}")` : '';
}
