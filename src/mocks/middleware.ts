import { http } from 'msw';
import { logAPI } from '@lib/loggers';
import { async } from '@lib/utils';

export const withLog = http.all('*', ({ request, requestId }) => {
    logAPI.info(`[MSW] [${requestId}] Mocked : ${request.method} ${request.url}`);
});

export const withDelay = (delayMs: number) =>
    http.all('*', async ({ requestId }) => {
        logAPI.info(`[MSW] [${requestId}] waiting ...`);
        await async.delay(delayMs);
        logAPI.info(`[MSW] [${requestId}] continue`);
    });
