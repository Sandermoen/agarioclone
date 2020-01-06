// Where all our main socket stuff will go
const io = require('../servers').io;

const Orb = require('./classes/Orb');
let orbs = [];

initGame();

io.sockets.on('connect', socket => {
  socket.emit('init', {
    orbs
  });
});

// Run at the beginning of a new game
function initGame() {
  for (let i = 0; i < 500; i++) {
    orbs.push(new Orb());
  }
}

module.exports = io;
