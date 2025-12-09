import debug from 'debug';

// to enable logs in the browser:
// - set level to All (verbose)
// - window.localStorage.setItem('debug', 'designer:design');

export const logAPI = debug('log:api');
export const logResource = {
    log: debug('log:resources'),
    info: debug('info:resources'),
    warn: debug('warn:resources')
};
export const logUser = debug('log:user');
export const logGame = {
    log: debug('log:game'),
    warn: debug('warn:game')
};

export const logI18n = debug('log:i18n');

export const logDesigner = debug('log:design');
