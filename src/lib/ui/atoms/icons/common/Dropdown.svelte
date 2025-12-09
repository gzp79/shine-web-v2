<script lang="ts">
    import IconBase, { type IconProps, TRANSPARENCY } from '@lib/ui/atoms/icons/IconBase.svelte';

    let props: IconProps = $props();
</script>

<IconBase viewBox={[-200, 0, 848, 512]} {...props}>
    <path
        fill-opacity={TRANSPARENCY}
        stroke-width="4%"
        d="M201.4 374.6c12.5 12.5 32.8 12.5 45.3 0l160-160c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L224 306.7 86.6 169.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l160 160z"
    />
</IconBase>
