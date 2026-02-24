import { HttpResponse, http } from 'msw';
import { authUrl } from '@lib/server/api/auth';
import guestUser from './guestUser.json';
import unauthorized from './unauthorized.json';

export const unauthorizedUser = http.get(authUrl.myInfo(), () => {
    return HttpResponse.json(unauthorized, { status: 401 });
});

export const defaultGuestUser = http.get(authUrl.myInfo(), () => {
    return HttpResponse.json(guestUser, { status: 200 });
});
