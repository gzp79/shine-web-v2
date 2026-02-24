export const hintList = ['login-expired', 'email-confirm', 'email-change'] as const;
export type Hint = (typeof hintList)[number];

export const errorList = [
    'auth-login-required',
    'auth-input-error',
    'auth-error',
    'auth-internal-error',
    'auth-token-expired',
    'auth-session-expired',
    'auth-register-email-conflict',
    'auth-register-external-id-conflict',
    'auth-not-confirmed',
    'auth-email-login',
    'external-missing-cookie',
    'external-invalid-nonce',
    'external-invalid-csrf',
    'external-exchange-failed',
    'external-info-failed',
    'external-discovery-failed',
    'server-down'
] as const;
export type ErrorType = (typeof errorList)[number];

export type HintInfo = {
    longHint?: string;
    shortHint?: string;
    allowGuest: boolean;
};
