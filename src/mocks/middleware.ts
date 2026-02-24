import { config } from '@config';
import { HttpResponse, http } from 'msw';
import { logAPI } from '@lib/loggers';
import { async, joinURL } from '@lib/utils';

export const withLog = http.all('*', ({ request, requestId }) => {
    logAPI.info(`[MSW] [${requestId}] Mocked : ${request.method} ${request.url}`);
});

export const withDelay = (delayMs: number) =>
    http.all('*', async ({ requestId }) => {
        logAPI.info(`[MSW] [${requestId}] waiting ...`);
        await async.delay(delayMs);
        logAPI.info(`[MSW] [${requestId}] continue`);
    });

export const withIdentityDown = http.all(joinURL(config.identityUrl, '*'), () => {
    return HttpResponse.json({ message: 'Mocked server is down' }, { status: 503 });
});
