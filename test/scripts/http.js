/**
 * Example sockpress server, used in unit tests.
 */

import init from '../../lib'
import express from 'express'
import assert from 'assert'

const app = init(express(), { secret: 'key' })

const joinRoom = (socket, room) => {
  socket.join(room)
  socket.broadcast.to(room).emit('room joined', room) // should not be sent
  socket.emit('room joined', room) // should be sent
  app.io.to(room).emit('room joined', room) // should be sent
}

app.rawServer.setTimeout(2000, () => {
  console.log('Timeout!')
})

app.use((_, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Headers', 'X-Requested-With')
  next()
})

/** GET TESTS */

app.get('/foo', (req, res) => {
  res.send('bar')
})

app.get('/increment', (req, res) => {
  if (!req.session.increment) req.session.increment = 0

  res.send(++req.session.increment + '')
})

app.get('/session/:param/:value', (req, res) => {
  req.session[req.params.param] = req.params.value
  res.send('OK')
})

app.get('/session/:param', (req, res) => {
  res.send('' + req.session[req.params.param])
})

/** IO TESTS */

app.io.on('connection', (socket) => {
  socket.emit('welcome', 'welcome')
  socket.on('PING', (m) => {
    assert.equal('Hi, I am the client', m)
    socket.emit('PONG', 'Hi, I am the server')
  })
  socket.on('get_session', (param) => {
    socket.emit('session_param', { param: param, value: socket.session[param] })
  })
  socket.on('set_session', (o) => {
    socket.session[o.param] = o.value
    socket.session.save()
    socket.emit('session_set')
  })
  socket.on('increment_session', () => {
    socket.session['increment']++
    socket.session.save()
  })
  socket.on('disconnect me', () => {
    socket.disconnect()
  })
  socket.on('broadcast message', (msg) => {
    socket.broadcast.emit('broadcasted message', msg)
  })
  socket.on('join room', (room) => {
    joinRoom(socket, room)
  })
})

/** IO ROUTE TESTS */

app.io.route('simple route', (socket, data) => {
  socket.emit('simple route ok')
})

app.io.route('route disconnect me', (socket, data) => {
  socket.disconnect()
})

app.io.route('route broadcast message', (socket, msg) => {
  socket.broadcast.emit('broadcasted message', msg)
})

app.io.route('route join room', joinRoom)

app.io.route('another simple route', (socket, data) => {
  if (data !== 'hello') throw Error(data + ' !== hello')
  socket.emit('another simple route ok', { foo: 'bar' })
})

/** NAMESPACE TESTS */

app.io.of('/namespace').on('connection', (socket) => {
  socket.session.namespace = 'is accessible from namespace'
  socket.emit('welcome namespace')
  socket.on('get_session', (param) => {
    socket.emit('session_param', { param: param, value: socket.session[param] })
  })
  socket.on('set_session', (o) => {
    socket.session[o.param] = o.value
    socket.session.save()
  })
})

app.io.route('/namespace', 'ping namespace', (socket, data) => {
  socket.emit('pong namespace', data)
})

/** NAMESPACE via Route Instance TESTS */

const namespacedRoute = app.io.Route()

namespacedRoute
  .on('connection', (socket) => {
    socket.session.namespace = 'is accessible from router_namespace'
    socket.emit('welcome router_namespace')
    socket.on('get_session', (param) => {
      socket.emit('session_param', { param: param, value: socket.session[param] })
    })
    socket.on('set_session', (o) => {
      socket.session[o.param] = o.value
      socket.session.save()
    })
  })
  .use((socket, next) => {
    socket.emit('router_namespace middleware message')
    next()
  })
  .event('ping router_namespace', (socket, data) => {
    socket.emit('pong router_namespace', data)
  })

app.io.route('/router_namespace', namespacedRoute)

/** GENERATE ARTIFICIAL LOAD */

for (let i = 0; i < 200; i++) {
  app.io.route('load_' + i, () => { })
  app.io.route('/namespace', 'load_' + i, () => { })
}

export default {
  server: null,
  start: (done) => {
    this.server = app.listen(3333, done)
  },
  stop: (done) => {
    if (this.server) {
      this.server.close()
    }
    done()
  }
}
