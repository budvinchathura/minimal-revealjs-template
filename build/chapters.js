// Chapter markers and the table of contents.
//
//   <x-chapter>Method</x-chapter>          marks the next <section> as the
//   <x-subchapter>Approach</x-subchapter>  start of a chapter / subchapter.
//
// The markers are removed and, if the deck has an element with
// id="toc-placeholder", a nested list of links is generated into it. This runs
// before math rendering, so TeX in chapter titles is typeset in the TOC like
// any other math. The links point at the section's id; main.js turns clicks
// into deck.slide() calls.

export function buildTableOfContents(doc, warn) {
  const entries = [];

  for (const marker of doc.querySelectorAll('x-chapter, x-subchapter')) {
    const level = marker.localName === 'x-chapter' ? 1 : 2;
    const title = marker.innerHTML.trim();
    const section = nextSection(marker);
    marker.remove();

    if (!section) {
      warn(`<${marker.localName}>${title}</${marker.localName}> is not followed by a <section> and was ignored`);
      continue;
    }
    if (title) {
      section.id ||= uniqueId(doc, 'chapter');
      entries.push({ level, title, target: section.id });
    }
  }

  const placeholder = doc.getElementById('toc-placeholder');
  if (!placeholder) {
    return;
  }
  if (!entries.length) {
    placeholder.textContent = 'No chapters found.';
    return;
  }
  placeholder.innerHTML = '';
  placeholder.append(createTocList(doc, entries));
}

function createTocList(doc, entries) {
  const list = doc.createElement('ul');
  list.className = 'toc-list';
  let chapterItem = null;

  for (const { level, title, target } of entries) {
    const item = doc.createElement('li');
    const link = doc.createElement('a');
    link.href = `#${target}`;
    link.dataset.tocTarget = target;
    link.innerHTML = title;
    item.append(link);

    if (level === 1) {
      list.append(item);
      chapterItem = item;
      continue;
    }

    item.className = 'toc-subchapter';
    if (!chapterItem) {
      list.append(item);
      continue;
    }
    let subList = chapterItem.querySelector('ul');
    if (!subList) {
      subList = doc.createElement('ul');
      chapterItem.append(subList);
    }
    subList.append(item);
  }
  return list;
}

function nextSection(marker) {
  let node = marker.nextElementSibling;
  while (node && node.localName !== 'section') {
    node = node.nextElementSibling;
  }
  return node;
}

function uniqueId(doc, prefix) {
  let n = 1;
  while (doc.getElementById(`${prefix}-${n}`)) {
    n++;
  }
  return `${prefix}-${n}`;
}
