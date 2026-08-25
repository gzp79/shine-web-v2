<script module lang="ts">
    import type { ClassValue } from 'clsx';
    import type { Snippet } from 'svelte';
    import type { ActionColor } from '@lib/ui/atoms';
    import Typography from '@lib/ui/atoms/Typography.svelte';
    import { cn } from '@lib/ui/utils';

    export type ChatBubbleProps = {
        /** The message body. */
        text: string;
        /** Align to the end (own messages) or the start (others'). */
        own?: boolean;
        /** Author label rendered above the text; a snippet lets the caller resolve it lazily. */
        author?: string | Snippet;
        /** Bubble color. Defaults to `primary` for own messages and `container` for others. */
        color?: ActionColor | 'container';
        /** Optional trailing content (e.g. a timestamp), rendered as a snippet. */
        meta?: Snippet;
        class?: ClassValue;
    };
</script>

<script lang="ts">
    let { text, own = false, author, color, meta, class: className }: ChatBubbleProps = $props();

    const resolvedColor = $derived(color ?? (own ? 'secondary' : 'primary'));

    const bubbleCls = $derived(
        cn(
            'inline-flex flex-col gap-0.5 max-w-[80%] w-fit rounded-2xl border-2 px-3 py-2 break-words',
            `bg-${resolvedColor}`,
            `text-on-${resolvedColor}`,
            `border-on-${resolvedColor}`,
            // Flatten the corner nearest the owner for a "tail" effect.
            own ? 'rounded-br-sm' : 'rounded-bl-sm',
            className
        )
    );
</script>

<div class={cn('flex w-full', own ? 'justify-end' : 'justify-start')} data-slot="chat-bubble">
    <div class={bubbleCls}>
        {#if author}
            <Typography variant="footnote" weight="emphasis" class={cn(`text-on-${resolvedColor}`, 'opacity-70')}>
                {#if typeof author === 'function'}
                    {@render author()}
                {:else}
                    {author}
                {/if}
            </Typography>
        {/if}
        <Typography variant="text" class="whitespace-pre-wrap text-start">{text}</Typography>
        {#if meta}
            <div class={cn(`text-on-${resolvedColor}`, 'self-end text-xs opacity-60')}>
                {@render meta()}
            </div>
        {/if}
    </div>
</div>
