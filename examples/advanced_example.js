/**
 * A more complex example with no session support and socketIO namespaces
 */

'use strict';

//Load library
var sockpress = require("sockpress");

//Create new engine using default session controller
var app = sockpress.init({disableSession: true});

//Register sample IO routes

app.io.of("/namespace").on("connection", function() {
	console.log("Connection on namespace called '/namespace'");
});

app.io.route("/namespace", "event", function(socket, data) {
	console.log("Event called on namespace '/namespace' !");
});

//Start the engine
app.listen(3000);