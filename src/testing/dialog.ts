import { waitFor } from '@testing-library/svelte';
import { expect } from 'vitest';
import { withinPortal } from './portal';

export async function getDialogButton(name: string | RegExp): Promise<HTMLElement> {
    const canvas = withinPortal();
    const confirm = await waitFor(async () => {
        const confirm = await canvas.getByRole('button', { name });
        await expect(confirm).toBeVisible();
        return confirm;
    });

    return confirm;
}

export async function clickDialogButton(name: string | RegExp) {
    const confirm = await getDialogButton(name);
    confirm.click();
}
