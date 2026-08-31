import { config as baseConfig } from '@generated/config';

export * from './constants';

export type EnvironmentType = 'mock' | 'local' | 'dev' | 'prod';

export interface Config {
    environment: EnvironmentType;

    webUrl: string;

    identityUrl: string;

    builderUrl: string;
    builderWSUrl: string;

    gameUrl: string;
    assetUrl: string;
    assetCacheDuration: number;

    turnstile: {
        siteKey: string;
    };
}

export const config: Config = {
    ...baseConfig,
    environment: baseConfig.environment as EnvironmentType
};
