/**
 * An example with a custom session store in mongoDB : mongoose-session
 */

'use strict';

//Load library
var sockpress = require("sockpress");

//Create new engine using mongoose session controller
var sessionStore = require('mongoose-session')(require('mongoose'));
var app = sockpress.init({
	secret: "key",
	resave: false,
    store: sessionStore
});

//Routes

app.post("/login", function(req, res) {
	if(!req.session.authenticated) {
		req.session.authenticated = true;
		//save is auto in express routes
	}
	res.send({error: null});
});

app.io.route("action", function(socket, data) {
	if(socket.session.authenticated) {
		socket.session.foo = "bar";
		socket.session.save();
	}
});

//Start the engine
app.listen(3000);