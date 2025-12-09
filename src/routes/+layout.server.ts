import { loadLanguageServerSide } from '@lib/i18n/i18n.svelte';

export const load = async ({ url, cookies, request, locals }) => {
    const languageProps = await loadLanguageServerSide(url, cookies, request.headers);

    return {
        language: languageProps,
        theme: locals.theme
    };
};
