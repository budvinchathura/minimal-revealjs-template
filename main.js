import Reveal from 'reveal.js';
import Notes from 'reveal.js/plugin/notes';
import RevealHighlight from 'reveal.js/plugin/highlight';
import 'reveal.js/reveal.css';
// It’s a local copy of Reveal’s simple theme with the Google Fonts @import 
// lines removed, so it doesn’t fetch fonts from the network
import './assets/simple.css';
// import 'reveal.js/plugin/highlight/monokai.css';
import './assets/default.min.css';
// import './assets/github.css';
import './assets/vs.css';
import '@fontsource/lato/400.css';
import '@fontsource/lato/700.css';
import '@fontsource/lato/400-italic.css';
import '@fontsource/lato/700-italic.css';
import '@fontsource/news-cycle/400.css';
import '@fontsource/news-cycle/700.css';

import './custom.css';

import CitationManager from './citations.js';

import cover from './slides/00-cover.html?raw';
import agenda from './slides/01-agenda.html?raw';
import problem from './slides/02-problem.html?raw';
import method from './slides/03-method.html?raw';
import model from './slides/04-model.html?raw';
import experiment from './slides/05-experiment.html?raw';
import results from './slides/06-results.html?raw';
import ablation from './slides/07-ablation.html?raw';
import system from './slides/08-system.html?raw';
import codeSlide from './slides/09-code.html?raw';
import gallery from './slides/10-figures.html?raw';
import references from './slides/11-references.html?raw';
import backup from './slides/12-backup.html?raw';

window.MathJax = {
  tex: {
    inlineMath: [['$', '$'], ['\\(', '\\)']],
    displayMath: [['$$', '$$'], ['\\[', '\\]']],
  },
  options: {
    skipHtmlTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code'],
    enableMenu: false
  },
  startup: {
    // Disable the automatic typeset pass on startup.
    // MathJax would otherwise typeset the whole document as soon as it
    // initialises — before Reveal has laid out the slides — and our manual
    // typesetPromise() calls in the event handlers would then re-process
    // already-typeset content.
    typeset: false,
  },
};

// Chain .then(() => MathJax.startup.promise) so that `mathjaxReady`
// resolves only after MathJax has fully initialised, not merely after
// the ES module has been evaluated.
const mathjaxReady = import('mathjax/es5/tex-chtml.js')
  .then(() => window.MathJax.startup.promise);

const slides = document.getElementById('my-slides');
slides.innerHTML = [
  cover,
  agenda,
  problem,
  method,
  model,
  experiment,
  results,
  ablation,
  system,
  codeSlide,
  gallery,
  references,
  backup
].join('\n');

const deck = new Reveal({
  plugins: [Notes, RevealHighlight]
});

deck.initialize({
  width: 1920,
  height: 1080,
  margin: 0.0,
  minScale: 0.1,
  maxScale: 10.0,
  transition: 'fade',
  backgroundTransition: 'fade',
  center: false,
  hash: false,       // on debugging, set to false to avoid polluting the URL
  history: false,
  slideNumber: 'c/t'
});

const citations = new CitationManager({
  bibPath: './refs.bib',
  template: 'vancouver'
});

deck.on('ready', async () => {
  await citations.init(deck);
  // Wait for full MathJax initialisation (module load + async startup).
  await mathjaxReady;
  await window.MathJax.typesetPromise([deck.getSlidesElement()]);
  deck.layout();
});

deck.on('slidechanged', async (event) => {
  // mathjaxReady is already resolved by the time the user can change
  // slides, but awaiting it is the correct guard against any edge case
  // where a slide change fires before the ready handler completes.
  await mathjaxReady;
  await window.MathJax.typesetPromise([event.currentSlide]);
});