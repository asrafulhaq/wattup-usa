'use client';
import { highlightHtml } from '@/lib/highlight-utils';
import 'highlight.js/styles/github-dark.css';
import { marked } from 'marked';
import React, { useEffect, useState } from 'react';
import DOMPurify from 'dompurify';

// --- Tiptap Node Styles ---
import '@/components/tiptap-node/blockquote-node/blockquote-node.scss';
import '@/components/tiptap-node/code-block-node/code-block-node.scss';
import '@/components/tiptap-node/heading-node/heading-node.scss';
import '@/components/tiptap-node/horizontal-rule-node/horizontal-rule-node.scss';
import '@/components/tiptap-node/image-node/image-node.scss';
import '@/components/tiptap-node/list-node/list-node.scss';
import '@/components/tiptap-node/paragraph-node/paragraph-node.scss';
import '@/components/tiptap-templates/simple/simple-editor.scss';

interface RichTextContentProps {
    content: string | null;
    className?: string;
    short?: boolean;
}

function wrapImagesWithCaptions(html: string): string {
    return html.replace(/<img\s([^>]*?)\/?>/gi, (match) => {
        const altMatch = match.match(/alt="([^"]*)"/i);
        const alt = altMatch ? altMatch[1] : '';
        const srcMatch = match.match(/src="([^"]*)"/i);
        const src = srcMatch ? srcMatch[1] : '';

        // Extract other attributes
        const otherAttrs = match
            .replace(/alt="[^"]*"/gi, '')
            .replace(/src="[^"]*"/gi, '')
            .replace(/<img\s/i, '')
            .replace(/\/?>/i, '')
            .trim();

        return `<figure class="image-with-caption-wrapper" style="width: 100%; max-width: 700px; margin: 2rem auto;">
                <div class="image-with-caption-img-container" style="width: 100%; height: 400px; overflow: hidden; border-radius: 0.5rem;">
                    <img src="${src}" alt="${alt}" ${otherAttrs} style="width: 100%; height: 100%; object-fit: cover;" class="image-with-caption-img"/>
                </div>
                ${
                    alt
                        ? `<figcaption style="font-size: 14px; color: rgba(17, 24, 39, 0.7); margin-top: 0.75rem; text-align: center;">${alt}</figcaption>`
                        : ''
                }
            </figure>`;
    });
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
        <div className='simple-editor-content' style={{ maxWidth: '700px', margin: '0 auto', fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
            <div
                className={`tiptap ProseMirror simple-editor !min-h-0 !p-0 ${className}`}
                dangerouslySetInnerHTML={{ __html: processedContent }}
            />
        </div>
    );
}
