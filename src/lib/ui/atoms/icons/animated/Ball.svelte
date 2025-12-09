<script lang="ts">
    import IconBase, { type IconProps } from '@lib/ui/atoms/icons/IconBase.svelte';

    let props: IconProps = $props();
    const dur = '0.8s';
</script>

<IconBase viewBox={[0, 0, 24, 24]} {...props}>
    <ellipse cx="12" cy="5" rx="4" ry="4">
        <animate
            attributeName="cy"
            values="5;20;20.5;20;5"
            keyTimes="0;0.46875;0.5;0.53125;1"
            {dur}
            repeatCount="indefinite"
        />
        <animate
            attributeName="rx"
            values="4;4;4.8;4;4"
            keyTimes="0;0.46875;0.5;0.53125;1"
            {dur}
            repeatCount="indefinite"
        />
        <animate
            attributeName="ry"
            values="4;4;3;4;4"
            keyTimes="0;0.46875;0.5;0.53125;1"
            {dur}
            repeatCount="indefinite"
        />
    </ellipse>
</IconBase>
