'use strict';

// This is just used for an instanceof check for mounting a Router object
var Route = require('./route')();

/*
 * This will be initialized once and all Routers will register with this
 */
var Routing = function (app, options) {

  var that        = this;
  var isListening = false;
  var sessionMiddleware = require('./sessionMiddleware')(options);

  // Expose public
  this.add = add;
  this.addListeners = addListeners;

  this.routes = [];
  this.nsps   = ['/'];

  // Base session hook
  // Namespaces register their own within 'add'
  app.io.use(sessionMiddleware);

  /**
   * Register a route in current router.
   * @param {String}   namespace (not mandatory argument)
   * @param {String}   route     The socket.io route.
   * @param {Function} callback  Will be called with socket as a parameter.
   */
  function add(namespace, route, callback) {
    if (isListening) throw Error('Sockpress cannot declare another route after application start.');

    if (!callback) {
      callback = route;
      route = namespace;
      namespace = '/';
    }

    if (typeof namespace !== 'string' || typeof route !== 'string' || (typeof callback !== 'function' && !(callback instanceof Route.constructor))) {
      throw Error('Bad arguments in sockpress/routing');
    }

    // Either a single route or a Router object
    if(callback instanceof Route.constructor) {
      _addRouteObject(namespace, route, callback);
    } else {
      _addSingleRoute(namespace, route, callback);
    }
  }

  function _addSingleRoute(namespace, route, callback) {
    that.routes.push({
      'namespace': namespace,
      'route'    : route,
      'fn'       : callback
    });

    if (that.nsps.indexOf(namespace) < 0) {
      that.nsps.push(namespace);
      // For each namespace, we need to register the session middleware
      // This has to be done outside of addListeners as other middleware may rely on this and can be registered before addListeners is called
      app.io.of(namespace).use(sessionMiddleware);
    }
  }

  function _addRouteObject(namespace, route, routeInstance) {
    var routeCache, middleware;

    // Add all client 'on' events (connection, etc)
    for (var r = 0, rl = routeInstance._clientEventHandlers.length; r < rl; r++) {
      routeCache = routeInstance._clientEventHandlers[r];

      if (!routeCache.event) {
        throw Error('Invalid socket param "event" supplied');
      }
      app.io.of(route).on(routeCache.event, routeCache.handler);
    }

    // Add all route events
    for (var r = 0, rl = routeInstance._eventHandlers.length; r < rl; r++) {
      routeCache = routeInstance._eventHandlers[r];

      if (!routeCache.event) {
        throw Error('Invalid socket route param "event" supplied');
      }
      add(route, routeCache.event, routeCache.handler);
    }
    // Loop over all middleware and add it
    for (var r = 0, rl = routeInstance._middleware.length; r < rl; r++) {
      middleware = routeInstance._middleware[r];
      if (typeof middleware !== 'function') {
        throw Error('Invalid socket middleware supplied');
      }
      app.io.of(route).use(middleware);
    }
  }

  /**
   * Add listeners to an application for each namespace.
   * Warning: Should be called after each route initialization.
   * @param {SocketIo} io
   */
  function addListeners(io) {
    for (var i = 0; i < that.nsps.length; i++) {

      (function (i) {
        io.of(that.nsps[i]).on('connection', function (socket) {
          listen(that.nsps[i], socket);
        });
      })(i);

    }
    isListening = true;
  }

  /** PRIVATE METHOD **/
  function listen(namespace, socket) {
    for (var i = 0; i < that.routes.length; i++) {
      if (that.routes[i].namespace !== namespace) continue;
      (function (i) {
        socket.on(that.routes[i].route, function (data) {
          that.routes[i].fn(socket, data);
        });
      })(i);
    }
  }
};

module.exports = Routing;
