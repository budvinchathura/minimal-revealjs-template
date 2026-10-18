// Build-time math: MathJax v4 (running in Node) typesets the TeX in the deck
// into self-contained SVG, so the browser needs no MathJax, fonts or network.
//
// With `speech` enabled, MathJax's speech-rule engine also generates a spoken
// description (and Nemeth braille) for every expression. It is attached the
// way MathJax's own explorer does it: the visual SVG is hidden from assistive
// technology and the container gets role="img" with the speech as its label.

import { parseHTML } from 'linkedom';
import { init } from 'mathjax';

let mathJax = null;

/**
 * MathJax is a process-wide singleton, so it is configured once, by the first
 * caller. The Vite plugin always passes the same options.
 */
export function getMathJax({ speech, tex }) {
  mathJax ??= init({
    loader: {
      load: [
        'adaptors/linkedom',
        'input/tex',
        'output/svg',
        ...(speech ? ['a11y/semantic-enrich', 'a11y/speech'] : []),
      ],
    },
    LINKEDOM: parseHTML,
    tex: {
      inlineMath: { '[+]': [['$', '$']] },
      // Without "noundefined", a typo like \lamda is a reported TeX error
      // instead of silently rendering as red text.
      packages: { '[-]': ['noundefined'] },
      ...tex,
    },
    svg: {
      // Every expression carries its own glyph definitions, so it stays
      // correct wherever it ends up (TOC, cloned fragments, speaker view).
      fontCache: 'local',
    },
    startup: { typeset: false },
  });
  return mathJax;
}

/** The CSS that MathJax's SVG output relies on. */
export async function mathStylesheet(options) {
  const MathJax = await getMathJax(options);
  return MathJax.startup.adaptor.textContent(MathJax.svgStylesheet());
}

/** Typeset all math in `doc` (a DOM created by MathJax's adaptor) in place. */
export async function renderMath(MathJax, doc, { speech, warn }) {
  const mathDocument = MathJax.startup.getDocument(doc);
  await mathDocument.renderPromise();

  for (const item of mathDocument.math) {
    const container = item.typesetRoot;
    const error = container.querySelector('[data-mjx-error]');
    if (error) {
      warn(`TeX error in "${item.math.trim()}": ${error.getAttribute('data-mjx-error')}${slideLabel(container)}`);
    }
    if (speech) {
      attachSpeech(container);
    }
    stripExplorerData(container);
  }

  if (speech) {
    // Speech is generated in a worker thread, which would otherwise keep Node
    // (and `vite build`) running. done() throws if the worker never started.
    await mathDocument.done().catch(() => {});
  }
}

function attachSpeech(container) {
  const speech = container.getAttribute('data-semantic-speech-none');
  if (!speech) {
    return;
  }
  for (const child of container.children) {
    child.setAttribute('aria-hidden', 'true');
  }
  container.setAttribute('role', 'img');
  container.setAttribute('aria-label', `${speech}, math`);
  const braille = container.getAttribute('data-semantic-braille');
  if (braille) {
    container.setAttribute('aria-braillelabel', braille);
  }
}

// MathJax annotates every node with semantic/speech data for its interactive
// explorer. Nothing in the browser reads it, so drop it to keep the page small.
// The TeX source stays available as data-latex on the root <g> of each SVG.
const EXPLORER_DATA = /^data-(semantic-|speech-|braille-)/;

function stripExplorerData(container) {
  for (const element of [container, ...container.querySelectorAll('*')]) {
    for (const { name } of [...element.attributes]) {
      const isNestedLatex = name === 'data-latex' && element.getAttribute('data-mml-node') !== 'math';
      if (EXPLORER_DATA.test(name) || isNestedLatex) {
        element.removeAttribute(name);
      }
    }
  }
}

function slideLabel(element) {
  const title = element.closest('section')?.querySelector('h1, h2, h3')?.textContent.trim();
  return title ? ` (slide "${title}")` : '';
}
