<script lang="ts">
    import { onDestroy } from 'svelte';
    import { logGame } from '@lib/loggers';
    import { getMenuContext } from '@lib/ui/app/AppMenu.svelte';
    import CenteredLayout from '@lib/ui/app/CenteredLayout.svelte';
    import Check from '@lib/ui/atoms/icons/common/Check.svelte';
    import ErrorCard from '@lib/ui/components/cards/ErrorCard.svelte';
    import LoadingCard from '@lib/ui/components/cards/LoadingCard.svelte';
    import { createAppError } from '@lib/utils';
    import type { PageData } from './$types';

    type Scene = 'game' | 'hex-mesh' | 'cdt' | 'input-events' | 'trilinear';
    type Viewer = { dispose(): void };
    type GameModule = {
        createScene: (container: HTMLElement, scene: Scene) => Promise<Viewer>;
    };

    const SCENES: Scene[] = ['game', 'hex-mesh', 'cdt', 'input-events', 'trilinear'];

    const { data }: { data: PageData } = $props();

    const appMenu = getMenuContext();

    let container: HTMLElement;
    let viewer: Viewer | null = null;
    let error = $state<unknown>(null);
    let running = $state(false);
    let scene = $state<Scene>('game');

    // Register scene-switch items in the context menu
    $effect(() => {
        const unregisters = SCENES.map((s) =>
            appMenu.register({
                id: `scene-${s}`,
                section: 'context',
                label: s,
                icon: scene === s ? Check : undefined,
                action: () => {
                    scene = s;
                }
            })
        );
        return () => unregisters.forEach((fn) => fn());
    });

    // Load/reload scene whenever it changes
    $effect(() => {
        const s = scene;
        void run(s);
        return () => {
            viewer?.dispose();
            viewer = null;
            running = false;
        };
    });

    async function run(s: Scene) {
        error = null;
        running = false;
        try {
            logGame.info(`importing ${data.jsUrl}`);
            const mod = (await import(/* @vite-ignore */ data.jsUrl)) as GameModule;
            logGame.info(`creating scene="${s}"`);
            viewer = await mod.createScene(container, s);
            running = true;
            logGame.info('scene running');
        } catch (err) {
            logGame.error('scene failed', err);
            error = err;
        }
    }

    onDestroy(() => {
        viewer?.dispose();
        viewer = null;
    });
</script>

<CenteredLayout padding={0}>
    <div class="relative w-full h-full">
        {#if error}
            <div class="absolute inset-0 flex items-center justify-center">
                <ErrorCard error={createAppError(error)} />
            </div>
        {:else if !running}
            <div class="absolute inset-0 flex items-center justify-center">
                <LoadingCard />
            </div>
        {/if}
        <div bind:this={container} class="w-full h-full" class:invisible={!running}></div>
    </div>
</CenteredLayout>
