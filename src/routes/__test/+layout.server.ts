import { config } from '@config';
import { error } from '@sveltejs/kit';

export const load = () => {
    if (config.environment === 'prod') {
        throw error(404, 'Not found');
    }
    return {};
};
