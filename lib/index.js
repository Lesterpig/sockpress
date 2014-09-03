/**
 * index.js
 * Entry point of sockpress wrapper.
 *
 * Inspired by https://gist.github.com/bobbydavid/2640463
 */

"use strict";

var express = require('express'),
	session = require('express-session'),
	io = require('socket.io'),
	Router = require("./router.js");

module.exports.init = function(options) {

	var _app, _server;

	//Init IO Router
	var _router = new Router();

	if (!options) options = {};

	//Defaults values for options
	options.name = options.name || 'sockpress.id';
	options.store = options.store || new session.MemoryStore();
	options.resave = options.resave === undefined
		? true
		: false
	options.saveUninitialized = options.saveUninitialized === undefined
		? true
		: false

	_app = express();
	_app.express = express; //expose raw express object for middlewares
	_server = require('http').Server(_app);
	_app.use(session(options));

	_app.io = io(_server);

	/**
	 * The authorization event is now a middleware in socket.io > 1.0.0
	 *
	 * Here, we are trying to populate socket.session object.
	 *
	 * Call next() if OK.
	 * Call next(new Error()) if not.
	 */
	_app.io.use(function(socket, next) {

		if (socket.request.headers.cookie) {
			var _cookies = require('cookie').parse(socket.request.headers.cookie);
			if (_cookies[options.name]) {

				//decode the cookie using session secret
				var _sid = require('cookie-parser').signedCookie(_cookies[options.name], options.secret);
				
				options.store.get(_sid, function(err, session) {
					if (err || !session) {
						session = {};
					}
					
					//Adding properties
					session.save = function(fn) {
						options.store.set(_sid, this, (fn || function() {}));
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

	// Expose new methods :

	/**
	 * Start express and socket.io applications.
	 * @param  {Number}   port
	 * @param  {Function} [callback]
	 */
	_app.listen = function(port, callback) {
		_router.addListeners(_app.io);
		_server.listen(port, callback);
	}

	/**
	 * Add a new socket.io route (convenience method)
	 * @param  {String}   [namespace] socket.io namespace. Defaults to "/".
	 * @param  {String}   route     the route name (should be unique)
	 * @param  {Function} fn        function(socket, data) { ... }
	 */
	_app.io.route = function(namespace, route, fn) {
		_router.add(namespace, route, fn);
	}

	return _app;

};