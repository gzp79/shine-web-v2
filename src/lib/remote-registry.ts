import { loadLanguageQuery } from './i18n/i18n.remote';

export const remoteFunctionRegistry = {
    'i18n/loadLanguageQuery': loadLanguageQuery
};

export type RemoteFunctionRegistry = typeof remoteFunctionRegistry;
