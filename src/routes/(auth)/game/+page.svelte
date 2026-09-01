<script lang="ts">
    import { config } from '@config';
    import { queryGameAssetManifest } from '@lib/assets/assets.remote';
    import { gameInputGate } from '@lib/game';
    import { logGame } from '@lib/loggers';
    import { getMenuContext } from '@lib/ui/app/AppMenu.svelte';
    import CenteredLayout from '@lib/ui/app/CenteredLayout.svelte';
    import Check from '@lib/ui/atoms/icons/common/Check.svelte';
    import Button from '@lib/ui/atoms/input/Button.svelte';
    import ErrorCard from '@lib/ui/components/cards/ErrorCard.svelte';
    import LoadingCard from '@lib/ui/components/cards/LoadingCard.svelte';
    import { createAppError, fireAndForget } from '@lib/utils';
    import type { PageData } from './$types';

    // Local mirror of the game bundle's contract (loaded at runtime, so its types aren't importable).
    type SceneHandle = {
        dispose(): void;
        setInputEnabled(enabled: boolean): void;
    };
    type AssetCatalog = {
        list(): { name: string }[];
        url(name: string): string;
    };
    type AssetCatalogBuilder = () => Promise<AssetCatalog>;
    type GameModule = {
        createScene: (
            container: HTMLElement,
            scene: string,
            catalogBuilder: AssetCatalogBuilder,
            onError?: (error: Error) => void
        ) => Promise<SceneHandle>;
        listScenes: () => { id: string; title: string }[];
    };

    const { data }: { data: PageData } = $props();

    const appMenu = getMenuContext();

    let container: HTMLElement;
    let handle = $state<SceneHandle | null>(null);
    let error = $state<unknown>(null);
    let running = $state(false);
    let retry = $state(0);
    let retrying = $state(false);
    let scene = $state<string>('');
    let sceneList = $state<{ id: string; title: string }[]>([]);

    // Register scene-switch items in the context menu
    $effect(() => {
        const unregisters = sceneList.map((entry) =>
            appMenu.register({
                id: `scene-${entry.id}`,
                section: 'context',
                label: entry.title,
                icon: scene === entry.id ? Check : undefined,
                action: () => {
                    scene = entry.id;
                }
            })
        );
        return () => unregisters.forEach((fn) => fn());
    });

    // Load/reload scene whenever it changes
    $effect(() => {
        let cancelled = false;
        fireAndForget(
            () => run(scene, retry, () => cancelled),
            (err) => logGame.error('scene failed', err)
        );
        return () => {
            cancelled = true;
            handle?.dispose();
            handle = null;
            running = false;
        };
    });

    $effect(() => {
        handle?.setInputEnabled(!gameInputGate.suspended);
    });

    async function buildAssetCatalog(): Promise<AssetCatalog> {
        const { links } = await queryGameAssetManifest();
        return {
            list: () => Object.keys(links).map((name) => ({ name })),
            url: (name) => {
                const path = links[name];
                if (path === undefined) throw new Error(`[AssetCatalog] unknown asset "${name}"`);
                return `${config.assetUrl}/${path}`;
            }
        };
    }

    async function run(s: string, attempt: number, isCancelled: () => boolean) {
        running = false;
        try {
            logGame.info(`importing ${data.jsUrl}`);
            const mod = (await import(/* @vite-ignore */ data.jsUrl)) as GameModule;
            if (isCancelled()) return;
            if (typeof mod.createScene !== 'function') {
                throw new Error('Invalid game module: createScene is not a function');
            }
            if (typeof mod.listScenes !== 'function') {
                throw new Error('Invalid game module: listScenes is not a function');
            }
            if (sceneList.length === 0) {
                sceneList = mod.listScenes();
            }
            logGame.info(`creating scene="${s}" attempt=${attempt}`);
            const next = await mod.createScene(container, s, buildAssetCatalog, (fatalError) => {
                if (isCancelled()) return;
                handle = null;
                running = false;
                error = fatalError;
                retrying = false;
            });
            if (isCancelled()) {
                next.dispose();
                return;
            }
            handle = next;
            error = null;
            running = true;
            retrying = false;
            logGame.info('scene running');
        } catch (err) {
            if (isCancelled()) return;
            logGame.error('scene failed', err);
            error = err;
            retrying = false;
        }
    }

    function retryScene() {
        if (retrying) return;
        retrying = true;
        retry += 1;
    }
</script>

<CenteredLayout padding={0}>
    <div class="relative w-full h-full">
        {#if error}
            <div class="absolute inset-0 flex items-center justify-center">
                <ErrorCard error={createAppError(error)}>
                    {#snippet actions()}
                        <Button disabled={retrying} onclick={retryScene}>Retry</Button>
                    {/snippet}
                </ErrorCard>
            </div>
        {:else if !running}
            <div class="absolute inset-0 flex items-center justify-center">
                <LoadingCard />
            </div>
        {/if}
        <div bind:this={container} class="w-full h-full" class:invisible={!running}></div>
    </div>
</CenteredLayout>
