import { randomUUID } from 'node:crypto';
import { ChatCommand } from '../../../src/lib/game-bindings';
import { expect, test } from '../../fixtures/e2e';
import { loginAsGuest } from '../../helpers/real-auth';
import { StreamWsClient } from '../../helpers/stream-ws';

/**
 * Real-services chat flow. Requires live identity + builder + web servers (e.g. `pnpm run env:local`);
 * this test is excluded from CI. It uses the one shared room and `@ping` makes every open chat answer, so
 * do not run copies of it in parallel (`--repeat-each`): the answers push the history out of the room.
 *
 * Flow:
 *  1. User 1 (a second guest) joins the room straight over the WebSocket (no UI) and adds a message.
 *  2. User 2 (a guest driving the real UI) opens the chat and sees user 1's message on the start side.
 *  3. User 2 replies through the input; the reply shows on the end side and reaches user 1's socket.
 *  4. User 2 reloads: the chat fills with the history of the room, both messages included.
 */
const STREAM_ID = 'chat:global';

const add = (text: string) => ChatCommand.encode(ChatCommand.add(text));

test('two users exchange chat messages through real services', async ({ browser }) => {
    // Unique per run so parallel runs / leftover history can't cause false positives.
    const stamp = randomUUID().slice(0, 8);
    const fromUser1 = `hello-from-user1-${stamp}`;
    const fromUser2 = `reply-from-user2-${stamp}`;

    // --- User 1: authenticated hub client, no UI ---
    const ctx1 = await browser.newContext();
    const page1 = await ctx1.newPage();
    const user1 = await loginAsGuest(page1);
    // Park the page on a document that is not the app: the app would open its own connection as
    // this user, and the newer connection replaces the older one.
    await page1.goto('/robots.txt');
    const ws1 = new StreamWsClient(page1, 'user1');

    // --- User 2: real UI ---
    const ctx2 = await browser.newContext();
    const page2 = await ctx2.newPage();
    const user2 = await loginAsGuest(page2);

    // The page has inputs of its own; the chat input is the one named by its placeholder.
    const chatInput = page2.getByRole('textbox', { name: 'Type a message…' });

    const openChat = async () => {
        await page2.getByRole('button', { name: 'Chat', exact: true }).click();
        // The input is enabled once the room is synced.
        await expect(chatInput).toBeEnabled({ timeout: 15000 });
    };

    try {
        expect(user1.userId).not.toBe(user2.userId);

        await test.step('user 1 joins the room', async () => {
            expect(await ws1.connect()).toBe(user1.userId);
            await ws1.subscribe(STREAM_ID);
        });

        await page2.goto('/account');
        await openChat();

        await test.step('user 1 adds a message; user 2 sees it aligned to the start', async () => {
            await ws1.sendCommand(STREAM_ID, randomUUID(), add(fromUser1));

            await expect(page2.getByText(fromUser1, { exact: true })).toBeVisible({ timeout: 15000 });

            // Others' messages render in a start-aligned bubble wrapper.
            const bubble = page2.locator('[data-slot="chat-bubble"]', { hasText: fromUser1 });
            await expect(bubble).toHaveClass(/justify-start/);
        });

        await test.step('user 2 replies through the input; it renders aligned to the end', async () => {
            await chatInput.fill(fromUser2);
            await chatInput.press('Enter');

            // Input clears on submit.
            await expect(chatInput).toHaveValue('');

            const outgoing = page2.locator('[data-slot="chat-bubble"]', { hasText: fromUser2 });
            await expect(outgoing).toBeVisible({ timeout: 15000 });
            await expect(outgoing).toHaveClass(/justify-end/);
        });

        await test.step('the reply from user 2 is delivered to the socket of user 1', async () => {
            const received = await ws1.waitForCommand(STREAM_ID, add(fromUser2));
            expect(received.userId).toBe(user2.userId);
        });

        await test.step('after a reload the chat is filled from the history of the room', async () => {
            await page2.reload();
            await openChat();

            await expect(page2.getByText(fromUser1, { exact: true })).toBeVisible({ timeout: 15000 });
            await expect(page2.getByText(fromUser2, { exact: true })).toBeVisible();
            // Both are confirmed history now, none is a dimmed pending message.
            await expect(
                page2.locator('[data-slot="chat-bubble"]', { hasText: fromUser2 }).locator('.opacity-60')
            ).toHaveCount(0);
        });

        // The dev commands are compiled in by the dev build (see CHAT_COMMANDS in vite.config.ts). The room is
        // shared and keeps its history, but user 2 is a fresh guest: its own bubbles, aligned to the end, are
        // all from this run.
        const ownBubbles = page2.locator('[data-slot="chat-bubble"].justify-end');

        await test.step('@ping shows the server round trip of the sender', async () => {
            await chatInput.fill('@ping');
            await chatInput.press('Enter');

            await expect(ownBubbles.filter({ hasText: /ping \(\d+ ms\)/ })).toBeVisible({ timeout: 15000 });
        });

        await test.step('@burst sends its messages through the room', async () => {
            await chatInput.fill('@burst 3');
            await chatInput.press('Enter');

            for (const n of [1, 2, 3]) {
                const bubble = ownBubbles.filter({ hasText: `burst ${n}/3` });
                await expect(bubble).toBeVisible({ timeout: 15000 });
                // Confirmed by the room, not a dimmed pending message.
                await expect(bubble.locator('.opacity-60')).toHaveCount(0);
            }
        });
    } finally {
        await ws1.close().catch(() => {});
        await ctx1.close();
        await ctx2.close();
    }
});
