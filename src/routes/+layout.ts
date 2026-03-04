import { loadTranslation } from '@lib/i18n';

// SSR disabled
//
// Rationale:
// - Most page has some loading state, the First Contentful Paint (FCP) is not significantly impacted by SSR
// - svelte:boundary only catches client-side rendering errors, not SSR errors (by design in Svelte 5)
// - With SSR disabled, all queries run client-side where svelte:boundary can catch errors and show ErrorCard
//
// Trade-offs accepted:
// - Login page requires JavaScript
// - Loss of SEO, but most of the content is behind authentication anyway
//
// See: https://github.com/sveltejs/kit/issues/14398
export const ssr = false;
export const csr = true;

export const load = async ({ data }) => {
    const translator = await loadTranslation(data.locale);

    return {
        ...data,
        translation: translator
    };
};
