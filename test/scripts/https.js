/**
 * Example sockpress server, used in unit tests.
 */

'use strict';

var sockpress = require('../../lib/index');
var assert    = require('assert');
var fs        = require('fs');
var path      = require('path');

var app = sockpress.init({secret: 'key', https: {
  cert: fs.readFileSync(path.join(__dirname, 'ssl_certs', 'cert.pem')),
  key:  fs.readFileSync(path.join(__dirname, 'ssl_certs', 'key.pem'))
}});

app.get('/foo', function(req, res) {
  res.send('bar');
});

app.io.on('connection', function(socket) {
  socket.emit('welcome', 'welcome');
  socket.on('PING', function(m) {
    assert.equal('Hi, I am the client', m);
    socket.emit('PONG', 'Hi, I am the server');
  });
});

/** START! */
module.exports = {
  server: null,
  start: function(done) {
    this.server = app.listen(3334, done);
  },
  stop: function(done) {
    if(this.server)
      this.server.close(done);
    else
      done();
  }
}
