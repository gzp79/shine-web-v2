export const GAME_BASE_NAME = 'shine-client';

// Sentinel Turnstile site-key that mirrors the identity service's test captcha secret. When the
// active config uses it, the service runs in test mode: the sent token drives the outcome
// (pass/block/skip) instead of a real Cloudflare check.
export const CAPTCHA_TEST_SITE_KEY = '0000000000000000000000000000000000';
export const CAPTCHA_SKIP_TOKEN = 'skip';
