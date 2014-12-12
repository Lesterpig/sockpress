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

	_app = express(); //load an express instance
	_app.express = express; //expose raw express object for middlewares

	if(!options.https) //load http or https nodejs server
		_server = require('http').createServer(_app);
	else
		_server = require('https').createServer(options.https, _app);
	
	if(!options.disableSession)
		_app.use(session(options)); //enable session support in express

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

		if (socket.request.headers.cookie && !options.disableSession) {
			var _cookies = require('cookie').parse(socket.request.headers.cookie);
			if (_cookies[options.name]) {

				//decode the cookie using session secret
				var _sid = require('cookie-parser').signedCookie(_cookies[options.name], options.secret);
				
				options.store.get(_sid, function(err, session) {
					if (err || !session) {
						return setInvalidSession(socket); next();
					}
					
					//Adding properties
					session.save = function(fn) {
						options.store.set(_sid, this, (fn || function() {}));
					}

					socket.session = session;
					next();
				});

			} else {
				setInvalidSession(socket); next();
			}
		} else {
			setInvalidSession(socket); next();
		}

	});

	// Expose new methods :

	/**
	 * Start express and socket.io applications.
	 * @params : see http://nodejs.org/api/http.html#http_server_listen_port_hostname_backlog_callback
	 */
	_app.listen = function(arg1, arg2, arg3, arg4) {

		if(arg1 === undefined) throw Error("Sockpress : Please provide at least one argument to listen function.");

		_router.addListeners(_app.io);

		if (arg2 === undefined) _server.listen(arg1);
		else if (arg3 === undefined) _server.listen(arg1, arg2);
		else if (arg4 === undefined) _server.listen(arg1, arg2, arg3);
		else _server.listen(arg1, arg2, arg3, arg4);
		
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

/** PRIVATE **/

function setInvalidSession(socket) {
	socket.session = {};
	socket.session.save = function(callback) {
		callback = callback || function() {};
		callback("Session if not initialized. Init it with a classic express request.");
	}
};