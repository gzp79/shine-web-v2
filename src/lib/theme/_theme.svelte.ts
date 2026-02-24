import { browser } from '$app/environment';
import { page } from '$app/state';
import type { Cookies } from '@sveltejs/kit';
import { getContext, setContext } from 'svelte';
import { logTheme } from '@lib/loggers';
import { getCookie, onTabVisible, setCookie } from '@lib/utils';

export const themeList = ['light', 'dark', 'system'] as const;
export type Theme = (typeof themeList)[number];
export const defaultTheme = 'dark' as Theme;

function isThemeSupported(theme: string | undefined | null): theme is Theme {
    return themeList.map((t) => t.toLowerCase()).includes(theme?.toLowerCase() ?? '');
}

export function getThemeWithFallback(candidate: string | undefined | null, fallback: Theme = defaultTheme): Theme {
    return isThemeSupported(candidate) ? candidate : fallback;
}

export async function getThemeFromRequest(cookies: Cookies, _headers: Headers): Promise<Theme> {
    const cookieTheme = cookies.get('theme');
    if (isThemeSupported(cookieTheme)) {
        logTheme.log(`Theme from cookie: ${cookieTheme}`);
        return cookieTheme;
    }

    logTheme.log(`Theme from default: ${defaultTheme}`);
    return defaultTheme;
}

const THEME_CONTEXT_KEY = Symbol('theme-context');

export type ThemeContext = {
    current: Theme;
};

/// Create and provide the theme context, with the initial theme from server or browser, and keep it in sync with cookie changes.
/// Server logic - non-authoritative source, just for the initial value:
///  - hooks.server.ts → handle({ event, resolve }), reads theme from cookie and put it in event.locals
///  - +layout.server.ts → load({ locals }), puts theme in page.data
//   - +layout.svelte → createThemeContext, creates the context from the page.data
/// Browser logic - authoritative source:
//   - +layout.svelte → createThemeContext, creates the context from the cookie
///  - on update, set cookie, update state
//   - across tabs it uses onTabVisible to refresh from cookie
export function createThemeContext(): ThemeContext {
    const th = getThemeWithFallback(page.data.theme);
    let theme = $state<Theme>(th);
    logTheme.log(`Initializing theme context with theme: ${theme}`);

    const context = {
        get current() {
            return theme;
        },
        set current(newTheme: Theme) {
            const th = getThemeWithFallback(newTheme);
            if (theme !== th) {
                logTheme.log(`Updating theme to: ${th}`);
                theme = th;
                setCookie('theme', th);
            }
        }
    } satisfies ThemeContext;

    setContext(THEME_CONTEXT_KEY, context);

    if (browser) {
        // After hydration, update from cookie if it differs (browser is authoritative)
        $effect(() => {
            const cookieTheme = getThemeWithFallback(getCookie('theme'));
            if (cookieTheme !== theme) {
                theme = cookieTheme;
            }
        });

        // When switching tab, refresh the theme from cookie to keep it in sync across tabs
        onTabVisible((visible) => {
            if (visible) {
                context.current = getThemeWithFallback(getCookie('theme'));
            }
        });
    }
    return context;
}

/// A low level API to set the theme context directly used for testing.
export function setThemeContext(context: ThemeContext) {
    setContext(THEME_CONTEXT_KEY, context);
}

export function getThemeContext(): ThemeContext {
    return getContext<ThemeContext>(THEME_CONTEXT_KEY);
}
