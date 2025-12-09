import type { GlyphSet } from '@lib/ui/atoms/glyphs/GlyphBase.svelte';
import Android from '@lib/ui/atoms/glyphs/brands/Android.svelte';
import Chrome from '@lib/ui/atoms/glyphs/brands/Chrome.svelte';
import Discord from '@lib/ui/atoms/glyphs/brands/Discord.svelte';
import Edge from '@lib/ui/atoms/glyphs/brands/Edge.svelte';
import Email from '@lib/ui/atoms/glyphs/brands/Email.svelte';
import Firefox from '@lib/ui/atoms/glyphs/brands/Firefox.svelte';
import Github from '@lib/ui/atoms/glyphs/brands/Github.svelte';
import Gitlab from '@lib/ui/atoms/glyphs/brands/Gitlab.svelte';
import Google from '@lib/ui/atoms/glyphs/brands/Google.svelte';
import IPhone from '@lib/ui/atoms/glyphs/brands/Iphone.svelte';
import Mac from '@lib/ui/atoms/glyphs/brands/Mac.svelte';
import Mobile from '@lib/ui/atoms/glyphs/brands/Mobile.svelte';
import Opera from '@lib/ui/atoms/glyphs/brands/Opera.svelte';
import Safari from '@lib/ui/atoms/glyphs/brands/Safari.svelte';
import Twitter from '@lib/ui/atoms/glyphs/brands/Twitter.svelte';
import User from '@lib/ui/atoms/glyphs/brands/User.svelte';

export default {
    Chrome: Chrome,
    Edge: Edge,
    Opera: Opera,
    Safari: Safari,
    Firefox: Firefox,
    Mobile: Mobile,
    Android: Android,
    IPhone: IPhone,
    Mac: Mac,
    Discord: Discord,
    Github: Github,
    Google: Google,
    Twitter: Twitter,
    Gitlab: Gitlab,

    Email: Email,
    User: User
} satisfies GlyphSet;
