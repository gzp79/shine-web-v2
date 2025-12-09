import { config as baseConfig } from '@generated/config';

export const GAME_BASE_NAME = 'shine-client';

export type EnvironmentType = 'mock' | 'local' | 'dev' | 'prod';

export interface Config {
    environment: EnvironmentType;

    identityUrl: string;
    builderUrl: string;
    builderWSUrl: string;
    webUrl: string;
    assetUrl: string;
    gameUrl: string;

    // when null, mock is disabled
    mocks?: string[];

    turnstile: {
        disable?: boolean;
        siteKey: string;
    };
}

export const config: Config = {
    ...baseConfig,
    environment: baseConfig.environment as EnvironmentType
};
