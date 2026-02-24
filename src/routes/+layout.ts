import { LOCALE_DATA_KEY, loadTranslation } from '@lib/i18n';

export const load = async ({ depends, data }) => {
    depends(LOCALE_DATA_KEY);

    const translator = await loadTranslation(data.locale);

    return {
        ...data,
        translation: translator
    };
};
