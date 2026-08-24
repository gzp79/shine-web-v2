import { expect, test } from '../../fixtures/e2e';
import { ChatWsClient } from '../../helpers/chat-ws';
import { loginAsGuest } from '../../helpers/real-auth';

/**
 * Real-services chat flow. Requires live identity + builder + web servers (e.g. `pnpm run env:local`);
 * this test is excluded from CI.
 *
 * Flow:
 *  1. User 1 (a second guest) sends a chat message straight over the WebSocket (no UI).
 *  2. User 2 (a guest driving the real UI) opens /chat and sees user 1's message on the start side.
 *  3. User 2 replies through the input; the reply shows on the end side and reaches user 1's socket.
 */
test('two users exchange chat messages through real services', async ({ browser }) => {
    // Unique per run so parallel runs / leftover history can't cause false positives.
    const stamp = Date.now().toString(36);
    const fromUser1 = `hello-from-user1-${stamp}`;
    const fromUser2 = `reply-from-user2-${stamp}`;

    // --- User 1: authenticated WS client, no UI ---
    const ctx1 = await browser.newContext();
    const page1 = await ctx1.newPage();
    const user1 = await loginAsGuest(page1);
    const ws1 = new ChatWsClient(page1, 'user1');
    await ws1.connect();

    // --- User 2: real UI ---
    const ctx2 = await browser.newContext();
    const page2 = await ctx2.newPage();
    const user2 = await loginAsGuest(page2);

    try {
        expect(user1.userId).not.toBe(user2.userId);

        await page2.goto('/chat');
        await expect(page2.getByRole('textbox')).toBeVisible();

        await test.step('user 1 sends a message; user 2 sees it aligned to the start', async () => {
            await ws1.send(fromUser1);

            const incoming = page2.getByText(fromUser1, { exact: true });
            await expect(incoming).toBeVisible({ timeout: 15000 });

            // Others' messages render in a start-aligned bubble wrapper.
            const bubble = page2.locator('[data-slot="chat-bubble"]', { hasText: fromUser1 });
            await expect(bubble).toHaveClass(/justify-start/);
        });

        await test.step('user 2 replies through the input; it renders aligned to the end', async () => {
            const input = page2.getByRole('textbox');
            await input.fill(fromUser2);
            await input.press('Enter');

            // Input clears on submit.
            await expect(input).toHaveValue('');

            const outgoing = page2.locator('[data-slot="chat-bubble"]', { hasText: fromUser2 });
            await expect(outgoing).toBeVisible({ timeout: 15000 });
            await expect(outgoing).toHaveClass(/justify-end/);
        });

        await test.step('the reply from user 2 is delivered to the socket of user 1', async () => {
            const received = await ws1.waitForMessage(fromUser2);
            expect(received.from).toBe(user2.userId);
            expect(received.text).toBe(fromUser2);
        });
    } finally {
        await ws1.close();
        await ctx1.close();
        await ctx2.close();
    }
});
