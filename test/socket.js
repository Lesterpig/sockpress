/**
 * Called for HTTP tests only, but with optional "route" mode
 * @param  string route (prefix)
 */
export default function(__BASE_URL__) {
    return (route) => {
        it('should disconnect a socket', function (done) {
            var _client = socketClient(__BASE_URL, {
                'force new connection': true
            });
            _client.on('welcome', function () {
                _client.emit(route + 'disconnect me');
                _client.on('disconnect', function () {
                    _client.disconnect();
                    done();
                });
            });
        });

        it('should broadcast to other sockets', function (done) {
            var _client = socketClient(__BASE_URL, {
                'force new connection': true
            });
            _client.on('welcome', function () {
                _client.emit(route + 'broadcast message', 'hello');
                _client.on('broadcasted message', function () {
                    throw Error('Unexpected broadcast message received');
                });
            });
            var _client2 = socketClient(__BASE_URL, {
                'force new connection': true
            });
            _client2.on('broadcasted message', function (msg) {
                assert.equal('hello', msg);
                _client.disconnect();
                _client2.disconnect();
                done();
            });
        });

        it('should join rooms and broadcast / emit correctly to this room', function (done) {
            var _client = socketClient(__BASE_URL, {
                'force new connection': true
            });
            var _received = 0;
            _client.on('welcome', function () {
                _client.emit(route + 'join room', 'test');
                _client.on('room joined', function (room) {
                    assert.equal('test', room);
                    if (++_received === 2) {
                        _client.disconnect();
                        _client2.disconnect();
                        done();
                    }
                    if (_received === 3) throw Error('too much receptions');
                });
            });
            var _client2 = socketClient(__BASE_URL, {
                'force new connection': true
            });
            _client2.on('room joined', function () {
                throw Error('should not receive this event');
            });
        });
    };
}
