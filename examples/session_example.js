/**
 * An example with a custom session store in mongoDB : mongoose-session
 */

'use strict';

//Load library
var sockpress = require("sockpress");

//Create new engine using default session controller
var sessionStore = require('mongoose-session')(require('mongoose'));
var app = sockpress.init({
	secret: "key",
	resave: false,
    store: sessionStore
});

// [... Routes ...]

//Start the engine
app.listen(3000);