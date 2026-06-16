class AdminSystem {
  constructor() {
    this.ADMIN_PASSWORD = process.env.ADMIN_CODE || 'Lisayonaracantik';
    this.admins = {};
  }

  verifyAdmin(socketId, roomCode) {
    return this.admins[socketId]?.roomCode === roomCode;
  }

  authenticate(socketId, password, roomCode) {
    if (password === this.ADMIN_PASSWORD) {
      this.admins[socketId] = {
        roomCode,
        verifiedAt: Date.now()
      };
      console.log(`[ADMIN] Admin access granted for ${socketId}`);
      return true;
    }
    console.log(`[ADMIN] Failed admin attempt for ${socketId}`);
    return false;
  }

  revoke(socketId) {
    delete this.admins[socketId];
  }

  isAdmin(socketId) {
    return !!this.admins[socketId];
  }
}

module.exports = AdminSystem;
