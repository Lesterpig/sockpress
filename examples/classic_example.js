/**
 * A classic use of Sockpress with session support (RAM)
 */

// Load library
import sockpress from 'sockpress'

// Create new engine using default session controller
const app = sockpress.init({
  secret: 'key'
})

// Register sample http routes
app.get('/index', (_, res) => {
  res.send('Hello!')
})

app.post('/update', (_, res) => {
  res.redirect('/index')
})

// Register sample IO routes
app.io.on('connection', socket => {
  console.log('New IO connection (id=' + socket.id + ')')
})

app.io.route('ping', (socket, data) => {
  socket.emit('pong', data) // echo service
})

// Start the engine
app.listen(3000)
