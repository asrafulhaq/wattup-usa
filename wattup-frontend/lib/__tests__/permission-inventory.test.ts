import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';
import { PERMISSION_INVENTORY } from '@/lib/permission-inventory';

/**
 * Checklist 4a.35 and 4a.36: every callable endpoint is in the inventory, and every
 * inventory entry that names a permission is backed by a guard call in the code.
 *
 * Endpoints are found, not listed: every file under app/ and lib/ that opens with the
 * 'use server' directive contributes its exported functions, and every route.ts under
 * app/ contributes its exported HTTP methods. The TypeScript compiler does the parsing,
 * so a new export in a new file is caught the moment it lands.
 */

const ROOT = path.resolve(__dirname, '../..');
const HTTP_METHODS = new Set(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS']);
const SKIP_DIRS = new Set(['node_modules', '.next', '__tests__']);

function walk(dir: string, out: string[] = []): string[] {
    for (const name of readdirSync(dir)) {
        if (SKIP_DIRS.has(name)) continue;
        const full = path.join(dir, name);
        if (statSync(full).isDirectory()) walk(full, out);
        else if (/\.tsx?$/.test(name)) out.push(full);
    }
    return out;
}

function parse(file: string): ts.SourceFile {
    return ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);
}

function isUseServerModule(source: ts.SourceFile): boolean {
    const first = source.statements[0];
    return (
        first !== undefined &&
        ts.isExpressionStatement(first) &&
        ts.isStringLiteral(first.expression) &&
        first.expression.text === 'use server'
    );
}

function hasExportModifier(node: ts.Node): boolean {
    return ts.canHaveModifiers(node)
        ? (ts.getModifiers(node) ?? []).some(m => m.kind === ts.SyntaxKind.ExportKeyword)
        : false;
}

/** name -> source text, for every exported function-valued binding in the file. */
function exportedFunctions(source: ts.SourceFile): Map<string, string> {
    const found = new Map<string, string>();
    for (const statement of source.statements) {
        if (!hasExportModifier(statement)) continue;
        if (ts.isFunctionDeclaration(statement) && statement.name) {
            found.set(statement.name.text, statement.getText(source));
        } else if (ts.isVariableStatement(statement)) {
            for (const declaration of statement.declarationList.declarations) {
                if (ts.isIdentifier(declaration.name)) {
                    const init = declaration.initializer;
                    if (init && (ts.isArrowFunction(init) || ts.isFunctionExpression(init))) {
                        found.set(declaration.name.text, declaration.getText(source));
                    }
                } else if (ts.isObjectBindingPattern(declaration.name)) {
                    // export const { GET, POST } = toNextJsHandler(auth)
                    for (const element of declaration.name.elements) {
                        if (ts.isIdentifier(element.name)) {
                            found.set(element.name.text, statement.getText(source));
                        }
                    }
                }
            }
        }
    }
    return found;
}

/** name -> source text, for every NON-exported function in the file (guard helpers). */
function localFunctions(source: ts.SourceFile): Map<string, string> {
    const found = new Map<string, string>();
    for (const statement of source.statements) {
        if (hasExportModifier(statement)) continue;
        if (ts.isFunctionDeclaration(statement) && statement.name) {
            found.set(statement.name.text, statement.getText(source));
        }
    }
    return found;
}

/**
 * The export's own text plus that of every local helper it calls, transitively, so a
 * guard placed in a private helper the export delegates to still counts.
 */
function reachableText(body: string, helpers: Map<string, string>, seen = new Set<string>()): string {
    let text = body;
    for (const [name, helperText] of helpers) {
        if (seen.has(name)) continue;
        if (new RegExp(`\\b${name}\\s*\\(`).test(body)) {
            seen.add(name);
            text += '\n' + reachableText(helperText, helpers, seen);
        }
    }
    return text;
}

interface Endpoint {
    key: string;
    text: string;
}

function discoverEndpoints(): Endpoint[] {
    const endpoints: Endpoint[] = [];
    const files = [...walk(path.join(ROOT, 'app')), ...walk(path.join(ROOT, 'lib'))];
    for (const file of files) {
        const relative = path.relative(ROOT, file);
        const isRoute = relative.startsWith('app/') && path.basename(file) === 'route.ts';
        const source = parse(file);
        const isAction = isUseServerModule(source);
        if (!isRoute && !isAction) continue;

        const helpers = localFunctions(source);
        for (const [name, text] of exportedFunctions(source)) {
            if (isRoute && !HTTP_METHODS.has(name)) continue;
            endpoints.push({ key: `${relative}#${name}`, text: reachableText(text, helpers) });
        }
    }
    return endpoints.sort((a, b) => a.key.localeCompare(b.key));
}

const endpoints = discoverEndpoints();
const inventoryKeys = Object.keys(PERMISSION_INVENTORY).sort();

describe('permission inventory', () => {
    it('discovered a realistic number of endpoints', () => {
        // A regression guard on the parser itself: an empty discovery would make the
        // two assertions below pass vacuously.
        expect(endpoints.length).toBeGreaterThan(40);
    });

    it('every server action export and every route handler is in the inventory', () => {
        const missing = endpoints.map(e => e.key).filter(key => !(key in PERMISSION_INVENTORY));
        expect(missing, `endpoints missing from lib/permission-inventory.ts:\n  ${missing.join('\n  ')}`).toEqual([]);
    });

    it('every inventory entry names an export that still exists', () => {
        const known = new Set(endpoints.map(e => e.key));
        const stale = inventoryKeys.filter(key => !known.has(key));
        expect(stale, `inventory entries whose export no longer exists:\n  ${stale.join('\n  ')}`).toEqual([]);
    });

    it('every entry with a permission is backed by requirePermission(Permission.<same>) in the code', () => {
        const unbacked: string[] = [];
        for (const endpoint of endpoints) {
            const entry = PERMISSION_INVENTORY[endpoint.key];
            if (!entry || !('permission' in entry)) continue;
            const needle = new RegExp(`requirePermission\\(\\s*Permission\\.${entry.permission}\\s*\\)`);
            if (!needle.test(endpoint.text)) {
                unbacked.push(`${endpoint.key} claims ${entry.permission}`);
            }
        }
        expect(unbacked, `inventory and code disagree:\n  ${unbacked.join('\n  ')}`).toEqual([]);
    });

    it('every entry without a permission says why, in a sentence', () => {
        for (const [key, entry] of Object.entries(PERMISSION_INVENTORY)) {
            if ('permission' in entry) continue;
            expect(entry.reason.length, `${key} has no reason`).toBeGreaterThan(20);
        }
    });

    it('an unguarded endpoint is never marked with a permission it does not check, and PUBLIC is never a guarded one', () => {
        // The reverse of the backing check: a PUBLIC, SESSION_ONLY or SELF_SCOPED entry
        // whose source calls requirePermission is mislabelled, because it does in fact
        // require one.
        const mislabelled: string[] = [];
        for (const endpoint of endpoints) {
            const entry = PERMISSION_INVENTORY[endpoint.key];
            if (!entry || 'permission' in entry) continue;
            if (/requirePermission\(\s*Permission\./.test(endpoint.text)) {
                mislabelled.push(`${endpoint.key} is marked ${entry.access} but calls requirePermission`);
            }
        }
        expect(mislabelled).toEqual([]);
    });
});
