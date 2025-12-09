import type { GlyphSet } from '@lib/ui/atoms/glyphs/GlyphBase.svelte';
import FlagGB from '@lib/ui/atoms/glyphs/flags/gb.svelte';
import FlagHU from '@lib/ui/atoms/glyphs/flags/hu.svelte';

export default {
    HU: FlagHU,
    GB: FlagGB
} satisfies GlyphSet;
