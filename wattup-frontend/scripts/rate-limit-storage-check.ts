/**
 * Proves that the Better Auth rate limiter configured in lib/auth.ts runs on
 * database storage and targets the RateLimit model (table auth_rate_limit),
 * without a database.
 *
 * It rebuilds the auth instance from the exact options lib/auth.ts exports
 * (`auth.options`: the same rateLimit block, plugins, hooks and generateId
 * setting) and swaps only `database` for Better Auth's real prismaAdapter
 * wrapped around a recording in-memory stand-in for the Prisma client. So the
 * path under test is the library's own database storage wrapper, its Prisma
 * adapter, and this app's configuration; only the SQL engine is faked.
 *
 * Six POST /api/auth/sign-in/email requests from one address must answer 401
 * five times and 429 once (the '/sign-in/email' rule is 5 per 60 s), and every
 * recorded call on the stand-in's `rateLimit` delegate must carry the key
 * `<ip>|/sign-in/email`. Any other delegate than `user` (the email lookup) is a
 * failure.
 *
 * Importing lib/auth.ts constructs the real Prisma client, which is lazy and
 * is never queried here. Run with DATABASE_URL pointed at a dead address
 * anyway, so an accidental query fails instead of reaching production. The
 * Resend key is a dummy: lib/email.ts constructs the client at import and the
 * constructor refuses an empty key; nothing here sends mail.
 *
 *   DATABASE_URL=postgresql://nobody:nobody@127.0.0.1:1/never \
 *   RESEND_API_KEY=re_rate_limit_storage_check \
 *   BETTER_AUTH_SECRET=rate-limit-storage-check BETTER_AUTH_TELEMETRY=0 \
 *   pnpm exec tsx scripts/rate-limit-storage-check.ts
 *
 * Run from wattup-frontend/. Exit code 1 on any mismatch.
 */
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import type { Prisma, PrismaClient } from '@prisma/client';
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { auth } from '@/lib/auth';

const IP = '203.0.113.7';
const ENDPOINT = '/sign-in/email';
const EXPECTED_KEY = `${IP}|${ENDPOINT}`;
const EXPECTED_STATUSES = [401, 401, 401, 401, 401, 429];

// Compile-time ties to the generated Prisma client: the delegate Better Auth is
// configured to hit must exist on the real client, and the model must be one
// Prisma generated. Both break `tsc --noEmit` if the schema loses the model.
const DELEGATE = 'rateLimit' satisfies keyof PrismaClient;
const MODEL: Prisma.ModelName = 'RateLimit';

// ─── Recording stand-in for the Prisma client ────────────────────────────────

type Row = { id: string; key: string; count: number; lastRequest: bigint };
type Call = { delegate: string; op: string; key: string | undefined; detail: string };

let rows: Row[] = [];
const calls: Call[] = [];
let nextId = 1;

function summarise(value: unknown): string {
    return JSON.stringify(value, (_k, v: unknown) => (typeof v === 'bigint' ? `${v}n` : v));
}

/** The `key` equality a Prisma where clause or create payload carries, if any. */
function keyIn(node: unknown): string | undefined {
    if (node === null || typeof node !== 'object') return undefined;
    if (Array.isArray(node)) {
        for (const part of node) {
            const found = keyIn(part);
            if (found) return found;
        }
        return undefined;
    }
    const record = node as Record<string, unknown>;
    const direct = record.key;
    if (typeof direct === 'string') return direct;
    if (direct !== null && typeof direct === 'object') {
        const equals = (direct as Record<string, unknown>).equals;
        if (typeof equals === 'string') return equals;
    }
    for (const value of Object.values(record)) {
        const found = keyIn(value);
        if (found) return found;
    }
    return undefined;
}

function record(delegate: string, op: string, args: unknown): void {
    calls.push({ delegate, op, key: keyIn(args), detail: summarise(args) });
}

