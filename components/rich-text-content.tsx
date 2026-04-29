'use client';
import { highlightHtml } from '@/lib/highlight-utils';
import 'highlight.js/styles/github-dark.css';
import { marked } from 'marked';
import React, { useEffect, useState } from 'react';
import DOMPurify from 'dompurify';

interface RichTextContentProps {
    content: string;
    className?: string;
    short?: boolean;
}

function wrapImagesWithCaptions(html: string): string {
    return html.replace(
        /<img\s([^>]*?)alt="([^"]+)"([^>]*?)\/?>/gi,
        (_, before, alt, after) =>
            `<figure><img ${before}alt="${alt}"${after}/><figcaption style="font-size: 12px; color: rgba(17, 24, 39, 0.7); margin-top: -20px;">${alt}</figcaption></figure>`
    );
}

export default function RichTextContent({
    content,
    className = '',
}: RichTextContentProps) {
    const [processedContent, setProcessedContent] = useState('');

    useEffect(() => {
        let cancelled = false;

        async function process() {
            const parsed = await marked.parse(content || '', { async: true });
            const highlighted = await highlightHtml(parsed);
            const withCaptions = wrapImagesWithCaptions(highlighted);

            const clean = DOMPurify.sanitize(withCaptions, {
                USE_PROFILES: { html: true },
                ADD_TAGS: ['figure', 'figcaption'],
                ADD_ATTR: [
                    'class',
                    'style',
                    'alt',
                    'src',
                    'href',
                    'target',
                    'rel',
                ],
            });

            if (!cancelled) setProcessedContent(clean);
        }

        process();
        return () => {
            cancelled = true;
        };
    }, [content]);

    return (
        <div
            className={`prose prose-stone dark:prose-invert text-foreground max-w-none ${className}`}
            dangerouslySetInnerHTML={{ __html: processedContent }}
        />
    );
}
