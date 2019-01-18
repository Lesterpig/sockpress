// This is just used for an instanceof check for mounting a Router object
import Route from './route'
import middleware from './session-middleware'

/*
 * This will be initialized once and all Routers will register with this
 */
class Routing {
  constructor (app, options) {
    this.app = app
    this.options = options
    this.isListening = false
    this.sessionMiddleware = middleware(options)
    this.routes = []
    this.nsps = ['/']

    app.io.use(this.sessionMiddleware)
  }

  /**
   * Register a route in current router.
   * @param {String}   namespace (not mandatory argument)
   * @param {String}   route     The socket.io route.
   * @param {Function} callback  Will be called with socket as a parameter.
   */
  add (namespace, route, callback) {
    if (this.isListening) throw Error('Sockpress cannot declare another route after application start.')

    if (!callback) {
      callback = route
      route = namespace
      namespace = '/'
    }

    if (typeof namespace !== 'string' || typeof route !== 'string' || (typeof callback !== 'function' && !(callback instanceof Route().constructor))) {
      throw Error('Bad arguments in sockpress/routing')
    }

    // Either a single route or a Router object
    if (callback instanceof Route().constructor) {
      // Hook here as connection events don't recursively call the add function, only custom events
      this._addSessionMiddlewareToNamespace(route)
      this._addRouteObject(namespace, route, callback)
    } else {
      this._addSessionMiddlewareToNamespace(namespace)
      this._addSingleRoute(namespace, route, callback)
    }
  }

  /**
   * Add listeners to an application for each namespace.
   * Warning: Should be called after each route initialization.
   * @param {SocketIo} io
   */
  addListeners (io) {
    for (let i = 0; i < this.nsps.length; i++) {
      ((i) => {
        io.of(this.nsps[i]).on('connection', (socket) => {
          this._listen(this.nsps[i], socket)
        })
      })(i)
    }

    this.isListening = true
  }

  /* Private functions, use it at your own risk */

  _addSessionMiddlewareToNamespace (route) {
    if (this.nsps.indexOf(route) < 0) {
      this.nsps.push(route)
      // For each namespace, we need to register the session middleware
      // This has to be done outside of addListeners as other middleware may rely on this and can be registered before addListeners is called
      this.app.io.of(route).use(this.sessionMiddleware)
    }
  }

  _addSingleRoute (namespace, route, callback) {
    this.routes.push({
      'namespace': namespace,
      'route': route,
      'fn': callback
    })
  }

  _addRouteObject (namespace, route, routeInstance) {
    let routeCache, middleware

    // Add all client 'on' events (connection, etc)
    for (let r = 0, rl = routeInstance.clientEventHandlers.length; r < rl; r++) {
      routeCache = routeInstance.clientEventHandlers[r]

      if (!routeCache.event) {
        throw Error('Invalid socket param "event" supplied')
      }
      this.app.io.of(route).on(routeCache.event, routeCache.handler)
    }

    // Add all route events
    for (let r = 0, rl = routeInstance.eventHandlers.length; r < rl; r++) {
      routeCache = routeInstance.eventHandlers[r]

      if (!routeCache.event) {
        throw Error('Invalid socket route param "event" supplied')
      }
      this.add(route, routeCache.event, routeCache.handler)
    }
    // Loop over all middleware and add it
    for (let r = 0, rl = routeInstance.middlewares.length; r < rl; r++) {
      middleware = routeInstance.middlewares[r]
      if (typeof middleware !== 'function') {
        throw Error('Invalid socket middleware supplied')
      }
      this.app.io.of(route).use(middleware)
    }
  }

  _listen (namespace, socket) {
    for (let i = 0; i < this.routes.length; i++) {
      if (this.routes[i].namespace !== namespace) continue
      ((i) => {
        socket.on(this.routes[i].route, (data) => {
          this.routes[i].fn(socket, data)
        })
      })(i)
    }
  }
}

export default Routing
