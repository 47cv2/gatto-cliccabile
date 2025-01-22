// playerData.js
class PlayerData {
    constructor() {
        this.defaultState = {
            minerals: 0,
            perClick: 1,
            autoMiners: 0,
            clickUpgradeCost: 10,
            autoUpgradeCost: 50,
            lastSave: Date.now(),
            achievements: [],
            statistics: {
                totalClicks: 0,
                totalMinerals: 0,
                playTime: 0
            }
        };
        
        this.gameState = this.loadGame();
    }

    loadGame() {
        const savedGame = localStorage.getItem('spaceMinerSave');
        if (savedGame) {
            const loadedState = JSON.parse(savedGame);
            // Calcola i minerali guadagnati offline
            const timeDiff = (Date.now() - loadedState.lastSave) / 1000; // in secondi
            if (loadedState.autoMiners > 0) {
                loadedState.minerals += (loadedState.autoMiners * 0.1) * timeDiff;
            }
            return loadedState;
        }
        return {...this.defaultState};
    }

    saveGame() {
        this.gameState.lastSave = Date.now();
        localStorage.setItem('spaceMinerSave', JSON.stringify(this.gameState));
    }

    resetGame() {
        this.gameState = {...this.defaultState};
        this.saveGame();
    }

    updateStatistics(clickCount = 0, mineralsGained = 0) {
        this.gameState.statistics.totalClicks += clickCount;
        this.gameState.statistics.totalMinerals += mineralsGained;
        this.checkAchievements();
    }

    checkAchievements() {
        const achievements = [
            {
                id: 'firstMiner',
                condition: () => this.gameState.autoMiners >= 1,
                title: 'Primo Minatore!',
                description: 'Acquista il tuo primo minatore automatico'
            },
            {
                id: 'mineralMaster',
                condition: () => this.gameState.statistics.totalMinerals >= 1000,
                title: 'Maestro dei Minerali',
                description: 'Accumula 1000 minerali in totale'
            },
            {
                id: 'clickMaster',
                condition: () => this.gameState.statistics.totalClicks >= 500,
                title: 'Click Master',
                description: 'Clicca 500 volte'
            }
        ];

        achievements.forEach(achievement => {
            if (!this.gameState.achievements.includes(achievement.id) && achievement.condition()) {
                this.gameState.achievements.push(achievement.id);
                this.notifyAchievement(achievement);
            }
        });
    }

    notifyAchievement(achievement) {
        // Mostra una notifica usando l'API di Telegram
        if (window.Telegram?.WebApp) {
            window.Telegram.WebApp.showPopup({
                title: '🏆 Nuovo Achievement!',
                message: `${achievement.title}\n${achievement.description}`,
                buttons: [{type: 'ok'}]
            });
        }
    }

    getProgress() {
        return {
            mineralsPerSecond: this.gameState.autoMiners * 0.1,
            achievementsUnlocked: this.gameState.achievements.length,
            totalAchievements: 3, // Aggiorna questo numero quando aggiungi nuovi achievement
            statistics: this.gameState.statistics
        };
    }
}

export default PlayerData;
