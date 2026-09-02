/**
 * Serialises a value for a `<script type="application/ld+json">` body.
 *
 * `JSON.stringify` escapes quotes and backslashes and nothing else. An HTML parser ends
 * a script element at the first literal `</script`, whatever JSON thinks the quoting
 * means, so a database value containing that sequence closes the block and anything
 * after it is parsed as markup.
 *
 * React defends against exactly this, but only when the JSON is passed as *children*:
 * react-dom-server applies a `/(<\/|<)(s)(cript)/gi` replacement to `"" + children` and
 * leaves the `dangerouslySetInnerHTML` path untouched. Every JSON-LD block in this app
 * uses innerHTML, so the escaping has to happen here.
 *
 * `<` and friends are ordinary JSON escapes: every structured data parser decodes
 * them back to the original characters, so Google reads exactly what it read before.
 *
 * The last two are the JavaScript hazard rather than the HTML one. U+2028 and U+2029 are
 * literal line terminators in JavaScript but legal unescaped inside a JSON string, which
 * is the one way a valid JSON document can still break a script that embeds it.
 */
export function safeJsonLd(schema: unknown): string {
    return JSON.stringify(schema)
        .replace(/</g, '\\u003c')
        .replace(/>/g, '\\u003e')
        .replace(/&/g, '\\u0026')
        .replace(/\u2028/g, '\\u2028')
        .replace(/\u2029/g, '\\u2029');
}
