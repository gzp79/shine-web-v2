import { browser } from '$app/environment';
import { onDestroy } from 'svelte';
import { createSubscriber } from 'svelte/reactivity';
import { logUser } from '@lib/loggers';
import { createContext } from '@lib/ui/utils';

/** The public fields the BFF resolves for a user. Extend here when more are exposed. */
export type PublicUserData = {
    name: string;
};

/** Public, shareable profile of any user. Reactive: mutate, never replace. */
export type PublicUserEntry = { readonly id: string } & Partial<PublicUserData> & {
        loading: boolean;
        error: string | undefined;
        /** Epoch ms of the last successful resolution; `0` while never resolved. */
        fetchedAt: number;
        /** Number of live consumers holding this entry. */
        refs: number;
    };

/** Minimal shape the store needs from the current user. */
export type CurrentUserLike = { id: string } & PublicUserData;

/** Transport used to resolve a batch of ids. Injected so tests can supply a fake. */
export type PublicUserLookup = (ids: string[]) => Promise<Record<string, PublicUserData>>;

export type UserStoreOptions = {
    /**
     * Reactive getter for the current user; re-evaluated inside an effect, so it may
     * start out `undefined` and become available later.
     */
    getMe?: () => CurrentUserLike | undefined;
    /** Overrides the default `/api/users/names` BFF transport. */
    lookup?: PublicUserLookup;
    /** Window in which requested ids are collected into a single request (default: 100 ms). */
    debounceMs?: number;
    /** How long a resolved entry stays fresh (default: 5 min). */
    ttlMs?: number;
    /** Maximum ids per request; the backend rejects larger lists (default: 100). */
    maxBatchSize?: number;
    /**
     * How often unreferenced stale entries are evicted, in the browser only
     * (default: `ttlMs`). Set to `0` to disable and sweep manually.
     */
    sweepIntervalMs?: number;
};

const DEFAULT_DEBOUNCE_MS = 100;
const DEFAULT_TTL_MS = 5 * 60 * 1000;
const DEFAULT_MAX_BATCH_SIZE = 100;

/** Default transport: the SvelteKit BFF, which hides the real identity service. */
async function fetchPublicUsers(ids: string[]): Promise<Record<string, PublicUserData>> {
    const response = await fetch('/api/users/names', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ids })
    });

    if (!response.ok) {
        throw new Error(`Failed to resolve users (${response.status})`);
    }

    const body = (await response.json()) as { users?: Record<string, PublicUserData> };
    return body.users ?? {};
}

/**
 * Shared, batched cache of public user data. {@link BrowserUserStore} does the real work;
 * {@link ServerUserStore} is an inert stub. Obtain one via {@link provideUserStore}.
 */
export interface UserStore {
    /**
     * Reactive get-or-fetch and the primary read path. Returns the shared entry for `id`; while
     * the result is read inside an effect or `$derived`, a reference is held (pinning the entry
     * against {@link UserStore.sweep}) and a load is queued when the entry is missing or stale.
     * The reference and load are released automatically once nothing reads it any more. Called
     * outside a tracking context it is a plain read that neither references nor loads.
     */
    get(id: string): PublicUserEntry;
    /**
     * Reads the shared entry for `id` at component initialisation and releases it on destroy.
     * Handy when the id is fixed for the component's lifetime; for a changing id or a read
     * inside `$derived`, prefer {@link UserStore.get}. Throws if called outside init.
     */
    use(id: string): PublicUserEntry;
    /** Id of the current user, or `undefined` while unknown. Reactive. */
    readonly meId: string | undefined;
    /** Marks entries stale; referenced ones re-resolve right away. Omit `id` for all. */
    invalidate(id?: string): void;
    /** Evicts stale entries that no consumer holds. */
    sweep(): void;
    /** Cancels pending work and tears down internal effects/timers. */
    destroy(): void;
}

/**
 * A perpetually-loading entry. The server cannot resolve a name, so it hands back the same
 * start state a browser store presents on first paint — `loading` — and the browser store
 * created after hydration performs the real load. A fresh object per call; the server keeps
 * no state.
 */
function loadingEntry(id: string): PublicUserEntry {
    return { id, name: undefined, loading: true, error: undefined, fetchedAt: 0, refs: 0 };
}

/**
 * Inert server-side store. Public user data is resolved only in the browser (after
 * hydration), so on the server every operation is a noop and requested entries stay in a
 * loading state. Keeping the server path free of fetching, reactive state and timers makes
 * an accidental server-side lookup impossible by construction, mirroring the current-user store.
 */
class ServerUserStore implements UserStore {
    get(id: string): PublicUserEntry {
        return loadingEntry(id);
    }

    use(id: string): PublicUserEntry {
        return loadingEntry(id);
    }

    get meId(): string | undefined {
        return undefined;
    }

    invalidate(): void {}

    sweep(): void {}

    destroy(): void {}
}

