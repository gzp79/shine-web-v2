<script lang="ts">
    import IconBase, { type IconProps } from '@lib/ui/atoms/icons/IconBase.svelte';

    let props: IconProps = $props();
</script>

<IconBase viewBox={[0, 0, 24, 24]} {...props}>
    <circle cx="4" cy="12" r="3">
        <animateTransform
            attributeName="transform"
            type="translate"
            values="0,0; 0,-6; 0,0"
            keyTimes="0; 0.2857; 1"
            dur="1.05s"
            repeatCount="indefinite"
        />
    </circle>
    <circle cx="12" cy="12" r="3">
        <animateTransform
            attributeName="transform"
            type="translate"
            values="0,0; 0,-6; 0,0"
            keyTimes="0; 0.2857; 1"
            dur="1.05s"
            begin="0.1s"
            repeatCount="indefinite"
        />
    </circle>
    <circle cx="20" cy="12" r="3">
        <animateTransform
            attributeName="transform"
            type="translate"
            values="0,0; 0,-6; 0,0"
            keyTimes="0; 0.2857; 1"
            dur="1.05s"
            begin="0.2s"
            repeatCount="indefinite"
        />
    </circle>
</IconBase>
