/* cspell: disable */
import { dev } from '$app/environment';
import I18N, { type Config, type Modifier, type Parser } from 'sveltekit-i18n';
import { logI18n } from '@lib/loggers';
import lang from '../../translations/lang.json';

/* cspell: enable */

export const langList = Object.keys(lang);
export const defaultLocale = 'en';

function addTranslation(key: string, routes: RegExp[]) {
    return langList.map((locale) => {
        return {
            locale: locale,
            key: key,
            routes,
            loader: async () => {
                logI18n(`Loading translation: ${locale}/${key}`);
                return (await import(`../../translations/${locale}/${key}.json`)).default;
            }
        };
    });
}

type Params = Record<string, unknown>;

const config: Config<Partial<Params>> = {
    log: {
        level: dev ? 'warn' : 'error'
    },
    translations: langList.reduce((r, v) => ({ ...r, ...{ [v]: { lang } } }), {}),
    loaders: [
        ...addTranslation('common', [/.*/])
        //...createLoader('validation', [/.*/]),
        //...createLoader('account', [/.*/]),
        //...createLoader('error', [/.*/]),
        //...createLoader('link', [/link\/.*/]),
        //...createLoader('mobile', [/public\/mobile/]),
        //...createLoader('login', [/login|public\/email-login/])
    ]
};

class I18NEx<Params extends Parser.Params<P, M>, P = Parser.PayloadDefault, M = Modifier.DefaultProps> extends I18N<
    Params,
    P,
    M
> {
    constructor(config?: Config<P, M>) {
        super(config);
    }
}

export const i18n = new I18NEx(config);
