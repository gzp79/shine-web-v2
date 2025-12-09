// Local web pages with mocked services for vitest

export const config = {
    environment: 'mock',

    webUrl: 'https://local.scytta.com:4443',
    assetUrl: 'https://local.scytta.com:4443',
    gameUrl: 'https://game.scytta.com',

    identityUrl: 'https://cloud.scytta.com',
    builderUrl: 'https://cloud.scytta.com',
    builderWSUrl: 'https://ws.scytta.com',

    turnstile: {
        siteKey: '1x00000000000000000000BB'
    },

    mocks: ['user.noUserInfo', 'user.defaultLoginProvider']
};
