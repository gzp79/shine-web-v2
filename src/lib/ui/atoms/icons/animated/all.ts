import type { IconSet } from '@lib/ui/atoms/icons/IconBase.svelte';
import Ball from '@lib/ui/atoms/icons/animated/Ball.svelte';
import Dots from '@lib/ui/atoms/icons/animated/Dots.svelte';
import Infinite from '@lib/ui/atoms/icons/animated/Infinite.svelte';
import Ring from '@lib/ui/atoms/icons/animated/Ring.svelte';
import Spinner from '@lib/ui/atoms/icons/animated/Spinner.svelte';

const all = {
    dots: Dots,
    spinner: Spinner,
    ring: Ring,
    ball: Ball,
    infinite: Infinite
} satisfies IconSet;

export type AnimatedIcon = keyof typeof all;
export default all;
