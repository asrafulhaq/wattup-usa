/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { EditorContent, EditorContext, useEditor } from '@tiptap/react';
import { useEffect, useRef, useState } from 'react';

// --- Tiptap Core Extensions ---
import { CharacterCount } from '@tiptap/extension-character-count';
import { CodeBlockLowlight } from '@tiptap/extension-code-block-lowlight';
import { FontFamily } from '@tiptap/extension-font-family';
import { Highlight } from '@tiptap/extension-highlight';
import { TaskItem, TaskList } from '@tiptap/extension-list';
import { Subscript } from '@tiptap/extension-subscript';
import { Superscript } from '@tiptap/extension-superscript';
import { Table } from '@tiptap/extension-table';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { TableRow } from '@tiptap/extension-table-row';
import { TextAlign } from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import { Typography } from '@tiptap/extension-typography';
import { Underline } from '@tiptap/extension-underline';
import { Selection } from '@tiptap/extensions';
import { StarterKit } from '@tiptap/starter-kit';
import { common, createLowlight } from 'lowlight';

// --- UI Primitives ---
import { Button as TiptapButton } from '@/components/tip-tap-editor/tiptap-ui-primitive/button';
import { Spacer } from '@/components/tip-tap-editor/tiptap-ui-primitive/spacer';
import {
    Toolbar,
    ToolbarGroup,
    ToolbarSeparator,
} from '@/components/tip-tap-editor/tiptap-ui-primitive/toolbar';

// --- Tiptap Node ---
import { HorizontalRule } from '@/components/tip-tap-editor/tiptap-node/horizontal-rule-node/horizontal-rule-node-extension';
import { ImageWithCaption } from '@/components/tip-tap-editor/tiptap-node/image-node/image-with-caption-extension';
import { ImageUploadNode } from '@/components/tip-tap-editor/tiptap-node/image-upload-node/image-upload-node-extension';

// Styles for nodes
import '@/components/tip-tap-editor/tiptap-node/blockquote-node/blockquote-node.scss';
import '@/components/tip-tap-editor/tiptap-node/code-block-node/code-block-node.scss';
import '@/components/tip-tap-editor/tiptap-node/heading-node/heading-node.scss';
import '@/components/tip-tap-editor/tiptap-node/horizontal-rule-node/horizontal-rule-node.scss';
import '@/components/tip-tap-editor/tiptap-node/image-node/image-node.scss';
import '@/components/tip-tap-editor/tiptap-node/list-node/list-node.scss';
import '@/components/tip-tap-editor/tiptap-node/paragraph-node/paragraph-node.scss';

// --- Tiptap UI ---
import { BlockquoteButton } from '@/components/tip-tap-editor/tiptap-ui/blockquote-button';
import { CodeBlockButton } from '@/components/tip-tap-editor/tiptap-ui/code-block-button';
import {
    ColorHighlightPopover,
    ColorHighlightPopoverButton,
    ColorHighlightPopoverContent,
} from '@/components/tip-tap-editor/tiptap-ui/color-highlight-popover';
import { HeadingDropdownMenu } from '@/components/tip-tap-editor/tiptap-ui/heading-dropdown-menu';
import { ImageUploadButton } from '@/components/tip-tap-editor/tiptap-ui/image-upload-button';
import {
    LinkButton,
    LinkContent,
    LinkPopover,
} from '@/components/tip-tap-editor/tiptap-ui/link-popover';
import { ListDropdownMenu } from '@/components/tip-tap-editor/tiptap-ui/list-dropdown-menu';
import { MarkButton } from '@/components/tip-tap-editor/tiptap-ui/mark-button';
import { TextAlignButton } from '@/components/tip-tap-editor/tiptap-ui/text-align-button';
import { UndoRedoButton } from '@/components/tip-tap-editor/tiptap-ui/undo-redo-button';

