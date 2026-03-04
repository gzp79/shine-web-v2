import type { Locator } from '@playwright/test';
import { expect } from '@playwright/test';

/**
 * Helper to select and click an action from a combo-button dropdown.
 * This handles the pattern of: open dropdown -> select option -> click action button.
 *
 * @param comboButtonSelector - Locator for the combo button or parent element containing it
 * @param actionName - Name of the action to select from dropdown
 *
 * @example
 * ```ts
 * // Find combo button in email section and click "Confirm Email"
 * const emailSection = page.locator('text=Email').locator('..');
 * await clickComboAction(emailSection, 'Confirm Email');
 *
 * // Find combo button anywhere on page
 * await clickComboAction(page.locator('body'), 'Logout from all devices');
 * ```
 */
export async function clickComboAction(comboButtonSelector: Locator, actionName: string) {
    // Find the combo button container (has data-slot="combo-button")
    const comboButton = comboButtonSelector.locator('[data-slot="combo-button"]').first();

    // Get the page reference for portal access
    const page = comboButtonSelector.page();

    // Find the dropdown trigger within the combo button
    const dropdownTrigger = comboButton.locator('button[aria-haspopup="menu"]');
    await expect(dropdownTrigger).toBeVisible();

    // Open the dropdown menu
    await dropdownTrigger.click();

    // Select the menu item in the portal
    const portal = page.locator('#popover');
    const menuItem = portal.getByRole('menuitem', { name: actionName });
    await expect(menuItem).toBeVisible();
    await menuItem.click();

    // Click the main action link/button (first child in the combo button group)
    const actionElement = comboButton.locator('> :first-child');
    await actionElement.click();
}
