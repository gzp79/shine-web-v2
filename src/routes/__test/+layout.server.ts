import { error } from '@sveltejs/kit';
import { IS_MOCK } from '@lib/utils';

export const load = () => {
    if (!IS_MOCK) {
        throw error(404, 'Not found');
    }
    return {};
};
