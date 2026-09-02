/**
 * Dark-mode coverage check for a rendered email (checklist B.14).
 *
 * Three things must hold, and each failure is reported as a line:
 *
 *   1. The head opts in: both colour-scheme metas and the `:root` declaration.
 *   2. Every element whose inline style carries a colour is matched by a rule inside
 *      the `@media (prefers-color-scheme: dark)` block that sets the same kind of
 *      property (color, background-color, border-color or box-shadow), so no light
 *      colour is left without a dark counterpart.
 *   3. Every dark rule has both Outlook.com twins, `[data-ogsc] .x` and
 *      `[data-ogsb] .x`, with identical declarations.
 *
 * Pure functions over the HTML string; render-mail.ts is the runner.
 */

export type Coverage = {
    problems: string[];
    lightColours: string[];
    darkColours: string[];
};

type Declarations = Map<string, string>;
type Rule = { selectors: string[]; declarations: Declarations };
type Element = { tag: string; classes: string[]; style: Declarations };

const COLOURS = /#[0-9a-f]{3,8}\b|rgba?\([^)]*\)/gi;
const HAS_COLOUR = /#[0-9a-f]{3,8}\b|rgba?\(/i;

function parseDeclarations(body: string): Declarations {
    const declarations: Declarations = new Map();
    for (const part of body.split(';')) {
        const index = part.indexOf(':');
        if (index === -1) continue;
        const property = part.slice(0, index).trim().toLowerCase();
        const value = part.slice(index + 1).replace(/!important/g, '').trim();
        if (property) declarations.set(property, value);
    }
    return declarations;
}

/** Top-level rules and the rules inside the dark media block, in one pass. */
function parseStyle(css: string): { topLevel: Rule[]; dark: Rule[] } {
    const topLevel: Rule[] = [];
    const dark: Rule[] = [];

    const parseRules = (text: string, into: Rule[]): void => {
        let buffer = '';
        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            if (char === ';') {
                buffer = '';
                continue;
            }
            if (char !== '{') {
                buffer += char;
                continue;
            }
            const selector = buffer.trim();
            buffer = '';
            let depth = 1;
            let j = i + 1;
            for (; j < text.length && depth > 0; j++) {
                if (text[j] === '{') depth++;
                else if (text[j] === '}') depth--;
            }
            const inner = text.slice(i + 1, j - 1);
            i = j - 1;
            if (selector.startsWith('@media')) {
                if (/prefers-color-scheme:\s*dark/.test(selector)) parseRules(inner, dark);
                continue;
            }
            if (selector.startsWith('@')) continue;
            into.push({
                selectors: selector.split(',').map((single) => single.trim()).filter(Boolean),
                declarations: parseDeclarations(inner),
            });
        }
    };

    parseRules(css.replace(/\/\*[\s\S]*?\*\//g, ''), topLevel);
    return { topLevel, dark };
}

/** Elements after </head> that carry an inline style; comments (and so the mso blocks) are dropped. */
function parseElements(html: string): Element[] {
    const body = html.slice(html.indexOf('</head>')).replace(/<!--[\s\S]*?-->/g, '');
    const elements: Element[] = [];
    for (const match of body.matchAll(/<([a-z][\w:-]*)([^>]*)>/gi)) {
        const attributes = match[2];
        const style = /\bstyle="([^"]*)"/i.exec(attributes)?.[1];
        if (!style) continue;
        const classes = /\bclass="([^"]*)"/i.exec(attributes)?.[1]?.split(/\s+/).filter(Boolean) ?? [];
        elements.push({ tag: match[1].toLowerCase(), classes, style: parseDeclarations(style) });
    }
    return elements;
}

/** The dark property that has to cover a light inline property carrying a colour. */
function darkPropertyFor(property: string): string | undefined {
    if (property === 'color') return 'color';
    if (property === 'background' || property === 'background-color') return 'background-color';
    if (property === 'border' || /^border-(top|right|bottom|left)$/.test(property)) return 'border-color';
    if (property.endsWith('-color')) return 'border-color';
    if (property === 'box-shadow') return 'box-shadow';
    return undefined;
}

function coloursIn(values: Iterable<string>): string[] {
    const found = new Set<string>();
    for (const value of values) for (const colour of value.match(COLOURS) ?? []) found.add(colour.toLowerCase());
    return [...found].sort();
}

export function checkDarkCoverage(html: string): Coverage {
    const problems: string[] = [];
    const styleText = /<style>([\s\S]*?)<\/style>/i.exec(html)?.[1] ?? '';
    const { topLevel, dark } = parseStyle(styleText);

    if (!/<meta name="color-scheme" content="light dark"/.test(html)) problems.push('missing <meta name="color-scheme" content="light dark">');
    if (!/<meta name="supported-color-schemes" content="light dark"/.test(html)) problems.push('missing <meta name="supported-color-schemes" content="light dark">');
    if (!/:root\s*\{[^}]*color-scheme:\s*light dark/.test(styleText)) problems.push('missing :root { color-scheme: light dark }');
    if (dark.length === 0) problems.push('no @media (prefers-color-scheme: dark) block');

    const darkBySelector = new Map<string, Declarations>();
    for (const rule of dark) for (const selector of rule.selectors) darkBySelector.set(selector, rule.declarations);

    const outlook = new Map<string, Declarations>();
    for (const rule of topLevel) {
        for (const selector of rule.selectors) if (selector.startsWith('[data-og')) outlook.set(selector, rule.declarations);
    }
    for (const [selector, declarations] of darkBySelector) {
        for (const prefix of ['[data-ogsc]', '[data-ogsb]']) {
            const twin = outlook.get(`${prefix} ${selector}`);
            if (!twin) {
                problems.push(`dark rule ${selector} has no ${prefix} twin`);
                continue;
            }
            const same = twin.size === declarations.size && [...declarations].every(([property, value]) => twin.get(property) === value);
            if (!same) problems.push(`dark rule ${selector} and its ${prefix} twin differ`);
        }
    }

    const elements = parseElements(html);
    for (const element of elements) {
        const matching = [...darkBySelector].filter(
            ([selector]) => selector === element.tag || (selector.startsWith('.') && element.classes.includes(selector.slice(1))),
        );
        for (const [property, value] of element.style) {
            if (!HAS_COLOUR.test(value)) continue;
            const needed = darkPropertyFor(property);
            if (!needed) continue;
            if (matching.some(([, declarations]) => declarations.has(needed))) continue;
            const classes = element.classes.length ? ` class="${element.classes.join(' ')}"` : '';
            problems.push(`<${element.tag}${classes}> ${property}: ${value} has no dark ${needed}`);
        }
    }

    const lightValues = [
        ...elements.flatMap((element) => [...element.style.values()]),
        ...topLevel.filter((rule) => !rule.selectors[0]?.startsWith('[data-og')).flatMap((rule) => [...rule.declarations.values()]),
    ];
    const darkValues = dark.flatMap((rule) => [...rule.declarations.values()]);

    return { problems, lightColours: coloursIn(lightValues), darkColours: coloursIn(darkValues) };
}

export function formatCoverage(name: string, coverage: Coverage): string {
    const lines = [
        `${name}: light colours ${coverage.lightColours.join(' ')}`,
        `${name}: dark colours  ${coverage.darkColours.join(' ')}`,
    ];
    if (coverage.problems.length === 0) lines.push(`${name}: dark coverage OK`);
    else lines.push(...coverage.problems.map((problem) => `${name}: FAIL ${problem}`));
    return lines.join('\n');
}
