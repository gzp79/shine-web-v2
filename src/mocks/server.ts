import type { RequestHandler } from 'msw';
import { setupServer } from 'msw/node';
import { defaultProviders } from './data/providers/mocks';
import { unauthorizedUser } from './data/users/mock';

export const defaultServer: Array<RequestHandler> = [defaultProviders, unauthorizedUser];

export const server = setupServer(...defaultServer);
