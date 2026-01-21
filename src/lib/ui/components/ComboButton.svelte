<script module lang="ts">
    import type { Snippet } from 'svelte';
    import Dropdown from '@lib/ui/atoms/dropdown-menu';
    import DropdownIcon from '@lib/ui/atoms/icons/common/Dropdown.svelte';
    import Button, { type ButtonAction } from '@lib/ui/atoms/input/Button.svelte';
    import InputGroup, { type InputGroupProps, marginClass } from '@lib/ui/atoms/input/InputGroup.svelte';
    import { asChildSnippet, cn, range } from '@lib/ui/utils';
    import * as kbd from '@lib/ui/utils/kbd';

    export type Option = ButtonAction & {
        caption: string | Snippet;
    };

    export type ComboButtonProps = Omit<InputGroupProps, 'data-slot' | 'children'> & {
        options: Option[];
        current?: number;
        disabled?: boolean;
    };
</script>

<script lang="ts">
    let { options, current = $bindable(0), disabled, ...restProps }: ComboButtonProps = $props();

    let open = $state(false);
    let action = $derived.by<ButtonAction>(() => {
        const { caption, ...buttonAction } = options[current];
        return buttonAction;
    });

    // Classes for buttons to remove outer rounding when ComboButton is inside InputGroup
    const actionBtnCls = $derived(cn(`[*:not(:first-child)>&]:rounded-s-none [&:not(:first-child)>&]:${marginClass}`));
    const menuBtnCls = $derived(
        cn(
            'p-1', //
            '[*:not(:last-child)>&]:rounded-e-none'
        )
    );

    const handleActionKey = (event: KeyboardEvent) => {
        if (event.key === kbd.ARROW_DOWN && !open) {
            event.preventDefault();
            open = true;
        }
    };
    const handleActionSelect = (idx: number) => {
        current = idx;
    };
</script>

{#snippet item(idx: number)}
    {@const option = options[idx]}
    {#if typeof option.caption === 'string'}
        {option.caption}
    {:else}
        {@render option?.caption()}
    {/if}
{/snippet}

{#snippet dropdownBtn()}
    <DropdownIcon />
{/snippet}

<InputGroup data-slot="combo-button" {...restProps}>
    <Button class={actionBtnCls} onkeydown={handleActionKey} {...action} {disabled}>{@render item(current)}</Button>
    <Dropdown.Menu trigger={asChildSnippet(dropdownBtn)} triggerStyle={{ disabled, class: menuBtnCls }} bind:open>
        {#each range(0, options.length) as idx (idx)}
            <Dropdown.Item closeOnSelect onSelect={() => handleActionSelect(idx)}>
                {@render item(idx)}
            </Dropdown.Item>
        {/each}
    </Dropdown.Menu>
</InputGroup>
