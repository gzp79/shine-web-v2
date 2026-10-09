import { describe, expect, test } from 'vitest';
import { sanitizeLocalUrl } from './_url';

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
        'http:/hack.com'
    ])('rejects %s', (raw) => {
        expect(sanitizeLocalUrl(raw)).toBeNull();
    });

    test.each([null, undefined, ''])('rejects %s', (raw) => {
        expect(sanitizeLocalUrl(raw)).toBeNull();
    });
});
