<script module lang="ts">
    import { getLocaleContext, localeList } from '@lib/i18n';
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
    const currentFlag = $derived(flagIcons[languageFlags[locale.current]!]);
</script>

{#snippet subTrigger()}
    {@const FlagIcon = currentFlag}
    <FlagIcon />
    {locale.t(`language.${locale.current}`)}
{/snippet}

<DropdownSubMenu {expandIcon} trigger={subTrigger}>
    <DropdownRadioGroup bind:value={locale.current}>
        {#each localeList as langOption (langOption)}
            {@const FlagIcon = flagIcons[languageFlags[langOption]!]}
            <DropdownRadioItem value={langOption} closeOnSelect={false}>
                <FlagIcon />
                {locale.t(`language.${langOption}`)}
            </DropdownRadioItem>
        {/each}
    </DropdownRadioGroup>
</DropdownSubMenu>
