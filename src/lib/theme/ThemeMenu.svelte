<script module lang="ts">
    import { getLocaleContext } from '@lib/i18n';
    import { getThemeContext, themeList } from '@lib/theme/_theme.svelte';
    import {
        DropdownRadioGroup,
        DropdownRadioItem,
        DropdownSubMenu,
        type ExpandIconSide
    } from '@lib/ui/atoms/dropdown-menu';
    import DarkIcon from '@lib/ui/atoms/icons/common/Dark.svelte';
    import DarkLightIcon from '@lib/ui/atoms/icons/common/DarkLight.svelte';
    import LightIcon from '@lib/ui/atoms/icons/common/Light.svelte';

    export type ThemeMenuProps = {
        expandIcon?: ExpandIconSide;
    };
</script>

<script lang="ts">
    let { expandIcon = 'right' }: ThemeMenuProps = $props();

    const theme = getThemeContext();
    const locale = getLocaleContext();

    const themeIcons = {
        dark: DarkIcon,
        light: LightIcon,
        system: DarkLightIcon
    };

    const currentTheme = $derived(themeIcons[theme.current]);
</script>

{#snippet subTrigger()}
    {@const Icon = currentTheme}
    <Icon />
    {locale.t('common.themeName')}
{/snippet}

<DropdownSubMenu {expandIcon} trigger={subTrigger}>
    <DropdownRadioGroup bind:value={theme.current}>
        {#each themeList as themeOption (themeOption)}
            {@const Icon = themeIcons[themeOption]}
            <DropdownRadioItem value={themeOption} closeOnSelect={false}>
                <Icon />
                {locale.t(`theme.${themeOption}`)}
            </DropdownRadioItem>
        {/each}
    </DropdownRadioGroup>
</DropdownSubMenu>
