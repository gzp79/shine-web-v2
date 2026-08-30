<script module lang="ts">
    import { defineMeta } from '@storybook/addon-svelte-csf';
    import ChatGap from './ChatGap.svelte';

    const { Story } = defineMeta({
        component: ChatGap,
        title: 'Components/Chat/ChatGap'
    });
</script>

<Story name="Default" />
