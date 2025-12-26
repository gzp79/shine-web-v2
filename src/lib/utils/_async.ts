export const async = {
    delay(ms: number): Promise<void> {
        return new Promise((resolver) => setTimeout(resolver, ms));
    },

    never(): Promise<never> {
        return new Promise(() => {});
    },

    resolved<T>(data: T): Promise<T> {
        return Promise.resolve(data);
    },

    async error(error: Error): Promise<never> {
        throw error;
    }
};
