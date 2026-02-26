/* eslint-disable @typescript-eslint/no-explicit-any */
import { render } from '@testing-library/svelte';
import VitestLayoutProvider from './VitestLayoutProvider.svelte';

/**
 * Renders a component wrapped with the application layout provider (locale, theme, and portal contexts).
 * Use this instead of render() directly when your component needs layout contexts.
 *
 * Provides:
 * - LocaleContext (i18n with en/hu translations)
 * - ThemeContext (light/dark theme)
 * - Portal container (#popover)
 *
 * @example
 * renderWithLayout(MyComponent, { value: 'test' });
 */
export function renderWithLayout(Component: any, props?: any) {
    const testResult = {
        Component,
        props: props || {}
    };

    return render(VitestLayoutProvider, {
        props: {
            testResult
        }
    });
}
