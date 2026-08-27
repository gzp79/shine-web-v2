<script module lang="ts">
    import { defineMeta } from '@storybook/addon-svelte-csf';
    import Stack from '@lib/ui/atoms/layouts/Stack.svelte';
    import ChatBubble from './ChatBubble.svelte';

    const { Story } = defineMeta({
        component: ChatBubble,
        title: 'Components/Chat/ChatBubble',
        args: {
            text: 'Hello there!',
            align: 'start'
        },
        argTypes: {
            align: { control: { type: 'inline-radio' }, options: ['start', 'end', 'center'] }
        }
    });
</script>

<Story name="Other" args={{ text: 'A message from someone else', align: 'start', author: 'user-8f3c1a2b' }} />

<Story name="Own" args={{ text: 'A message I sent', align: 'end', author: 'You' }} />

<Story name="Note" args={{ text: 'This is a note', align: 'center' }} />
