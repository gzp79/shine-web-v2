import { error } from '@sveltejs/kit';

export const load = () => {
    if (!import.meta.env.VITE_MOCK) {
        throw error(404, 'Not found');
    }
    return {};
};
