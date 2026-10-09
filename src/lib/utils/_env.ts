/// Build-time environment flags.
///
/// `vite build` replaces `import.meta.env.VITE_*` textually, so in both the client and the server
/// bundle these fold to a literal and guarded code is tree-shaken away.

export const IS_MOCK = import.meta.env.VITE_MOCK === true || import.meta.env.VITE_MOCK === 'true';

export const IS_PROD = import.meta.env.VITE_PROD === true || import.meta.env.VITE_PROD === 'true';