/**
 * Browser-side cache: the real implementation.
 *
 * `get(id)` always returns the same reactive entry for a given id, so any number of
 * components render from one object and one request. Missing or stale ids are collected
 * for a short debounce window and resolved in a single batched call. Entries are
 * reference counted, so unused stale entries are swept periodically.
 *
 * The current user is reconciled into the same cache: when `getMe()` becomes available,
 * the matching entry is upgraded in place instead of being replaced, which keeps
 * `me.name` and the cached entry from drifting apart.
 */
export class BrowserUserStore implements UserStore {
    // Deliberately a plain (non-reactive) Map: membership is only read imperatively (sweep,
    // invalidate), so `get` can create an entry inside a `$derived` without tripping
    // `state_unsafe_mutation`. Reactivity lives on each entry, which is a `$state` proxy.
    readonly #entries = new Map<string, PublicUserEntry>();
    readonly #subscribers = new Map<string, () => void>();
    readonly #pending = new Set<string>();
    readonly #getMe: (() => CurrentUserLike | undefined) | undefined;
    readonly #lookup: PublicUserLookup;
    readonly #debounceMs: number;
    readonly #ttlMs: number;
    readonly #maxBatchSize: number;

    #timer: ReturnType<typeof setTimeout> | undefined;
    #sweepTimer: ReturnType<typeof setInterval> | undefined;
    #disposeMeEffect: (() => void) | undefined;
    #destroyed = false;

