<script module lang="ts">
    import { defineMeta } from '@storybook/addon-svelte-csf';
    import { expect } from 'storybook/test';
    import Typography from '@lib/ui/atoms/Typography.svelte';
    import Logo from '@lib/ui/atoms/glyphs/Logo.svelte';
    import Discord from '@lib/ui/atoms/glyphs/brands/Discord.svelte';
    import Email from '@lib/ui/atoms/glyphs/brands/Email.svelte';
    import Github from '@lib/ui/atoms/glyphs/brands/Github.svelte';
    import Google from '@lib/ui/atoms/glyphs/brands/Google.svelte';
    import User from '@lib/ui/atoms/glyphs/brands/User.svelte';
    import Button from '@lib/ui/atoms/input/Button.svelte';
    import Box from '@lib/ui/atoms/layouts/Box.svelte';
    import Separator from '@lib/ui/atoms/layouts/Separator.svelte';
    import Stack from '@lib/ui/atoms/layouts/Stack.svelte';

    const { Story } = defineMeta({
        title: 'Atoms/Layouts/Separator',
        component: Separator,
        play: async ({ canvasElement }) => {
            expect(canvasElement).toBeDefined();
        }
    });
</script>

<Story name="Default">
    {#snippet template(args)}
        <Stack>
            <Typography variant="h3">Section 1</Typography>
            <Typography>This is the first section with some content.</Typography>
            <Separator />
            <Typography variant="h3">Section 2</Typography>
            <Typography>This is the second section with more content.</Typography>
        </Stack>
    {/snippet}
</Story>

<Story name="Subtle Variant">
    {#snippet template(args)}
        <div
            class="relative p-8"
            style="background-image: url('https://picsum.photos/800/600'); background-size: cover; background-position: center; min-height: 500px;"
        >
            <div class="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>
            <div class="relative">
                <Box containerClass="max-w-md mx-auto bg-white/10 backdrop-blur-md p-6 rounded-lg">
                    <Typography variant="h2" class="text-white text-center mb-4">Sign In</Typography>

                    <Stack spacing={3}>
                        <button
                            class="w-full py-3 px-4 bg-white/20 hover:bg-white/30 rounded-full text-white transition-colors"
                        >
                            Continue as User
                        </button>

                        <Typography class="text-white/70 text-sm text-center">Not you? Switch account</Typography>

                        <Separator variant="subtle" />

                        <Stack spacing={2}>
                            <button
                                class="w-full py-3 px-4 bg-white/20 hover:bg-white/30 rounded-full text-white transition-colors flex items-center justify-center gap-2"
                            >
                                Email
                            </button>
                            <button
                                class="w-full py-3 px-4 bg-white/20 hover:bg-white/30 rounded-full text-white transition-colors flex items-center justify-center gap-2"
                            >
                                Discord
                            </button>
                            <button
                                class="w-full py-3 px-4 bg-white/20 hover:bg-white/30 rounded-full text-white transition-colors flex items-center justify-center gap-2"
                            >
                                GitHub
                            </button>
                        </Stack>

                        <Separator variant="subtle" />

                        <label class="flex items-center gap-2 text-white">
                            <input type="checkbox" class="rounded" />
                            <span>Remember me</span>
                        </label>
                    </Stack>
                </Box>

                <Separator variant="subtle" />

                <button
                    class="mx-auto block mt-6 py-3 px-8 bg-white/20 hover:bg-white/30 rounded-full text-white transition-colors"
                >
                    Guest
                </button>
            </div>
        </div>
    {/snippet}
</Story>

<Story name="Both Variants">
    {#snippet template(args)}
        <Stack>
            <Box border containerClass="p-4">
                <Typography variant="h4">Default Separator</Typography>
                <Typography>Standard border separator</Typography>
                <Separator />
                <Typography>Content after separator</Typography>
            </Box>

            <div
                class="relative p-6"
                style="background-image: url('https://picsum.photos/600/400'); background-size: cover; background-position: center;"
            >
                <div class="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>
                <div class="relative">
                    <Box containerClass="max-w-sm mx-auto bg-white/10 backdrop-blur-md p-6 rounded-lg">
                        <Typography variant="h4" class="text-white text-center">Subtle Separator</Typography>
                        <Typography class="text-white/80 text-center">With gradient glow effect</Typography>
                        <Separator variant="subtle" />
                        <Typography class="text-white text-center">Perfect for glass-morphic designs</Typography>
                    </Box>
                </div>
            </div>
        </Stack>
    {/snippet}
</Story>

<Story name="Vertical">
    {#snippet template(args)}
        <div class="flex gap-4 items-stretch" style="min-height: 200px;">
            <Box border containerClass="flex-1 p-4">
                <Typography>Left Content</Typography>
            </Box>
            <Separator orientation="vertical" />
            <Box border containerClass="flex-1 p-4">
                <Typography>Middle Content</Typography>
            </Box>
            <Separator orientation="vertical" variant="subtle" />
            <Box border containerClass="flex-1 p-4">
                <Typography>Right Content</Typography>
            </Box>
        </div>
    {/snippet}
</Story>

<Story name="Login Interface">
    {#snippet template(args)}
        <div
            class="relative p-8 min-h-screen flex flex-col items-center justify-center"
            style="background: linear-gradient(to bottom, #8B9DA8, #B8C5CC); background-size: cover; background-position: center;"
        >
            <div
                class="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-[0.25]"
                style="background-image: url(&quot;https://assets.scytta.com/ui/ac4f8b1cbab17ec60b11bc5b64b4dba0.webp&quot;), url(&quot;https://assets.scytta.com/ui/ac4f8b1cbab17ec60b11bc5b64b4dba0.jpg&quot;);"
            ></div>

            <div class="grid">
                <Logo />

                <Box ghost={true} containerClass="rounded-3xl backdrop-blur-lg" contentClass="p-6">
                    <Stack spacing={3}>
                        <Button wide variant="outline" size="lg">
                            <User />
                            Continue as FreeUser
                        </Button>
                        <Typography variant="text" class="text-center">Not you? Switch account</Typography>

                        <Separator variant="subtle" />

                        <Box border={false} ghost={true} width="full" contentClass="p-0 pe-2 h-full max-h-52">
                            <Stack spacing={2}>
                                <Button variant="outline" wide class="justify-start">
                                    <Email size="sm" />
                                    Email
                                </Button>

                                <Button variant="outline" wide class="justify-start">
                                    <Discord size="sm" />
                                    Discord
                                </Button>

                                <Button variant="outline" wide class="justify-start">
                                    <Github size="sm" />
                                    Github
                                </Button>

                                <Button variant="outline" wide class="justify-start">
                                    <Google size="sm" />
                                    Google
                                </Button>

                                <Button variant="outline" wide class="justify-start">
                                    <Google size="sm" />
                                    Google
                                </Button>
                            </Stack>
                        </Box>

                        <!-- Remember Me -->
                        <Stack direction="row" alignment="center" justification="start" spacing={2}>
                            <div
                                class="w-6 h-6 bg-white/30 rounded flex items-center justify-center border border-slate-800/20"
                            >
                                <svg
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    stroke-width="3"
                                    class="w-4 h-4"
                                >
                                    <path d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <Typography class="text-slate-800 font-medium cursor-pointer">Remember me</Typography>
                        </Stack>
                    </Stack>
                </Box>

                <!-- Guest Button -->
                <Box
                    ghost={true}
                    border={false}
                    containerClass="w-full rounded-3xl backdrop-blur-lg background-gradient-to-r from-surface/50 to-green/30"
                    contentClass="p-6 justify-center"
                >
                    <Button variant="outline" size="lg">Guest</Button>
                </Box>
            </div>
        </div>
    {/snippet}
</Story>
