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
import experiment from './slides/05-experiment.html?raw';
import results from './slides/06-results.html?raw';
import references from './slides/07-references.html?raw';

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
  experiment,
  results,
  references
].join('\n');

applyChapterMarkers(slides);

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
  buildTableOfContents(deck);
  addTocButton(deck);
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

function addTocButton(deck) {
  const revealRoot = deck.getRevealElement();
  if (!revealRoot || revealRoot.querySelector('.toc-button')) {
    return;
  }

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'toc-button';
  const icon = document.createElement('img');
  icon.src = './assets/toc-logo.svg';
  icon.alt = '';
  icon.setAttribute('aria-hidden', 'true');
  button.appendChild(icon);
  button.setAttribute('aria-label', 'Go to table of contents');

  button.addEventListener('click', () => {
    const tocContainer = document.getElementById('toc-placeholder');
    if (tocContainer) {
      const tocSlide = tocContainer.closest('section');
      if (tocSlide) {
        const { h, v } = deck.getIndices(tocSlide);
        deck.slide(h, v);
        return;
      }
    }

    deck.slide(0, 0);
  });

  revealRoot.appendChild(button);
}

function applyChapterMarkers(slidesRoot) {
  const markers = slidesRoot.querySelectorAll('x-chapter, x-subchapter');
  markers.forEach((marker) => {
    const nextSection = findNextSlideSection(marker);
    if (!nextSection) {
      marker.remove();
      return;
    }

    if (marker.tagName.toLowerCase() === 'x-chapter') {
      const title = marker.textContent?.trim();
      if (title) {
        nextSection.setAttribute('data-chapter', title);
      }
    }

    if (marker.tagName.toLowerCase() === 'x-subchapter') {
      const title = marker.textContent?.trim();
      if (title) {
        nextSection.setAttribute('data-subchapter', title);
      }
    }

    marker.remove();
  });
}

function findNextSlideSection(startNode) {
  let node = startNode.nextElementSibling;
  while (node) {
    if (node.tagName && node.tagName.toLowerCase() === 'section') {
      return node;
    }
    node = node.nextElementSibling;
  }
  return null;
}

function buildTableOfContents(deck) {
  const tocContainer = document.getElementById('toc-placeholder');
  if (!tocContainer) {
    return;
  }

  const list = document.createElement('ul');
  list.className = 'toc-list';

  let currentChapterItem = null;
  const allSlides = deck.getSlides();
  allSlides.forEach((slide) => {

    const chapter = slide.getAttribute('data-chapter');
    const subchapter = slide.getAttribute('data-subchapter');
    if (!chapter && !subchapter) {
      return;
    }

    const { h, v } = deck.getIndices(slide);
    if (chapter) {
      const item = document.createElement('li');
      item.appendChild(createTocLink(chapter, h, v));
      list.appendChild(item);
      currentChapterItem = item;
    }

    if (subchapter) {
      const subItem = document.createElement('li');
      subItem.className = 'toc-subchapter';
      subItem.appendChild(createTocLink(subchapter, h, v));

      if (!currentChapterItem) {
        list.appendChild(subItem);
        return;
      }

      let subList = currentChapterItem.querySelector('ul');
      if (!subList) {
        subList = document.createElement('ul');
        currentChapterItem.appendChild(subList);
      }
      subList.appendChild(subItem);
    }
  });

  if (!list.childElementCount) {
    tocContainer.textContent = 'No chapters found.';
    return;
  }

  tocContainer.appendChild(list);
}

function createTocLink(label, h, v) {
  const link = document.createElement('a');
  const target = v ? `#/${h}/${v}` : `#/${h}`;
  link.href = target;
  link.textContent = label;
  return link;
}