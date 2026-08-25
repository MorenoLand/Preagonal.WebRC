import { lazy, Suspense } from 'react';
import type { ChangeEvent } from 'react';

const MonacoEditor = lazy(() => import('./MonacoEditor'));

export interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language?: string;
  path?: string;
  readOnly?: boolean;
  ariaLabel: string;
}

export function CodeEditor(props: CodeEditorProps) {
  const fallback = <textarea className="code-editor-fallback" aria-label={props.ariaLabel} value={props.value} onChange={(event: ChangeEvent<HTMLTextAreaElement>) => props.onChange(event.target.value)} readOnly={props.readOnly} />;
  return <div className="code-editor-shell" aria-label={props.ariaLabel} data-testid="code-editor">
    {import.meta.env.MODE === 'test' ? fallback : <Suspense fallback={<div className="code-editor-loading">Loading editor…</div>}><MonacoEditor {...props} /></Suspense>}
  </div>;
}
