import { vi } from 'vitest';

import type { Member } from '@/lib/member-directory';

/**
 * The directory the gate consults, as one scriptable lookup. tests/setup.ts
 * keeps the rest of lib/member-directory.ts real (normalizeEmail and both
 * directory classes) and replaces only getMemberDirectory() with a function
 * returning this object, so a test says "the directory answers X" without
 * caring which implementation would have answered in that environment.
 *
 * Default, restored before every test by resetDirectory(): null (not a member).
 */
export const directory = {
    lookup: vi.fn<(email: string) => Promise<Member | null>>(),
};

export function member(email: string, overrides: Partial<Member> = {}): Member {
    return { id: `user_${email}`, email, name: email, active: true, ...overrides };
}

export function resetDirectory(): void {
    directory.lookup.mockReset().mockResolvedValue(null);
}

resetDirectory();
