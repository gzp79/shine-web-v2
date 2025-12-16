import { remoteFunctionRegistry, type RemoteFunctionRegistry } from '$lib/remote-registry';
import { error } from '@sveltejs/kit';

export async function POST(event) {
    const { functionPath, args } = await event.request.json();

    if (!functionPath) {
        throw error(400, 'Missing function path');
    }

    if (!Object.keys(remoteFunctionRegistry).includes(functionPath)) {
        throw error(403, `Forbidden function call: ${functionPath}`);
    }

    try {
        const remoteFunction = remoteFunctionRegistry[functionPath as keyof RemoteFunctionRegistry];
        return await remoteFunction(event, ...(args || []));
    } catch (e) {
        console.error('Remote function execution error:', e);
        if (e.status) throw e;
        throw error(500, `Failed to execute remote function: ${e.message}`);
    }
}
