/**
 * Called for HTTP tests only, but with optional "route" mode
 * @param  string route (prefix)
 */
import assert from 'assert'
import socketClient from 'socket.io-client'

export default (__BASE_URL) => {
  return (route) => {
    it('should disconnect a socket', (done) => {
      const client = socketClient(__BASE_URL, {
        'force new connection': true
      })
      client.on('welcome', () => {
        client.emit(route + 'disconnect me')
        client.on('disconnect', () => {
          client.disconnect()
          done()
        })
      })
    })

    it('should broadcast to other sockets', (done) => {
      const client = socketClient(__BASE_URL, {
        'force new connection': true
      })
      client.on('welcome', () => {
        client.emit(route + 'broadcast message', 'hello')
        client.on('broadcasted message', () => {
          throw Error('Unexpected broadcast message received')
        })
      })
      const client2 = socketClient(__BASE_URL, {
        'force new connection': true
      })
      client2.on('broadcasted message', (msg) => {
        assert.strictEqual('hello', msg)
        client.disconnect()
        client2.disconnect()
        done()
      })
    })

    it('should join rooms and broadcast / emit correctly to this room', (done) => {
      let received = 0
      const client = socketClient(__BASE_URL, {
        'force new connection': true
      })
      client.on('welcome', () => {
        client.emit(route + 'join room', 'test')
        client.on('room joined', (room) => {
          assert.strictEqual('test', room)
          if (++received === 2) {
            client.disconnect()
            client2.disconnect()
            done()
          }
          if (received === 3) throw Error('too much receptions')
        })
      })
      const client2 = socketClient(__BASE_URL, {
        'force new connection': true
      })
      client2.on('room joined', () => {
        throw Error('should not receive this event')
      })
    })
  }
}
