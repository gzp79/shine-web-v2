<script module lang="ts">
    import ColorSample from '@sb/ColorSample.svelte';
    import { defineMeta } from '@storybook/addon-svelte-csf';
    import { expect } from 'storybook/test';
    import { actionColorList, containerColorList } from '@lib/ui/atoms';

    const { Story } = defineMeta({
        title: 'Atoms/Theme/Colors',
        play: async ({ canvasElement }) => {
            expect(canvasElement).toBeDefined();
        }
    });
</script>

<Story name="Container Colors">
    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
        {#each containerColorList as color (color)}
            <div class="flex flex-col items-center rounded-lg border">
                <div class="m-2">
                    <ColorSample {color} />
                </div>
            </div>
        {/each}
    </div>
</Story>

<Story name="Action Colors">
    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
        {#each actionColorList as color (color)}
            <div class="flex flex-col items-center rounded-lg border">
                <div class="m-2">
                    <ColorSample {color} shades />
                </div>
            </div>
        {/each}
    </div>
</Story>
