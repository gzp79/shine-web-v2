<script lang="ts">
    import { onMount } from 'svelte';
    import Stack from '@lib/ui/atoms/layouts/Stack.svelte';
    import { shortenString } from '@lib/ui/utils';

    type Props = {
        name: string;
        element?: HTMLElement | null;
    };

    let { name, element = $bindable() }: Props = $props();

    let selfElement = $state<HTMLElement | null>(null);
    let targetElement = $derived(element /*?? (selfElement?.parentNode as HTMLElement)*/ ?? selfElement);
    let variableName = $derived(name.startsWith('--') ? name : `--${name}`);

    let version = $state(0);
    let value = $state('');

    $effect(() => {
        void version;
        if (targetElement) {
            value = getComputedStyle(targetElement).getPropertyValue(variableName).trim();
        } else {
            value = '';
        }
    });

    onMount(() => {
        const interval = setInterval(() => version++, 1000);
        return () => clearInterval(interval);
    });
</script>

<Stack direction="row" class="w-fit" bind:ref={selfElement}>
    <span class="whitespace-nowrap text-xs"> {`${shortenString(variableName, 30)}=[${value}]`} </span>
</Stack>
