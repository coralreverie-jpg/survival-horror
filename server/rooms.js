class RoomManager {
  constructor() {
    this.rooms = {};
  }

  generateRoomCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  createRoom(hostId, hostName) {
    const code = this.generateRoomCode();
    
    this.rooms[code] = {
      code,
      hostId,
      players: [{
        id: hostId,
        name: hostName,
        lives: 3,
        position: { x: 0, y: 1.6, z: 0 },
        eliminated: false,
        itemsCollected: []
      }],
      gameStarted: false,
      missions: [],
      completedMissions: [],
      scpPosition: { x: 0, y: 2, z: 0 },
      scpState: 'idle',
      scpAlerted: false,
      timeStop: false,
      adminFastMode: false,
      createdAt: Date.now(),
      maxPlayers: 4
    };
    
    console.log(`[ROOM] New room created: ${code}`);
    return this.rooms[code];
  }

  joinRoom(playerId, playerName, roomCode, isHost = false) {
    if (isHost) {
      return this.createRoom(playerId, playerName);
    }
    
    const room = this.rooms[roomCode];
    
    if (!room) {
      return null;
    }
    
    if (room.players.length >= room.maxPlayers) {
      return null;
    }
    
    room.players.push({
      id: playerId,
      name: playerName,
      lives: 3,
      position: { x: Math.random() * 5 - 2.5, y: 1.6, z: Math.random() * 5 - 2.5 },
      eliminated: false,
      itemsCollected: []
    });
    
    console.log(`[ROOM] ${playerName} joined room ${roomCode}`);
    return room;
  }

  getRoom(roomCode) {
    return this.rooms[roomCode];
  }

  getPlayer(roomCode, playerId) {
    const room = this.getRoom(roomCode);
    if (!room) return null;
    return room.players.find(p => p.id === playerId);
  }

  removePlayer(playerId) {
    for (const roomCode in this.rooms) {
      const room = this.rooms[roomCode];
      const playerIndex = room.players.findIndex(p => p.id === playerId);
      
      if (playerIndex !== -1) {
        room.players.splice(playerIndex, 1);
        
        if (room.players.length === 0) {
          delete this.rooms[roomCode];
          console.log(`[ROOM] Room ${roomCode} deleted (empty)`);
        }
        
        return room;
      }
    }
    return null;
  }

  updatePlayerPosition(roomCode, playerId, position) {
    const player = this.getPlayer(roomCode, playerId);
    if (player) {
      player.position = position;
    }
  }

  getActiveRooms() {
    return Object.values(this.rooms).filter(room => !room.gameStarted);
  }
}

module.exports = RoomManager;
