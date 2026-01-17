import { expect, waitFor } from 'storybook/test';
import { withinPopover } from './popover';

export async function getDialogButton(name: string | RegExp): Promise<HTMLElement> {
    const canvas = withinPopover();
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
