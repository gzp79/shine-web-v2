import type { Page } from '@playwright/test';
import { config } from '../../src/generated/config';

/** The builder hub endpoint, derived the same way the app does (see `builderHubUrl`). */
export function builderHubWsUrl(): string {
    const base = config.builderWSUrl.replace(/^http/, 'ws').replace(/\/$/, '');
    return `${base}/api/connect`;
}

/** A command of a stream log as the server delivers it. */
export type ReceivedCommand = {
    version: number;
    commandId: string;
    userId: string;
    /** Base64 of the postcard bytes. */
    command: string;
};

type Store = { ws: WebSocket; frames: Record<string, unknown>[]; closed?: { code: number; reason: string } };

/**
 * Drives a raw builder hub WebSocket from inside a Playwright page, so the browser attaches the
 * authenticated session cookie on the upgrade. It speaks the hub and stream protocol directly:
 * the `connected` handshake, `streamSubscribe` and `streamCommand` out, stream frames in.
 *
 * The socket and the received frames live on `window` of the page, so assertions can poll them.
 */
export class StreamWsClient {
    readonly #page: Page;
    readonly #key: string;

    /**
     * @param page an authenticated page (its browser context must already hold a valid session)
     * @param handle unique key so several clients can coexist on one page's `window`
     */
    constructor(page: Page, handle = 'default') {
        this.#page = page;
        this.#key = `__streamWs_${handle}`;
    }

    /** Opens the socket and resolves with the user id of the server's `connected` frame. */
    async connect(): Promise<string> {
        return this.#page.evaluate(
            ([url, key]) =>
                new Promise<string>((resolve, reject) => {
                    const ws = new WebSocket(url);
                    const store: Store = { ws, frames: [] };
                    (window as unknown as Record<string, unknown>)[key] = store;

                    ws.addEventListener('error', () => reject(new Error(`hub ws failed to open: ${url}`)));
                    ws.addEventListener('close', (event) => {
                        store.closed = { code: event.code, reason: event.reason };
                        reject(new Error('hub ws closed before it was connected'));
                    });
                    ws.addEventListener('message', (event: MessageEvent) => {
                        if (typeof event.data !== 'string') return;
                        let frame: Record<string, unknown>;
                        try {
                            frame = JSON.parse(event.data) as Record<string, unknown>;
                        } catch {
                            return;
                        }
                        store.frames.push(frame);
                        if (frame.type === 'connected' && typeof frame.userId === 'string') resolve(frame.userId);
                    });
                }),
            [builderHubWsUrl(), this.#key] as const
        );
    }

    /** Subscribes to a stream. */
    async subscribe(streamId: string): Promise<void> {
        await this.#send({ type: 'streamSubscribe', streamId });
    }

    /** Pushes a command (base64 of its postcard bytes) into a stream. */
    async sendCommand(streamId: string, commandId: string, command: string): Promise<void> {
        await this.#send({ type: 'streamCommand', streamId, commandId, command });
    }

    /** Waits until a sync or a command batch of the stream carries `command`, and returns that command. */
    async waitForCommand(streamId: string, command: string, timeout = 15000): Promise<ReceivedCommand> {
        await this.#page.waitForFunction(
            ([key, id, needle]) => {
                const store = (window as unknown as Record<string, Store | undefined>)[key];
                return !!store?.frames.some(
                    (frame) =>
                        frame.streamId === id &&
                        (frame.type === 'streamSync' || frame.type === 'streamCommands') &&
                        (frame.commands as { command: string }[]).some((c) => c.command === needle)
                );
            },
            [this.#key, streamId, command] as const,
            { timeout }
        );

        return this.#page.evaluate(
            ([key, id, needle]) => {
                const store = (window as unknown as Record<string, Store | undefined>)[key];
                for (const frame of store?.frames ?? []) {
                    if (frame.streamId !== id) continue;
                    const found = ((frame.commands as ReceivedCommand[] | undefined) ?? []).find(
                        (c) => c.command === needle
                    );
                    if (found) return found;
                }
                throw new Error(`stream command not found: ${needle}`);
            },
            [this.#key, streamId, command] as const
        );
    }

    /** Every frame received so far, for diagnostics. */
    async frames(): Promise<Record<string, unknown>[]> {
        return this.#page.evaluate((key) => {
            const store = (window as unknown as Record<string, Store | undefined>)[key];
            return store?.frames ?? [];
        }, this.#key);
    }

    /** Closes the socket and clears the page-side buffer. */
    async close(): Promise<void> {
        await this.#page.evaluate((key) => {
            const store = (window as unknown as Record<string, Store | undefined>)[key];
            store?.ws.close();
            delete (window as unknown as Record<string, unknown>)[key];
        }, this.#key);
    }

    async #send(frame: object): Promise<void> {
        await this.#page.evaluate(
            ([key, text]) => {
                const store = (window as unknown as Record<string, Store | undefined>)[key];
                if (!store?.ws) throw new Error('hub ws not connected');
                // A send on a closed socket is dropped without an error, so refuse it loudly.
                if (store.ws.readyState !== WebSocket.OPEN) {
                    const closed = store.closed ? ` (closed ${store.closed.code} ${store.closed.reason})` : '';
                    throw new Error(`hub ws is not open${closed}`);
                }
                store.ws.send(text);
            },
            [this.#key, JSON.stringify(frame)] as const
        );
    }
}
