import { type APIRequestContext, test as base } from '@playwright/test';
import type { MockHandlers } from '../../src/mocks/registry';

// Identifies the worker so its mock overrides stay isolated from other workers
// running in parallel (see WORKER_HEADER in src/mocks/server.ts).
const WORKER_HEADER = 'x-mock-worker';

class MockFixture {
    constructor(
        private request: APIRequestContext,
        private workerId: string
    ) {}

    private get headers(): Record<string, string> {
        return { [WORKER_HEADER]: this.workerId };
    }

    async add<K extends keyof MockHandlers>(
        name: K,
        ...params: MockHandlers[K] extends void ? [] : [MockHandlers[K]]
    ): Promise<void> {
        const response = await this.request.post('/api/__mock', {
            headers: this.headers,
            data: { handler: name, params: params[0] }
        });
        if (!response.ok()) {
            const error = await response.text();
            throw new Error(`Mock add '${name}' failed: ${error}`);
        }
    }

    async remove(name: keyof MockHandlers): Promise<void> {
        const response = await this.request.delete('/api/__mock', {
            headers: this.headers,
            data: { handler: name }
        });
        if (!response.ok()) {
            const error = await response.text();
            throw new Error(`Mock remove '${name}' failed: ${error}`);
        }
    }

    async reset(): Promise<void> {
        const response = await this.request.delete('/api/__mock', {
            headers: this.headers
        });
        if (!response.ok()) {
            const error = await response.text();
            throw new Error(`Mock reset failed: ${error}`);
        }
    }
}

export { expect } from '@playwright/test';

export const test = base.extend<{ mock: MockFixture; autoResetMocks: void }>({
    // Stamp every browser request with the worker id so the SvelteKit server
    // forwards it onto outbound fetches, routing them to this worker's mocks.
    context: async ({ context }, use, testInfo) => {
        await context.setExtraHTTPHeaders({ [WORKER_HEADER]: String(testInfo.workerIndex) });
        await use(context);
    },
    mock: async ({ request }, use, testInfo) => {
        await use(new MockFixture(request, String(testInfo.workerIndex)));
    },
    // Auto-fixture: runs for every test even when `mock` is not destructured,
    // so leaked overrides can't bleed between tests.
    autoResetMocks: [
        async ({ request }, use, testInfo) => {
            const fixture = new MockFixture(request, String(testInfo.workerIndex));
            await fixture.reset(); // clear state left by a previous test that may have crashed mid-run
            await use();
            await fixture.reset(); // teardown: remove mocks registered during this test
        },
        { auto: true }
    ]
});
