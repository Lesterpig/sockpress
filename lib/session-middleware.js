import cookie from 'cookie'
import cookieParser from 'cookie-parser'

/** PRIVATE **/
const setInvalidSession = (socket) => {
  socket.session = {}
  socket.session.save = (callback) => {
    callback = callback || (() => {})
    callback(new Error('Session is not initialized. Init it with a classic express request.'))
  }
}

export default (sockpressOptions) => {
  // We need to scope the options variable so it isn't cached when the file is required
  const options = sockpressOptions
  // Return middleware for the socket
  return (socket, next) => {
    if (!options.disableSession && socket.request.headers.cookie) {
      const cookies = cookie.parse(socket.request.headers.cookie)
      if (cookies[options.name]) {
        // decode the cookie using session secret
        const sid = cookieParser.signedCookie(cookies[options.name], options.secret)

        options.store.get(sid, (err, session) => {
          if (err || !session) {
            setInvalidSession(socket)
            return next()
          }

          // Adding properties
          session.save = function (fn) {
            options.store.set(sid, this, (fn || (() => {})))
          }

          socket.session = session
          next()
        })
      } else {
        setInvalidSession(socket); next()
      }
    } else {
      setInvalidSession(socket); next()
    }
  }
}
