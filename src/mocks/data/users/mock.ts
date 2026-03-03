import { HttpResponse, http } from 'msw';
import { authApiRoutes } from '@lib/server/api/authApiRoutes';
import guestUser from './guestUser.json';
import unauthorized from './unauthorized.json';
import unverifiedUser from './unverifiedUser.json';
import verifiedUser from './verifiedUser.json';

export const unauthorizedUser = http.get(authApiRoutes.myInfo(), () => {
    return HttpResponse.json(unauthorized, { status: 401 });
});

export const defaultGuestUser = http.get(authApiRoutes.myInfo(), () => {
    return HttpResponse.json(guestUser, { status: 200 });
});

export const verifiedUserHandler = http.get(authApiRoutes.myInfo(), () => {
    return HttpResponse.json(verifiedUser, { status: 200 });
});

export const unverifiedUserHandler = http.get(authApiRoutes.myInfo(), () => {
    return HttpResponse.json(unverifiedUser, { status: 200 });
});
