// Local web pages with mocked services for vitest

export const config = {
    environment: 'mock',

    webUrl: 'https://local.scytta.com:4443',

    identityUrl: 'https://cloud.scytta.com/identity',

    builderUrl: 'https://cloud.scytta.com/builder',
    builderWSUrl: 'https://ws.scytta.com/builder',

    gameUrl: 'https://game.scytta.com',
    assetUrl: 'https://assets.scytta.com',
    assetCacheDuration: 0,

    turnstile: {
        siteKey: '1x00000000000000000000BB'
    }
};
