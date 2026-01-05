import log from 'loglevel';

// Usage:
// - In Node: set the env var `LOG_LEVEL` before starting the process
//     PowerShell:   $env:LOG_LEVEL = 'info'; pnpm run dev
//     POSIX shells: LOG_LEVEL='info' pnpm run dev
// - In the browser: set `localStorage.LOG_LEVEL` to a level or config
//     window.localStorage.setItem('LOG_LEVEL', 'info')
// - Per-tag levels: use comma-separated config
//     - `info,api=debug,resources=warn` -> global info, api at debug, resources at warn
// - Available levels: trace, debug, info, warn, error, silent
// - Programmatic helpers `setLogConfig(pattern)` exported below

type LevelDesc = log.LogLevelDesc;

const STORAGE_KEY = 'LOG_LEVEL';

type LogConfig = { global?: LevelDesc; perTag: Record<string, LevelDesc> };

// Parse a config string like 'info,api=debug,resources=warn'
function parseConfig(conf: string | null | undefined): LogConfig {
    const result: LogConfig = { perTag: {} };

    if (!conf) {
        return result;
    }

    const parts = conf
        .split(',')
        .map((p) => p.trim())
        .filter(Boolean);
    for (const p of parts) {
        const [k, v] = p.split('=').map((s) => s.trim());
        if (!v) {
            // single token like 'info' sets global
            result.global = k as LevelDesc;
        } else {
            // 'api=debug' per-tag
            result.perTag[k] = v as LevelDesc;
        }
    }
    return result;
}

function applyConfigToLoglevel(confStr: string | null | undefined) {
    const cfg = parseConfig(confStr);
    //console.log('Applying log config', cfg);

    if (cfg.global) {
        log.setLevel(cfg.global);
    }
    for (const tag of Object.keys(cfg.perTag)) {
        const lvl = cfg.perTag[tag];
        const logger = log.getLogger(tag);
        logger.setLevel(lvl);
    }
}

function readConfig(): string | null {
    if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(STORAGE_KEY);
    }
    if (typeof process !== 'undefined' && process.env.LOG_LEVEL) {
        return process.env.LOG_LEVEL;
    }
    return null;
}

if (typeof window !== 'undefined') {
    window.addEventListener('storage', (e) => {
        if (e.key === STORAGE_KEY) {
            applyConfigToLoglevel(e.newValue);
        }
    });
}

function createLogger(namespace: string) {
    const logger = log.getLogger(namespace);
    logger.setLevel(log.getLevel());
    return {
        trace: (...args: unknown[]) => logger.trace(`[${namespace}]`, ...args),
        log: (...args: unknown[]) => logger.debug(`[${namespace}]`, ...args),
        info: (...args: unknown[]) => logger.info(`[${namespace}]`, ...args),
        warn: (...args: unknown[]) => logger.warn(`[${namespace}]`, ...args),
        error: (...args: unknown[]) => logger.error(`[${namespace}]`, ...args)
    };
}

export const logAPI = createLogger('api');
export const logUser = createLogger('user');
export const logI18n = createLogger('i18n');

// Apply initial config on module load
applyConfigToLoglevel(readConfig());
