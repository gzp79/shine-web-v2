/**
 * Test step utility for organizing multi-step tests with logging.
 * Provides similar functionality to test.step() which is not available in Vitest browser mode.
 */
export async function step<T>(name: string, fn: () => T | Promise<T>): Promise<T> {
    console.log(`[Test Step] ${name}`);
    return await fn();
}
