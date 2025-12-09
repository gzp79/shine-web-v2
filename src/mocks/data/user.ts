import { config } from '@config';
import { HttpResponse, http } from 'msw';

export const noUserInfo = http.get(`${config.identityUrl}/api/auth/user/info`, async () => {
    return HttpResponse.json(
        { status: 401, type: 'unauthorized', instance: null, detail: 'Missing session info', extension: null },
        { status: 401 }
    );
});

export const defaultLoginProvider = http.get(`${config.identityUrl}/api/auth/providers`, async () => {
    return HttpResponse.json(
        {
            providers: [
                'google',
                'gitlab',
                'github',
                'discord',
                'aaa',

                //duplicates
                'google',
                'gitlab',
                'github',
                'discord'
            ]
        },
        { status: 200 }
    );
});
