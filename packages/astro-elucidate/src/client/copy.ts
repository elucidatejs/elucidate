// Copy buttons for the citation box and code blocks. They appear only when the Clipboard API is
// available; without JavaScript the text can still be selected.

function enable(button: HTMLButtonElement, text: () => string): void {
  button.hidden = false;
  button.addEventListener('click', async () => {
    const label = button.textContent;
    try {
      await navigator.clipboard.writeText(text());
      button.textContent = 'Copied';
    } catch {
      button.textContent = 'Copy failed';
    }
    setTimeout(() => {
      button.textContent = label;
    }, 1500);
  });
}

if (navigator.clipboard) {
  for (const button of document.querySelectorAll<HTMLButtonElement>('button[data-copy]')) {
    const target = document.getElementById(button.dataset.copy ?? '');
    if (target) enable(button, () => target.textContent ?? '');
  }
  for (const pre of document.querySelectorAll<HTMLPreElement>('.el-prose pre.astro-code')) {
    const wrapper = document.createElement('div');
    wrapper.className = 'el-copyable';
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'el-copy';
    button.textContent = 'Copy';
    button.setAttribute('aria-label', 'Copy code');
    pre.before(wrapper);
    wrapper.append(pre, button);
    enable(button, () => pre.textContent ?? '');
  }
}
