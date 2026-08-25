import { HttpResponse, http } from 'msw';
import { authApiRoutes } from '@lib/server/api/authApiRoutes';
import { userApiRoutes } from '@lib/server/api/userApiRoutes';
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

/** Resolves any id to a stable, readable name so batching is observable in mock runs. */
export const defaultPublicUserInfo = http.post(userApiRoutes.publicUserInfo(), async ({ request }) => {
    const { userIds } = (await request.json()) as { userIds?: string[] };
    if (!Array.isArray(userIds) || userIds.length === 0 || userIds.length > 100) {
        return HttpResponse.json({ error: 'invalid user id list' }, { status: 400 });
    }

    const users = Object.fromEntries(
        [...new Set(userIds)].map((id) => [id, { name: `User_${id.replace(/-/g, '').slice(0, 6)}` }])
    );
    return HttpResponse.json({ users }, { status: 200 });
});

export const publicUserInfoUnauthorized = http.post(userApiRoutes.publicUserInfo(), () => {
    return HttpResponse.json(unauthorized, { status: 401 });
});
