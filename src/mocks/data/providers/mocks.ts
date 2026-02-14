import { HttpResponse, http } from 'msw';
import { authUrl } from '@lib/server/api/auth';
import providers from './default.json';

export const defaultProviders = http.get(authUrl.providers(), () => {
    return HttpResponse.json(providers);
});
