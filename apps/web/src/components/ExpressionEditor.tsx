import dynamic from 'next/dynamic';
import { javascript } from '@codemirror/lang-javascript';
import { EditorView } from '@codemirror/view';
import { tomorrowNightBlue } from '@uiw/codemirror-theme-tomorrow-night-blue';

const CodeMirror = dynamic(
  () => import('@uiw/react-codemirror').then((mod) => mod.default),
  { ssr: false },
);

interface ExpressionEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export function ExpressionEditor({ value, onChange }: ExpressionEditorProps) {
  return (
    <CodeMirror
      value={value}
      height="200px"
      extensions={[javascript(), EditorView.lineWrapping]}
      basicSetup={{
        lineNumbers: false,
        foldGutter: false,
        highlightActiveLine: false,
      }}
      theme={tomorrowNightBlue}
      onChange={(nextValue: string) => onChange(nextValue)}
    />
  );
}
