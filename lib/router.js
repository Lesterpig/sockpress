"use strict";

var Router = function() {

	var that = this;
	var isListening = false;

	//expose public
	
	this.add = add;
	this.addListeners = addListeners;

	this.routes = [];
	this.nsps = [];

	/**
	 * Register a route in current router.
	 * @param {String}   namespace (not mandatory argument)
	 * @param {String}   route    The socket.io route.
	 * @param {Function} callback Will be called with socket as a parameter.
	 */
	function add(namespace, route, callback) {

		if(isListening) throw Error("Sockpress cannot declare another route after application start.");

		if(!callback) {
			callback = route;
			route = namespace;
			namespace = "/";
		}
		if(typeof namespace !== "string" || typeof route !== "string" || typeof callback !== "function")
			throw Error("Bad arguments in sockpress/route");

		this.routes.push({namespace: namespace, route: route, fn: callback});

		if(this.nsps.indexOf(namespace) < 0)
			this.nsps.push(namespace);
	}

	/**
	 * Add listeners to an application for each namespace.
	 * Warning ! Should be called after each route initialization.
	 * @param {SocketIo} io
	 */
	function addListeners(io) {

		for(var i = 0; i < that.nsps.length; i++) {

			(function(i) {
				io.of(that.nsps[i]).on("connection", function(s) {
					listen(that.nsps[i], s);
				});
			})(i);
			
		}

		isListening = true;
	}


	/** PRIVATE METHODS **/

	function listen(namespace, socket) {

		for(var i = 0; i < that.routes.length; i++) {

			if(that.routes[i].namespace !== namespace) continue;

			(function(i) {
				socket.on(that.routes[i].route, function(data) {
					that.routes[i].fn(socket, data);
				});
			})(i);
		}

	}

}

module.exports = Router;