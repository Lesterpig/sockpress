var Router = function() {

	var that = this;

	this.routes = [];

	/**
	 * Register a route in current router.
	 * @param {String}   route    The socket.io route.
	 * @param {Function} callback Will be called with socket as a parameter.
	 */
	function add(route, callback) {
		if(typeof route !== "string" || typeof callback !== "function") throw Error("Bad arguments in route");
		this.routes.push({route: route, fn: callback});
	}

	/**
	 * Add event listenners to a socket (on connection)
	 * @param  {Object} socket
	 */
	function listen(socket) {

		for(var i = 0; i < that.routes.length; i++) {
			(function(i) {
				socket.on(that.routes[i].route, function(data) {
					that.routes[i].fn(socket, data);
				});
			})(i); // TODO : Potential memory leak ?
		}

	}

	//expose public methods
	
	this.add = add;
	this.listen = listen;

}

module.exports = Router;