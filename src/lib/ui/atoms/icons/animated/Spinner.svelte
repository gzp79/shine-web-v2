<script lang="ts">
    import IconBase, { type IconProps } from '@lib/ui/atoms/icons/IconBase.svelte';

    let props: IconProps = $props();
</script>

<IconBase viewBox={[0, 0, 24, 24]} {...props}>
    <circle cx="12" cy="12" r="9.5" fill="none" stroke-width="3" stroke-linecap="round">
        <animate
            attributeName="stroke-dasharray"
            values="0 150; 42 150; 42 150"
            keyTimes="0; 0.475; 1"
            dur="1.5s"
            repeatCount="indefinite"
        />
        <animate
            attributeName="stroke-dashoffset"
            values="0; -16; -59"
            keyTimes="0; 0.475; 1"
            dur="1.5s"
            repeatCount="indefinite"
        />
        <animateTransform
            attributeName="transform"
            type="rotate"
            from="0 12 12"
            to="360 12 12"
            dur="3s"
            repeatCount="indefinite"
        />
    </circle>
</IconBase>
