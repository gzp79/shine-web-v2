<script lang="ts">
    import { goto } from '$app/navigation';
    import { resolve } from '$app/paths';
    import CenteredLayout from '@lib/ui/app/CenteredLayout.svelte';
</script>

<CenteredLayout>
    <button
        class="cursor-pointer rounded-full p-8 hover:brightness-highlight"
        aria-label="Enter"
        onclick={() => goto(resolve('/game'))}
    >
        <span class="relative flex h-16 w-16">
            <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-on-primary opacity-50"></span>
            <span class="relative inline-flex h-16 w-16 rounded-full bg-on-primary"></span>
        </span>
    </button>
</CenteredLayout>
