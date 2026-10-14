import { describe, expect, test } from 'vitest';
import { currentLocationUrl, sanitizeLocalUrl } from './_url';

describe('currentLocationUrl', () => {
    // Guards the fix for a redirect race: `page.url` from `$app/state` lags `window.location` for a
    // short window after a navigation commits, so a redirect decided in that window used to carry
    // the previous route as its `returnUrl`. Callers must read the location, never the router state.
    test.each([
        ['/account', '/account'],
        ['/account?tab=sessions', '/account?tab=sessions'],
        ['/link/email-verify?token=abc#frag', '/link/email-verify?token=abc#frag'],
        ['/', '/']
    ])('reports %s from window.location', (navigateTo, expected) => {
        history.pushState({}, '', navigateTo);

        expect(currentLocationUrl()).toBe(expected);
    });

    test('is relative — never carries the origin', () => {
        history.pushState({}, '', '/account');

        expect(currentLocationUrl().startsWith('/')).toBe(true);
        expect(currentLocationUrl()).not.toContain(window.location.origin);
    });
});

describe('sanitizeLocalUrl', () => {
    test.each([
        ['/game', '/game'],
        ['/game?a=1#b', '/game?a=1#b'],
        ['/', '/'],
        // A local path that merely looks like a host is still local.
        ['/hack.com/enter_password', '/hack.com/enter_password'],
        // Encoded slashes stay in the path; they cannot introduce an authority.
        ['/%2F%2Fhack.com', '/%2F%2Fhack.com']
    ])('keeps the local path %s', (raw, expected) => {
        expect(sanitizeLocalUrl(raw)).toBe(expected);
    });

    test.each([
        // The example this guard exists for: no leading slash, so it is an off-site target.
        'hack.com/enter_password',
        'https://hack.com/enter_password',
        // Protocol-relative and backslash-smuggled authorities pass a leading-slash test but parse
        // to a foreign origin.
        '//hack.com/x',
        '/\\hack.com/x',
        '\\\\hack.com',
        'javascript:alert(1)',
        'http:/hack.com',
        // Dot segments that normalise to a protocol-relative path after the origin check.
        '/.//hack.com',
        '/..//hack.com',
        '/a/..//hack.com'
    ])('rejects %s', (raw) => {
        expect(sanitizeLocalUrl(raw)).toBeNull();
    });

    test.each([null, undefined, ''])('rejects %s', (raw) => {
        expect(sanitizeLocalUrl(raw)).toBeNull();
    });
});
