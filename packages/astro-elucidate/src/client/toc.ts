// Scroll-spy for the floating table of contents: marks the section being read.
const links = [...document.querySelectorAll<HTMLAnchorElement>('.el-toc--float a')];
const headings = links
  .map((link) => document.getElementById(decodeURIComponent(link.hash.slice(1))))
  .filter((heading): heading is HTMLElement => heading !== null);

function update(): void {
  const line = innerHeight * 0.3;
  let active: HTMLElement | undefined;
  for (const heading of headings) if (heading.getBoundingClientRect().top <= line) active = heading;
  for (const link of links) {
    if (active && link.hash === `#${active.id}`) link.setAttribute('aria-current', 'true');
    else link.removeAttribute('aria-current');
  }
}

const observer = new IntersectionObserver(update, { rootMargin: '0px 0px -70% 0px' });
for (const heading of headings) observer.observe(heading);

// Close the mobile "Contents" disclosure after choosing a section.
for (const details of document.querySelectorAll<HTMLDetailsElement>('.el-toc--disclosure')) {
  details.addEventListener('click', (event) => {
    if ((event.target as Element).closest('a')) details.open = false;
  });
}

// Wide, page and screen content passes under the floating contents; fade the list out while it
// overlaps, so the two never draw on top of each other.
const nav = document.querySelector<HTMLElement>('.el-toc--float > nav');
const wide = [
  ...document.querySelectorAll<HTMLElement>(
    '.el-prose > :is(.el-width-wide, .el-width-page, .el-width-screen, .el-appendix__section)',
  ),
];
if (nav && wide.length > 0) {
  const visible = new Set<HTMLElement>();
  const overlap = () => {
    const box = nav.getBoundingClientRect();
    const covered = [...visible].some((el) => {
      const r = el.getBoundingClientRect();
      return r.left < box.right && r.top < box.bottom && r.bottom > box.top;
    });
    nav.classList.toggle('el-toc__nav--hidden', covered);
  };
  const watcher = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) visible.add(entry.target as HTMLElement);
      else visible.delete(entry.target as HTMLElement);
    }
    overlap();
  });
  for (const el of wide) watcher.observe(el);
  addEventListener('scroll', () => visible.size > 0 && requestAnimationFrame(overlap), {
    passive: true,
  });
}
