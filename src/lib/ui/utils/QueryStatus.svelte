<script module lang="ts">
    import Typography from '@lib/ui/atoms/Typography.svelte';
    import Stack from '@lib/ui/atoms/layouts/Stack.svelte';
    import { type AutoRefresh, type QueryLike, typeOfT } from '@lib/utils';
    import Button from '../atoms/input/Button.svelte';

    export type QueryStatusProps<T> = {
        query: QueryLike<T>;
    };
</script>

<script lang="ts" generics="T">
    let { query }: QueryStatusProps<T> = $props();

    let typeName = $derived(typeOfT(query));
    let autoRefresh = $derived('timeToRefresh' in query ? (query as unknown as AutoRefresh) : undefined);
</script>

<svelte:boundary>
    <Stack>
        <Typography>type: {typeName}</Typography>
        <Typography>is loading: {query.loading}</Typography>
        <Typography>has error: {!!query.error}</Typography>
        <Typography>has current: {!!query.current}</Typography>

        {#if autoRefresh !== undefined}
            <Typography>updated: {autoRefresh.lastUpdate}</Typography>
            <Typography>time to refresh: {autoRefresh.timeToRefresh}</Typography>
        {/if}

        <Button onclick={() => query.refresh()}>Refresh</Button>
    </Stack>
</svelte:boundary>
