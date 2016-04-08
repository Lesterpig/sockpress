/**
 * Sockpress Module
 *
 * Inspired by https://gist.github.com/bobbydavid/2640463
 */

'use strict';

var express = require('express'),
    session = require('express-session'),
    io      = require('socket.io'),
    Routing = require('./routing'),
    Route   = require('./route');

module.exports.init = function (options) {

  var _app, _server;

  if (!options) options = {};

  //Defaults values for options
  options.name = options.name || 'sockpress.id';
  options.store = options.store || new session.MemoryStore();
  options.resave = options.resave === undefined ? true : false;
  options.saveUninitialized = options.saveUninitialized === undefined ? true : false;

  _app = express(); // Load an express instance
  _app.express = express; // Expose raw express object for middlewares

  // Load http or https nodejs server
  if (!options.https) {
    _server = require('http').createServer(_app);
  } else {
    _server = require('https').createServer(options.https, _app);
  }

  if (!options.disableSession) {
    _app.use(session(options)); // Enable session support in express
  }

  _app.io = io(_server);
  _app.rawServer = _server;

  // Init IO Routing
  var _routing = new Routing(_app, options);

  // Expose new methods :

  /**
   * Start express and socket.io applications.
   * @params : see http://nodejs.org/api/http.html#http_server_listen_port_hostname_backlog_callback
   */
  _app.listen = function () {
    if (!_app.io.hasListeners) {
      _routing.addListeners(_app.io);
      _app.io.hasListeners = true;
    }

    return _server.listen.apply(_server, arguments);
  };

  /**
   * Add a new socket.io route (convenience method)
   * @param  {String}   [namespace] socket.io namespace. Defaults to "/".
   * @param  {String}   eventName   the event name (should be unique)
   * @param  {Function} fn          callback function or instance of Router
   */
  _app.io.route = function (namespace, eventName, fn) {
    _routing.add(namespace, eventName, fn);
  };

  // Expose Route object to create mountable sub-routes
  _app.io.Route = Route;

  return _app;

};
