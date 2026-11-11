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
