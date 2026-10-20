// Build-time math: MathJax v4 (running in Node) typesets the TeX in the deck
// into self-contained SVG, so the browser needs no MathJax, fonts or network.
//
// Each rendered expression keeps its TeX source in a data-latex attribute on
// its <mjx-container>; copy-latex.js uses it to copy equations as LaTeX.

import { parseHTML } from 'linkedom';
import { init } from 'mathjax';

let mathJax = null;

/**
 * MathJax is a process-wide singleton, so it is configured once, by the first
 * caller. The Vite plugin always passes the same options.
 */
export function getMathJax({ tex }) {
  mathJax ??= init({
    loader: {
      load: ['adaptors/linkedom', 'input/tex', 'output/svg'],
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
export async function renderMath(MathJax, doc, { warn }) {
  const mathDocument = MathJax.startup.getDocument(doc);
  await mathDocument.renderPromise();

  for (const item of mathDocument.math) {
    const container = item.typesetRoot;
    const latex = item.math.trim();
    const error = container.querySelector('[data-mjx-error]');
    if (error) {
      warn(`TeX error in "${latex}": ${error.getAttribute('data-mjx-error')}${slideLabel(container)}`);
    }
    container.setAttribute('data-latex', latex);
  }
}

function slideLabel(element) {
  const title = element.closest('section')?.querySelector('h1, h2, h3')?.textContent.trim();
  return title ? ` (slide "${title}")` : '';
}
