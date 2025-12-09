import type { IconSet } from '@lib/ui/atoms/icons/IconBase.svelte';
import Check from '@lib/ui/atoms/icons/common/Check.svelte';
import Cross from '@lib/ui/atoms/icons/common/Cross.svelte';
import Dark from '@lib/ui/atoms/icons/common/Dark.svelte';
import DarkAndLight from '@lib/ui/atoms/icons/common/DarkLight.svelte';
import DropDown from '@lib/ui/atoms/icons/common/Dropdown.svelte';
import Fatal from '@lib/ui/atoms/icons/common/Fatal.svelte';
import Hamburger from '@lib/ui/atoms/icons/common/Hamburger.svelte';
import Info from '@lib/ui/atoms/icons/common/Info.svelte';
import Light from '@lib/ui/atoms/icons/common/Light.svelte';
import Link from '@lib/ui/atoms/icons/common/Link.svelte';
import Settings from '@lib/ui/atoms/icons/common/Settings.svelte';
import Warning from '@lib/ui/atoms/icons/common/Warning.svelte';

export default {
    Check: Check,
    Cross: Cross,
    Hamburger: Hamburger,
    Settings: Settings,
    Info: Info,
    Warning: Warning,
    Light: Light,
    Dark: Dark,
    DarkAndLight: DarkAndLight,
    Fatal: Fatal,
    DropDown: DropDown,
    Link: Link
} satisfies IconSet;
