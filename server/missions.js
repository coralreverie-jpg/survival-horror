class MissionManager {
  constructor() {
    this.missionTemplates = [
      {
        id: 1,
        title: 'Find the Candles',
        description: 'Collect 3 candles scattered in the main room',
        type: 'collect',
        requiredItems: 3,
        itemName: 'candle',
        hints: ['Look on the shelves', 'Check the table', 'Near the fireplace']
      },
      {
        id: 2,
        title: 'Answer the Riddle',
        description: 'What walks on four legs in the morning, two in the afternoon, and three at night?',
        type: 'riddle',
        correctAnswer: 'man',
        hints: ['It is a creature', 'Humans do this', 'Life stages']
      },
      {
        id: 3,
        title: 'Collect Ancient Texts',
        description: 'Find 5 pages of the forbidden book scattered around the house',
        type: 'collect',
        requiredItems: 5,
        itemName: 'book-page',
        hints: ['Check upstairs', 'Under beds', 'In closets', 'Behind paintings']
      },
      {
        id: 4,
        title: 'Open the Safe',
        description: 'Use the code found in mission 3 to open the safe in the basement',
        type: 'puzzle',
        correctAnswer: '1337',
        hints: ['The book pages spell a number', 'Four digit code', 'Extract from text']
      },
      {
        id: 5,
        title: 'Map Riddle',
        description: 'What has cities, but no houses, forests but no trees, and water but no fish?',
        type: 'riddle',
        correctAnswer: 'map',
        hints: ['Geographic item', 'Used for navigation', 'You can hold it']
      },
      {
        id: 6,
        title: 'Activate the Control Panel',
        description: 'Reach the basement and activate all 4 switches to escape',
        type: 'objective',
        requiredItems: 4,
        itemName: 'switch',
        hints: ['Go downstairs', 'Basement has machinery', 'All 4 corners of the basement']
      },
      {
        id: 7,
        title: 'ESCAPE!',
        description: 'Run to the front door and get out of the house!',
        type: 'escape',
        hints: ['SCP is now ALERT', 'RUN!', 'Reach the exit', 'First one to exit wins']
      }
    ];
  }

  generateMissions() {
    return this.missionTemplates.map(mission => ({
      ...mission,
      completed: false,
      progress: 0,
      startedAt: Date.now()
    }));
  }

  getMission(missionId) {
    return this.missionTemplates.find(m => m.id === missionId);
  }

  checkAnswer(missionId, answer) {
    const mission = this.getMission(missionId);
    if (mission && mission.type === 'riddle') {
      return answer.toLowerCase().trim() === mission.correctAnswer.toLowerCase();
    }
    if (mission && mission.type === 'puzzle') {
      return answer.toLowerCase().trim() === mission.correctAnswer.toLowerCase();
    }
    return false;
  }

  updateProgress(mission, itemsCollected) {
    if (mission.type === 'collect') {
      mission.progress = Math.min(itemsCollected, mission.requiredItems);
      mission.completed = mission.progress === mission.requiredItems;
    }
  }
}

module.exports = MissionManager;
