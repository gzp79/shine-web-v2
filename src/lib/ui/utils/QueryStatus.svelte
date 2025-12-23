<script module lang="ts">
    import Typography from '@lib/ui/atoms/Typography.svelte';
    import Stack from '@lib/ui/atoms/layouts/Stack.svelte';
    import { type IQuery, typeOfT } from '@lib/utils';
    import type { EnhancedQuery } from '@lib/utils/enhanced-query.svelte';
    import Button from '../atoms/input/Button.svelte';

    export type QueryStatusProps<T> = {
        query: IQuery<T>;
    };
</script>

<script lang="ts" generics="T">
    let { query }: QueryStatusProps<T> = $props();

    let typeName = $derived(typeOfT(query));
    let enhancedQuery = $derived('timeToRefresh' in query ? (query as EnhancedQuery<T>) : undefined);
</script>

<svelte:boundary>
    <Stack>
        <Typography>type: {typeName}</Typography>
        <Typography>is loading: {query.loading}</Typography>
        <Typography>has error: {!!query.error}</Typography>
        <Typography>has current: {!!query.current}</Typography>

        {#if enhancedQuery !== undefined}
            <Typography>updated: {enhancedQuery.lastUpdate}</Typography>
            <Typography>time to refresh: {enhancedQuery.timeToRefresh}</Typography>
        {/if}

        <Button onclick={() => query.refresh()}>Refresh</Button>
    </Stack>
</svelte:boundary>
