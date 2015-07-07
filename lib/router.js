'use strict';

var Router = function (app, options) {

  var that        = this;
  var isListening = false;

  //expose public

  this.add = add;
  this.addListeners = addListeners;

  this.routes = [];
  this.nsps   = ['/'];

  function _sessionHook(socket, next) {

    if (socket.request.headers.cookie && !options.disableSession) {
      var _cookies = require('cookie').parse(socket.request.headers.cookie);
      if (_cookies[options.name]) {

        //decode the cookie using session secret
        var _sid = require('cookie-parser').signedCookie(_cookies[options.name], options.secret);

        options.store.get(_sid, function (err, session) {
          if (err || !session) {
            setInvalidSession(socket);
            return next();
          }

          //Adding properties
          session.save = function (fn) {
            options.store.set(_sid, this, (fn || function () { }));
          };

          socket.session = session;
          next();
        });

      } else {
        setInvalidSession(socket); next();
      }
    } else {
      setInvalidSession(socket); next();
    }

  }

  // Base session hook
  // namespaces register their own within 'add'
  app.io.use(_sessionHook);

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
    if (typeof namespace !== 'string' || typeof route !== 'string' || typeof callback !== 'function')
      throw Error('Bad arguments in sockpress/route');

    this.routes.push({
      'namespace': namespace,
      'route'    : route,
      'fn'       : callback
    });

    if (this.nsps.indexOf(namespace) < 0) {

      this.nsps.push(namespace);

      // For each namespace, we need to register the session middleware
      // This has to be done outside of addListeners as other middleware may rely on this and can be registered before addListeners is called
      app.io.of(namespace).use(_sessionHook);

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
        io.of(that.nsps[i]).on('connection', function (s) {
          listen(that.nsps[i], s);
        });
      })(i);

    }

    isListening = true;
  }


  /** PRIVATE METHODS **/

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

/** PRIVATE **/

function setInvalidSession(socket) {
  socket.session = {};
  socket.session.save = function (callback) {
    callback = callback || function () { };
    callback('Session is not initialized. Init it with a classic express request.');
  };
}

module.exports = Router;
