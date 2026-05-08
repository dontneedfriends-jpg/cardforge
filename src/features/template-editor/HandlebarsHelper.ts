import type { Column } from '../../shared/types/project';

export function registerHandlebarsCompletions(monaco: any, columns: Column[]) {
  if (!monaco.languages?.registerCompletionItemProvider) return;

  const suggestions = columns.map(col => ({
    label: `{{${col.name}}}`,
    kind: monaco.languages.CompletionItemKind.Variable,
    insertText: `{{${col.name}}}`,
    detail: `Column: ${col.type}`,
    range: {
      startLineNumber: 0,
      endLineNumber: 0,
      startColumn: 0,
      endColumn: 0,
    },
  }));

  const dispose = monaco.languages.registerCompletionItemProvider('html', {
    triggerCharacters: ['{', '{', '.'],
    provideCompletionItems: (model: any, position: any) => {
      const word = model.getWordUntilPosition(position);
      return {
        suggestions: suggestions.map(s => ({
          ...s,
          range: {
            startLineNumber: position.lineNumber,
            endLineNumber: position.lineNumber,
            startColumn: word.startColumn,
            endColumn: word.endColumn,
          },
        })),
      };
    },
  });

  return dispose;
}