// --- Icons ---
import { ArrowLeftIcon } from '@/components/tip-tap-editor/tiptap-icons/arrow-left-icon';
import { HighlighterIcon } from '@/components/tip-tap-editor/tiptap-icons/highlighter-icon';
import { LinkIcon } from '@/components/tip-tap-editor/tiptap-icons/link-icon';

// --- Hooks ---
import { useCursorVisibility } from '@/hooks/use-cursor-visibility';
import { useIsBreakpoint } from '@/hooks/use-is-breakpoint';
import { useTheme } from 'next-themes';

// --- Lib ---
import { handleImageUpload, MAX_FILE_SIZE } from '@/lib/tiptap-utils';

// --- Styles ---
import '@/components/tip-tap-editor/tiptap-editor-style/simple-editor.scss';
import 'highlight.js/styles/github-dark.css';

const lowlight = createLowlight(common);

interface RichTextEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}

const MainToolbarContent = ({
    onHighlighterClick,
    onLinkClick,
    isMobile,
}: {
    onHighlighterClick: () => void;
    onLinkClick: () => void;
    isMobile: boolean;
}) => {
    return (
        <>
            <Spacer />

            <ToolbarGroup>
                <UndoRedoButton action='undo' />
                <UndoRedoButton action='redo' />
            </ToolbarGroup>

            <ToolbarSeparator />

            <ToolbarGroup>
                <HeadingDropdownMenu levels={[1, 2, 3, 4]} portal={isMobile} />
                <ListDropdownMenu
                    types={['bulletList', 'orderedList', 'taskList']}
                    portal={isMobile}
                />
                <BlockquoteButton />
                <CodeBlockButton />
            </ToolbarGroup>

            <ToolbarSeparator />

            <ToolbarGroup>
                <MarkButton type='bold' />
                <MarkButton type='italic' />
                <MarkButton type='strike' />
                <MarkButton type='code' />
                <MarkButton type='underline' />
                {!isMobile ? (
                    <ColorHighlightPopover />
                ) : (
                    <ColorHighlightPopoverButton onClick={onHighlighterClick} />
                )}
                {!isMobile ? (
                    <LinkPopover />
                ) : (
                    <LinkButton onClick={onLinkClick} />
                )}
            </ToolbarGroup>

            <ToolbarSeparator />

            <ToolbarGroup>
                <MarkButton type='superscript' />
                <MarkButton type='subscript' />
            </ToolbarGroup>

            <ToolbarSeparator />

            <ToolbarGroup>
                <TextAlignButton align='left' />
                <TextAlignButton align='center' />
                <TextAlignButton align='right' />
                <TextAlignButton align='justify' />
            </ToolbarGroup>

            <ToolbarSeparator />

            <ToolbarGroup>
                <ImageUploadButton text='Add' />
            </ToolbarGroup>

            <Spacer />
        </>
    );
};

const MobileToolbarContent = ({
    type,
    onBack,
}: {
    type: 'highlighter' | 'link';
    onBack: () => void;
}) => (
    <>
        <ToolbarGroup>
            <TiptapButton variant='ghost' onClick={onBack}>
                <ArrowLeftIcon className='tiptap-button-icon' />
                {type === 'highlighter' ? (
                    <HighlighterIcon className='tiptap-button-icon' />
                ) : (
                    <LinkIcon className='tiptap-button-icon' />
                )}
            </TiptapButton>
        </ToolbarGroup>

        <ToolbarSeparator />

        {type === 'highlighter' ? (
            <ColorHighlightPopoverContent />
        ) : (
            <LinkContent />
        )}
    </>
);

