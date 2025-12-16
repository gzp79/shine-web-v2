<script module lang="ts">
    import { t } from '@lib/i18n/i18n.svelte';
    import { themeList, themeStore } from '@lib/theme/theme.svelte';
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

    let theme = themeStore();

    const themeIcons = {
        dark: DarkIcon,
        light: LightIcon,
        system: DarkLightIcon
    };

    let currentTheme = $derived(themeIcons[theme.current]);
</script>

<Dropdown.Sub>
    <Dropdown.SubTrigger {expandIcon}>
        {@const Icon = currentTheme}
        <Icon />
        {$t('common.theme')}</Dropdown.SubTrigger
    >
    <Dropdown.SubContent>
        <Dropdown.RadioGroup bind:value={theme.current}>
            {#each themeList as themeOption (themeOption)}
                {@const Icon = themeIcons[themeOption]}
                <Dropdown.RadioItem value={themeOption} closeOnSelect={false}>
                    <Icon />
                    {$t(`common.theme.${themeOption}`)}
                </Dropdown.RadioItem>
            {/each}
        </Dropdown.RadioGroup>
    </Dropdown.SubContent>
</Dropdown.Sub>
