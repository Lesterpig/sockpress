/**
 * index.js
 * Entry point of sockpress wrapper.
 *
 * Inspired by https://gist.github.com/bobbydavid/2640463
 */

"use strict";

var express = require('express'),
	session = require('express-session'),
	io = require('socket.io');

var app, server, sessionStore;

module.exports.init = function(options) {

	if (!options) options = {};
	if (!options.secret) throw Error("The secret option is mandatory in sockpress module.");
	options.key = options.key || 'sockpress.id';

	app = express();
	server = require('http').Server(app);
	sessionStore = new session.MemoryStore();

	app.use(session({
		key: options.key,
		store: sessionStore,
		secret: options.secret,
		resave: true,
		saveUninitialized: true
	}));

	app.io = io(server);

	/**
	 * The authorization event is now a middleware in socket.io > 1.0.0
	 *
	 * Here, we are trying to populate socket.session object.
	 *
	 * Call next() if OK.
	 * Call next(new Error()) if not.
	 */
	app.io.use(function(socket, next) {

		if (socket.request.headers.cookie) {
			var _cookies = require('cookie').parse(socket.request.headers.cookie);
			if (_cookies[options.key]) {

				//decode the cookie using session secret
				var _sid = require('cookie-parser').signedCookie(_cookies[options.key], options.secret);
				
				sessionStore.get(_sid, function(err, session) {
					if (err || !session) {
						socket.session = {};
					}
					
					//Adding properties
					session.save = function(fn) {
						sessionStore.set(_sid, this, (fn || function() {}));
					}

					socket.session = session;
					next();
				});

			} else {
				socket.session = {}; next();
			}
		} else {
			socket.session = {}; next();
		}

	});

	return app;

};

module.exports.listen = function(port, callback) {

	if (!server || !sessionStore) throw Error("Please run init before listen in sockpress module.");

	server.listen(port, callback);

}