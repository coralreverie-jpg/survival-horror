const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
require('dotenv').config();

const RoomManager = require('./rooms');
const MissionManager = require('./missions');
const AdminSystem = require('./admin');
const SCPAi = require('./scp-ai');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(express.static(path.join(__dirname, '../client')));
app.use(express.json());

// Initialize managers
const roomManager = new RoomManager();
const missionManager = new MissionManager();
const adminSystem = new AdminSystem();
const scpAi = new SCPAi();

// Socket.IO Events
io.on('connection', (socket) => {
  console.log(`[CONNECT] Player joined: ${socket.id}`);

  // Player joins game
  socket.on('player-join', (data) => {
    const { playerName, roomCode, isHost } = data;
    const room = roomManager.joinRoom(socket.id, playerName, roomCode, isHost);
    
    if (room) {
      socket.join(`room-${room.code}`);
      io.to(`room-${room.code}`).emit('player-list-update', room.players);
      console.log(`[JOIN] ${playerName} joined room ${room.code}`);
    } else {
      socket.emit('error', 'Room not found or full');
    }
  });

  // Host starts game
  socket.on('start-game', (roomCode) => {
    const room = roomManager.getRoom(roomCode);
    if (room && room.hostId === socket.id) {
      room.gameStarted = true;
      room.startTime = Date.now();
      
      // Initialize missions
      const missions = missionManager.generateMissions();
      room.missions = missions;
      
      // Spawn SCP
      room.scpPosition = { x: 0, y: 2, z: 0 };
      room.scpState = 'idle';
      
      io.to(`room-${roomCode}`).emit('game-start', {
        missions,
        roomCode,
        players: room.players,
        timeLimit: 30 * 60 * 1000
      });
      
      console.log(`[START] Game started in room ${roomCode}`);
      
      // Start SCP AI loop
      startSCPLoop(roomCode, room, io);
    }
  });

  // Player voice activity
  socket.on('voice-activity', (data) => {
    const { roomCode, volume, playerName } = data;
    const room = roomManager.getRoom(roomCode);
    
    if (room && room.gameStarted) {
      io.to(`room-${roomCode}`).emit('player-speaking', {
        playerName,
        volume,
        timestamp: Date.now()
      });
      
      if (volume > 0.7) {
        room.scpAlerted = true;
        room.lastLoudNoisePos = data.playerPos;
      }
    }
  });

  // Player completes mission
  socket.on('mission-complete', (data) => {
    const { roomCode, missionId } = data;
    const room = roomManager.getRoom(roomCode);
    
    if (room) {
      room.completedMissions.push(missionId);
      io.to(`room-${roomCode}`).emit('mission-update', {
        completedMissions: room.completedMissions,
        totalMissions: 7
      });
      
      if (room.completedMissions.length === 7) {
        io.to(`room-${roomCode}`).emit('final-mission', {
          message: 'FINAL MISSION: ESCAPE THE HOUSE!'
        });
      }
    }
  });

  // Player takes damage
  socket.on('player-damage', (data) => {
    const { roomCode, playerName } = data;
    const room = roomManager.getRoom(roomCode);
    
    if (room) {
      const player = room.players.find(p => p.name === playerName);
      if (player) {
        player.lives--;
        io.to(`room-${roomCode}`).emit('player-damaged', {
          playerName,
          lives: player.lives,
          isEliminated: player.lives === 0
        });
        
        if (player.lives === 0) {
          player.eliminated = true;
          console.log(`[DEATH] ${playerName} eliminated in room ${roomCode}`);
        }
      }
    }
  });

  // Admin commands
  socket.on('admin-command', (data) => {
    const { roomCode, command, payload } = data;
    const isAdmin = adminSystem.verifyAdmin(socket.id, roomCode);
    
    if (isAdmin) {
      handleAdminCommand(command, roomCode, payload, io, roomManager);
    } else {
      socket.emit('error', 'Unauthorized');
    }
  });

  // Disconnect
  socket.on('disconnect', () => {
    const room = roomManager.removePlayer(socket.id);
    if (room) {
      io.to(`room-${room.code}`).emit('player-disconnected', {
        playerName: room.players.find(p => p.id === socket.id)?.name || 'Unknown'
      });
      console.log(`[DISCONNECT] Player left room ${room.code}`);
    }
  });
});

// SCP AI Loop
function startSCPLoop(roomCode, room, io) {
  const scpInterval = setInterval(() => {
    if (!room.gameStarted) {
      clearInterval(scpInterval);
      return;
    }
    
    if (room.scpAlerted) {
      room.scpState = 'hunting';
    } else {
      room.scpState = 'patrolling';
      room.scpPosition.x += (Math.random() - 0.5) * 2;
      room.scpPosition.z += (Math.random() - 0.5) * 2;
    }
    
    io.to(`room-${roomCode}`).emit('scp-position', {
      position: room.scpPosition,
      state: room.scpState
    });
  }, 1000);
}

// Admin Commands Handler
function handleAdminCommand(command, roomCode, payload, io, roomManager) {
  const room = roomManager.getRoom(roomCode);
  
  if (!room) return;
  
  switch(command) {
    case 'stop-time':
      room.timeStop = true;
      io.to(`room-${roomCode}`).emit('time-stopped', {
        message: '⏸️ Time has stopped!'
      });
      setTimeout(() => {
        room.timeStop = false;
        io.to(`room-${roomCode}`).emit('time-resumed');
      }, 5000);
      break;
      
    case 'fast-shoes':
      room.adminFastMode = !room.adminFastMode;
      io.to(`room-${roomCode}`).emit('admin-fast-mode', {
        enabled: room.adminFastMode
      });
      break;
      
    case 'portal':
      io.to(`room-${roomCode}`).emit('admin-portal', {
        message: 'Admin is teleporting!'
      });
      break;
  }
}

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/index.html'));
});

app.get('/game', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/game.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/admin-panel.html'));
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`\n🔴 SCP Horror Game Server`);
  console.log(`🚀 Running on http://localhost:${PORT}`);
  console.log(`⏰ Waiting for players...\n`);
});

module.exports = { io, roomManager, missionManager };
