/**
 * HTTPS UNIT TESTS FOR SOCKPRESS.
 */

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

import common from './common';

describe('Sockpress (HTTPS)', async function () {
    let __BASE_URL = 'https://localhost:3334';
    let server;

    before(function () {
        server = require('./scripts/https').default;
    });

    beforeEach(() => {
        server.start();
    });

    afterEach(function (done) {
        server.stop(done);
    });

    describe('Basic Features', common(__BASE_URL));
});