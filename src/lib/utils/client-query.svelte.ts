import { browser } from '$app/environment';
import { type AppError, type IQuery, createOtherError, isAppError } from '@lib/utils';

/**
 * Client-side implementation of IQuery for mocking or simple use cases.
 * Use remote functions query instead for real data fetching.
 */
export class ClientQuery<T> implements IQuery<T> {
    loading = $state(false);
    error = $state<AppError | undefined>(undefined);
    current = $state<T | undefined>(undefined);

    constructor(private readonly load: () => Promise<T>) {
        if (browser) {
            this.refresh();
        }
    }

    async refresh(): Promise<void> {
        this.loading = true;
        try {
            this.current = await this.load();
        } catch (err) {
            if (isAppError(err)) {
                this.error = err;
            } else {
                this.error = createOtherError('Unknown error during mock query refresh', err);
            }
            throw err;
        } finally {
            this.loading = false;
        }
    }
}
