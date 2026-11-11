// Copy controls for the citation box and code blocks. They appear only when the Clipboard API is
// available; without JavaScript the text can still be selected. A click turns COPY into COPIED for
// two seconds, and a polite live region says the same to screen readers.

let liveRegion: HTMLElement | undefined;

function announce(message: string): void {
  if (!liveRegion) {
    liveRegion = document.createElement('span');
    liveRegion.className = 'el-visually-hidden';
    liveRegion.setAttribute('role', 'status');
    (document.querySelector('main') ?? document.body).append(liveRegion);
  }
  // Clear first so that the same message twice is still announced.
  liveRegion.textContent = '';
  const region = liveRegion;
  requestAnimationFrame(() => {
    region.textContent = message;
  });
}

function enable(button: HTMLButtonElement, what: string, text: () => string): void {
  button.hidden = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  button.addEventListener('click', async () => {
    let done: boolean;
    try {
      await navigator.clipboard.writeText(text());
      done = true;
    } catch {
      done = false;
    }
    button.textContent = done ? 'Copied' : 'Copy failed';
    button.dataset.state = done ? 'copied' : 'failed';
    announce(done ? `${what} copied` : `Could not copy the ${what.toLowerCase()}`);
    clearTimeout(timer);
    timer = setTimeout(() => {
      button.textContent = 'Copy';
      delete button.dataset.state;
    }, 2000);
  });
}

if (navigator.clipboard) {
  for (const button of document.querySelectorAll<HTMLButtonElement>('button[data-copy]')) {
    const target = document.getElementById(button.dataset.copy ?? '');
    if (target) enable(button, button.dataset.copyWhat ?? 'Text', () => target.textContent ?? '');
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
    enable(button, 'Code', () => pre.textContent ?? '');
  }
}
