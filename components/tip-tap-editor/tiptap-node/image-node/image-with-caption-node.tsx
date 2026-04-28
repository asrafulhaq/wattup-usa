'use client';

import { NodeViewWrapper } from '@tiptap/react';
import { useCallback, useRef } from 'react';

/**
 * Custom image node view that renders an image with an editable
 * alt text / caption input below it — matching the reference design.
 */
export function ImageWithCaptionNodeView(props: any) {
    const { node, updateAttributes, selected } = props;
    const { src, alt, title } = node.attrs as {
        src: string;
        alt?: string;
        title?: string;
    };
    const inputRef = useRef<HTMLInputElement>(null);

    const handleAltChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            updateAttributes({ alt: e.target.value });
        },
        [updateAttributes]
    );

    // Prevent Tiptap from stealing focus when clicking the input
    const handleInputClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        inputRef.current?.focus();
    };

    const handleInputKeyDown = (e: React.KeyboardEvent) => {
        // Allow normal typing inside the input without Tiptap intercepting
        e.stopPropagation();
    };

    return (
        <NodeViewWrapper
            className='image-with-caption-wrapper'
            data-drag-handle>
            {/* Image */}
            <div
                className={`image-with-caption-img-container ${selected ? 'image-selected' : ''}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={src}
                    alt={alt || ''}
                    title={title || ''}
                    className='image-with-caption-img'
                    draggable={false}
                />
            </div>

            {/* Alt text / Caption input */}
            <div className='image-with-caption-input-wrapper'>
                <input
                    ref={inputRef}
                    type='text'
                    className='image-with-caption-input'
                    placeholder='Add alt text / caption…'
                    value={alt || ''}
                    onChange={handleAltChange}
                    onClick={handleInputClick}
                    onKeyDown={handleInputKeyDown}
                    aria-label='Image alt text'
                />
            </div>
        </NodeViewWrapper>
    );
}

