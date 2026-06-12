import { cleanup, render, screen } from '@testing-library/svelte';
import { afterEach, describe, expect, test } from 'vitest';
import ProgressBar from './ProgressBar.svelte';

afterEach(() => {
    cleanup();
});

describe('ProgressBar', () => {
    test('renders progressbar role', () => {
        render(ProgressBar, { props: { value: 50 } });
        expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    test('sets aria-valuenow to clamped value', () => {
        render(ProgressBar, { props: { value: 75 } });
        expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '75');
    });

    test('clamps value below 0 to 0', () => {
        render(ProgressBar, { props: { value: -10 } });
        expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
    });

    test('clamps value above 100 to 100', () => {
        render(ProgressBar, { props: { value: 150 } });
        expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
    });

    test('sets aria-valuemin to 0 and aria-valuemax to 100', () => {
        render(ProgressBar, { props: { value: 50 } });
        const bar = screen.getByRole('progressbar');
        expect(bar).toHaveAttribute('aria-valuemin', '0');
        expect(bar).toHaveAttribute('aria-valuemax', '100');
    });

    test('shows percentage label by default', () => {
        render(ProgressBar, { props: { value: 42 } });
        expect(screen.getAllByText('42%').length).toBeGreaterThan(0);
    });

    test('hides label when display is none', () => {
        render(ProgressBar, { props: { value: 42, display: 'none' } });
        expect(screen.queryByText('42%')).not.toBeInTheDocument();
    });

    test('shows clamped value in label', () => {
        render(ProgressBar, { props: { value: 150 } });
        expect(screen.getAllByText('100%').length).toBeGreaterThan(0);
    });
});
