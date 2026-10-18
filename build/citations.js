// Citations, resolved at build time.
//
//   <cite-ref key="smith2024"></cite-ref>        -> [1]
//   <cite-ref key="smith2024, liu2022"></cite-ref> -> [1, 2]
//   <div id="bibliography"></div>                -> formatted reference list
//
// References are numbered in order of first citation across the whole deck.

import { Cite } from '@citation-js/core';
import '@citation-js/plugin-bibtex';
import '@citation-js/plugin-csl';

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

export function renderCitations(doc, { bibtex, style, includeUncited, warn }) {
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
    const keys = (ref.getAttribute('key') ?? '').split(',').map((key) => key.trim()).filter(Boolean);
    const labels = keys.map((key) => {
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

  if (!bibliography) {
    return;
  }
  const keys = [...numbers.keys()];
  if (includeUncited) {
    keys.push(...[...entries.keys()].filter((key) => !numbers.has(key)));
  }
  bibliography.innerHTML = keys.length
    ? new Cite(keys.map((key) => entries.get(key))).format('bibliography', {
        template: style,
        format: 'html',
        lang: 'en-US',
      })
    : '';
}
