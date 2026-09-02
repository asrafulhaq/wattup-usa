// Stands in for the `server-only` package under Vitest (see vitest.config.ts). The
// real module throws when imported outside a React Server Components build; here
// there is no such build, and the test is the server.
export {};
