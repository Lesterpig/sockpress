/**
 * UNIT TESTS FOR SOCKPRESS.
 */

'use strict';
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

var assert       = require('assert');
var request      = require('request');
var socketClient = require('socket.io-client');
var __BASE_URL;

describe('Sockpress (HTTP)', function() {

  before(function(){
    __BASE_URL  = 'http://localhost:3333';
  });

  var server = require('./scripts/http');
  beforeEach(server.start);
  afterEach(function(done){
    server.stop(done);
  });

  describe('Basic Features', runBasicTests);

  describe('Socket.IO Features', function() {
    runSocketTests('');
  });

  describe('IO Routes Features', function() {

    it('should work with one route', function(done) {
      var _client = socketClient(__BASE_URL, {
        'force new connection': true
      });
      _client.on('welcome', function() {
        _client.emit('simple route');
        _client.on('simple route ok', done);
      });
    });

    it('should work with another route', function(done) {
      var _client = socketClient(__BASE_URL, {
        'force new connection': true
      });
      _client.on('welcome', function() {
        _client.emit('another simple route', 'hello');
        _client.on('simple route ok', function() {
          throw Error('Unexpected ok signal')
        });
        _client.on('another simple route ok', function(m) {
          assert.equal(m.foo, 'bar');
          done();
        });
      });
    });

    it('should accepts namespaces', function(done) {
      var _client = socketClient(__BASE_URL + '/namespace', {
        'force new connection': true
      });
      _client.on('welcome namespace', function() {
        _client.emit('ping namespace', 'hello');
        _client.on('pong namespace', function(data) {
          assert.equal('hello', data);
          done();
        });
      });
    });

    it('should consider / as default namespace', function(done) {
      var _client = socketClient(__BASE_URL + '/', {
        'force new connection': true
      });
      _client.on('welcome', function() {
        _client.emit('simple route');
        _client.on('simple route ok', done);
      });
    });

    runSocketTests('route ');

  });

  describe('Session Features', function() {

    /**
     * COOKIES INIT
     */

    var cookies = request.jar();
    request = request.defaults({
      jar: cookies
    });

    it('should increment a session variable through get', function(done) {
      request(__BASE_URL + '/increment', function(err, res, body) {
        assert.strictEqual(null, err);
        assert.equal(1, body);
        request(__BASE_URL + '/increment', function(err, res, body) {
          assert.strictEqual(null, err);
          assert.equal(2, body);
          request(__BASE_URL + '/increment', function(err, res, body) {
            assert.strictEqual(null, err);
            assert.equal(3, body);
            done();
          });
        });
      });

    });

    it('should share session from http to socket', function(done) {
      request.get(__BASE_URL + '/session/variable/value', function() {
        var _client = socketClient(__BASE_URL, {
          'force new connection': true,
          'extraHeaders': {
            'Cookie': cookies.getCookieString(__BASE_URL)
          }
        });
        _client.on('welcome', function() {
          _client.emit('get_session', 'variable');
          _client.on('session_param', function(o) {
            assert.equal(o.param, 'variable');
            assert.equal(o.value, 'value');
            done();
          });
        });
      });
    });

    it('should share session from http to socket in namespaces', function(done) {
      request.get(__BASE_URL + '/session/variable2/value2', function() {
        var _client = socketClient(__BASE_URL + '/namespace', {
          'force new connection': true,
          'extraHeaders': {
            'Cookie': cookies.getCookieString(__BASE_URL)
          }
        });
        _client.on('welcome namespace', function() {
          _client.emit('get_session', 'variable2');
          _client.on('session_param', function(o){
            assert.equal(o.param, 'variable2');
            assert.equal(o.value, 'value2');
            done();
          });
        });
      });
    });

    it('should share session from socket to http', function(done) {
      var _client = socketClient(__BASE_URL, {
        'force new connection': true,
        'extraHeaders': {
          'Cookie': cookies.getCookieString(__BASE_URL)
        }
      });
      _client.on('welcome', function() {
        _client.emit('set_session', {param: 'variable3', value: 'value3'});
        setTimeout(function() {
          request.get(__BASE_URL + '/session/variable3', function(err, res) {
            assert.equal(res.body, 'value3');
            done();
          });
        }, 10);
      });
    });

    it('should be fast and atomic (session only)', function(done) {
      var _client = socketClient(__BASE_URL, {
        'force new connection': true,
        'extraHeaders': {
          'Cookie': cookies.getCookieString(__BASE_URL)
        }
      });
      _client.on('welcome', function() {
        _client.emit('set_session', {param: 'increment', value: -1})
        for(var i = 0; i < 1001; i++) {
          _client.emit('increment_session');
        }
        setTimeout(function(){
          _client.emit('get_session', 'increment');
          _client.on('session_param', function(o) {
            assert.equal(o.param, 'increment');
            assert.equal(o.value, 1000);
            request.get(__BASE_URL + '/increment', function(err, res) {
              assert.equal(res.body, 1001);
              done();
            });
          });
        }, 200);
      });
    });

    it('should not give data to wrong client', function(done) {
      var _client = socketClient(__BASE_URL, {
        'force new connection': true,
        'extraHeaders': {
          'Cookie': cookies.getCookieString(__BASE_URL)
        }
      });
      _client.on('welcome', function() {
        _client.emit('set_session', { param: 'sensible_data', value: 42 });
      });

      _client.on('session_set', function() {
        request.get({
          jar: request.jar(),
          url: __BASE_URL + '/session/sensible_data'
        }, function(err, res) {
          assert.equal(err, null);
          assert(res.body != 42);
          done();
        });
      });
    });

    var _object = {
      foo: 'bar',
      number: 1,
      array: [1, false, 'a', null, 2.22222222],
      object: {
        a: 'sub',
        'complete-object': true
      }
    };

    function _checkObj(a, b) {
      return JSON.stringify(a) === JSON.stringify(b);
    }

    it('should preserve var type', function(done) {

      var _client = socketClient(__BASE_URL, {
        'force new connection': true
      });
      _client.on('welcome', function() {
        _client.emit('set_session', { param: 'from_socket', value: _object });
      });
      _client.on('session_set', function() {
        _client.emit('get_session', 'from_socket');
      });
      _client.on('session_param', function(o) {
        _checkObj(o.value, _object);
        request.get(__BASE_URL + '/session/from_socket', function(err, res) {
          _checkObj(res.body, _object);
          done();
        });
      });
    });

  });

});

