import { type Cookies } from '@sveltejs/kit';
import { type Nullable, getCookie, setCookie } from '@lib/utils';

export type Theme = 'light' | 'dark' | 'system';
export const themeList: Theme[] = ['light', 'dark', 'system'];
export const defaultTheme = 'system' as Theme;

let rune = $state(defaultTheme);

export interface ThemeProps {
    theme: Theme;
}

export async function loadThemeServerSide(cookies: Cookies): Promise<ThemeProps> {
    let theme = (cookies.get('theme') || '').toLowerCase() as Theme;
    if (!themeList.includes(theme)) {
        theme = defaultTheme;
    }

    return {
        theme
    };
}

export async function loadTheme(themeProps: Nullable<ThemeProps>): Promise<void> {
    rune = themeProps?.theme ?? defaultTheme;
}

export function refreshTheme() {
    rune = (getCookie('theme') as Theme) ?? defaultTheme;
}

export function themeStore() {
    $effect(() => {
        setCookie('theme', rune);
        if (rune === 'system') document.documentElement.removeAttribute('data-theme');
        else document.documentElement.setAttribute('data-theme', rune);
    });

    return {
        get current() {
            return rune;
        },
        set current(value: Theme) {
            rune = value;
        }
    };
}
