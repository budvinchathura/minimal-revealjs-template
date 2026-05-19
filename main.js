import Reveal from 'reveal.js';
import Notes from 'reveal.js/plugin/notes';
import RevealHighlight from 'reveal.js/plugin/highlight';
import renderMathInElement from 'katex/dist/contrib/auto-render.mjs';

import 'reveal.js/reveal.css';
import './assets/simple.css';
// import 'reveal.js/plugin/highlight/monokai.css';
import './assets/default.min.css';
// import './assets/github.css';
import './assets/vs.css';
import 'katex/dist/katex.min.css';
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
  renderMathInElement(deck.getSlidesElement(), {
    delimiters: [
      { left: '$$', right: '$$', display: true },
      { left: '$', right: '$', display: false },
      { left: '\\(', right: '\\)', display: false },
      { left: '\\[', right: '\\]', display: true }
    ],
    ignoredTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code'],
    throwOnError: false
  });
  deck.layout();
});
