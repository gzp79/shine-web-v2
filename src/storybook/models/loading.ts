import { expect, waitFor } from 'storybook/test';
import type { Canvas } from './types';

export async function expectLoadingState(canvas: Canvas): Promise<HTMLElement> {
    const loading = await canvas.getByRole('status');
    await expect(loading).toBeVisible();
    await expect(loading).toHaveTextContent(/loading/i);
    return loading;
}

export async function waitForLoadingState(canvas: Canvas): Promise<HTMLElement> {
    const loading = await waitFor(() => canvas.getByRole('status'));
    await expect(loading).toBeVisible();
    await expect(loading).toHaveTextContent(/loading/i);
    return loading;
}

export async function waitForLoadingToComplete(canvas: Canvas) {
    await waitFor(async () => {
        const loading = canvas.queryByRole('status');
        await expect(loading).not.toBeInTheDocument();
    });
}
