/**
 * A more complex example with no session support and socketIO namespaces
 */

// Load library
import sockpress from 'sockpress'

// Create new engine using default session controller
const app = sockpress({
  disableSession: true
})

// Register sample IO routes
app.io.of('/namespace').on('connection', () => {
  console.log("Connection on namespace called '/namespace'")
})

app.io.route('/namespace', 'event', (socket, data) => {
  console.log("Event called on namespace '/namespace' !")
})

// Start the engine
app.listen(3000)
