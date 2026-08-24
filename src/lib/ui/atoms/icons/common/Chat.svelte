<script lang="ts">
    import IconBase, { type IconProps, TRANSPARENCY } from '@lib/ui/atoms/icons/IconBase.svelte';

    let props: IconProps = $props();
</script>

<IconBase viewBox={[0, 0, 24, 24]} {...props}>
    <path
        fill-opacity={TRANSPARENCY}
        stroke-width="4%"
        d="M12 3C6.477 3 2 6.798 2 11.5c0 2.29 1.06 4.365 2.786 5.9-.12 1.24-.53 2.51-1.286 3.6 1.62-.24 3.03-.79 4.16-1.57C9.02 20.79 10.47 21 12 21c5.523 0 10-3.798 10-9.5S17.523 3 12 3z"
    />
</IconBase>
