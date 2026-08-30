<script module lang="ts">
    import type { ClassValue } from 'clsx';
    import type { Snippet } from 'svelte';
    import type { ActionColor } from '@lib/ui/atoms';
    import Typography from '@lib/ui/atoms/Typography.svelte';
    import { cn } from '@lib/ui/utils';

    /** Where a bubble sits: the author's own messages `end`, others' `start`, system notes `center`. */
    export type ChatBubbleAlign = 'start' | 'end' | 'center';

    export type ChatBubbleProps = {
        /** The message body, either plain text or a snippet for rich content. */
        content: string | Snippet;
        /** Placement and style. */
        align?: ChatBubbleAlign;
        /** Author label rendered above the text. */
        author?: string | Snippet;
        /** Bubble color. */
        color?: ActionColor | 'container';
        /** Optional trailing content (e.g. a timestamp), rendered as a snippet. */
        meta?: Snippet;
        class?: ClassValue;
    };
</script>

<script lang="ts">
    let { content, align = 'start', author, color, meta, class: className }: ChatBubbleProps = $props();

    const resolvedColor = $derived(color ?? (align === 'end' ? 'secondary' : 'primary'));

    const bubbleCls = $derived(
        cn(
            'inline-flex flex-col gap-0.5 max-w-[80%] w-fit rounded-2xl border-2 px-3 py-2 break-words',
            `bg-${resolvedColor}`,
            `text-on-${resolvedColor}`,
            `border-on-${resolvedColor}`,
            // Flatten the corner nearest the owner for a "tail" effect.
            align === 'end' ? 'rounded-br-sm' : 'rounded-bl-sm',
            className
        )
    );
</script>

{#if align === 'center'}
    <div class="flex w-full justify-center" data-slot="chat-note">
        {#if typeof content === 'function'}
            {@render content()}
        {:else}
            <Typography variant="footnote" class={cn('text-secondary select-none', className)}>{content}</Typography>
        {/if}
    </div>
{:else}
    <div class={cn('flex w-full', align === 'end' ? 'justify-end' : 'justify-start')} data-slot="chat-bubble">
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
            {#if typeof content === 'function'}
                {@render content()}
            {:else}
                <Typography variant="text" class="whitespace-pre-wrap text-start">{content}</Typography>
            {/if}
            {#if meta}
                <div class={cn(`text-on-${resolvedColor}`, 'self-end text-xs opacity-60')}>
                    {@render meta()}
                </div>
            {/if}
        </div>
    </div>
{/if}
