import rehypeHighlight from 'rehype-highlight';
import rehypeParse from 'rehype-parse';
import rehypeStringify from 'rehype-stringify';
import { unified } from 'unified';

/**
 * Highlighting HTML content using rehype-highlight
 * This is meant to be used on the server or during build time.
 */
export async function highlightHtml(html: string) {
    // Some posts might have 'language-plaintext' or just 'hljs' without a language class,
    // which can sometimes block smart detection in rehype-highlight.
    // We clean these up to ensure the detector gets a fresh look at the code.
    const cleanedHtml = html.replace(
        /class="[^"]*language-plaintext[^"]*"/g,
        'class="hljs"'
    );

    const file = await unified()
        .use(rehypeParse, { fragment: true })
        .use(rehypeHighlight, {
            detect: true,
        })
        .use(rehypeStringify)
        .process(cleanedHtml);

    return String(file);
}

