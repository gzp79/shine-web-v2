export function getCookie(key: string): string | undefined {
    const value = document.cookie.split('; ').reduce((r, v) => {
        const parts = v.split('=');
        return parts[0] === key ? parts[1] : r;
    }, '');

    return value ? value : undefined;
}

export function updateCookie(key: string, value: string, expires: Date) {
    document.cookie = `${key}=${value}; expires=${expires.toUTCString()}; path=/`;
}

export function setCookie(key: string, value: string) {
    const expires = new Date(new Date().setFullYear(new Date().getFullYear() + 100));
    updateCookie(key, value, expires);
}

export function deleteCookie(key: string) {
    updateCookie(key, '', new Date(0));
}

// Poll for cookie value to match expected value for up to the given timeout (in ms)
export async function waitForCookie(key: string, expectedValue: string, timeout = 2000) {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
        const cookie = await cookieStore.get(key);
        if (cookie?.value === expectedValue) {
            return true;
        }
        await new Promise((resolve) => setTimeout(resolve, 50)); // Poll every 50ms
    }
    throw new Error(`Cookie '${key}' did not reach expected value '${expectedValue}' within ${timeout}ms`);
}