function prismaError(code: string, message: string): Error & { code: string } {
    return Object.assign(new Error(message), { code });
}

function comparable(value: unknown): number | string | boolean | null {
    if (typeof value === 'bigint') return Number(value);
    if (
        typeof value === 'number' ||
        typeof value === 'string' ||
        typeof value === 'boolean' ||
        value === null
    ) {
        return value;
    }
    throw new Error(`stand-in cannot compare a ${typeof value}`);
}

function holds(actual: unknown, operator: string, expected: unknown): boolean {
    const a = comparable(actual);
    const e = comparable(expected);
    switch (operator) {
        case 'equals':
            return a === e;
        case 'not':
            return a !== e;
        case 'lt':
            return Number(a) < Number(e);
        case 'lte':
            return Number(a) <= Number(e);
        case 'gt':
            return Number(a) > Number(e);
        case 'gte':
            return Number(a) >= Number(e);
        default:
            throw new Error(`stand-in does not implement the ${operator} filter`);
    }
}

/** Evaluates the where shapes the Prisma adapter builds: direct equality,
 *  `{ field: { op: value } }`, and AND / OR lists of either. */
function matches(row: Row, where: unknown): boolean {
    if (where === undefined || where === null) return true;
    if (typeof where !== 'object') throw new Error('where must be an object');
    for (const [field, condition] of Object.entries(where)) {
        if (field === 'AND' || field === 'OR') {
            const parts: unknown[] = Array.isArray(condition) ? condition : [condition];
            const results = parts.map(part => matches(row, part));
            const pass = field === 'AND' ? results.every(Boolean) : results.some(Boolean);
            if (!pass) return false;
            continue;
        }
        if (!(field in row)) throw new Error(`stand-in row has no column ${field}`);
        const actual = row[field as keyof Row];
        if (condition !== null && typeof condition === 'object' && !Array.isArray(condition)) {
            for (const [operator, expected] of Object.entries(condition)) {
                if (operator === 'mode') continue;
                if (!holds(actual, operator, expected)) return false;
            }
        } else if (!holds(actual, 'equals', condition)) {
            return false;
        }
    }
    return true;
}

function clone(row: Row): Row {
    return { ...row };
}

function toBigInt(value: unknown): bigint {
    if (typeof value === 'bigint') return value;
    if (typeof value === 'number' && Number.isInteger(value)) return BigInt(value);
    throw new Error(`lastRequest must be an integer, got ${summarise(value)}`);
}

const rateLimitDelegate = {
    async findMany(args: { where?: unknown; take?: number; skip?: number }) {
        record(DELEGATE, 'findMany', args.where);
        const skip = args.skip ?? 0;
        const take = args.take ?? rows.length;
        return rows
            .filter(row => matches(row, args.where))
            .slice(skip, skip + take)
            .map(clone);
    },
    async findFirst(args: { where?: unknown }) {
        record(DELEGATE, 'findFirst', args.where);
        const hit = rows.find(row => matches(row, args.where));
        return hit ? clone(hit) : null;
    },
    async create(args: { data: Record<string, unknown> }) {
        record(DELEGATE, 'create', args.data);
        if ('id' in args.data) {
            throw new Error('create supplied an id: generateId is false, so Prisma must default it');
        }
        const { key, count, lastRequest } = args.data;
        if (typeof key !== 'string' || typeof count !== 'number') {
            throw new Error(`create data has the wrong shape: ${summarise(args.data)}`);
        }
        if (rows.some(row => row.key === key)) {
            throw prismaError('P2002', 'Unique constraint failed on the fields: (`key`)');
        }
        const row: Row = { id: `cuid_${nextId++}`, key, count, lastRequest: toBigInt(lastRequest) };
        rows.push(row);
        return clone(row);
    },
    async update(args: { where: Record<string, unknown>; data: Record<string, unknown> }) {
        record(DELEGATE, 'update', args);
        // Prisma's update needs a unique column at the root of the where.
        if (!('id' in args.where) && !('key' in args.where)) {
            throw new Error(`update where has no unique column: ${summarise(args.where)}`);
        }
        const row = rows.find(candidate => matches(candidate, args.where));
        if (!row) throw prismaError('P2025', 'Record to update not found.');
        for (const [field, value] of Object.entries(args.data)) {
            const increment =
                value !== null && typeof value === 'object' && 'increment' in value
                    ? Number((value as { increment: unknown }).increment)
                    : undefined;
            if (field === 'count') {
                row.count = increment === undefined ? Number(value) : row.count + increment;
            } else if (field === 'lastRequest') {
                row.lastRequest =
                    increment === undefined ? toBigInt(value) : row.lastRequest + BigInt(increment);
            } else {
                throw new Error(`update touched an unexpected column ${field}`);
            }
        }
        return clone(row);
    },
    async deleteMany(args: { where?: unknown }) {
        record(DELEGATE, 'deleteMany', args.where);
        const before = rows.length;
        rows = rows.filter(row => !matches(row, args.where));
        return { count: before - rows.length };
    },
};

