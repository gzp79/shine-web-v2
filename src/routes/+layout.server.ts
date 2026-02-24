export const load = async ({ locals }) => {
    return {
        theme: locals.theme,
        locale: locals.locale
    };
};
