import { onDestroy } from 'svelte';
import { createContext } from '@lib/ui/utils';
import { BuilderHub, type BuilderHubOptions } from './hub';

const context = createContext<BuilderHub>('builder-hub');

/**
 * Creates the shared builder hub and publishes it to descendants via context.
 * Call once from a layout `<script>` in an authenticated region.
 *
 * The hub is created **idle** — no socket is opened here. Call {@link BuilderHub.connect}
 * once the region is ready (e.g. to drive the app-shell status indicator). The hub is
 * disposed automatically when the providing component is destroyed.
 */
export function provideBuilderHub(options?: BuilderHubOptions): BuilderHub {
    const hub = new BuilderHub(options);
    context.set(hub);
    onDestroy(() => hub.destroy());
    return hub;
}

/** Reads the shared builder hub. Throws if no ancestor called {@link provideBuilderHub}. */
export function getBuilderHub(): BuilderHub {
    const hub = context.tryGet();
    if (!hub) {
        throw new Error('getBuilderHub: no hub in context (call provideBuilderHub in the region layout)');
    }
    return hub;
}

/** Reads the shared builder hub, or `undefined` when none is provided. */
export function tryGetBuilderHub(): BuilderHub | undefined {
    return context.tryGet();
}
