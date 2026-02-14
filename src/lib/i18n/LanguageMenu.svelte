<script module lang="ts">
    import lang from '@translations/lang.json';
    import { getLocaleContext, langList } from '@lib/i18n/i18n.svelte';
    import {
        DropdownRadioGroup,
        DropdownRadioItem,
        DropdownSubMenu,
        type ExpandIconSide
    } from '@lib/ui/atoms/dropdown-menu';
    import flagIcons from '@lib/ui/atoms/glyphs/flags/all';

    export type LanguageMenuProps = {
        expandIcon?: ExpandIconSide;
    };
</script>

<script lang="ts">
    let { expandIcon = 'right' }: LanguageMenuProps = $props();
    let locale = getLocaleContext();

    const languageFlags: Record<string, keyof typeof flagIcons> = {
        en: 'GB',
        hu: 'HU'
    };
    const currentFlag = $derived(flagIcons[languageFlags[locale.current]]);
</script>

{#snippet subTrigger()}
    {@const FlagIcon = currentFlag}
    <FlagIcon />
    {lang[locale.current as keyof typeof lang]}
{/snippet}

<DropdownSubMenu {expandIcon} trigger={subTrigger}>
    <DropdownRadioGroup bind:value={locale.current}>
        {#each langList as langOption (langOption)}
            {@const FlagIcon = flagIcons[languageFlags[langOption]]}
            <DropdownRadioItem value={langOption} closeOnSelect={false}>
                <FlagIcon />
                {lang[langOption as keyof typeof lang]}
            </DropdownRadioItem>
        {/each}
    </DropdownRadioGroup>
</DropdownSubMenu>