/** A table with no rows: the email lookup lands here and finds nobody. Any
 *  other operation is unexpected and throws. */
function emptyDelegate(name: string): object {
    return new Proxy(
        {},
        {
            get(_target, prop) {
                if (prop === 'findFirst') {
                    return async (args: { where?: unknown }) => {
                        record(name, 'findFirst', args.where);
                        return null;
                    };
                }
                if (prop === 'findMany') {
                    return async (args: { where?: unknown }) => {
                        record(name, 'findMany', args.where);
                        return [];
                    };
                }
                if (prop === 'then') return undefined;
                throw new Error(`unexpected ${name}.${String(prop)} on the stand-in`);
            },
        },
    );
}

type StandIn = {
    rateLimit: typeof rateLimitDelegate;
    user: object;
    session: object;
    account: object;
    verification: object;
    $transaction: <T>(work: (tx: StandIn) => Promise<T>) => Promise<T>;
};

const standIn: StandIn = {
    rateLimit: rateLimitDelegate,
    user: emptyDelegate('user'),
    session: emptyDelegate('session'),
    account: emptyDelegate('account'),
    verification: emptyDelegate('verification'),
    $transaction: work => work(standIn),
};

// ─── The auth instance: lib/auth.ts's options, only the database swapped ─────

const testAuth = betterAuth({
    ...auth.options,
    database: prismaAdapter(standIn, { provider: 'postgresql' }),
});

const trusted = auth.options.trustedOrigins;
const origin =
    Array.isArray(trusted) && typeof trusted[0] === 'string' ? trusted[0] : 'http://localhost:3000';

function attempt(): Promise<Response> {
    return testAuth.handler(
        new Request(`${origin}/api/auth${ENDPOINT}`, {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
                origin,
                'x-forwarded-for': IP,
            },
            body: JSON.stringify({ email: 'nobody@example.com', password: 'not-the-password' }),
        }),
    );
}

// ─── Checks ──────────────────────────────────────────────────────────────────

const failures: string[] = [];
function expect(condition: boolean, message: string): void {
    if (!condition) failures.push(message);
}

function tableNameFromSchema(): string | undefined {
    const schemaPath = path.resolve(process.cwd(), 'prisma/schema.prisma');
    if (!existsSync(schemaPath)) {
        failures.push(`prisma/schema.prisma not found at ${schemaPath}; run from wattup-frontend/`);
        return undefined;
    }
    const schema = readFileSync(schemaPath, 'utf8');
    const block = schema.match(new RegExp(`model ${MODEL} \\{([\\s\\S]*?)\\n\\}`));
    const map = block?.[1].match(/@@map\("([^"]+)"\)/);
    return map?.[1];
}

