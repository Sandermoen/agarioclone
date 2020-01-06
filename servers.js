// this file is only used for making the socket.io server and the express server
const express = require('express');
const app = express();
app.use(express.static(__dirname + '/public'));
const socketio = require('socket.io');
const expressServer = app.listen(8080);
const io = socketio(expressServer);
const helmet = require('helmet');
app.use(helmet());
console.log('Express and socket.io are listening on port 8080');

module.exports = {
  app,
  io
};
