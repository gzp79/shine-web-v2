import { HttpResponse, http } from 'msw';
import { authUrl } from '@lib/server/api/auth';
import unauthorized from './unauthorized.json';

export const unauthorizedUser = http.get(authUrl.myInfo(), () => {
    return HttpResponse.json(unauthorized, { status: 401 });
});
