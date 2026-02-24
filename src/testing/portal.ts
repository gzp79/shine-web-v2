import { cleanup, within } from '@testing-library/svelte';
import { expect } from 'vitest';

export function withinPortal(portalId = 'popover') {
    const portal = document.body.querySelector(`#${portalId}`) as HTMLElement;
    expect(portal).not.toBeNull();
    return within(portal);
}

/**
 * Sets up portal element for testing components that use portals (dropdowns, dialogs, etc.).
 * Call this before/after your tests.
 *
 * @param portalId - The ID of the portal element (default: 'popover')
 * @returns Object with beforeEach and afterEach functions
 *
 * @example
 * ```typescript
 * const portal = setupPortal();
 *
 * beforeEach(portal.beforeEach);
 * afterEach(portal.afterEach);
 * ```
 */
export function setupPortal(portalId = 'popover') {
    return {
        beforeEach: () => {
            const portal = document.createElement('div');
            portal.id = portalId;
            document.body.appendChild(portal);
        },
        afterEach: () => {
            document.getElementById(portalId)?.remove();
            cleanup();
        }
    };
}