    constructor(options: UserStoreOptions = {}) {
        this.#getMe = options.getMe;
        this.#lookup = options.lookup ?? fetchPublicUsers;
        this.#debounceMs = options.debounceMs ?? DEFAULT_DEBOUNCE_MS;
        this.#ttlMs = options.ttlMs ?? DEFAULT_TTL_MS;
        this.#maxBatchSize = options.maxBatchSize ?? DEFAULT_MAX_BATCH_SIZE;

        if (this.#getMe) {
            const getMe = this.#getMe;
            // Rooted so the store can be constructed outside component initialisation (tests, provisioning).
            this.#disposeMeEffect = $effect.root(() => {
                $effect(() => {
                    const me = getMe();
                    if (!me) return;
                    this.#applyMe(me);
                });
            });
        }

        const sweepIntervalMs = options.sweepIntervalMs ?? this.#ttlMs;
        if (sweepIntervalMs > 0) {
            this.#sweepTimer = setInterval(() => this.sweep(), sweepIntervalMs);
        }
    }

    /**
     * Reactive get-or-fetch: returns the shared entry for `id` and ties its lifetime to the
     * reader. While the returned entry is read inside an effect or `$derived`, the entry is
     * referenced (pinned against {@link sweep}) and a load is queued when it is missing or
     * stale; when the last such reader is torn down the reference is dropped. Outside a
     * tracking context this is a plain read that neither references nor loads.
     */
    get(id: string): PublicUserEntry {
        const entry = this.#entries.get(id) ?? this.#createEntry(id);
        // Subscribing inside the caller's reaction runs the entry's `start` (ref + load) and its
        // teardown (unref) with the reader's lifetime; a noop outside a tracking context.
        this.#subscribers.get(id)?.();
        return entry;
    }

    /**
     * Returns the shared reactive entry for `id`, queueing a load when it is missing or stale,
     * and releases the reference when the calling component is destroyed.
     *
     * Must be called during component initialisation. For a changing id or a read inside a
     * `$derived`, prefer {@link get}, which references and loads on demand and releases itself.
     */
    use(id: string): PublicUserEntry {
        const entry = this.#acquire(id);

        try {
            onDestroy(() => this.#release(id));
        } catch {
            this.#release(id);
            throw new Error(
                `UserStore.use(${id}): called outside component initialisation; read it with get() instead`
            );
        }

        return entry;
    }

    /** Id of the current user, or `undefined` while unknown. Reactive. */
    get meId(): string | undefined {
        return this.#getMe?.()?.id;
    }

    /**
     * Marks entries stale. Entries still held by a reader are re-resolved right away;
     * unreferenced ones wait for the next {@link get}. Omit `id` for all.
     */
    invalidate(id?: string): void {
        const ids = id === undefined ? [...this.#entries.keys()] : [id];
        const meId = this.meId;

        for (const key of ids) {
            const entry = this.#entries.get(key);
            // The current user is owned by the `me` effect, not by the lookup.
            if (!entry || key === meId) continue;

            entry.fetchedAt = 0;
            if (entry.refs > 0 && !entry.loading) {
                this.#queue(key, entry);
            }
        }
    }

    /**
     * Evicts stale entries that nothing holds. A referenced entry is safe to keep — a live
     * reader (via {@link get}) or a {@link use} pins it until released, so only entries with
     * no references are evicted.
     */
    sweep(): void {
        for (const [id, entry] of this.#entries) {
            if (entry.refs === 0 && !entry.loading && this.#isStale(entry)) {
                this.#entries.delete(id);
                this.#subscribers.delete(id);
            }
        }
    }

    /** Cancels pending work and tears down the `me` reconciliation effect. */
    destroy(): void {
        this.#destroyed = true;
        if (this.#timer !== undefined) {
            clearTimeout(this.#timer);
            this.#timer = undefined;
        }
        if (this.#sweepTimer !== undefined) {
            clearInterval(this.#sweepTimer);
            this.#sweepTimer = undefined;
        }
        this.#pending.clear();
        this.#subscribers.clear();
        this.#disposeMeEffect?.();
        this.#disposeMeEffect = undefined;
    }

    /** Creates the single reactive object every consumer of `id` will share. */
    #createEntry(id: string): PublicUserEntry {
        const entry = $state<PublicUserEntry>({
            id,
            name: undefined,
            loading: false,
            error: undefined,
            fetchedAt: 0,
            refs: 0
        });
        this.#entries.set(id, entry);

        // `start` runs in an internal effect (so its mutations are legal) when a reader first
        // reads the entry via `get`; its cleanup runs when the last such reader is torn down.
        this.#subscribers.set(
            id,
            createSubscriber(() => {
                entry.refs++;
                if (id !== this.meId && this.#isStale(entry) && !entry.loading) {
                    this.#queue(id, entry);
                }
                return () => {
                    if (entry.refs > 0) entry.refs--;
                };
            })
        );

        return entry;
    }

    /** Drops a reference taken by {@link use}. */
    #release(id: string): void {
        const entry = this.#entries.get(id);
        if (entry && entry.refs > 0) {
            entry.refs--;
        }
    }

    #acquire(id: string): PublicUserEntry {
        const entry = this.#entries.get(id) ?? this.#createEntry(id);
        entry.refs++;

        const me = this.#getMe?.();
        if (me && me.id === id) {
            this.#applyMe(me);
            return entry;
        }

        if (this.#isStale(entry) && !entry.loading) {
            this.#queue(id, entry);
        }

        return entry;
    }

    #applyMe(me: CurrentUserLike): void {
        const entry = this.#entries.get(me.id) ?? this.#createEntry(me.id);

        // Upgrade in place: consumers already hold this object.
        entry.name = me.name;
        entry.loading = false;
        entry.error = undefined;
        entry.fetchedAt = Date.now();
        this.#pending.delete(me.id);
    }

    #isStale(entry: PublicUserEntry): boolean {
        return entry.fetchedAt === 0 || Date.now() - entry.fetchedAt > this.#ttlMs;
    }

    #queue(id: string, entry: PublicUserEntry): void {
        if (this.#destroyed) return;

        entry.loading = true;
        entry.error = undefined;
        this.#pending.add(id);

        if (this.#timer !== undefined) {
            clearTimeout(this.#timer);
        }
        this.#timer = setTimeout(() => {
            this.#timer = undefined;
            void this.#flush();
        }, this.#debounceMs);
    }

    async #flush(): Promise<void> {
        const ids = [...this.#pending];
        this.#pending.clear();
        if (ids.length === 0) return;

        for (let i = 0; i < ids.length; i += this.#maxBatchSize) {
            await this.#resolveBatch(ids.slice(i, i + this.#maxBatchSize));
        }
    }

    async #resolveBatch(ids: string[]): Promise<void> {
        try {
            const users = await this.#lookup(ids);
            const now = Date.now();
            for (const id of ids) {
                const entry = this.#entries.get(id);
                if (!entry) continue;
                const user = users[id];
                entry.name = user?.name;
                entry.error = user ? undefined : 'not-found';
                entry.loading = false;
                entry.fetchedAt = now;
            }
        } catch (err) {
            logUser.error('Failed to resolve public user info', err);
            const message = err instanceof Error ? err.message : 'Failed to resolve user';
            for (const id of ids) {
                const entry = this.#entries.get(id);
                if (!entry) continue;
                entry.error = message;
                entry.loading = false;
            }
        }
    }
}

const context = createContext<UserStore>('public-user-store');

/**
 * Creates a user store and publishes it to descendants. Call once per application or
 * request region (a layout `<script>`), never as a module-global singleton: module state
 * is shared between SSR requests.
 */
export function provideUserStore(options?: UserStoreOptions): UserStore {
    const store: UserStore = browser ? new BrowserUserStore(options) : new ServerUserStore();
    context.set(store);
    onDestroy(() => store.destroy());
    return store;
}

/** Reads the store published by {@link provideUserStore}. */
export function getUserStore(): UserStore {
    const store = context.tryGet();
    if (!store) {
        throw new Error('getUserStore: no user store in context (call provideUserStore in the region layout)');
    }
    return store;
}

/** Reads the store published by {@link provideUserStore}, or `undefined` when none is provided. */
export function tryGetUserStore(): UserStore | undefined {
    return context.tryGet();
}

/** Shorthand for `getUserStore().use(id)`. */
export function useUser(id: string): PublicUserEntry {
    return getUserStore().use(id);
}
