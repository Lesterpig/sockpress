/**
 * An example with a custom session store in mongoDB : mongoose-session
 */

// Load library
import sockpress from 'sockpress'
import mongoose from 'mongoose'
import mongooseSession from 'mongoose-session'

// Create new engine using mongoose session controller
const store = mongooseSession(mongoose)
const app = sockpress.init({
  secret: 'key',
  resave: false,
  store
})

// Routes
app.post('/login', (req, res) => {
  if (!req.session.authenticated) {
    req.session.authenticated = true
    // save is automatically called in express routes
  }
  res.send({
    error: null
  })
})

app.io.route('action', (socket, data) => {
  if (socket.session.authenticated) {
    socket.session.foo = 'bar'
    socket.session.save()
  }
})

// Start the engine
app.listen(3000)
