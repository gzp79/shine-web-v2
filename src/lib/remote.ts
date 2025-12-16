import type { RemoteFunctionRegistry } from './remote-registry';

export async function remote<T>(
    functionPath: keyof RemoteFunctionRegistry,
    ...args: any[]
): Promise<T> {
    const response = await fetch('/api/remote', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ functionPath, args })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(`Remote function call failed: ${error.message}`);
    }

    return await response.json();
}
