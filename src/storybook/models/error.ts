import { expect, waitFor } from 'storybook/test';
import type { Canvas } from './types';

export async function expectErrorState(canvas: Canvas, errorText?: string | RegExp): Promise<HTMLElement> {
    const error = await canvas.getByRole('alert');
    await expect(error).toBeVisible();
    if (errorText) {
        await expect(error).toHaveTextContent(errorText);
    }
    return error;
}

export async function waitForErrorState(canvas: Canvas, errorText?: string | RegExp): Promise<HTMLElement> {
    const error = await waitFor(() => canvas.getByRole('alert'));
    if (errorText) {
        await expect(error).toHaveTextContent(errorText);
    }
    return error;
}

export async function waitForErrorToBeRemoved(canvas: Canvas) {
    await waitFor(async () => {
        const error = canvas.queryByRole('alert');
        await expect(error).not.toBeInTheDocument();
    });
}
