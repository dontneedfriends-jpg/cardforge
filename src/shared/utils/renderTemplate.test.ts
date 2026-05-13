import { describe, it, expect } from 'vitest';
import { replaceVariables, cssVariableValue, applyTemplateData } from './renderTemplate';

describe('replaceVariables', () => {
  it('replaces single variable', () => {
    const result = replaceVariables('Hello {{name}}!', { name: 'World' });
    expect(result).toBe('Hello World!');
  });

  it('replaces multiple variables', () => {
    const result = replaceVariables('{{greeting}}, {{name}}!', {
      greeting: 'Hello',
      name: 'Alice',
    });
    expect(result).toBe('Hello, Alice!');
  });

  it('replaces numeric values', () => {
    const result = replaceVariables('Cost: {{cost}}', { cost: 5 });
    expect(result).toBe('Cost: 5');
  });

  it('replaces boolean values', () => {
    const result = replaceVariables('Active: {{active}}', { active: true });
    expect(result).toBe('Active: true');
  });

  it('replaces same variable multiple times', () => {
    const result = replaceVariables('{{x}} + {{x}} = {{y}}', { x: 1, y: 2 });
    expect(result).toBe('1 + 1 = 2');
  });

  it('resolves undefined to empty string', () => {
    const result = replaceVariables('Hello {{missing}}!', {});
    expect(result).toBe('Hello !');
  });

  it('resolves null to empty string', () => {
    const result = replaceVariables('Value: {{val}}', { val: null });
    expect(result).toBe('Value: ');
  });

  it('leaves text without variables unchanged', () => {
    const result = replaceVariables('Hello World!', { name: 'X' });
    expect(result).toBe('Hello World!');
  });

  it('ignores unmatched closing braces without opening', () => {
    const result = replaceVariables('Price: }}5}}', {});
    expect(result).toBe('Price: }}5}}');
  });

  it('handles empty HTML string', () => {
    const result = replaceVariables('', { a: 'b' });
    expect(result).toBe('');
  });

  it('handles empty row', () => {
    const result = replaceVariables('{{a}}{{b}}', {});
    expect(result).toBe('');
  });
});

describe('cssVariableValue', () => {
  it('replaces variables in CSS', () => {
    const css = '.card { color: {{color}}; }';
    const result = cssVariableValue(css, { color: 'red' });
    expect(result).toBe('.card { color: red; }');
  });

  it('replaces numeric CSS values', () => {
    const css = '.card { font-size: {{size}}px; }';
    const result = cssVariableValue(css, { size: 16 });
    expect(result).toBe('.card { font-size: 16px; }');
  });

  it('resolves missing CSS variables to empty string', () => {
    const css = '.card { background: {{bg}}; }';
    const result = cssVariableValue(css, {});
    expect(result).toBe('.card { background: ; }');
  });
});

describe('applyTemplateData', () => {
  const html = '<div>{{name}}</div>';
  const css = '.card { color: {{color}}; }';

  it('replaces variables in both HTML and CSS', () => {
    const result = applyTemplateData(html, css, { name: 'Card', color: 'blue' });
    expect(result.html).toBe('<div>Card</div>');
    expect(result.css).toBe('.card { color: blue; }');
  });

  it('returns originals when row is null', () => {
    const result = applyTemplateData(html, css, null);
    expect(result.html).toBe(html);
    expect(result.css).toBe(css);
  });

  it('returns originals when row is undefined', () => {
    const result = applyTemplateData(html, css, undefined);
    expect(result.html).toBe(html);
    expect(result.css).toBe(css);
  });

  it('returns originals when row is empty object', () => {
    const result = applyTemplateData(html, css, {});
    expect(result.html).toBe('<div></div>');
    expect(result.css).toBe('.card { color: ; }');
  });
});
