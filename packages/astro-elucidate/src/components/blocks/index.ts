// The blocks a `layout: bespoke` article composes its page from (docs/spec.md §9.4). The article
// route passes them to the MDX content, so they need no import.
import Abstract from './Abstract.astro';
import Appendix from './Appendix.astro';
import ArticleTitle from './ArticleTitle.astro';
import Byline from './Byline.astro';
import TableOfContents from './TableOfContents.astro';

export const blocks = { Abstract, Appendix, ArticleTitle, Byline, TableOfContents };