function TipTapSurface({ value, onChange, placeholder }: RichTextEditorProps) {
    const isMobile = useIsBreakpoint('max', 480);
    const [mobileView, setMobileView] = useState<
        'main' | 'highlighter' | 'link'
    >('main');
    const toolbarRef = useRef<HTMLDivElement>(null);

    const editor = useEditor({
        immediatelyRender: false,
        editorProps: {
            attributes: {
                autocomplete: 'off',
                autocorrect: 'off',
                autocapitalize: 'off',
                'aria-label': 'Main content area, start typing to enter text.',
                class: 'simple-editor focus:outline-none min-h-[400px] ',
            },
        },
        extensions: [
            StarterKit.configure({
                horizontalRule: false,
                codeBlock: false, // replaced by CodeBlockLowlight
                link: {
                    openOnClick: false,
                    enableClickSelection: true,
                },
                heading: { levels: [1, 2, 3, 4] },
            }),
            CodeBlockLowlight.configure({
                lowlight,
                defaultLanguage: null,
                HTMLAttributes: {
                    class: 'hljs',
                },
            }),
            HorizontalRule,
            TextAlign.configure({ types: ['heading', 'paragraph', 'image'] }),
            TaskList,
            TaskItem.configure({ nested: true }),
            Highlight.configure({ multicolor: true }),
            ImageWithCaption,
            Typography,
            Underline,
            Superscript,
            Subscript,
            Selection,
            TextStyle,
            FontFamily,
            CharacterCount,
            Table.configure({
                resizable: true,
                HTMLAttributes: {
                    class: 'border-collapse table-auto w-full my-4',
                },
            }),
            TableRow,
            TableHeader,
            TableCell,
            ImageUploadNode.configure({
                accept: 'image/*',
                maxSize: MAX_FILE_SIZE,
                limit: 3,
                upload: handleImageUpload,
                onError: (error: Error) =>
                    console.error('Upload failed:', error),
            }),
        ],
        content: value,
        onUpdate: ({ editor }: any) => {
            onChange(editor.getHTML());
        },
    });

    useCursorVisibility({
        editor,
        // eslint-disable-next-line react-hooks/refs
        overlayHeight: toolbarRef.current?.getBoundingClientRect().height ?? 0,
    });

    useEffect(() => {
        if (!isMobile && mobileView !== 'main') {
            setMobileView('main');
        }
    }, [isMobile, mobileView]);

    useEffect(() => {
        if (editor && value !== editor.getHTML()) {
            editor.commands.setContent(value || '');
        }
    }, [value, editor]);

    if (!editor) {
        return (
            <div className='h-[400px] w-full bg-muted/5 border border-border rounded-xl animate-pulse' />
        );
    }

    return (
        <div className='rich-text-editor-container relative flex flex-col border border-border rounded-xl  overflow-hidden bg-background'>
            <EditorContext.Provider value={{ editor }}>
                <Toolbar
                    ref={toolbarRef}
                    className='border-b border-border bg-muted/20 order-last sm:order-first'>
                    {mobileView === 'main' ? (
                        <MainToolbarContent
                            onHighlighterClick={() =>
                                setMobileView('highlighter')
                            }
                            onLinkClick={() => setMobileView('link')}
                            isMobile={isMobile}
                        />
                    ) : (
                        <MobileToolbarContent
                            type={
                                mobileView === 'highlighter'
                                    ? 'highlighter'
                                    : 'link'
                            }
                            onBack={() => setMobileView('main')}
                        />
                    )}
                </Toolbar>

                <div className='editor-content-scroll shadow-inner min-h-[400px]'>
                    <EditorContent
                        editor={editor}
                        role='presentation'
                        className='simple-editor-content '
                    />
                </div>
            </EditorContext.Provider>

            <style jsx global>{`
                .rich-text-editor-container .simple-editor-content {
                    max-width: none !important;
                    margin: 0 !important;
                    height: auto !important;
                }
                .rich-text-editor-container .tiptap.ProseMirror.simple-editor {
                    padding: 1rem !important;
                    min-height: 400px;
                }
                @media (min-width: 640px) {
                    .rich-text-editor-container
                        .tiptap.ProseMirror.simple-editor {
                        padding: 1.5rem !important;
                    }
                }
                .rich-text-editor-container .simple-editor-wrapper {
                    height: auto !important;
                    width: 100% !important;
                }
                /* Ensure lists are visible outside of .prose if needed */
                .rich-text-editor-container .tiptap ul {
                    list-style-type: disc !important;
                    padding-left: 1.5rem !important;
                    margin: 1rem 0 !important;
                }
                .rich-text-editor-container .tiptap ol {
                    list-style-type: decimal !important;
                    padding-left: 1.5rem !important;
                    margin: 1rem 0 !important;
                }
                /* Table styles */
                .rich-text-editor-container .tiptap table {
                    border-collapse: collapse;
                    margin: 1rem 0;
                    overflow: hidden;
                    table-layout: fixed;
                    width: 100%;
                }
                .rich-text-editor-container .tiptap td,
                .rich-text-editor-container .tiptap th {
                    border: 1px solid var(--border);
                    box-sizing: border-box;
                    min-width: 1em;
                    padding: 6px 8px;
                    position: relative;
                    vertical-align: top;
                }
                .rich-text-editor-container .tiptap th {
                    background-color: var(--muted);
                    font-weight: bold;
                    text-align: left;
                }
                /* Image styles */
                .rich-text-editor-container .tiptap img:not(.image-with-caption-img) {
                    max-width: 100% !important;
                    width: 100% !important;
                    height: auto;
                    object-fit: contain !important;
                    border-radius: 0.5rem;
                    display: block;
                    margin: 0 auto;
                }

                .rich-text-editor-container .tiptap figure {
                    max-width: 100% !important;
                    margin: 1rem auto !important;
                }

                .rich-text-editor-container .tiptap figure img:not(.image-with-caption-img) {
                    width: 100% !important;
                    height: auto;
                    object-fit: contain !important;
                }

                .rich-text-editor-container .tiptap figcaption {
                    font-size: 12px;
                    color: var(--muted-foreground);
                    text-align: center;
                    margin-top: 0.5rem;
                }
                /* Selection highlight */
                .rich-text-editor-container .tiptap {
                    --editor-selection-bg: rgba(25, 125, 255, 0.28);
                    --editor-node-selection-bg: rgba(25, 125, 255, 0.16);
                    --editor-selection-ring: rgba(25, 125, 255, 0.65);
                }

                @supports (background-color: color-mix(in srgb, red, transparent)) {
                    .rich-text-editor-container .tiptap {
                        --editor-selection-bg: color-mix(
                            in srgb,
                            var(--primary) 30%,
                            transparent
                        );
                        --editor-node-selection-bg: color-mix(
                            in srgb,
                            var(--primary) 16%,
                            transparent
                        );
                        --editor-selection-ring: color-mix(
                            in srgb,
                            var(--primary) 65%,
                            transparent
                        );
                    }
                }

                .rich-text-editor-container .tiptap::selection,
                .rich-text-editor-container .tiptap *::selection {
                    background-color: var(--editor-selection-bg) !important;
                    color: inherit !important;
                }

                .rich-text-editor-container .tiptap .selection {
                    background-color: var(--editor-selection-bg) !important;
                }

                .rich-text-editor-container .tiptap .ProseMirror-selectednode {
                    background-color: var(--editor-node-selection-bg) !important;
                    outline: 2px solid var(--editor-selection-ring) !important;
                    outline-offset: 2px;
                }
            `}</style>
        </div>
    );
}

export function RichTextEditor({
    value,
    onChange,
    placeholder = 'Start writing...',
}: RichTextEditorProps) {
    const { theme } = useTheme();

    return (
        <div
            suppressHydrationWarning
            className='w-full'
            data-color-mode={theme === 'dark' ? 'dark' : 'light'}>
            <TipTapSurface
                value={value}
                onChange={onChange}
                placeholder={placeholder}
            />
        </div>
    );
}
