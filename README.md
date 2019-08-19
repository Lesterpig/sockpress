sockpress [![Build Status](https://travis-ci.org/Lesterpig/sockpress.svg)](https://travis-ci.org/Lesterpig/sockpress)
=========

A simple express.js and socket.io wrapper for nodejs

Why ?
-----

Because building an app with express and socket.io could be complex and redundant, here is a **really small** wrapper to work with **latest** versions of express.js and socket.io

Install
-------

```
yarn install sockpress
```

**Important note**: sockpress leverages JavaScript modules since its 1.4.0 version.
It is bundled with the excellent [esm](https://github.com/standard-things/esm) module for retro-compatibility.


How to use ?
------------

Sockpress adds the **socket.io** object to the **express** one. **It does not change express or socket.io properties**, but adds some useful features.

### Init Sockpress

Sockpress initialization creates express and socket server **with automatic shared session support**.

```javascript
import sockpress from "sockpress"
const app = sockpress([express], [options])
```

An example to work with classic session store (memory) :

```javascript
const options = {
  secret: "a secret key",
  saveUninitialized: false
}
const app = sockpress(options)
```

An example to work with **connect-redis** session :

```javascript
const session = require('express-session')
const RedisStore = require('connect-redis')(session)

const options = {
  secret: "a secret key",
  store: new RedisStore({host:'127.0.0.1'}),
  name: "my-cookie-key"
}
const app = sockpress(options)
```

*[List of available options for sessions](https://github.com/expressjs/session#options)*

If you dont want sockpress to create a session store, just pass `options.disableSession = true` parameter.

### Use it with HTTPS

You can use sockpress as a HTTPS server. Just pass a `https` option to sockpress, containing https details.

```javascript
const options = {
  secret: "a secret key",
  https: {
    key: privateKey,
    cert: serverCert,
  },
}
const app = sockpress(options)
```

*[List of available options for https](http://nodejs.org/api/tls.html#tls_tls_createserver_options_secureconnectionlistener)*

### Add express middlewares as usual

You can include your favorite express middleware like a classic express app ! For convenience, sockpress exposes the `express` raw object in `app.express`.

```javascript
app.use(app.express.static(require("path").join(__dirname, "static")))
```

**Important** : use Express 4 middlewares, see [documentation](http://expressjs.com/migrating-4.html#core-changes).

### Define routes

For classic routes, you don't have to change your code. See [express docs](http://expressjs.com/4x/api.html).

```javascript
app.get("/index", (req, res) => {
  res.send("Hello World!")
})
```

For IO routes and configuration, you can use the `app.io` object, and use it as a classic socket.io object. See [socket.io docs](http://socket.io/docs/).

```javascript
app.io.on("connection", (socket) => {
  socket.emit("welcome", "Hi ! Welcome on Sockpress server.") //send to the connected socket
  socket.broadcast.emit("newUser") //broadcast to other users
})
```

You can also use a fresh utility provided by Sockpress : **app.io.route(socket, data)**

```javascript
app.io.route("send message", (socket, data) => {
  socket.emit("message sent", data)
  socket.broadcast.emit("new message", data)
})
```

It also supports socket.io namespaces :

```javascript
app.io.route("/users", "send message", (socket, data) => {
  // ...
})
```

### Use session inside IO routes

```javascript
app.io.route("action", (socket, data) => {
  if(socket.session.authenticated) {
    socket.session.foo = "bar"
    socket.session.save()
  }
})
```

**Warning : you have to call the `socket.session.save([callback])` function after updating the session inside a IO route.**

### Start Sockpress !

```javascript
app.listen(3000)
// or
app.listen(3000, "127.0.0.1")
```

see [nodejs http(s) doc](http://nodejs.org/api/http.html#http_server_listen_port_hostname_backlog_callback)

### Test Sockpress

```bash
git clone https://github.com/Lesterpig/sockpress.git
cd sockpress
npm test
```

### (Advanced) Use modular routes system

If your application uses a modular approach, you would be interested by the modular routes syntax.
Here is an example where we define a route and then plug it into the sockpress server.

```javascript
const myRoute = app.io.Route()

// Define route
myRoute
.on('connection', (socket) => {
  // On new connection (standard approach)
})
.use((socket, next) => {
  // On new connection too (middleware approach)
})
.event('name', (socket, data) => {
  // On particular event
})

// Plug route!
app.io.route('/namespace', myRoute)
```

Project Status
--------------

This project is maintained for bug fixes and compatibility with newer versions of express/socket.io, but no new features are planned. It should then be considered "Stable".

Authors:
- [Lesterpig](https://github.com/lesterpig) (base code, tests)
- [Stevokk](https://github.com/stevokk) (modular routes)
- [Luiscarbonell](https://github.com/luiscarbonell)
- [OmgImAlexis](https://github.com/OmgImAlexis) (es6 conversion)
