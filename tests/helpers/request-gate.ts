import type { Page } from '@playwright/test';

/**
 * Holds matching requests open until explicitly released, so tests can
 * deterministically observe in-flight loading states (e.g. a button that is
 * disabled while a mutation is pending) without relying on artificial delays.
 *
 * Remote functions post to `/_app/remote/<hash>/<functionName>`, so a command
 * or query can be matched by its name via {@link RequestGate.forRemote}.
 *
 * @example
 * ```ts
 * const gate = await RequestGate.forRemote(page, 'revokeToken');
 *
 * await confirmButton.click();
 * await gate.hold();                       // wait for the request, then hold it open
 * await expect(revokeButton).toBeDisabled();
 *
 * await gate.release();                     // let the request complete
 * await expect(revokeButton).toBeEnabled();
 *
 * await gate.dispose();
 * ```
 */
export class RequestGate {
    private release_!: () => void;
    private readonly released: Promise<void>;
    private heldResolve?: () => void;
    private heldPromise: Promise<void>;
    private held = 0;
    private handlerDone: Promise<void> = Promise.resolve();

    private constructor(
        private readonly page: Page,
        private readonly pattern: string | RegExp
    ) {
        this.released = new Promise<void>((resolve) => (this.release_ = resolve));
        this.heldPromise = new Promise<void>((resolve) => (this.heldResolve = resolve));
    }

    /** Gate every request matching `pattern` (a glob or RegExp passed to `page.route`). */
    static async create(page: Page, pattern: string | RegExp): Promise<RequestGate> {
        const gate = new RequestGate(page, pattern);
        await page.route(pattern, async (route) => {
            gate.held++;
            gate.heldResolve?.();
            gate.handlerDone = (async () => {
                await gate.released;
                await route.continue();
            })();
            await gate.handlerDone;
        });
        return gate;
    }

    /** Gate a remote function (query/command) by its exported name. */
    static forRemote(page: Page, functionName: string): Promise<RequestGate> {
        return RequestGate.create(page, `**/_app/remote/*/${functionName}`);
    }

    /** Wait for a matching request to arrive; it is then held open until {@link release}. */
    async hold(): Promise<void> {
        await this.heldPromise;
    }

    /** True if one or more matching requests are currently held open. */
    get isHolding(): boolean {
        return this.held > 0;
    }

    /** Release all held requests (and any that arrive afterwards) so they complete. */
    release(): void {
        this.release_();
    }

    /** Stop intercepting. Call in test teardown; also releases any held requests. */
    async dispose(): Promise<void> {
        this.release_();
        await this.handlerDone;
        await this.page.unroute(this.pattern);
    }
}
