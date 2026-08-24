import { config as baseConfig } from '@generated/config';

export * from './constants';

export type EnvironmentType = 'mock' | 'local' | 'dev' | 'prod';

export interface Config {
    environment: EnvironmentType;

    identityUrl: string;
    builderUrl: string;
    builderWSUrl: string;
    webUrl: string;
    assetUrl: string;
    gameUrl: string;

    turnstile: {
        siteKey: string;
    };
}

export const config: Config = {
    ...baseConfig,
    environment: baseConfig.environment as EnvironmentType
};
