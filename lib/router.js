/**
 * Router class
 */
module.exports = function Router() {
    this._clientEventHandlers = []
    this._eventHandlers = []
    this._middleware = []
    this._route = '/'
    this.route = function(r) {
      this._route = r
      return this
    }
    this.use = function(func) {
      this._middleware.push(func)
    }
    this.on = function(event, handler) {
      if (arguments.length < 2) {
        throw new Error('Invalid arguments length')
      }

      this._clientEventHandlers.push({ event: event, handler: handler })
      
      return this
    }
    /**
     * Namespaces per route have been disabled here as it is not implemented in the routing.js#_addRouter
     * See that function for more information.
     */
    this.event = function(/*namespace, */event, handler) {

      // Check arguments
      if (arguments.length < 2) {
        throw new Error('Invalid arguments length')
      }/* else if (arguments.length === 2) {
        handler = event
        event = namespace
        namespace = '/'
      }*/

      // Add to router
      this._eventHandlers.push({ /*namespace: namespace, */event: event, handler: handler })

      return this
    }
  }