import { getTranslator } from '@lib/i18n';

export const load = async ({ data }) => {
    return {
        translator: await getTranslator(data.locale),
        ...data
    };
};
