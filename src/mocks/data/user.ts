import { config } from '@config';
import { HttpResponse, http } from 'msw';
import { v4 as uuid } from 'uuid';

const SIMPLE_USER_ID = 'a36ee600-ed1e-4b6e-a664-aae7ad517841';

const unauthorizedUser = {
    status: 401,
    type: 'unauthorized',
    instance: null,
    detail: 'Missing session info',
    extension: null
};

const serverErrorUser = {
    status: 500,
    type: 'server_error',
    instance: null,
    detail: 'Test server error',
    extension: null
};

const simpleUser = (userId: string) => ({
    userId,
    name: 'Freshman_123456',
    isEmailConfirmed: true,
    isLinked: true,
    roles: [],
    sessionLength: 2180,
    remainingSessionTime: 1799,
    details: {
        kind: 'user',
        createdAt: '2025-10-22T19:41:33.000337Z',
        email: 'user@example.com'
    }
});

const monkeyUserInfo = async (
    unauthorizedRate: number,
    serverErrorRate: number,
    okRate: number,
    delayMs: number
): Promise<Response> => {
    if (delayMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
    }

    const sum = Math.max(0, unauthorizedRate) + Math.max(0, serverErrorRate) + Math.max(0, okRate);
    const rand = Math.random() * sum;

    if (rand < unauthorizedRate) {
        return HttpResponse.json(unauthorizedUser, { status: unauthorizedUser.status });
    } else if (rand < unauthorizedRate + serverErrorRate) {
        return HttpResponse.json(serverErrorUser, { status: serverErrorUser.status });
    } else {
        return HttpResponse.json(simpleUser(SIMPLE_USER_ID), { status: 200 });
    }
};

const userMocks: Record<string, () => Promise<Response>> = {
    unauthorized: () => Promise.resolve(HttpResponse.json(unauthorizedUser, { status: unauthorizedUser.status })),
    serverError: () => Promise.resolve(HttpResponse.json(serverErrorUser, { status: serverErrorUser.status })),
    simpleUser: () => Promise.resolve(HttpResponse.json(simpleUser(SIMPLE_USER_ID), { status: 200 })),
    randomUser: () => Promise.resolve(HttpResponse.json(simpleUser(uuid()), { status: 200 })),

    monkey: () => monkeyUserInfo(20, 10, 70, 500)
};

type Managed = keyof typeof userMocks;
let managed: Managed = 'simpleUser';

export const availableUserMocks: Managed[] = Object.keys(userMocks) as Managed[];

export function selectUserMock(name: Managed) {
    if (!(name in userMocks)) {
        throw new Error(`Unknown user mock: ${name}`);
    }
    managed = name;
}

export function getCurrentUserMock(): Managed {
    return managed;
}

export default http.get(`${config.identityUrl}/api/auth/user/info`, async () => {
    return userMocks[managed]();
});
