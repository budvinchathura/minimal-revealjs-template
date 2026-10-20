import Reveal from 'reveal.js';
import Notes from 'reveal.js/plugin/notes';

import 'reveal.js/reveal.css';
// Local copy of Reveal's "simple" theme without its Google Fonts @import, so
// nothing is fetched from the network.
import './styles/theme.css';
import './styles/fonts.css';
import 'highlight.js/styles/a11y-dark.css';
import 'virtual:slides.css';
import './styles/code.css';
import './styles/custom.css';

// Slides with math, citations, TOC and code highlighting already rendered
// (see build/slides-plugin.js).
import slidesHtml from 'virtual:slides';
import tocIcon from './assets/toc-logo.svg';
import { enableLatexCopy } from './copy-latex.js';

const slidesElement = document.querySelector('.reveal .slides');
slidesElement.innerHTML = slidesHtml;

const deck = new Reveal(document.querySelector('.reveal'), {
  width: 1920,
  height: 1080,
  margin: 0,
  minScale: 0.1,
  maxScale: 10,
  transition: 'fade',
  backgroundTransition: 'fade',
  center: false,
  hash: false,
  history: false,
  slideNumber: 'c/t',
  plugins: [Notes],
});

await deck.initialize();

slidesElement.addEventListener('click', onTocLinkClick);
addTocButton();
enableLatexCopy();

function goToSlide(section) {
  const { h, v } = deck.getIndices(section);
  deck.slide(h, v);
}

function onTocLinkClick(event) {
  const link = event.target.closest('a[data-toc-target]');
  const target = link && document.getElementById(link.dataset.tocTarget);
  if (target) {
    event.preventDefault();
    goToSlide(target);
  }
}

function addTocButton() {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'toc-button';
  button.setAttribute('aria-label', 'Go to table of contents');

  const icon = document.createElement('img');
  icon.src = tocIcon;
  icon.alt = '';
  button.append(icon);

  button.addEventListener('click', () => {
    const tocSlide = document.getElementById('toc-placeholder')?.closest('section');
    if (tocSlide) {
      goToSlide(tocSlide);
    } else {
      deck.slide(0, 0);
    }
  });

  deck.getRevealElement().append(button);
}

// Dev only: swap in re-rendered slides without reloading, staying on the
// current slide and fragment.
if (import.meta.hot) {
  import.meta.hot.accept('virtual:slides', (module) => {
    if (!module) {
      return;
    }
    const { h, v, f } = deck.getIndices();
    slidesElement.innerHTML = module.default;
    deck.sync();
    deck.slide(h, v, f);
  });
}
