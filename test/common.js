import assert from 'assert'
import Request from 'request'
import socketClient from 'socket.io-client'

/**
 * Called for HTTP and HTTS tests
 */
export default (BASEURL) => () => {
  const request = Request.defaults({})

  it('should start the server', (done) => {
    done()
  })

  it('should be able to get a page', (done) => {
    request(BASEURL + '/foo', (err, res, body) => {
      assert.strictEqual(null, err)
      assert.strictEqual('bar', body)
      done()
    })
  })

  it('should be able to get socket.io client', (done) => {
    request(BASEURL + '/socket.io/socket.io.js', (err, res, body) => {
      assert.strictEqual(null, err)
      assert.strictEqual(200, res.statusCode)
      done()
    })
  })

  it('should be able to connect to socket.io and emit/receive events', (done) => {
    const client = socketClient(BASEURL, {
      'force new connection': true,
      rejectUnauthorized: false
    })
    client.on('welcome', (m) => {
      assert.strictEqual('welcome', m)
      client.disconnect()
      done()
    })
    client.on('connect_error', (e) => {
      throw Error(e)
    })
    client.on('connect_timeout', () => {
      throw Error('Timeout error')
    })
  })

  it('should work with more complex events', (done) => {
    const client = socketClient(BASEURL, {
      'force new connection': true,
      rejectUnauthorized: false
    })
    client.on('welcome', () => {
      client.emit('PING', 'Hi, I am the client')
    })
    client.on('PONG', (m) => {
      assert.strictEqual('Hi, I am the server', m)
      client.disconnect()
      done()
    })
  })

  const n = 100
  it(`should handle ${n} clients easily, even with a large number of routes`, (done) => {
    let welcomeCount = 0
    let clients = []

    for (let i = 0; i < n; i++) {
      clients[i] = socketClient(BASEURL, {
        'force new connection': true,
        rejectUnauthorized: false
      })
      clients[i].on('welcome', () => {
        if (++welcomeCount === n) {
          // Disconnect everybody to purge routines
          for (let j = 0; j < n; j++) {
            clients[j].disconnect()
          }
          done()
        }
      })
    }
  })
}
