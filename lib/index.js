/**
 * Sockpress Module
 *
 * Inspired by https://gist.github.com/bobbydavid/2640463
 */

import express from 'express'
import session from 'express-session'
import io from 'socket.io'
import Routing from './routing'
import Route from './route'

export default (app, options) => {
  if (!app && !options) {
    options = {}
  } else if (!options) {
    options = app
    app = undefined
  }

  // Defaults values for options
  options.name = options.name || 'sockpress.id'
  options.store = options.store || new session.MemoryStore()
  options.resave = options.resave === undefined ? true : !!options.resave
  options.saveUninitialized = options.saveUninitialized === undefined ? true : !!options.saveUninitialized

  app = options.app || app || express() // Load an express instance
  app.express = express // Expose raw express object for middlewares

  // Load http or https nodejs server

  const server = (!options.https)
    ? require('http').createServer(app)
    : require('https').createServer(options.https, app)

  if (!options.disableSession) {
    app.use(session(options)) // Enable session support in express
  }

  app.io = io(server, options.io)
  app.rawServer = server

  // Init IO Routing
  const routing = new Routing(app, options)

  // Expose new methods :

  /**
   * Start express and socket.io applications.
   * @params : see http://nodejs.org/api/http.html#http_server_listen_port_hostname_backlog_callback
   */
  app.listen = function () {
    if (!app.io.hasListeners) {
      routing.addListeners(app.io)
      app.io.hasListeners = true
    }

    return server.listen.apply(server, arguments)
  }

  /**
   * Add a new socket.io route (convenience method)
   * @param  {String}   [namespace] socket.io namespace. Defaults to "/".
   * @param  {String}   eventName   the event name (should be unique)
   * @param  {Function} fn          callback function or instance of Router
   */
  app.io.route = (namespace, eventName, fn) => {
    routing.add(namespace, eventName, fn)
  }

  // Expose Route object to create mountable sub-routes
  app.io.Route = Route

  return app
}
