import { highlightHtml } from '@/lib/highlight-utils';
import 'highlight.js/styles/github-dark.css';

interface RichTextContentProps {
    content: string;
    className?: string;
}

/**
 * Wraps standalone <img> tags that have a non-empty alt attribute
 * in <figure> with a visible <figcaption> below the image.
 */
function wrapImagesWithCaptions(html: string): string {
    return html.replace(
        /<img\s([^>]*?)alt="([^"]+)"([^>]*?)\/?>/gi,
        (match, before, alt, after) => {
            // Skip if already inside a <figure>
            return `<figure><img ${before}alt="${alt}"${after}/><figcaption style="font-size: 12px; color: rgba(17, 24, 39, 0.7); margin-top: -20px;">${alt}</figcaption></figure>`;
        }
    );
}

/**
 * A component to render Rich Text (HTML) with syntax highlighting.
 * Supports all features of the Tiptap editor (tables, task lists, code blocks, etc.)
 * Works as a Server Component.
 */
export default async function RichTextContent({
    content,
    className = '',
}: RichTextContentProps) {
    const highlightedContent = await highlightHtml(content);
    const processedContent = wrapImagesWithCaptions(highlightedContent);

    return (
        <div
            className={`prose prose-stone dark:prose-invert text-foreground max-w-none 
                ${className} 
                
                scrollbar-thin scrollbar-thumb-border scrollbar-track-border/20
                
                /* Code Block Styles */
                [&_pre]:p-0 
                [&_pre]:bg-transparent 
                [&_pre]:border-none
                [&_pre]:my-6
                [&_pre_code.hljs]:p-5
                [&_pre_code.hljs]:rounded-xl 
                [&_pre_code.hljs]:block
                [&_pre_code.hljs]:overflow-x-auto
                [&_pre_code.hljs]:font-mono
                [&_pre_code.hljs]:text-[13px]
                [&_pre_code.hljs]:leading-relaxed
                [&_pre_code.hljs]:border
                [&_pre_code.hljs]:border-border/50
                
                /* Code Block Scrollbar */
                [&_pre_code.hljs::-webkit-scrollbar]:h-1.5
                [&_pre_code.hljs::-webkit-scrollbar-track]:bg-transparent
                [&_pre_code.hljs::-webkit-scrollbar-thumb]:bg-muted-foreground/20
                [&_pre_code.hljs::-webkit-scrollbar-thumb]:rounded-full
                [&_pre_code.hljs::-webkit-scrollbar-thumb:hover]:bg-muted-foreground/40
                
                /* Inline Code */
                [&_:not(pre)_>_code]:bg-muted/50
                [&_:not(pre)_>_code]:text-primary
                [&_:not(pre)_>_code]:px-1.5
                [&_:not(pre)_>_code]:py-0.5
                [&_:not(pre)_>_code]:rounded-md
                [&_:not(pre)_>_code]:font-mono
                [&_:not(pre)_>_code]:text-[0.85em]
                [&_:not(pre)_>_code]:font-medium
                [&_:not(pre)_>_code]:before:content-none
                [&_:not(pre)_>_code]:after:content-none

                /* Table Styles */
                [&_table]:border-collapse
                [&_table]:w-full
                [&_table]:my-8
                [&_table]:text-sm
                [&_th]:border
                [&_th]:border-border
                [&_th]:bg-muted/30
                [&_th]:p-3
                [&_th]:text-left
                [&_th]:font-semibold
                [&_td]:border
                [&_td]:border-border
                [&_td]:p-3

                /* List Styles */
                [&_ul]:my-6
                [&_ol]:my-6
                [&_li]:my-2
                
                /* Task List Styles */
                [&_ul[data-type="taskList"]]:list-none
                [&_ul[data-type="taskList"]]:pl-1
                [&_ul[data-type="taskList"]_li]:flex
                [&_ul[data-type="taskList"]_li]:gap-3
                [&_ul[data-type="taskList"]_li_input]:mt-1.5
                [&_ul[data-type="taskList"]_li_input]:accent-primary

                /* Blockquote Styles */
                [&_blockquote]:border-l-4
                [&_blockquote]:border-primary/20
                [&_blockquote]:bg-muted/10
                [&_blockquote]:py-2
                [&_blockquote]:px-6
                [&_blockquote]:italic
                [&_blockquote]:rounded-r-lg
                [&_blockquote]:my-8

                /* Horizontal Rule */
                [&_hr]:my-10
                [&_hr]:border-t
                [&_hr]:border-border/60
                
                /* Image and Figure Styles */
                [&_img]:rounded-xl
                [&_img]:border
                [&_img]:border-border/50
                [&_img]:shadow-sm
                [&_figure]:my-8
                [&_figcaption]:text-center
                [&_figcaption]:text-sm
                [&_figcaption]:text-text-muted
                [&_figcaption]:mt-3
                
                /* Text Formatting */
                [&_sub]:bottom-0
                [&_sup]:top-0
                [&_mark]:bg-yellow-200/50
                [&_mark]:dark:bg-yellow-500/30
                [&_mark]:px-1
                [&_mark]:rounded-sm
                
                /* Typography Overrides */
                [&_h1]:text-3xl
                [&_h1]:md:text-4xl
                [&_h1]:mb-6
                [&_h1]:tracking-tight
                [&_h2]:text-2xl
                [&_h2]:md:text-3xl
                [&_h2]:mb-4
                [&_h2]:mt-10
                [&_h2]:tracking-tight
                [&_h3]:text-xl
                [&_h3]:md:text-2xl
                [&_h3]:mb-3
                [&_h3]:mt-8
                [&_p]:leading-[1.7]
                [&_p]:mb-5
                [&_p]:text-text-description
                [&_strong]:text-foreground
                [&_strong]:font-bold`}
            dangerouslySetInnerHTML={{ __html: processedContent }}
        />
    );
}

