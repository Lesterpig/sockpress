/**
 * index.js
 * Entry point of sockpress wrapper.
 *
 * Inspired by https://gist.github.com/bobbydavid/2640463
 */

var express = require('express')
  , connect = require('connect')
  , io = require('socket.io');

var app, sessionStore;

module.exports.init = function(options) {

	if(!options) options = {};
	if(!options.secret) throw Error("The secret option is mandatory in sockpress module.");

	app = express();
	sessionStore = new connect.session.MemoryStore();

	app.use(require("cookie-parser")(options.secret));
	app.use(require("express-session")({
	    key: (options.key || 'express.sid')
	  , store: sessionStore
	}));

	app.io = io(app);

	/**
	 * The authorization event is now a middleware in socket.io > 1.0.0
	 *
	 * Here, we are trying to populate socket.session object.
	 * 
	 * Call next() if OK.
	 * Call next(new Error()) if not.
	 */
	io.use(function(socket, next) {
		var _cookie = socket.request.headers.cookie;
		var _cookies = socket.request.cookies; // TODO : choose one of them ! (need tests). The second should be populated by cookie parser middleware...
		// TODO : continue this.
	});

	return app;

};

module.exports.listen = function(port, callback) {

	if(!app || !sessionStore) throw Error("Please run init before listen in sockpress module.");

	app.listen(port, callback);

}