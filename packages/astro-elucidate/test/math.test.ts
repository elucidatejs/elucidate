import { describe, expect, it } from 'vitest';
import { mathjaxMacros } from '../src/markdown/math-engines.ts';
import { render } from './markdown-helpers.ts';

const source = [
  'Inline $\\alpha \\in \\R$ and $\\norm{w}$.',
  '',
  '$$',
  'w^{k+1} = w^k - \\alpha \\nabla f(w^k) \\label{eq:gd}',
  '$$',
  '',
  '$$',
  '\\begin{aligned} a &= b \\\\ c &= d \\end{aligned}',
  '$$',
  '',
  'See @eq:gd.',
].join('\n');

describe.each(['katex', 'mathjax'] as const)('%s', (engine) => {
  it('renders inline and display math with MathML for assistive technology', async () => {
    const { html, data } = await render(source, { engine });
    expect(data.hasMath).toBe(true);
    expect(html.match(/class="el-math"/g)).toHaveLength(2);
    expect(html.match(/class="el-equation"/g)).toHaveLength(2);
    expect(html).toContain('<div class="el-equation" id="eq:gd" tabindex="0">');
    expect(html).toContain(engine === 'katex' ? 'class="katex-mathml"' : 'mjx-assistive-mml');
    expect(html).toContain('<a href="#eq:gd" class="el-xref">Equation 1</a>');
  });

  it('numbers labeled equations with a tag', async () => {
    const { html } = await render(source, { engine });
    const equation = html.slice(
      html.indexOf('id="eq:gd"'),
      html.indexOf('</div>', html.indexOf('id="eq:gd"')),
    );
    // The number is part of the visible output and of the MathML that screen readers use.
    expect(equation).toMatch(engine === 'katex' ? /class="katex-tag"/ : /data-labels="true"/);
    expect(equation).toMatch(
      engine === 'katex' ? /<mtext>\(1\)<\/mtext>/ : /<mlabeledtr>.*<mtext[^>]*>1<\/mtext>/s,
    );
  });

  it('applies the shared macros', async () => {
    const { html } = await render('$\\R$', { engine });
    expect(html).toMatch(engine === 'katex' ? /mathbb|amsrm/ : /mathvariant="double-struck"/);
  });

  it('reports TeX errors with the file and line', async () => {
    await expect(render('Text\n\n$$\n\\frac{a\n$$', { engine })).rejects.toThrow(
      /fixtures\/article\/index\.md:3:1 → \$\$ \\frac\{a \$\$\n {2}\S/,
    );
  });

  it('reads $$…$$ alone in a paragraph as a display equation', async () => {
    const { html } = await render(
      'Text with $$a$$ inline.\n\n$$ w^{k+1} = w^k \\label{eq:one} $$\n\nSee @eq:one.',
      { engine },
    );
    expect(html).toContain('<div class="el-equation" id="eq:one"');
    expect(html).toContain('<a href="#eq:one"');
    expect(html.match(/el-equation/g)).toHaveLength(1);
  });

  it('leaves prices alone and does not mark pages without math', async () => {
    const { html, data } = await render('No math, just $5 and $10, or $ 3 $.', { engine });
    expect(html).toContain('No math, just $5 and $10, or $ 3 $.');
    expect(data.hasMath).toBe(false);
  });
});

it('converts macros to the MathJax format, counting arguments', () => {
  expect(
    mathjaxMacros({ '\\R': '\\mathbb{R}', '\\norm': '\\lVert #1 \\rVert', ip: '#1 \\cdot #2' }),
  ).toEqual({
    R: '\\mathbb{R}',
    norm: ['\\lVert #1 \\rVert', 1],
    ip: ['#1 \\cdot #2', 2],
  });
});
