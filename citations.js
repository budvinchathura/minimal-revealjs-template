import { Cite } from '@citation-js/core';
import '@citation-js/plugin-bibtex';
import '@citation-js/plugin-csl';

export default class CitationManager {
  constructor(options = {}) {
    this.bibPath = options.bibPath || './refs.bib';
    this.template = options.template || 'vancouver';

    this.cite = null;

    this.order = [];
    this.indexMap = {};

    this.showAll = false;
  }

  async init(deck) {
    this.deck = deck;

    const res = await fetch(this.bibPath);
    const bibtex = await res.text();

    this.cite = new Cite(bibtex);

    this.render();

    deck.on('slidechanged', () => {
      this.renderCitations();
    });
  }

  getIndex(key) {
    if (this.indexMap[key]) return this.indexMap[key];

    this.order.push(key);
    this.indexMap[key] = this.order.length;

    return this.indexMap[key];
  }

  renderCitations() {
    document.querySelectorAll('cite-ref').forEach(el => {
      const key = el.getAttribute('key');
      const num = this.getIndex(key);

      el.innerHTML = `<sup>[${num}]</sup>`;
    });
  }

  renderBibliography() {
    const allEntries = this.cite.data.map(x => x.id);

    const cited = this.order;
    const uncited = allEntries.filter(k => !this.order.includes(k));

    const finalOrder = this.showAll
      ? [...cited, ...uncited]
      : cited;

    const entries = finalOrder
      .map(id => this.cite.data.find(e => e.id === id))
      .filter(Boolean);

    const sorted = new Cite(entries);

    const el = document.getElementById('bibliography');
    if (!el) return;

    el.innerHTML = sorted.format('bibliography', {
      template: this.template,
      format: 'html',
      lang: 'en-US'
    });
  }

  render() {
    this.renderCitations();
    this.renderBibliography();
  }

  toggleAll() {
    this.showAll = !this.showAll;
    this.renderBibliography();
  }
}
