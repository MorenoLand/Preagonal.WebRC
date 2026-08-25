import Editor, { loader, type BeforeMount } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import editorWorker from 'monaco-editor/editor/editor.worker?worker';
import jsonWorker from 'monaco-editor/language/json/json.worker?worker';
import cssWorker from 'monaco-editor/language/css/css.worker?worker';
import htmlWorker from 'monaco-editor/language/html/html.worker?worker';
import tsWorker from 'monaco-editor/language/typescript/ts.worker?worker';
import type { CodeEditorProps } from './CodeEditor';

type MonacoEnvironment = { getWorker: (_moduleId: string, label: string) => Worker };

loader.config({ monaco });

if (typeof window !== 'undefined') {
  (globalThis as typeof globalThis & { MonacoEnvironment?: MonacoEnvironment }).MonacoEnvironment = {
    getWorker: (_moduleId, label) => {
      if (label === 'json') return new jsonWorker();
      if (label === 'css' || label === 'scss' || label === 'less') return new cssWorker();
      if (label === 'html' || label === 'handlebars' || label === 'razor') return new htmlWorker();
      if (label === 'typescript' || label === 'javascript') return new tsWorker();
      return new editorWorker();
    }
  };
}

function configureEditor(beforeMountMonaco: Parameters<BeforeMount>[0]): void {
  beforeMountMonaco.editor.defineTheme('preagonal-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '6f7d8a' },
      { token: 'string', foreground: 'a8d5b5' },
      { token: 'keyword', foreground: '8bc6ff' }
    ],
    colors: {
      'editor.background': '#0b0d12',
      'editor.foreground': '#dbe6dd',
      'editorLineNumber.foreground': '#56606d',
      'editorLineNumber.activeForeground': '#a8d5b5',
      'editorCursor.foreground': '#63c58b',
      'editor.selectionBackground': '#214833',
      'editor.inactiveSelectionBackground': '#182e22',
      'editor.lineHighlightBackground': '#10171a'
    }
  });
  beforeMountMonaco.languages.typescript?.javascriptDefaults.setDiagnosticsOptions({ noSemanticValidation: true, noSyntaxValidation: true });
}

export default function MonacoEditor({ value, onChange, language = 'javascript', path, readOnly = false, ariaLabel }: CodeEditorProps) {
  return <Editor height="100%" width="100%" theme="preagonal-dark" language={language} path={path} value={value} onChange={nextValue => onChange(nextValue ?? '')} beforeMount={configureEditor} loading={<div className="code-editor-loading">Loading editor…</div>} options={{ automaticLayout: true, fontFamily: "'Cascadia Code', Consolas, monospace", fontSize: 12, lineNumbers: 'on', minimap: { enabled: true }, padding: { top: 12, bottom: 12 }, readOnly, scrollBeyondLastLine: false, wordWrap: 'on', ariaLabel }} />;
}
