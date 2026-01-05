// Production configuration (client side data, no secrets !!!)

export const config = {
    environment: 'prod',

    webUrl: 'https://www.scytta.com',
    assetUrl: 'https://assets.scytta.com',
    gameUrl: 'https://game.scytta.com',

    identityUrl: 'https://cloud.scytta.com/identity',
    builderUrl: 'https://cloud.scytta.com/builder',
    builderWSUrl: 'https://ws.scytta.com/builder',

    turnstile: {
        siteKey: '0x4AAAAAAAQ-4vBocJkM5FBI'
    }
};
