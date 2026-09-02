'use client';

import { html } from '@codemirror/lang-html';
import ReactCodeMirror from '@uiw/react-codemirror';

interface ScriptEditorProps {
    id?: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    minHeight?: string;
}

const extensions = [html()];

export function ScriptEditor({
    value,
    onChange,
    minHeight = '140px',
}: ScriptEditorProps) {
    return (
        <ReactCodeMirror
            value={value}
            onChange={onChange}
            extensions={extensions}
            theme='dark'
            minHeight={minHeight}
            style={{
                fontSize: 13,
                borderRadius: '0.5rem',
                overflow: 'hidden',
                border: '1px solid hsl(var(--border))',
            }}
            basicSetup={{
                lineNumbers: true,
                foldGutter: false,
                highlightActiveLine: true,
                bracketMatching: true,
                autocompletion: true,
                closeBrackets: true,
                indentOnInput: true,
            }}
        />
    );
}
