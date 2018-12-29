import assert from 'assert';
import Request from 'request';
import socketClient from 'socket.io-client';

/**
 * Called for HTTP and HTTS tests
 */
export default function(__BASE_URL) {
    return (__BASE_URL_) => {
        const request = Request.defaults({});

        it('should start the server', function (done) {
            done();
        });

        it('should be able to get a page', function (done) {
            request(__BASE_URL + '/foo', function (err, res, body) {
                assert.strictEqual(null, err);
                assert.equal('bar', body);
                done();
            });
        });

        it('should be able to get socket.io client', function (done) {
            request(__BASE_URL + '/socket.io/socket.io.js', function (err, res, body) {
                assert.strictEqual(null, err);
                assert.equal(200, res.statusCode);
                done();
            });
        });

        it('should be able to connect to socket.io and emit/receive events', function (done) {
            var _client = socketClient(__BASE_URL, {
                'force new connection': true,
                rejectUnauthorized: false,
            });
            _client.on('welcome', function (m) {
                assert.equal('welcome', m);
                _client.disconnect();
                done();
            });
            _client.on('error', function (e) {
                throw Error(e);
            });
            _client.on('connect_error', function (e) {
                throw Error(e);
            });
            _client.on('connect_timeout', function () {
                throw Error('Timeout error');
            });
        });

        it('should work with more complex events', function (done) {
            var _client = socketClient(__BASE_URL, {
                'force new connection': true,
                rejectUnauthorized: false,
            });
            _client.on('welcome', function () {
                _client.emit('PING', 'Hi, I am the client');
            });
            _client.on('PONG', function (m) {
                assert.equal('Hi, I am the server', m);
                _client.disconnect();
                done();
            });
        });

        it('should handle 100 clients easily, even with a large number of routes', function (done) {
            var _welcomeCount = 0;
            var _clients = [];
            for (var i = 0; i < 100; i++) {
                _clients[i] = socketClient(__BASE_URL, {
                    'force new connection': true,
                    rejectUnauthorized: false,
                });
                _clients[i].on('welcome', function () {
                    if (++_welcomeCount === 100) {
                        done();
                    }
                });
                _clients[i].on('error', function (e) {
                    throw new Error(e);
                });
            }
        });
    };
};