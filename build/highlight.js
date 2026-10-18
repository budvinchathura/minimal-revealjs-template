// Syntax highlighting with highlight.js at build time, so the browser does not
// have to load the ~1 MB highlight plugin. Supports the same authoring options
// as Reveal's highlight plugin and produces the same markup, so Reveal's
// built-in styles (line numbers, step highlights) apply unchanged:
//
//   <pre><code class="language-js" data-trim data-noescape
//              data-line-numbers="1|2-3" data-ln-start-from="10">…</code></pre>
//
// - Code is shown literally: HTML tags inside <code> appear as text, unless
//   data-noescape is set. <script type="text/template"> wrappers are supported.
// - data-trim removes surrounding blank lines and common indentation.
// - data-line-numbers adds line numbers; "1|2-3" highlights lines step by step
//   (each step after the first becomes a fragment).

import hljs from 'highlight.js';

const NO_HIGHLIGHT = /\bno-?highlight\b/;
const LANGUAGE = /\b(?:lang|language)-([\w#+-]+)/;

export function highlightCode(doc, warn) {
  for (const code of doc.querySelectorAll('pre code')) {
    code.parentElement.classList.add('code-wrapper');

    let source = sourceText(doc, code);
    if (code.hasAttribute('data-trim')) {
      source = trimCode(source);
    }

    const html = highlight(code, source, warn);
    code.innerHTML = html;
    code.classList.add('hljs');

    if (code.hasAttribute('data-line-numbers') && source.trim()) {
      addLineNumbers(code, html);
    }
  }
}

function sourceText(doc, code) {
  const template = code.querySelector('script[type="text/template"]');
  if (template) {
    return template.textContent;
  }
  if (code.hasAttribute('data-noescape')) {
    return code.textContent;
  }
  // Like Reveal's plugin: markup inside <code> is part of the listing.
  const decoder = doc.createElement('div');
  decoder.innerHTML = code.innerHTML.replaceAll('<', '&lt;');
  return decoder.textContent;
}

function highlight(code, source, warn) {
  if (NO_HIGHLIGHT.test(code.className)) {
    return escapeHtml(source);
  }
  const language = code.className.match(LANGUAGE)?.[1];
  if (!language) {
    const result = hljs.highlightAuto(source);
    if (result.language) {
      code.classList.add(`language-${result.language}`);
    }
    return result.value;
  }
  if (!hljs.getLanguage(language)) {
    warn(`Unknown code language "${language}", the listing is not highlighted`);
    return escapeHtml(source);
  }
  return hljs.highlight(source, { language, ignoreIllegals: true }).value;
}

function escapeHtml(text) {
  return text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

// Same algorithm as Reveal's data-trim.
function trimCode(source) {
  const lines = source.split('\n');
  while (lines.length && !lines[0].trim()) lines.shift();
  while (lines.length && !lines.at(-1).trim()) lines.pop();
  const indent = Math.min(
    ...lines.filter((line) => line.trim()).map((line) => line.length - line.trimStart().length),
  );
  return lines.map((line) => line.slice(indent)).join('\n');
}

function addLineNumbers(code, html) {
  const startFrom = Number.parseInt(code.getAttribute('data-ln-start-from'), 10) || 1;
  const lines = splitLines(html);
  if (lines.length > 1 && !lines.at(-1).trim()) {
    lines.pop();
  }

  const rows = lines.map((line, index) => {
    const n = index + startFrom;
    return (
      `<tr><td class="hljs-ln-line hljs-ln-numbers" data-line-number="${n}">` +
      `<div class="hljs-ln-n" data-line-number="${n}"></div></td>` +
      `<td class="hljs-ln-line hljs-ln-code" data-line-number="${n}">${line || ' '}</td></tr>`
    );
  });
  code.innerHTML = `<table class="hljs-ln">${rows.join('')}</table>`;

  const [firstStep, ...laterSteps] = parseSteps(code.getAttribute('data-line-numbers'));
  let fragmentIndex = Number.parseInt(code.getAttribute('data-fragment-index'), 10);

  for (const step of laterSteps) {
    const clone = code.cloneNode(true);
    clone.setAttribute('data-line-numbers', serializeStep(step));
    clone.classList.add('fragment');
    if (Number.isNaN(fragmentIndex)) {
      clone.removeAttribute('data-fragment-index');
    } else {
      clone.setAttribute('data-fragment-index', fragmentIndex++);
    }
    highlightLines(clone, step);
    code.parentElement.append(clone);
  }

  if (laterSteps.length) {
    code.removeAttribute('data-fragment-index');
    code.setAttribute('data-line-numbers', serializeStep(firstStep));
  }
  highlightLines(code, firstStep);
}

// Split highlighted HTML into lines, closing and reopening <span>s that cross
// line breaks so every line is well-formed on its own.
function splitLines(html) {
  const lines = [];
  const open = [];
  let line = '';
  for (const token of html.split(/(<span[^>]*>|<\/span>|\n)/)) {
    if (token === '\n') {
      lines.push(line + '</span>'.repeat(open.length));
      line = open.join('');
    } else {
      if (token.startsWith('<span')) open.push(token);
      if (token === '</span>') open.pop();
      line += token;
    }
  }
  lines.push(line);
  return lines;
}

// "1,3|5-7" -> [[{start: 1}, {start: 3}], [{start: 5, end: 7}]]
function parseSteps(value) {
  return value
    .replace(/\s/g, '')
    .split('|')
    .map((step) =>
      step.split(',').flatMap((range) => {
        if (!/^\d+(-\d+)?$/.test(range)) return [];
        const [start, end] = range.split('-').map(Number);
        return [{ start, end }];
      }),
    );
}

function serializeStep(step) {
  return step.map(({ start, end }) => (end ? `${start}-${end}` : `${start}`)).join(',');
}

function highlightLines(code, step) {
  const rows = code.querySelectorAll('tr');
  for (const { start, end = start } of step) {
    for (let row = start; row <= end && row <= rows.length; row++) {
      rows[row - 1].classList.add('highlight-line');
      code.classList.add('has-highlights');
    }
  }
}
