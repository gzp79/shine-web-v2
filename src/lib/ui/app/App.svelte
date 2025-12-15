<script module lang="ts">
    import { type Snippet } from 'svelte';
    import { fade } from 'svelte/transition';
    import Settings from '@lib/ui/atoms/icons/common/Settings.svelte';
    import Button from '@lib/ui/atoms/input/Button.svelte';
    import { createContext } from '@lib/ui/utils';

    export type AppProps = {
        showToolbar?: boolean;
        children: Snippet;
    };

    export type AppToolbarContext = {
        setToolbar: (toolbar: Snippet | undefined) => number;
        resetToolbar: (version: number) => void;
    };

    const [getAppToolbarContext, setAppToolbarContext] = createContext<AppToolbarContext>('AppToolbar');
    export { getAppToolbarContext };
</script>

<script lang="ts">
    let { showToolbar = true, children }: AppProps = $props();

    let toolbar = $state<Snippet | undefined>(undefined);
    let isToolbarExpanded = $state(false);
    let toolbarHistory = $state<[Snippet | undefined, number][]>([]);
    let versionCounter = 0;

    setAppToolbarContext({
        setToolbar: (newToolbar: Snippet | undefined): number => {
            const old = toolbar;
            toolbar = newToolbar;
            const version = ++versionCounter;
            toolbarHistory.push([old, version]);
            return version;
        },

        resetToolbar: (version: number): void => {
            if (toolbarHistory.length === 0) {
                return;
            }
            const index = toolbarHistory.findIndex(([_, v]) => v === version);
            if (index === -1) {
                console.error('Attempted to reset toolbar with unknown version:', version);
                return;
            } else if (index !== toolbarHistory.length - 1) {
                console.warn('Reset toolbar to a non-latest version:', version);
            }
            const [actualToolbar, _] = toolbarHistory[index];
            toolbar = actualToolbar;
            toolbarHistory = toolbarHistory.slice(0, index);
        }
    });

    function toggleToolbar() {
        isToolbarExpanded = !isToolbarExpanded;
    }
</script>

<div data-slot="app" class="relative flex h-screen w-screen flex-col overflow-hidden">
    {#if showToolbar && toolbar}
        <div class="absolute right-4 top-4 z-10">
            <div class="flex items-start gap-2">
                {#if isToolbarExpanded}
                    <header
                        transition:fade={{ duration: 250 }}
                        class="overflow-hidden"
                        aria-label="Application toolbar"
                    >
                        {@render toolbar()}
                    </header>
                {/if}
                <Button
                    size="xs"
                    variant="outline"
                    onclick={toggleToolbar}
                    aria-label={isToolbarExpanded ? 'Close toolbar' : 'Open toolbar'}
                    aria-expanded={isToolbarExpanded}
                    class={`transition-transform duration-300 ${isToolbarExpanded ? 'rotate-180' : ''}`}
                >
                    <Settings />
                </Button>
            </div>
        </div>
    {/if}
    {@render children()}
</div>
