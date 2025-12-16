<script lang="ts">
    import { t } from '@lib/i18n/i18n.svelte';
    import { themeList, themeStore } from '@lib/theme/theme.svelte';
    import Dropdown from '@lib/ui/atoms/dropdown-menu';
    import DarkIcon from '@lib/ui/atoms/icons/common/Dark.svelte';
    import DarkLightIcon from '@lib/ui/atoms/icons/common/DarkLight.svelte';
    import LightIcon from '@lib/ui/atoms/icons/common/Light.svelte';

    let theme = themeStore();

    const themeIcons = {
        dark: DarkIcon,
        light: LightIcon,
        system: DarkLightIcon
    };
</script>

<Dropdown.Sub>
    <Dropdown.SubTrigger>{$t('common.theme')}</Dropdown.SubTrigger>
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
