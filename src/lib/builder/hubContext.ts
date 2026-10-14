import { onDestroy } from 'svelte';
import { createContext } from '#lib/ui/utils';
import { BuilderHub, type BuilderHubOptions } from './hub';

const context = createContext<BuilderHub>('BuilderHubContext');

/**
 * Creates the shared builder hub, connects it, and publishes it to descendants via context.
 * Call once from a layout `<script>` in an authenticated region. The hub is disposed
 * automatically when the providing component is destroyed.
 */
export function provideBuilderHubContext(options?: BuilderHubOptions): BuilderHub {
    const hub = new BuilderHub(options);
    context.set(hub);
    hub.connect();
    onDestroy(() => hub.destroy());
    return hub;
}

/** Reads the shared builder hub. Throws if no ancestor called {@link provideBuilderHubContext}. */
export function getBuilderHubContext(): BuilderHub {
    const hub = context.tryGet();
    if (!hub) {
        throw new Error('BuilderHubContext was not provided: call provideBuilderHubContext in the region layout.');
    }
    return hub;
}
