import { type APIRequestContext, test as base } from '@playwright/test';
import type { MockHandlers } from '../../src/mocks/registry';

class MockFixture {
    constructor(private request: APIRequestContext) {}

    async add<K extends keyof MockHandlers>(
        name: K,
        ...params: MockHandlers[K] extends void ? [] : [MockHandlers[K]]
    ): Promise<void> {
        const response = await this.request.post('/api/__mock', {
            data: { handler: name, params: params[0] }
        });
        if (!response.ok()) {
            const error = await response.text();
            throw new Error(`Mock add '${name}' failed: ${error}`);
        }
    }

    async remove(name: keyof MockHandlers): Promise<void> {
        const response = await this.request.delete('/api/__mock', {
            data: { handler: name }
        });
        if (!response.ok()) {
            const error = await response.text();
            throw new Error(`Mock remove '${name}' failed: ${error}`);
        }
    }

    async reset(): Promise<void> {
        const response = await this.request.delete('/api/__mock');
        if (!response.ok()) {
            const error = await response.text();
            throw new Error(`Mock reset failed: ${error}`);
        }
    }
}

export { expect } from '@playwright/test';

export const test = base.extend<{ mock: MockFixture; autoResetMocks: void }>({
    mock: async ({ request }, use) => {
        await use(new MockFixture(request));
    },
    // Auto-fixture: runs for every test even when `mock` is not destructured,
    // so leaked overrides can't bleed between tests.
    autoResetMocks: [
        async ({ request }, use) => {
            const fixture = new MockFixture(request);
            await fixture.reset(); // clear state left by a previous test that may have crashed mid-run
            await use();
            await fixture.reset(); // teardown: remove mocks registered during this test
        },
        { auto: true }
    ]
});
