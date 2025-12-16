<script lang="ts">
    import MessageContent from '@lib/ui/app/MessageContent.svelte';
    import Typography from '@lib/ui/atoms/Typography.svelte';
    import Stack from '@lib/ui/atoms/layouts/Stack.svelte';
</script>

<MessageContent>
    <Stack>
        <Typography variant="h1">Welcome to SvelteKit</Typography>
        <p>Visit <a href="https://svelte.dev/docs/kit">svelte.dev/docs/kit</a> to read the documentation</p>
    </Stack>
</MessageContent>
