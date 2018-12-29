/**
 * HTTP UNIT TESTS FOR SOCKPRESS.
 */

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

import assert from 'assert';
import Request from 'request';
import socketClient from 'socket.io-client';
import commonTest from './common';
import socketTest from './socket';

describe('Sockpress (HTTP)', function() {
  let __BASE_URL = 'http://localhost:3333';
  let server;

  before(function(){
    server = require('./scripts/http').default;
  });

  beforeEach(() => {
    server.start();
  });
  afterEach(function(done){
    server.stop(done);
  });

  describe('Basic Features', commonTest(__BASE_URL));

  describe('Socket.IO Features', function() {
    socketTest(__BASE_URL)('');
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
    
    it('should accept namespaces via Route', function(done) {
      var _client = socketClient(__BASE_URL + '/router_namespace', {
        'force new connection': true
      });
      _client.on('welcome router_namespace', function() {
        _client.emit('ping router_namespace', 'hello');
        _client.on('pong router_namespace', function(data) {
          assert.equal('hello', data);
          done();
        });
      });
    });

    it('should register middleware in namespaces via Route', function(done) {
      var _client = socketClient(__BASE_URL + '/router_namespace', {
        'force new connection': true
      });
      _client.on('router_namespace middleware message', function() {
        // Route.use() fired message
        done();
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

    socketTest(__BASE_URL)('route ');
  });

  describe('Session Features', function() {

    /**
     * COOKIES INIT
     */

    const cookies = Request.jar();
    const request = Request.defaults({
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

    it('should share session from http to socket in namespaces via Route', function(done) {
      request.get(__BASE_URL + '/session/variable3/value3', function() {
        var _client = socketClient(__BASE_URL + '/router_namespace', {
          'force new connection': true,
          'extraHeaders': {
            'Cookie': cookies.getCookieString(__BASE_URL)
          }
        });
        _client.on('welcome router_namespace', function() {
          _client.emit('get_session', 'variable3');
          _client.on('session_param', function(o){
            assert.equal(o.param, 'variable3');
            assert.equal(o.value, 'value3');
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