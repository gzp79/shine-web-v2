import type { RemoteQuery } from '@sveltejs/kit';
import { SvelteDate } from 'svelte/reactivity';
import { v4 as uuid } from 'uuid';
import { logResource } from '@lib/loggers';
import { type AppError, type IQuery, createOtherError, isAppError } from '@lib/utils';

export type EnhancedQueryOptions = {
    /** Refresh if the query is older than the given time-to-live in ms (default: 60000) */
    ttl?: number;
    /** Interval in milliseconds for updating reactive age property (default: 500) */
    ageCheckInterval?: number;
};

/**
 * Enhanced query wrapper that adds TTL-based refresh to SvelteKit's native RemoteQuery.
 *
 * This wraps a RemoteQuery to provide:
 * - Reactive age tracking and automatic refresh
 * - Custom AppError wrapping
 */
export class EnhancedQuery<T> implements IQuery<T> {
    private _id = uuid();
    private _query: RemoteQuery<T>;
    private _options: Required<EnhancedQueryOptions>;

    private _lastUpdate = $state(Date.now());
    private _lastUpdateDate = $derived(new SvelteDate(this._lastUpdate));
    private _currentTime = $state(Date.now());

    private _ttl = $derived.by(() =>
        Math.clamp(this._options.ttl - (this._currentTime - this._lastUpdate), 0, this._options.ttl)
    );

    constructor(query: RemoteQuery<T>, options?: EnhancedQueryOptions) {
        this._query = query;
        this._options = {
            ageCheckInterval: options?.ageCheckInterval ?? 500,
            ttl: options?.ttl && options.ttl > 0 ? options.ttl : 60000
        };

        // Update current time periodically for reactive age)
        $effect(() => {
            const interval = setInterval(() => {
                this._currentTime = Date.now();
            }, this._options.ageCheckInterval);

            return () => clearInterval(interval);
        });

        // Update last successful load time
        $effect(() => {
            if (!this._query.loading) {
                this._lastUpdate = Date.now();
            }
        });

        // Reactive TTL-based refresh: watch age and trigger refresh when TTL expires
        $effect(() => {
            if (this._ttl <= 0 && !this._query.loading) {
                logResource.trace(`[${this.uniqueId}] TTL expired, refreshing query`);
                this._query.refresh();
            }
        });
    }

    /** Unique identifier for logging and debugging */
    get uniqueId(): string {
        return `EnhancedQuery-${this._id}`;
    }

    /** Timestamp of the last successful data load */
    get lastUpdate(): Date {
        return this._lastUpdateDate;
    }

    /** Reactive age in milliseconds, updates based on ageCheckInterval */
    get timeToRefresh(): number {
        return this._ttl;
    }

    /** True if the query is currently loading */
    get loading(): boolean {
        return this._query.loading;
    }

    /** The error if loading failed, normalized to AppError */
    get error(): AppError | undefined {
        if (this._query.error) {
            return this._normalizeError(this._query.error);
        }
        return undefined;
    }

    /** The current data, or undefined if not yet loaded or if there's an error */
    get current(): T | undefined {
        return this._query.current;
    }

    /** Refresh the query unconditionally */
    async refresh(): Promise<void> {
        await this._query.refresh();
    }

    private _normalizeError(error: unknown): AppError {
        return isAppError(error)
            ? error
            : createOtherError(error instanceof Error ? error.message : 'Unknown error', error);
    }
}
