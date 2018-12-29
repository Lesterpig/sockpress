/**
 * Example sockpress server, used in unit tests.
 */

import { init } from '../../lib';
import assert from 'assert';
import fs from 'fs';
import path from 'path';

const app = init({
  secret: 'key', https: {
    cert: fs.readFileSync(path.join(__dirname, 'ssl_certs', 'cert.pem')),
    key: fs.readFileSync(path.join(__dirname, 'ssl_certs', 'key.pem'))
  }
});

app.get('/foo', (_, res) => {
  res.send('bar');
});

app.io.on('connection', socket => {
  socket.emit('welcome', 'welcome');
  socket.on('PING', function (m) {
    assert.equal('Hi, I am the client', m);
    socket.emit('PONG', 'Hi, I am the server');
  });
});

export default {
  server: null,
  start: function(done) {
    this.server = app.listen(3334, done);
  },
  stop: function(done) {
    if (this.server) {
      this.server.close(done);
    } else {
      done();
    }
  }
};