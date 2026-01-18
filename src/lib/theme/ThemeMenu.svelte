<script module lang="ts">
    import { t } from '@lib/i18n/i18n.svelte';
    import { getThemeContext, themeList } from '@lib/theme/theme.svelte';
    import Dropdown, { type ExpandIconSide } from '@lib/ui/atoms/dropdown-menu';
    import DarkIcon from '@lib/ui/atoms/icons/common/Dark.svelte';
    import DarkLightIcon from '@lib/ui/atoms/icons/common/DarkLight.svelte';
    import LightIcon from '@lib/ui/atoms/icons/common/Light.svelte';

    export type ThemeMenuProps = {
        expandIcon?: ExpandIconSide;
    };
</script>

<script lang="ts">
    let { expandIcon = 'right' }: ThemeMenuProps = $props();

    let theme = getThemeContext();

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
    {$t('common.theme.name')}
{/snippet}

<Dropdown.Sub {expandIcon} trigger={subTrigger}>
    <Dropdown.RadioGroup bind:value={theme.current}>
        {#each themeList as themeOption (themeOption)}
            {@const Icon = themeIcons[themeOption]}
            <Dropdown.RadioItem value={themeOption} closeOnSelect={false}>
                <Icon />
                {$t(`common.theme.${themeOption}`)}
            </Dropdown.RadioItem>
        {/each}
    </Dropdown.RadioGroup>
</Dropdown.Sub>
