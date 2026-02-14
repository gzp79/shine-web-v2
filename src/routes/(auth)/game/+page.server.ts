import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ request }) => {
    const userAgent = request.headers.get('user-agent') || '';

    // Check if the user agent indicates Android or iOS and redirect to mobile page if so
    const isAndroid = /android/i.test(userAgent);
    const isIOS = /iphone|ipad|ipod/i.test(userAgent);

    if (isAndroid || isIOS) {
        throw redirect(302, '/public/mobile');
    }

    return {};
};
