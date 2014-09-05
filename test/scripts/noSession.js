"use strict";

var sockpress = require("../../lib/index");
var assert = require("assert");

var app = sockpress.init({disableSession: true});

app.get("/foo", function(req, res) {
	res.send("bar");
});

app.io.on("connection", function(socket) {
	socket.emit("welcome", "welcome");
	socket.on("PING", function(m) {
		assert.equal("Hi, I am the client", m);
		socket.emit("PONG", "Hi, I am the server");
	});
});

app.listen(3333, function() {
	process.stdout.write("READY");
});