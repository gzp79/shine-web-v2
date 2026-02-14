import type { RequestHandler } from 'msw';
import { setupWorker } from 'msw/browser';

export const defaultBrowser: Array<RequestHandler> = [];

export const worker = setupWorker(...defaultBrowser);
