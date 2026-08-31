// Local web pages with local services

export const config = {
    environment: 'local',

    webUrl: 'https://local.scytta.com:4443',

    identityUrl: 'https://cloud.local.scytta.com:8443/identity',

    builderUrl: 'https://cloud.local.scytta.com:8444/builder',
    builderWSUrl: 'https://ws.local.scytta.com:8444/builder',

    gameUrl: 'https://game.local.scytta.com:8092',
    assetUrl: 'https://assets.local.scytta.com:8093',
    assetCacheDuration: 5 * 1000,

    turnstile: {
        siteKey: '0000000000000000000000000000000000'
    }
};
