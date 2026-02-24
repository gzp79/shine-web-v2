import { LOCALE_DATA_KEY } from '@lib/i18n';

export const load = async ({ depends, locals }) => {
    depends(LOCALE_DATA_KEY);

    return {
        theme: locals.theme,
        locale: locals.locale
    };
};
