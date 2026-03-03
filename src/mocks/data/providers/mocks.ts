import { HttpResponse, http } from 'msw';
import { logAPI } from '@lib/loggers';
import { authApiRoutes } from '@lib/server/api/authApiRoutes';
import providers from './default.json';

export const defaultProviders = http.get(authApiRoutes.providers(), ({ requestId }) => {
    logAPI.info(`[MSW] [${requestId}] Mocked: GET ${authApiRoutes.providers()}`);
    return HttpResponse.json(providers);
});
