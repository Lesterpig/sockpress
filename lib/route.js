/**
 * Route class
 */
class Route {
  constructor () {
    this.clientEventHandlers = []
    this.eventHandlers = []
    this.middlewares = []
  }

  use (func) {
    this.middlewares.push(func)
    return this
  }

  on (event, handler) {
    if (arguments.length < 2) {
      throw new Error('Invalid arguments length')
    }

    this.clientEventHandlers.push({ event, handler })
    return this
  }

  event (event, handler) {
    // Check arguments
    if (arguments.length < 2) {
      throw new Error('Invalid arguments length')
    }

    // Add route event
    this.eventHandlers.push({ event, handler })
    return this
  }
}

export { Route }
export default () => new Route()
