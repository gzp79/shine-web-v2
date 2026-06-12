import { config } from '@config';

/**
 * Pauses test execution for debugging by waiting for a very long time.
 * Use browser DevTools to inspect the page state while paused.
 *
 * IMPORTANT: Add this temporarily for debugging, then remove before committing.
 *
 * Usage:
 *   import { pauseTest } from '@testing';
 *
 *   test('my test', async () => {
 *     render(MyComponent);
 *     await pauseTest(); // Execution pauses here, inspect in browser
 *   });
 */
export async function pauseTest(label?: string): Promise<void> {
    if (config.environment !== 'mock') {
        throw new Error(
            `pauseTest called outside mock environment${label ? ` (${label})` : ''} — remove before merging`
        );
    }
    console.log('Test paused for debugging. Close the browser tab to continue.');
    await new Promise((resolve) => setTimeout(resolve, 1000000)); // Wait ~16 minutes
}

/**
 * Logs the current HTML content to console.
 */
export function logHTML() {
    console.log(document.body.innerHTML);
}

/**
 * Waits for specified milliseconds. Useful for debugging timing issues.
 *
 * IMPORTANT: Add this temporarily for debugging, then remove before committing.
 *
 * Usage:
 *   import { debugWait } from '@testing';
 *
 *   test('my test', async () => {
 *     render(MyComponent);
 *     await debugWait(2000); // Wait 2 seconds to inspect
 *   });
 */
export async function debugWait(ms: number) {
    await new Promise((resolve) => setTimeout(resolve, ms));
}
