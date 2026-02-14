<script module lang="ts">
    import { defineMeta } from '@storybook/addon-svelte-csf';
    import { expect } from 'storybook/test';
    import { themeList } from '@lib/theme/theme.svelte';

    const { Story } = defineMeta({
        title: 'Atoms/Theme/Themes',
        play: async ({ canvasElement }) => {
            expect(canvasElement).toBeDefined();
        }
    });
</script>

<Story name="Theme Nesting">
    <div class="p-8">
        {#each themeList as theme (theme)}
            <!-- Light with nested Dark -->
            <div data-theme={theme} class="rounded-lg border border-sub-container bg-surface text-on-surface p-6 mb-8">
                <h2 class="mb-4 text-lg font-bold">Theme: {theme}</h2>
                <div class="p-4 grid gap-2 rounded-lg border border-sub-container bg-container text-on-container">
                    <p class="mb-4">content</p>
                    {#each themeList as theme2 (theme2)}
                        <div
                            data-theme={theme2}
                            class="rounded-lg border border-sub-container bg-surface text-on-surface p-4"
                        >
                            <p class="mb-3">Theme: {theme2}</p>
                            <div
                                class="rounded-lg border border-sub-container bg-sub-container text-on-sub-container p-3"
                            >
                                <p>content</p>
                            </div>
                        </div>
                    {/each}
                </div>
            </div>
        {/each}
    </div>
</Story>
