import { HttpResponse, http } from 'msw';
import { logAPI } from '@lib/loggers';
import { authUrl } from '@lib/server/api/auth';
import providers from './default.json';

export const defaultProviders = http.get(authUrl.providers(), ({ requestId }) => {
    logAPI.info(`[MSW] [${requestId}] Mocked: GET ${authUrl.providers()}`);
    return HttpResponse.json(providers);
});
