'use client';

import { useEffect } from 'react';

export function InjectHeadScripts({ html }: { html: string }) {
    useEffect(() => {
        const tmp = document.createElement('div');
        tmp.innerHTML = html;
        Array.from(tmp.childNodes).forEach(node =>
            document.head.appendChild(node.cloneNode(true))
        );
    }, [html]);

    return null;
}
