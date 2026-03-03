import { HttpResponse, http } from 'msw';
import { authApiRoutes } from '@lib/server/api/authApiRoutes';
import guestUser from './guestUser.json';
import unauthorized from './unauthorized.json';

export const unauthorizedUser = http.get(authApiRoutes.myInfo(), () => {
    return HttpResponse.json(unauthorized, { status: 401 });
});

export const defaultGuestUser = http.get(authApiRoutes.myInfo(), () => {
    return HttpResponse.json(guestUser, { status: 200 });
});
