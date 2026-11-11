// <Overlay>: open and close native modal dialogs, deep links by URL hash, focus return
// (docs/spec.md §8.6). The modal dialog itself traps focus and closes on Esc.
//
//   import { open, close } from 'astro-elucidate/client';
//   open('explorer');

const SELECTOR = 'dialog.el-overlay';
/** Where focus goes back to when an overlay closes, by overlay id. */
const returnFocus = new Map<string, HTMLElement>();
/** Overlays opened with a new history entry, which closing takes back. */
const pushed = new Set<string>();

function overlay(id: string): HTMLDialogElement | null {
  const element = document.getElementById(id);
  return element instanceof HTMLDialogElement && element.matches(SELECTOR) ? element : null;
}

/** Opens the overlay with this id and puts `#id` in the address bar. */
export function open(id: string): void {
  const dialog = overlay(id);
  if (!dialog) {
    console.warn(`[elucidate] No <Overlay id="${id}"> on this page.`);
    return;
  }
  if (dialog.open) return;
  const active = document.activeElement;
  if (active instanceof HTMLElement && active !== document.body) returnFocus.set(id, active);
  if (location.hash !== `#${id}`) {
    history.pushState({ elOverlay: id }, '', `#${id}`);
    pushed.add(id);
  }
  dialog.showModal();
}

/** Closes the overlay with this id, or every open overlay. */
export function close(id?: string): void {
  for (const dialog of document.querySelectorAll<HTMLDialogElement>(SELECTOR)) {
    if (dialog.open && (id === undefined || dialog.id === id)) dialog.close();
  }
}

function closed(dialog: HTMLDialogElement): void {
  const { id } = dialog;
  if (location.hash === `#${id}`) {
    if (pushed.has(id) && history.state?.elOverlay === id) history.back();
    else history.replaceState(history.state, '', location.pathname + location.search);
  }
  pushed.delete(id);
  const target =
    returnFocus.get(id) ?? document.querySelector<HTMLElement>(`[data-el-overlay-open="${id}"]`);
  returnFocus.delete(id);
  if (target?.isConnected) target.focus();
}

/** Opens the overlay the hash names, and closes overlays it no longer names. */
function sync(): void {
  const id = decodeURIComponent(location.hash.slice(1));
  for (const dialog of document.querySelectorAll<HTMLDialogElement>(SELECTOR)) {
    if (dialog.open && dialog.id !== id) {
      pushed.delete(dialog.id);
      dialog.close();
    }
  }
  if (id && overlay(id) && !overlay(id)?.open) overlay(id)?.showModal();
}

function setUp(): void {
  for (const button of document.querySelectorAll<HTMLElement>('[data-el-overlay-open]')) {
    button.hidden = false;
    button.setAttribute('aria-controls', button.dataset.elOverlayOpen ?? '');
  }
  for (const dialog of document.querySelectorAll<HTMLDialogElement>(SELECTOR)) {
    dialog.addEventListener('close', () => closed(dialog));
    // A click on the backdrop lands on the dialog itself, outside its box. Both the press and the
    // release must be outside, so that dragging a slider out of the panel does not close it.
    let pressedOutside = false;
    const outside = (event: MouseEvent) => {
      if (event.target !== dialog) return false;
      const box = dialog.getBoundingClientRect();
      return (
        event.clientX < box.left ||
        event.clientX > box.right ||
        event.clientY < box.top ||
        event.clientY > box.bottom
      );
    };
    dialog.addEventListener('pointerdown', (event) => {
      pressedOutside = outside(event);
    });
    dialog.addEventListener('click', (event) => {
      if (pressedOutside && outside(event) && dialog.hasAttribute('data-dismissible')) {
        dialog.close();
      }
      pressedOutside = false;
    });
  }
  document.addEventListener('click', (event) => {
    const target = event.target instanceof Element ? event.target : null;
    const opener = target?.closest<HTMLElement>('[data-el-overlay-open]');
    if (opener?.dataset.elOverlayOpen) {
      event.preventDefault();
      open(opener.dataset.elOverlayOpen);
      return;
    }
    if (target?.closest('[data-el-overlay-close]')) {
      target.closest('dialog')?.close();
      return;
    }
    // Plain links to an overlay (`[Open the explorer](#explorer)`) open it too.
    const link = target?.closest<HTMLAnchorElement>('a[href^="#"]');
    const id = link && decodeURIComponent(link.hash.slice(1));
    if (link && id && overlay(id) && link.pathname === location.pathname) {
      event.preventDefault();
      open(id);
    }
  });
  addEventListener('popstate', sync);
  addEventListener('hashchange', sync);
  sync();
}

// Once per page, even if a bundle includes this module twice.
if (!document.documentElement.hasAttribute('data-el-overlays')) {
  document.documentElement.setAttribute('data-el-overlays', '');
  setUp();
}
