import { loadTranslation } from '@lib/i18n';

export const load = async ({ data }) => {
    const translator = await loadTranslation(data.locale);

    return {
        ...data,
        translation: translator
    };
};
