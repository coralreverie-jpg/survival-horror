class SCPAi {
  constructor() {
    this.routes = [
      [{x:0,y:1,z:0},{x:5,y:1,z:0},{x:5,y:1,z:5},{x:0,y:1,z:5}],
      [{x:0,y:2,z:0},{x:-5,y:2,z:0},{x:-5,y:2,z:5},{x:0,y:2,z:5}],
      [{x:0,y:3,z:0},{x:3,y:3,z:3},{x:-3,y:3,z:3},{x:0,y:3,z:0}]
    ];
  }

  calculateDistance(pos1, pos2) {
    return Math.sqrt(
      Math.pow(pos1.x - pos2.x, 2) +
      Math.pow(pos1.y - pos2.y, 2) +
      Math.pow(pos1.z - pos2.z, 2)
    );
  }

  findNearestPlayer(scpPos, players) {
    let nearest = null;
    let minDistance = Infinity;

    players.forEach(player => {
      if (!player.eliminated) {
        const distance = this.calculateDistance(scpPos, player.position);
        if (distance < minDistance) {
          minDistance = distance;
          nearest = player;
        }
      }
    });

    return nearest;
  }

  moveTowards(currentPos, targetPos, speed = 0.5) {
    const direction = {
      x: targetPos.x - currentPos.x,
      y: targetPos.y - currentPos.y,
      z: targetPos.z - currentPos.z
    };

    const distance = Math.sqrt(
      direction.x * direction.x +
      direction.y * direction.y +
      direction.z * direction.z
    );

    if (distance > 0.1) {
      return {
        x: currentPos.x + (direction.x / distance) * speed,
        y: currentPos.y + (direction.y / distance) * speed,
        z: currentPos.z + (direction.z / distance) * speed
      };
    }

    return currentPos;
  }

  patrol(scpPos, floorNumber = 0) {
    const route = this.routes[floorNumber];
    if (!route) return scpPos;
    const waypoint = route[Math.floor(Math.random() * route.length)];
    return this.moveTowards(scpPos, waypoint, 0.2);
  }

  hunt(scpPos, targetPlayer) {
    return this.moveTowards(scpPos, targetPlayer.position, 1.0);
  }

  scream() {
    return Math.random() * 0.5 + 0.5;
  }
}

module.exports = SCPAi;
