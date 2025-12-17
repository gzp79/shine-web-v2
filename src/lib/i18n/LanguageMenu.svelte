<script module lang="ts">
    import lang from '@translations/lang.json';
    import { getLocaleContext, langList } from '@lib/i18n/i18n.svelte';
    import Dropdown, { type ExpandIconSide } from '@lib/ui/atoms/dropdown-menu';
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
    let currentFlag = $derived(flagIcons[languageFlags[locale.current]]);
</script>

<Dropdown.Sub>
    <Dropdown.SubTrigger {expandIcon}>
        {@const FlagIcon = currentFlag}
        <FlagIcon />
        {lang[locale.current as keyof typeof lang]}
    </Dropdown.SubTrigger>
    <Dropdown.SubContent>
        <Dropdown.RadioGroup bind:value={locale.current}>
            {#each langList as langOption (langOption)}
                {@const FlagIcon = flagIcons[languageFlags[langOption]]}
                <Dropdown.RadioItem value={langOption} closeOnSelect={false}>
                    <FlagIcon />
                    {lang[langOption as keyof typeof lang]}
                </Dropdown.RadioItem>
            {/each}
        </Dropdown.RadioGroup>
    </Dropdown.SubContent>
</Dropdown.Sub>
