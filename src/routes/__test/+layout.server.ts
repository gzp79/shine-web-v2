import { config } from '@config';
import { error } from '@sveltejs/kit';

export const load = () => {
    if (config.environment !== 'mock') {
        throw error(404, 'Not found');
    }
    return {};
};
