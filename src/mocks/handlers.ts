import { RequestHandler } from 'msw';
import userMock from './data/user';

export const handlers: Array<RequestHandler> = [userMock];
