import { query } from '$app/server';

export const queryData = query(async (): Promise<string> => {
    await new Promise((resolver) => setTimeout(resolver, 5000));
    return 'data';
});
