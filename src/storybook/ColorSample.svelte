<script lang="ts">
    import { onMount } from 'svelte';
    import { type ActionColor, type ContainerColor } from '@lib/ui/atoms';

    interface Props {
        color: ActionColor | ContainerColor;
        shades?: boolean;
    }
    const { color, shades }: Props = $props();

    let divRef: HTMLDivElement;
    let colorValue = $state('');
    let colorVersion = $state(0);

    $effect(() => {
        void colorVersion; // Depend on colorVersion to re-run when it changes

        const computedStyle = getComputedStyle(divRef);
        const backgroundColor = computedStyle.backgroundColor;

        const context = document.createElement('canvas')?.getContext('2d');
        if (context) {
            context.fillStyle = backgroundColor;
            context.fillRect(0.0, 0.0, 1.0, 1.0);
            const color = context.getImageData(0.0, 0.0, 1.0, 1.0)?.data;

            colorValue = color
                ? `#${Array.from(color)
                      .slice(0, 3) // Ignore the alpha channel
                      .map((value) => value.toString(16).padStart(2, '0'))
                      .join('')}`
                : '';
        }
    });

    // Observe changes to the data-theme
    onMount(() => {
        const observer = new MutationObserver((mutations) => {
            if (mutations.some((m) => m.type === 'attributes' && m.attributeName === 'data-theme')) {
                colorVersion++;
            }
        });

        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['data-theme']
        });

        return () => observer.disconnect();
    });
</script>

<div bind:this={divRef} class="relative bg-{color} mx-2 mt-2 h-32 w-48 border-2 border-on-{color}">
    {#if shades}
        <!-- -1 variant: left half of bottom 40% -->
        <div class="absolute bottom-0 left-0 w-1/2 h-[40%] bg-{color}-1 flex items-center justify-center">
            <span class="text-xs font-bold text-on-{color}-1">on-1</span>
        </div>
        <!-- -2 variant: right half of bottom 40% -->
        <div class="absolute bottom-0 left-1/2 w-1/2 h-[40%] bg-{color}-2 flex items-center justify-center">
            <span class="text-xs font-bold text-on-{color}-2">on-2</span>
        </div>
    {/if}
    <!-- base color text + hex in top 60% -->
    <div
        class="absolute top-0 left-0 w-full flex flex-col items-center justify-center text-on-{color} text-center"
        class:h-full={!shades}
        class:h-[60%]={shades}
    >
        <span class="text-sm font-bold">{color}</span>
        <span class="text-xs">{colorValue}</span>
        <span class="text-xs">on: sample</span>
    </div>
</div>
