/**
 * Shared action-result type — the contract every public form action returns:
 * either `{ ok: true }` (with an optional typed success payload) or
 * `{ ok: false; error: string }`.
 *
 * The codebase already used this shape everywhere; this file formalizes it so
 * new actions import one type instead of re-declaring the union. Dependency
 * free so server actions and client components share the same contract.
 */
export type Result<T = object> = ({ ok: true } & T) | { ok: false; error: string };
