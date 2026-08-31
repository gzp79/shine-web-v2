// Production configuration (client side data, no secrets !!!)

export const config = {
    environment: 'prod',

    webUrl: 'https://www.scytta.com',

    identityUrl: 'https://cloud.scytta.com/identity',

    builderUrl: 'https://cloud.scytta.com/builder',
    builderWSUrl: 'https://ws.scytta.com/builder',

    gameUrl: 'https://game.scytta.com',
    assetUrl: 'https://assets.scytta.com',
    assetCacheDuration: 60 * 60 * 1000,

    turnstile: {
        siteKey: '0x4AAAAAAAQ-4vBocJkM5FBI'
    }
};
