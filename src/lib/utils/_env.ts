/// Build-time environment flags.
///
/// `vite build` replaces `import.meta.env.VITE_*` textually, so in both the client and the server
/// bundle these fold to a literal and guarded code is tree-shaken away.

export const IS_MOCK = import.meta.env.VITE_MOCK === true || import.meta.env.VITE_MOCK === 'true';

export const IS_PROD = import.meta.env.VITE_PROD === true || import.meta.env.VITE_PROD === 'true';

export const SKIP_CAPTCHA = import.meta.env.VITE_SKIP_CAPTCHA === true || import.meta.env.VITE_SKIP_CAPTCHA === 'true';

export const CHAT_CMD_PING =
    import.meta.env.VITE_CHAT_CMD_PING === true || import.meta.env.VITE_CHAT_CMD_PING === 'true';

export const CHAT_CMD_BURST =
    import.meta.env.VITE_CHAT_CMD_BURST === true || import.meta.env.VITE_CHAT_CMD_BURST === 'true';

export const CHAT_CMD_STORM =
    import.meta.env.VITE_CHAT_CMD_STORM === true || import.meta.env.VITE_CHAT_CMD_STORM === 'true';
