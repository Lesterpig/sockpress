Sockpress
=========

A simple express.js and socket.io wrapper for nodejs (work in progress).
**Note** : Sockpress is not able to manage https servers for the moment.

Why ?
-----

Because building an app with express and socket.io could be complex and redundant, here is a **really small** wrapper to work with **latest** versions of express.js and socket.io

Written in **full javascript** with the KiSS protocol : *Keep it Short and Simple* !

How to use ?
------------

Sockpress adds the **socket.io** object to the **express** one. **It does not change express or socket.io properties**, but adds some useful features.

### Init Sockpress

Sockpress initialization creates express and socket server **with automatic shared session support**.

```javascript
var app = require("sockpress").init(options);
```

An example to work with classic session store (memory) :

```javascript
var options = {
	secret: "a secret key",
	saveUninitialized: false
}
```

An example to work with **connect-redis** session : *(not fully tested yet)*

```javascript
var session = require('express-session');
var RedisStore = require('connect-redis')(session);

var options = { 
  secret: "A Secret Key for cookie Encryption",
  store: new RedisStore({host:'127.0.0.1'}),
  name: "my-cookie-key"
}
```

*[List of options available](https://github.com/expressjs/session#options)*

### Define routes

For classic routes, you don't have to change your code. See [express docs](http://expressjs.com/4x/api.html).

```javascript
app.get("/index", function(req, res) {
	res.send("Hello World!");
});
```

For IO routes and configuration, you can use the `app.io` object, and use it as a classic socket.io object. See [socket.io docs](http://socket.io/docs/).

```javascript
app.io.on("connection", function(socket) {
	socket.emit("welcome", "Hi ! Welcome on Sockpress server."); //send to the connected socket
	socket.broadcast.emit("newUser"); //broadcast to other users
});
```

You can also use a fresh utility provided by Sockpress : **app.io.route(socket, data)**

```javascript
app.io.route("send message", function(socket, data) {
	socket.emit("message sent", data);
	socket.broadcast.emit("new message", data);
});
```

**Note :** It does not support namespaces yet. The idea comes from Express.io

### Start Sockpress !

```javascript
app.listen(3000);
```

Project Status
--------------

The project is new on github. **It is not ready for production yet.**
However, 0.1.0 version should appear soon on NPM. Stay tuned :)