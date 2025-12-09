import { config } from '@config';
import { HttpResponse, RequestHandler, http } from 'msw';
import { defaultLoginProvider, noUserInfo } from './data/user';

const mocks: Record<string, RequestHandler> = {
    'user.noUserInfo': noUserInfo,
    'user.defaultLoginProvider': defaultLoginProvider
};

const enabledMocks = config.environment === 'mock' ? (config.mocks ?? []) : [];
const enabledHandlers = enabledMocks.map((mock) => mocks[mock]).filter((mock) => mock !== undefined);

export const handlers: Array<RequestHandler> = [
    http.get('https://example.com/user', () => {
        return HttpResponse.json({
            id: 'c7b3d8e0-5e0b-4b0f-8b3a-3b9f4b3d3b3d',
            firstName: 'John',
            lastName: 'Maverick'
        });
    }),

    ...enabledHandlers
];
