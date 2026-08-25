<script lang="ts">
    import IconBase, { type IconProps, TRANSPARENCY } from '@lib/ui/atoms/icons/IconBase.svelte';

    let props: IconProps = $props();
</script>

<IconBase viewBox={[0, 0, 24, 24]} {...props}>
    <circle cx="12" cy="12" r="8" fill-opacity={TRANSPARENCY} stroke-width="8%" />
</IconBase>
