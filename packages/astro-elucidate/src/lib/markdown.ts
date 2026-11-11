import rehypeStringify from 'rehype-stringify';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import { unified } from 'unified';

const processor = unified().use(remarkParse).use(remarkRehype).use(rehypeStringify);

/** Renders a short Markdown string from front matter (e.g. the abstract) to HTML. */
export async function renderMarkdown(source: string): Promise<string> {
  return String(await processor.process(source));
}