async function main(): Promise<void> {
    const rateLimit = auth.options.rateLimit;
    console.log('lib/auth.ts rateLimit block (functions omitted):');
    console.log(`  ${summarise(rateLimit)}`);
    expect(rateLimit?.storage === 'database', `rateLimit.storage is ${summarise(rateLimit?.storage)}, not "database"`);
    expect(rateLimit?.modelName === DELEGATE, `rateLimit.modelName is ${summarise(rateLimit?.modelName)}, not "${DELEGATE}"`);
    expect(rateLimit?.enabled === true, 'rateLimit.enabled is not true');

    const table = tableNameFromSchema();
    console.log(`\nPrisma model ${MODEL} -> delegate prisma.${DELEGATE} -> table ${table ?? '(not found)'}`);
    expect(table === 'auth_rate_limit', `model ${MODEL} maps to ${summarise(table)}, not "auth_rate_limit"`);

    const statuses: number[] = [];
    let last: Response | undefined;
    for (let i = 0; i < EXPECTED_STATUSES.length; i++) {
        const response = await attempt();
        statuses.push(response.status);
        last = response;
    }
    console.log(`\n${statuses.length} x POST /api/auth${ENDPOINT} from ${IP}: ${statuses.join(' ')}`);
    expect(
        statuses.join() === EXPECTED_STATUSES.join(),
        `statuses ${statuses.join(' ')} != expected ${EXPECTED_STATUSES.join(' ')}`,
    );
    const retryAfter = last?.headers.get('x-retry-after');
    console.log(`last response: ${last?.status} X-Retry-After=${retryAfter} ${await last?.text()}`);
    expect(last?.status === 429, 'the sixth response is not a 429');
    expect(Number(retryAfter) > 0, `X-Retry-After is ${summarise(retryAfter)}`);

    console.log('\nCalls the Prisma stand-in recorded:');
    calls.forEach((call, i) => {
        const shown = call.detail.length > 150 ? `${call.detail.slice(0, 147)}...` : call.detail;
        console.log(`  ${String(i + 1).padStart(2)}  ${call.delegate}.${call.op}  key=${call.key ?? '-'}  ${shown}`);
    });

    const delegates = [...new Set(calls.map(call => call.delegate))];
    expect(
        delegates.every(name => name === DELEGATE || name === 'user'),
        `unexpected delegates touched: ${delegates.join(', ')}`,
    );
    const limiterCalls = calls.filter(call => call.delegate === DELEGATE);
    expect(limiterCalls.length > 0, `no calls reached prisma.${DELEGATE}`);
    for (const call of limiterCalls) {
        if (call.op === 'deleteMany') continue;
        expect(call.key === EXPECTED_KEY, `${call.op} used key ${summarise(call.key)}, not ${EXPECTED_KEY}`);
    }
    const ops = (op: string) => limiterCalls.filter(call => call.op === op).length;
    expect(ops('create') === 1, `${ops('create')} creates, expected 1`);
    expect(ops('update') === 4, `${ops('update')} updates, expected 4 (requests 2 to 5)`);
    expect(ops('findMany') >= 6, `${ops('findMany')} reads, expected one per request`);
    expect(
        !limiterCalls.some(call => call.op === 'create' && call.detail.includes('"id"')),
        'create carried an id',
    );

    console.log(`\nRows left in the stand-in: ${summarise(rows)}`);
    expect(rows.length === 1, `${rows.length} rows, expected 1`);
    expect(rows[0]?.key === EXPECTED_KEY, `stored key ${summarise(rows[0]?.key)}`);
    expect(rows[0]?.count === 5, `stored count ${rows[0]?.count}, expected 5 (the sixth was refused)`);

    console.log('');
    if (failures.length > 0) {
        for (const failure of failures) console.error(`FAIL  ${failure}`);
        process.exitCode = 1;
        return;
    }
    console.log(
        `PASS  storage=database, delegate prisma.${DELEGATE} (table ${table}), key ${EXPECTED_KEY}: 5 x 401 then 429`,
    );
}

main().catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
});
