import type { Page } from '@playwright/test';

type VisibilityState = 'visible' | 'hidden';

/** Set `document.visibilityState` and fire a `visibilitychange` event. */
export async function setTabVisibility(page: Page, state: VisibilityState): Promise<void> {
    await page.evaluate((value) => {
        Object.defineProperty(document, 'visibilityState', { value, configurable: true });
        document.dispatchEvent(new Event('visibilitychange', { bubbles: true }));
    }, state);
}

/** Simulate leaving and returning to the tab (hidden -> visible). */
export async function simulateTabRefocus(page: Page): Promise<void> {
    await setTabVisibility(page, 'hidden');
    await setTabVisibility(page, 'visible');
}
