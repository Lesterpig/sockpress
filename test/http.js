/**
 * HTTP UNIT TESTS FOR SOCKPRESS.
 */

import assert from 'assert'
import Request from 'request'
import socketClient from 'socket.io-client'
import commonTest from './common'
import socketTest from './socket'
import server from './scripts/http'

describe('Sockpress (HTTP)', () => {
  const BASEURL = 'http://localhost:3333'

  beforeEach(() => {
    server.start()
  })
  afterEach((done) => {
    server.stop(done)
  })

  describe('Basic Features', commonTest(BASEURL))

  describe('Socket.IO Features', () => {
    socketTest(BASEURL)('')
  })

  describe('IO Routes Features', () => {
    it('should work with one route', (done) => {
      const client = socketClient(BASEURL, {
        'force new connection': true
      })
      client.on('welcome', () => {
        client.emit('simple route')
        client.on('simple route ok', () => { client.disconnect(); done() })
      })
    })

    it('should work with another route', (done) => {
      const client = socketClient(BASEURL, {
        'force new connection': true
      })
      client.on('welcome', () => {
        client.emit('another simple route', 'hello')
        client.on('simple route ok', () => {
          throw Error('Unexpected ok signal')
        })
        client.on('another simple route ok', (m) => {
          assert.strictEqual(m.foo, 'bar')
          client.disconnect()
          done()
        })
      })
    })

    it('should accepts namespaces', (done) => {
      const client = socketClient(BASEURL + '/namespace', {
        'force new connection': true
      })
      client.on('welcome namespace', () => {
        client.emit('ping namespace', 'hello')
        client.on('pong namespace', (data) => {
          assert.strictEqual('hello', data)
          client.disconnect()
          done()
        })
      })
    })

    it('should accept namespaces via Route', (done) => {
      const client = socketClient(BASEURL + '/router_namespace', {
        'force new connection': true
      })
      client.on('welcome router_namespace', () => {
        client.emit('ping router_namespace', 'hello')
        client.on('pong router_namespace', (data) => {
          assert.strictEqual('hello', data)
          client.disconnect()
          done()
        })
      })
    })

    it('should register middleware in namespaces via Route', (done) => {
      const client = socketClient(BASEURL + '/router_namespace', {
        'force new connection': true
      })
      client.on('router_namespace middleware message', () => {
        // Route.use() fired message
        client.disconnect()
        done()
      })
    })

    it('should consider / as default namespace', (done) => {
      const client = socketClient(BASEURL + '/', {
        'force new connection': true
      })
      client.on('welcome', () => {
        client.emit('simple route')
        client.on('simple route ok', () => { client.disconnect(); done() })
      })
    })

    socketTest(BASEURL)('route ')
  })

  describe('Session Features', () => {
    /**
     * COOKIES INIT
     */

    const cookies = Request.jar()
    const request = Request.defaults({
      jar: cookies
    })

    it('should increment a session variable through get', (done) => {
      request(BASEURL + '/increment', (err, res, body) => {
        assert.strictEqual(null, err)
        assert.strictEqual('1', body)
        request(BASEURL + '/increment', (err, res, body) => {
          assert.strictEqual(null, err)
          assert.strictEqual('2', body)
          request(BASEURL + '/increment', (err, res, body) => {
            assert.strictEqual(null, err)
            assert.strictEqual('3', body)
            done()
          })
        })
      })
    })

    it('should share session from http to socket', (done) => {
      request.get(BASEURL + '/session/variable/value', () => {
        const client = socketClient(BASEURL, {
          'force new connection': true,
          'extraHeaders': {
            'Cookie': cookies.getCookieString(BASEURL)
          }
        })
        client.on('welcome', () => {
          client.emit('get_session', 'variable')
          client.on('session_param', (o) => {
            assert.strictEqual(o.param, 'variable')
            assert.strictEqual(o.value, 'value')
            client.disconnect()
            done()
          })
        })
      })
    })

    it('should share session from http to socket in namespaces', (done) => {
      request.get(BASEURL + '/session/variable2/value2', () => {
        const client = socketClient(BASEURL + '/namespace', {
          'force new connection': true,
          'extraHeaders': {
            'Cookie': cookies.getCookieString(BASEURL)
          }
        })
        client.on('welcome namespace', () => {
          client.emit('get_session', 'variable2')
          client.on('session_param', (o) => {
            assert.strictEqual(o.param, 'variable2')
            assert.strictEqual(o.value, 'value2')
            client.disconnect()
            done()
          })
        })
      })
    })

    it('should share session from http to socket in namespaces via Route', (done) => {
      request.get(BASEURL + '/session/variable3/value3', () => {
        const client = socketClient(BASEURL + '/router_namespace', {
          'force new connection': true,
          'extraHeaders': {
            'Cookie': cookies.getCookieString(BASEURL)
          }
        })
        client.on('welcome router_namespace', () => {
          client.emit('get_session', 'variable3')
          client.on('session_param', (o) => {
            assert.strictEqual(o.param, 'variable3')
            assert.strictEqual(o.value, 'value3')
            client.disconnect()
            done()
          })
        })
      })
    })

    it('should share session from socket to http', (done) => {
      const client = socketClient(BASEURL, {
        'force new connection': true,
        'extraHeaders': {
          'Cookie': cookies.getCookieString(BASEURL)
        }
      })
      client.on('welcome', () => {
        client.emit('set_session', { param: 'variable3', value: 'value3' })
        setTimeout(() => {
          request.get(BASEURL + '/session/variable3', (_, res) => {
            assert.strictEqual(res.body, 'value3')
            client.disconnect()
            done()
          })
        }, 10)
      })
    })

    it('should be fast and atomic (session only)', (done) => {
      const client = socketClient(BASEURL, {
        'force new connection': true,
        'extraHeaders': {
          'Cookie': cookies.getCookieString(BASEURL)
        }
      })
      client.on('welcome', () => {
        client.emit('set_session', { param: 'increment', value: -1 })
        for (let i = 0; i < 1001; i++) {
          client.emit('increment_session')
        }
        setTimeout(() => {
          client.emit('get_session', 'increment')
          client.on('session_param', (o) => {
            assert.strictEqual(o.param, 'increment')
            assert.strictEqual(o.value, 1000)
            request.get(BASEURL + '/increment', (_, res) => {
              assert.strictEqual(res.body, '1001')
              client.disconnect()
              done()
            })
          })
        }, 200)
      })
    })

    it('should not give data to wrong client', (done) => {
      const client = socketClient(BASEURL, {
        'force new connection': true,
        'extraHeaders': {
          'Cookie': cookies.getCookieString(BASEURL)
        }
      })
      client.on('welcome', () => {
        client.emit('set_session', { param: 'sensibledata', value: 42 })
      })

      client.on('session_set', () => {
        request.get({
          jar: request.jar(),
          url: BASEURL + '/session/sensibledata'
        }, (err, res) => {
          assert.strictEqual(err, null)
          assert(res.body !== 42)
          client.disconnect()
          done()
        })
      })
    })

    const object = {
      foo: 'bar',
      number: 1,
      array: [1, false, 'a', null, 2.22222222],
      object: {
        a: 'sub',
        'complete-object': true
      }
    }

    const checkObj = (a, b) => JSON.stringify(a) === JSON.stringify(b)

    it('should preserve var type', (done) => {
      const client = socketClient(BASEURL, {
        'force new connection': true
      })
      client.on('welcome', () => {
        client.emit('set_session', { param: 'fromsocket', value: object })
      })
      client.on('session_set', () => {
        client.emit('get_session', 'fromsocket')
      })
      client.on('session_param', (o) => {
        checkObj(o.value, object)
        request.get(BASEURL + '/session/fromsocket', (_, res) => {
          checkObj(res.body, object)
          client.disconnect()
          done()
        })
      })
    })
  })
})
