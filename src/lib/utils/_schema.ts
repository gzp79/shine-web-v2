import type z from 'zod';

export async function parseSchema<T extends z.ZodObject>(schema: T, data: unknown): Promise<z.infer<T>> {
    try {
        return schema.parse(data);
    } catch (err) {
        console.error('Failed to parse', data, 'with error', err);
        throw err;
    }
}

export async function parseResponse<T extends z.ZodObject>(schema: T, response: Response): Promise<z.infer<T>> {
    return await parseSchema(schema, await response.json());
}

export async function parseRequest<T extends z.ZodObject>(schema: T, request: Request): Promise<z.infer<T>> {
    return await parseSchema(schema, await request.json());
}
