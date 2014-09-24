/**
 * A classic use of Sockpress with session support (RAM)
 */

'use strict';

//Load library
var sockpress = require("sockpress");

//Create new engine using default session controller
var app = sockpress.init({secret: "key"});

//Register sample http routes

app.get("/index", function(req, res) {
	res.send("Hello!");
});

app.post("/update", function(req, res) {
	res.redirect("/index");
});

//Register sample IO routes

app.io.on("connection", function(socket) {
	console.log("New IO connection (id="+socket.id+")");
});

app.io.route("ping", function(socket, data) {
	socket.emit("pong", data); //echo service
});

//Start the engine
app.listen(3000);