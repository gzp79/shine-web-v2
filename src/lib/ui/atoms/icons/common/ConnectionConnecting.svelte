<script lang="ts">
    import IconBase, { type IconProps } from '@lib/ui/atoms/icons/IconBase.svelte';

    let props: IconProps = $props();
</script>

<IconBase viewBox={[0, 0, 24, 24]} {...props}>
    <circle cx="12" cy="12" r="8" fill="none" stroke-width="12%" stroke-linecap="round" stroke-dasharray="30 12" />
</IconBase>
