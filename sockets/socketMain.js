// Where all our main socket stuff will go
const io = require('../servers').io;
const {
  checkForOrbCollisions,
  checkForPlayerCollisions
} = require('./checkCollisions');

const Player = require('./classes/Player');
const PlayerConfig = require('./classes/PlayerConfig');
const PlayerData = require('./classes/PlayerData');
const Orb = require('./classes/Orb');

let orbs = [];
let players = [];
let settings = {
  defaultOrbs: 50,
  defaultSpeed: 6,
  defaultSize: 6,
  // as a player gets bigger the zoom needs to go out
  defaultZoom: 1.5,
  worldWidth: 500,
  worldHeight: 500
};

initGame();

// issue a message to every connected socket 30 fps
setInterval(() => {
  if (players.length > 0) {
    io.to('game').emit('tock', {
      players
    });
  }
}, 33); // there are 30 33s in 1000 milliseconds, or 1/30th of a second, or 1 of 30 frames per second

io.sockets.on('connect', socket => {
  let player = {};
  player.tickSent = false;
  // a player has connected
  socket.on('init', data => {
    // add the player to the game namespace
    socket.join('game');
    // make a playerConfig object
    let playerConfig = new PlayerConfig(settings);
    // make a player data object
    let playerData = new PlayerData(data.playerName, settings);
    // make a master player object to hold both
    player = new Player(socket.id, playerConfig, playerData);

    // issue a message to THIS CLIENT with its loc 30 times per second
    setInterval(() => {
      if (players.length > 0) {
        socket.emit('tickTock', {
          playerX: player.playerData.locX,
          playerY: player.playerData.locY
        });
      }
    }, 33); // there are 30 33s in 1000 milliseconds, or 1/30th of a second, or 1 of 30 frames per second

    socket.emit('initReturn', {
      orbs
    });
    players.push(playerData);
  });
  // the client sent over a tick, that means we know what direction to move the socket
  socket.on('tick', data => {
    player.tickSent = true;
    if (data.xVector && data.yVector) {
      speed = player.playerConfig.speed;
      // update the player config object with the new direction in data
      // and at the same time create a local variable for this callback for readability
      xV = player.playerConfig.xVector = data.xVector;
      yV = player.playerConfig.yVector = data.yVector;

      if (
        (player.playerData.locX < 5 && player.playerData.xVector < 0) ||
        (player.playerData.locX > settings.worldWidth && xV > 0)
      ) {
        player.playerData.locY -= speed * yV;
      } else if (
        (player.playerData.locY < 5 && yV > 0) ||
        (player.playerData.locY > settings.worldHeight && yV < 0)
      ) {
        player.playerData.locX += speed * xV;
      } else {
        player.playerData.locX += speed * xV;
        player.playerData.locY -= speed * yV;
      }
    }
    // ORB COLLISION
    let capturedOrb = checkForOrbCollisions(
      player.playerData,
      player.playerConfig,
      orbs,
      settings
    );
    capturedOrb
      .then(data => {
        // a collision happened
        // emit to all sockets the orb to replace
        const orbData = {
          orbIndex: data,
          newOrb: orbs[data]
        };
        // console.log(orbData);
        io.sockets.emit('orbSwitch', orbData);
      })
      .catch(() => {
        // no collision
      });

    // PLAYER COLLISION
    let playerDeath = checkForPlayerCollisions(
      player.playerData,
      player.playerConfig,
      players,
      player.socketId
    );
    playerDeath
      .then(data => {
        console.log('player collision!');
      })
      .catch(() => {
        // No player collision
      });
  });
});

// Run at the beginning of a new game
function initGame() {
  for (let i = 0; i < settings.defaultOrbs; i++) {
    orbs.push(new Orb(settings));
  }
}

module.exports = io;
