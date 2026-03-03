// SSR disabled for login page to enable proper error handling
//
// Rationale:
// - Remote function queries (queryCurrentUserInfo, queryExternalLoginProviders) run during page load
// - If these fail during SSR (e.g., identity server down), the error crashes SSR before HTML reaches browser
// - svelte:boundary only catches client-side rendering errors, not SSR errors (by design in Svelte 5)
// - With SSR disabled, all queries run client-side where svelte:boundary can catch errors and show ErrorCard
// - This enables proper error recovery UI with retry button instead of generic 500 error page
//
// Trade-offs accepted:
// - Login page requires JavaScript (already true for Turnstile captcha anyway)
// - No SEO benefit needed for authentication page
//
// See: https://github.com/sveltejs/kit/issues/14398
export const ssr = false;
export const csr = true;