describe('Sockpress (HTTPS)', function() {

  before(function(){
    __BASE_URL = 'https://localhost:3334'
  });

  var server = require('./scripts/https');
  beforeEach(server.start);
  afterEach(function(done) {
    server.stop(done);
  });

  describe('Basic Features', runBasicTests);

});

/**
 * Called for HTTP and HTTS tests
 */
function runBasicTests() {

  it('should start the server', function(done) {
    done();
  });

  it('should be able to get a page', function(done) {
    request(__BASE_URL + '/foo', function(err, res, body) {
      assert.strictEqual(null, err);
      assert.equal('bar', body);
      done();
    });
  });

  it('should be able to get socket.io client', function(done) {
    request(__BASE_URL + '/socket.io/socket.io.js', function(err, res, body) {
      assert.strictEqual(null, err);
      assert.equal(200, res.statusCode);
      done();
    });
  });

  it('should be able to connect to socket.io and emit/receive events', function(done) {
    var _client = socketClient(__BASE_URL, {
      'force new connection': true
    });
    _client.on('welcome', function(m) {
      assert.equal('welcome', m);
      _client.disconnect();
      done();
    });
    _client.on('error', function(e) {
      throw Error(e);
    });
    _client.on('connect_error', function(e) {
      throw Error(e);
    });
    _client.on('connect_timeout', function() {
      throw Error('Timeout error');
    });
  });

  it('should work with more complex events', function(done) {
    var _client = socketClient(__BASE_URL, {
      'force new connection': true
    });
    _client.on('welcome', function() {
      _client.emit('PING', 'Hi, I am the client');
    });
    _client.on('PONG', function(m) {
      assert.equal('Hi, I am the server', m);
      _client.disconnect();
      done();
    });
  });

  it('should handle 100 clients easily, even with a large number of routes', function(done) {
    var _welcomeCount = 0;
    var _clients = [];
    for(var i = 0; i < 100; i++) {
      _clients[i] = socketClient(__BASE_URL, {
        'force new connection': true
      });
      _clients[i].on('welcome', function() {
        if(++_welcomeCount === 100){
          done();
        }
      });
      _clients[i].on('error', function(e) {
        throw new Error(e);
      });
    }
  });
}

/**
 * Called for HTTP tests only, but with optional "route" mode
 * @param  string route (prefix)
 */
function runSocketTests(route) {
  it('should disconnect a socket', function(done) {
    var _client = socketClient(__BASE_URL, {
      'force new connection': true
    });
    _client.on('welcome', function() {
      _client.emit(route + 'disconnect me');
      _client.on('disconnect', function() {
        _client.disconnect();
        done();
      });
    });
  });

  it('should broadcast to other sockets', function(done) {
    var _client = socketClient(__BASE_URL, {
      'force new connection': true
    });
    _client.on('welcome', function() {
      _client.emit(route + 'broadcast message', 'hello');
      _client.on('broadcasted message', function() {
        throw Error('Unexpected broadcast message received');
      });
    });
    var _client2 = socketClient(__BASE_URL, {
      'force new connection': true
    });
    _client2.on('broadcasted message', function(msg) {
      assert.equal('hello', msg);
      _client.disconnect();
      _client2.disconnect();
      done();
    });
  });

  it('should join rooms and broadcast / emit correctly to this room', function(done) {
    var _client = socketClient(__BASE_URL, {
      'force new connection': true
    });
    var _received = 0;
    _client.on('welcome', function() {
      _client.emit(route + 'join room', 'test');
      _client.on('room joined', function(room) {
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
    _client2.on('room joined', function() {
      throw Error('should not receive this event');
    });
  });
}
