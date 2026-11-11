// Cards for citations and footnotes (spec §8.4): the card shows the reference or note from the
// appendix. Mouse: hover. Keyboard: focus, Escape closes. Touch: the first tap shows the card, a
// second tap follows the link. Without JavaScript (or the Popover API) the links simply jump to
// the appendix.

const TRIGGERS = '.el-cite__ref, a[data-footnote-ref]';

if ('showPopover' in HTMLElement.prototype) {
  const card = document.createElement('div');
  card.id = 'el-hovercard';
  card.className = 'el-hovercard';
  card.setAttribute('role', 'tooltip');
  card.setAttribute('popover', 'manual');
  // Inside the main landmark, so screen reader users find it with the rest of the content.
  (document.querySelector('main') ?? document.body).append(card);

  let current: HTMLAnchorElement | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let touch = false;

  const triggerOf = (target: EventTarget | null) =>
    (target instanceof Element ? target.closest<HTMLAnchorElement>(TRIGGERS) : null) ?? undefined;
  const inCard = (target: EventTarget | null) => target instanceof Node && card.contains(target);

  /** The card's HTML, or nothing when the note is already visible beside the text. */
  const contentFor = (link: HTMLAnchorElement): string | undefined => {
    const target = document.getElementById(decodeURIComponent(link.hash.slice(1)));
    if (!target) return undefined;
    if (link.matches('[data-footnote-ref]')) {
      const sidenote = link.parentElement?.nextElementSibling;
      if (sidenote?.matches('.el-sidenote') && getComputedStyle(sidenote).display !== 'none') {
        return undefined;
      }
      const note = target.cloneNode(true) as HTMLElement;
      for (const backref of note.querySelectorAll('.el-backref')) backref.remove();
      return note.innerHTML;
    }
    return target.querySelector('.el-references__entry')?.innerHTML;
  };

  const place = (link: HTMLAnchorElement) => {
    const anchor = link.getBoundingClientRect();
    const box = card.getBoundingClientRect();
    const gap = 8;
    const edge = 12;
    const left = Math.max(
      edge,
      Math.min(anchor.left + anchor.width / 2 - box.width / 2, innerWidth - box.width - edge),
    );
    const fitsBelow = anchor.bottom + gap + box.height <= innerHeight - edge;
    const top =
      fitsBelow || anchor.top - gap - box.height < edge
        ? anchor.bottom + gap
        : anchor.top - gap - box.height;
    card.style.left = `${left}px`;
    card.style.top = `${top}px`;
  };

  const hide = () => {
    clearTimeout(timer);
    current?.removeAttribute('aria-describedby');
    current = undefined;
    if (card.matches(':popover-open')) card.hidePopover();
  };

  const hideSoon = () => {
    clearTimeout(timer);
    timer = setTimeout(hide, 200);
  };

  const show = (link: HTMLAnchorElement) => {
    clearTimeout(timer);
    if (link === current) return;
    const html = contentFor(link);
    if (!html) return hide();
    current?.removeAttribute('aria-describedby');
    current = link;
    card.innerHTML = html;
    link.setAttribute('aria-describedby', card.id);
    if (!card.matches(':popover-open')) card.showPopover();
    place(link);
  };

  document.addEventListener('pointerover', (event) => {
    const link = triggerOf(event.target);
    if (event.pointerType !== 'touch' && link) show(link);
  });
  document.addEventListener('pointerout', (event) => {
    if (event.pointerType === 'touch' || !triggerOf(event.target)) return;
    if (!inCard(event.relatedTarget)) hideSoon();
  });
  card.addEventListener('pointerenter', () => clearTimeout(timer));
  card.addEventListener('pointerleave', (event) => {
    if (event.pointerType !== 'touch') hideSoon();
  });

  document.addEventListener('focusin', (event) => {
    const link = triggerOf(event.target);
    if (link && !touch) show(link);
    else if (!link && !inCard(event.target)) hide();
  });
  document.addEventListener('keydown', (event) => {
    touch = false;
    if (event.key === 'Escape' && current) hide();
  });

  document.addEventListener('pointerdown', (event) => {
    touch = event.pointerType === 'touch';
    if (touch && current && !triggerOf(event.target) && !inCard(event.target)) hide();
  });
  document.addEventListener('click', (event) => {
    const link = triggerOf(event.target);
    if (!link) return;
    if (!touch || link === current) return hide();
    if (!contentFor(link)) return;
    event.preventDefault();
    show(link);
  });

  const follow = () => current && place(current);
  addEventListener('scroll', follow, { passive: true });
  addEventListener('resize', follow);
}
