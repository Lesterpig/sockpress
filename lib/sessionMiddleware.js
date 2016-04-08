var cookie = require('cookie');
var cookieParser = require('cookie-parser');

/** PRIVATE **/
function setInvalidSession(socket) {
  socket.session = {};
  socket.session.save = function (callback) {
    callback = callback || function () { };
    callback('Session is not initialized. Init it with a classic express request.');
  };
}

module.exports = function(sockpressOptions) {
  // We need to scope the options variable so it isn't cached when the file is required
  var options = sockpressOptions;
  // Return middleware for the socket
  return function (socket, next) {

    if (!options.disableSession && socket.request.headers.cookie) {
      var _cookies = cookie.parse(socket.request.headers.cookie);
      if (_cookies[options.name]) {

        //decode the cookie using session secret
        var _sid = cookieParser.signedCookie(_cookies[options.name], options.secret);

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

  };
};
