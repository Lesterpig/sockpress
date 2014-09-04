"use strict";

var sockpress = require("../../lib/index");
var assert = require("assert");
var fs = require("fs");
var path = require("path");

var app = sockpress.init({secret: "key", https: {
	cert: fs.readFileSync(path.join(__dirname, "fixtures", "cert.pem")),
	key: fs.readFileSync(path.join(__dirname, "fixtures", "key.pem"))
}});

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