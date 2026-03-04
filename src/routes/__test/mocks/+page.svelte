<script lang="ts">
    import Button from '$lib/ui/atoms/input/Button.svelte';
    import { onMount } from 'svelte';
    import MockItem from './MockItem.svelte';

    type Mock = {
        name: string;
        isActive: boolean;
        hasParams: boolean;
        params?: unknown;
    };

    let mocks = $state<Mock[]>([]);
    let error = $state<string | null>(null);
    let loading = $state(true);

    async function fetchMocks() {
        try {
            error = null;
            const res = await fetch('/api/__mock');
            if (!res.ok) {
                throw new Error(`HTTP ${res.status}`);
            }
            const data = await res.json();
            mocks = data.mocks;
        } catch (err) {
            error = `Failed to load mocks: ${(err as Error).message}`;
        } finally {
            loading = false;
        }
    }

    async function addMock(name: string, params: unknown | undefined) {
        const res = await fetch('/api/__mock', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ handler: name, params })
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
    }

    async function removeMock(name: string) {
        const res = await fetch('/api/__mock', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ handler: name })
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
    }

    onMount(() => {
        fetchMocks();
    });

    const handleRefresh = async () => {
        loading = true;
        await fetchMocks();
    };

    const handleReset = async () => {
        try {
            loading = true;
            error = null;
            const res = await fetch('/api/__mock', { method: 'DELETE' });
            if (!res.ok) {
                throw new Error(`HTTP ${res.status}`);
            }
            await fetchMocks();
        } catch (err) {
            error = `Failed to reset mocks: ${(err as Error).message}`;
            loading = false;
        }
    };

    const handleDisable = async (name: string) => {
        try {
            error = null;
            await removeMock(name);
        } catch (err) {
            error = `Failed to update mock: ${(err as Error).message}`;
        }
        await fetchMocks();
    };

    const handleEnable = async (name: string, params: unknown) => {
        try {
            error = null;
            await addMock(name, params);
        } catch (err) {
            error = `Failed to update params: ${(err as Error).message}`;
        }
        await fetchMocks();
    };

    const activeMocks = $derived(mocks.filter((m) => m.isActive));
    const inactiveMocks = $derived(mocks.filter((m) => !m.isActive));
</script>

<div class="h-screen flex flex-col overflow-hidden">
    <div class="p-4 border-b border-on-container">
        <div class="max-w-screen-2xl mx-auto flex flex-col items-center">
            <h1 class="text-2xl font-bold mb-4">Mock Control Panel</h1>
            <div class="flex gap-2">
                <Button onclick={handleRefresh} disabled={loading}>Refresh</Button>
                <Button onclick={handleReset} disabled={loading} color="danger">Reset All</Button>
            </div>
        </div>
    </div>

    <div class="flex-1 overflow-y-auto p-4">
        <div class="max-w-screen-2xl mx-auto space-y-4">
            {#if error}
                <div class="p-4 bg-danger text-on-danger rounded">
                    <p>{error}</p>
                </div>
            {/if}

            {#if loading}
                <p>Loading...</p>
            {:else}
                {#if activeMocks.length > 0}
                    <div class="p-4 bg-container border border-on-container rounded">
                        <h2 class="text-lg font-semibold mb-4">Active Overrides ({activeMocks.length})</h2>
                        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                            {#each activeMocks as mock (mock.name)}
                                <MockItem
                                    name={mock.name}
                                    defaultValue={JSON.stringify(mock.params ?? {}, null, 2)}
                                    rawInput={JSON.stringify(mock.params ?? {}, null, 2)}
                                    isActive={true}
                                    hasParams={mock.params !== undefined}
                                    disabled={loading}
                                    onEnable={handleEnable}
                                    onDisable={handleDisable}
                                />
                            {/each}
                        </div>
                    </div>
                {/if}

                {#if inactiveMocks.length > 0}
                    <div class="p-4 bg-container border border-on-container rounded">
                        <h2 class="text-lg font-semibold mb-4">
                            Available Mocks ({inactiveMocks.length})
                        </h2>
                        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                            {#each inactiveMocks as mock (mock.name)}
                                <MockItem
                                    name={mock.name}
                                    defaultValue={JSON.stringify(mock.params ?? {}, null, 2)}
                                    rawInput={JSON.stringify(mock.params ?? {}, null, 2)}
                                    isActive={false}
                                    hasParams={mock.params !== undefined}
                                    disabled={loading}
                                    onEnable={handleEnable}
                                    onDisable={handleDisable}
                                />
                            {/each}
                        </div>
                    </div>
                {/if}
            {/if}
        </div>
    </div>
</div>
