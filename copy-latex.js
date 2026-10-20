// Copy rendered math as LaTeX. The build stores each expression's TeX source
// in data-latex on its <mjx-container> (build/math.js).
//
// - Click an equation: its LaTeX is copied (without delimiters).
// - Copy a selection (Ctrl/Cmd+C): equations in it become $…$ / $$…$$, so a
//   copied sentence or bullet pastes as LaTeX/Markdown source.

const MATH = 'mjx-container[data-latex]';

export function enableLatexCopy() {
  document.addEventListener('click', onClick);
  document.addEventListener('copy', onCopy);
}

let pendingCopy = null;

function onClick(event) {
  const math = event.target.closest?.(MATH);
  // Leave math inside links (TOC entries) clickable, and don't interfere
  // when the user is selecting text.
  if (!math || event.target.closest('a') || !document.getSelection().isCollapsed) {
    return;
  }
  copyText(math.dataset.latex).then(
    () => showToast('LaTeX copied', event),
    () => showToast('Could not copy', event),
  );
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    // The async Clipboard API is missing outside secure contexts (e.g. http://
    // on a LAN address) and can be denied in frames; fall back to a copy
    // command, whose clipboard data onCopy fills in.
    pendingCopy = text;
    try {
      if (!document.execCommand('copy')) {
        throw new Error('copy command failed');
      }
    } finally {
      pendingCopy = null;
    }
  }
}

function onCopy(event) {
  if (pendingCopy !== null) {
    event.clipboardData.setData('text/plain', pendingCopy);
    event.preventDefault();
    return;
  }

  const selection = document.getSelection();
  if (selection.isCollapsed || !selection.rangeCount) {
    return;
  }
  // A selection that starts or ends inside an equation takes all of it.
  const range = selection.getRangeAt(0).cloneRange();
  const startMath = closestMath(range.startContainer);
  const endMath = closestMath(range.endContainer);
  if (startMath) range.setStartBefore(startMath);
  if (endMath) range.setEndAfter(endMath);

  const copy = document.createElement('div');
  copy.append(range.cloneContents());
  const equations = copy.querySelectorAll(MATH);
  if (!equations.length) {
    return;
  }
  for (const math of equations) {
    const latex = math.dataset.latex;
    math.replaceWith(math.getAttribute('display') === 'true' ? `\n$$${latex}$$\n` : `$${latex}$`);
  }

  event.clipboardData.setData('text/plain', tidyWhitespace(copy.textContent));
  event.clipboardData.setData('text/html', copy.innerHTML);
  event.preventDefault();
}

function closestMath(node) {
  return (node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement)?.closest(MATH);
}

// textContent keeps the slide source's indentation; drop it and blank lines.
function tidyWhitespace(text) {
  return text
    .split('\n')
    .map((line) => line.replace(/[ \t]+/g, ' ').trim())
    .filter(Boolean)
    .join('\n');
}

function showToast(message, { clientX, clientY }) {
  const toast = document.createElement('div');
  toast.className = 'latex-copy-toast';
  toast.setAttribute('role', 'status');
  toast.textContent = message;
  toast.style.left = `${clientX}px`;
  toast.style.top = `${clientY}px`;
  document.body.append(toast);
  setTimeout(() => toast.remove(), 1200);
}
