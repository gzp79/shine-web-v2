import type { Page } from '@playwright/test';
import { config } from '../../src/generated/config';

/**
 * Derives the builder chat WS endpoint the same way the app does
 * (see `src/lib/builder/chatConnection.svelte.ts`).
 */
export function builderChatWsUrl(): string {
    const base = config.builderWSUrl.replace(/^http/, 'ws').replace(/\/$/, '');
    return `${base}/api/connect`;
}

type ReceivedComment = { id: string; from: string; text: string };

/**
 * Drives a raw builder chat WebSocket from *inside* a Playwright page, so the browser
 * attaches the authenticated `sid` cookie on the upgrade (same-site with the app origin).
 *
 * This is the low-level "send/receive WS messages directly" tool used by real-services
 * e2e tests to act as a second user without driving the chat UI. It speaks the wire
 * protocol directly: `{type:'chat',text}` out, `{type:'chat',messages:[...]}` in.
 *
 * The socket and a received-message buffer live on `window` inside the page, so assertions
 * can poll them via `page.waitForFunction`.
 */
export class ChatWsClient {
    readonly #page: Page;
    readonly #handle: string;

    /**
     * @param page an authenticated page (its browser context must already hold a valid session)
     * @param handle unique key so multiple clients can coexist on one page's `window`
     */
    constructor(page: Page, handle = 'default') {
        this.#page = page;
        this.#handle = `__chatWs_${handle}`;
    }

    /** Opens the socket and starts buffering incoming chat comments. Resolves once open. */
    async connect(): Promise<void> {
        await this.#page.evaluate(
            ([url, key]) =>
                new Promise<void>((resolve, reject) => {
                    const ws = new WebSocket(url);
                    const store = { ws, received: [] as ReceivedComment[] };
                    (window as unknown as Record<string, unknown>)[key] = store;

                    ws.addEventListener('open', () => resolve());
                    ws.addEventListener('error', () => reject(new Error(`chat ws failed to open: ${url}`)));
                    ws.addEventListener('message', (event: MessageEvent) => {
                        if (typeof event.data !== 'string') return;
                        try {
                            const parsed = JSON.parse(event.data);
                            if (parsed?.type === 'chat' && Array.isArray(parsed.messages)) {
                                store.received.push(...parsed.messages);
                            }
                        } catch {
                            // ignore malformed frames
                        }
                    });
                }),
            [builderChatWsUrl(), this.#handle] as const
        );
    }

    /** Sends a plain-text chat message over the socket. */
    async send(text: string): Promise<void> {
        await this.#page.evaluate(
            ([key, message]) => {
                const store = (window as unknown as Record<string, { ws: WebSocket }>)[key];
                if (!store?.ws) throw new Error('chat ws not connected');
                store.ws.send(JSON.stringify({ type: 'chat', text: message }));
            },
            [this.#handle, text] as const
        );
    }

    /** Waits until a received comment's text contains `substring`, then returns it. */
    async waitForMessage(substring: string, timeout = 15000): Promise<ReceivedComment> {
        await this.#page.waitForFunction(
            ([key, needle]) => {
                const store = (window as unknown as Record<string, { received: ReceivedComment[] }>)[key];
                return !!store?.received.some((m) => m.text.includes(needle));
            },
            [this.#handle, substring] as const,
            { timeout }
        );

        return this.#page.evaluate(
            ([key, needle]) => {
                const store = (window as unknown as Record<string, { received: ReceivedComment[] } | undefined>)[key];
                const found = store?.received.find((m) => m.text.includes(needle));
                if (!found) throw new Error(`chat ws message not found: ${needle}`);
                return found;
            },
            [this.#handle, substring] as const
        );
    }

    /** Closes the socket and clears the page-side buffer. */
    async close(): Promise<void> {
        await this.#page.evaluate((key) => {
            const store = (window as unknown as Record<string, { ws: WebSocket } | undefined>)[key];
            store?.ws.close();
            delete (window as unknown as Record<string, unknown>)[key];
        }, this.#handle);
    }
}
