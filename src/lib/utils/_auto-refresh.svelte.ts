import { SvelteDate } from 'svelte/reactivity';
import { v4 as uuid } from 'uuid';
import { logAPI } from '@lib/loggers';

export type AutoRefreshOptions = {
    /** Refresh if the query is older than the given time-to-live in ms (default: 60000) */
    maxTTL?: number;
    /** Interval in milliseconds for updating reactive age property (default: 500) */
    ageCheckInterval?: number;
};

export type AutoRefresh = {
    /** The timestamp of the last successful update */
    readonly lastUpdate: Date;
    /** The time-to-refresh in milliseconds until the next refresh is needed */
    readonly timeToRefresh: number;
};

/**
 * Automatically refreshes a query based on its age and the document visibility state.
 *
 * This sets up reactive tracking of the age of the query data, and triggers
 * the provided refresh function when the data is older than the specified TTL.
 * It also handles pausing the age tracking when the document is not visible,
 * and forces a refresh when the document becomes visible again.
 *
 * @param refresh - Function to call to refresh the query.
 * @param canRefresh - Optional reactive boolean to determine if a refresh is allowed.
 * @param options - Configuration options for TTL and age check interval.
 * @returns An object with properties for last update time, TTL, and methods to suspend/resume tracking.
 */
export function autoRefresh(refresh: () => Promise<void>, canRefresh?: boolean, options?: AutoRefreshOptions) {
    const { maxTTL = 60000, ageCheckInterval = 500 } = options ?? {};

    const uniqueId = uuid();
    let interval: NodeJS.Timeout | null = null;
    let lastUpdate = $state(Date.now());
    let currentTime = $state(Date.now());
    const lastUpdateDate = $derived(new SvelteDate(lastUpdate));
    const timeToRefresh = $derived(Math.clamp(maxTTL - (currentTime - lastUpdate), 0, maxTTL));

    const _startTimer = () => {
        if (!interval) {
            interval = setInterval(() => {
                currentTime = Date.now();
            }, ageCheckInterval);
        }
    };

    const _stopTimer = () => {
        if (interval) {
            clearInterval(interval);
            interval = null;
        }
    };

    // Reset lastUpdate when canRefresh becomes true
    $effect(() => {
        if (canRefresh) {
            logAPI.log(`[${uniqueId}] canRefresh enabled, resetting lastUpdate`);
            lastUpdate = Date.now();
        }
    });

    // Update current time periodically for reactive age)
    $effect(() => {
        const onVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                // When tab becomes visible, make age reflect an expired TTL to trigger immediate refresh
                logAPI.log(`[${uniqueId}] Tab visible, forcing refresh`);
                lastUpdate = Date.now() - maxTTL - 1000;
                _startTimer();
            } else {
                logAPI.log(`[${uniqueId}] Tab hidden, pausing age timer`);
                _stopTimer();
                lastUpdate = Date.now();
            }
        };

        _startTimer();
        window.addEventListener('visibilitychange', onVisibilityChange);

        return () => {
            _stopTimer();
            window.removeEventListener('visibilitychange', onVisibilityChange);
        };
    });

    // Reactive TTL-based refresh: watch age and trigger refresh when TTL expires
    $effect(() => {
        if (timeToRefresh <= 0 && canRefresh) {
            logAPI.trace(`[${uniqueId}] TTL expired, refreshing query`);
            refresh().then(() => {
                logAPI.trace(`[${uniqueId}] Query refreshed successfully`);
                lastUpdate = Date.now();
            });
        }
    });

    return {
        get lastUpdate(): Date {
            return lastUpdateDate;
        },
        get timeToRefresh(): number {
            return timeToRefresh;
        }
    };
}
