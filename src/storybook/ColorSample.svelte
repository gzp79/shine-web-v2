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

<div bind:this={divRef} class="relative bg-{color} mx-2 mt-2 h-24 w-24 border-2 border-on-{color}">
    {#if shades}
        <div class="absolute bottom-0 left-0 w-[34%] h-[33%] bg-{color}-1"></div>
        <div class="absolute bottom-0 left-[33%] w-[34%] h-[33%] bg-{color}-2"></div>
        <div class="absolute bottom-0 left-[66%] w-[34%] h-[33%] bg-on-{color}"></div>
    {/if}
    <div
        class="absolute top-0 left-0 h-full w-full flex items-center justify-center text-on-{color} text-center text-xl"
    >
        Content
    </div>
</div>
<p class="text-center">{color}</p>
<p class="text-center">{colorValue}</p>
