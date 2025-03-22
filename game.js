class Game {
    constructor() {
        this.level = 1;
        this.progress = 0;
        this.isRegressing = false;
        this.realmIndex = 0;
        this.startTime = Date.now();
        this.gameInterval = null;
        this.isGameFinished = false;
        this.realms = [
            { name: '凡人境界', maxLevel: 10, speed: 1 },
            { name: '练气境界', maxLevel: 20, speed: 1.5 },
            { name: '筑基境界', maxLevel: 30, speed: 2 },
            { name: '金丹境界', maxLevel: 40, speed: 2.5 },
            { name: '元婴境界', maxLevel: 50, speed: 3 },
            { name: '化神境界', maxLevel: 60, speed: 3.5 },
            { name: '大乘境界', maxLevel: 70, speed: 4 }
        ];

        this.elements = {
            realm: document.getElementById('realm'),
            levelInfo: document.getElementById('level-info'),
            progress: document.getElementById('progress'),
            warning: document.getElementById('warning'),
            messageLog: document.getElementById('message-log')
        };

        this.cultivationEvents = {
            success: [
                '突破瓶颈，感悟天地大道！',
                '福缘际会，修为大进！',
                '天降机缘，修为精进！',
                '悟得真谛，境界提升！',
                '功法圆满，突破在即！'
            ],
            failure: [
                '心魔作祟，道心不稳！',
                '走火入魔，修为倒退！',
                '遭遇心魔，金丹破碎！',
                '分心他顾，道基不稳！',
                '意志不坚，功亏一篑！'
            ]
        };

        this.setupEventListeners();
        this.startCultivation();
    }

    setupEventListeners() {
        // 检测触摸和点击
        document.addEventListener('touchstart', () => this.handleInteraction());
        document.addEventListener('mousedown', () => this.handleInteraction());

        // 检测页面可见性变化
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.handleInteraction();
            }
        });
    }

    handleInteraction() {
        if (!this.isRegressing) {
            this.isRegressing = true;
            this.elements.warning.style.display = 'block';
            this.addMessage(this.getRandomEvent('failure'));
            this.startRegression();
        }
    }

    addMessage(message) {
        const messageElement = document.createElement('div');
        messageElement.className = 'message';
        messageElement.textContent = message;
        this.elements.messageLog.insertBefore(messageElement, this.elements.messageLog.firstChild);
        
        if (this.elements.messageLog.children.length > 5) {
            this.elements.messageLog.removeChild(this.elements.messageLog.lastChild);
        }
    }

    getRandomEvent(type) {
        const events = this.cultivationEvents[type];
        return events[Math.floor(Math.random() * events.length)];
    }

    startCultivation() {
        this.gameInterval = setInterval(() => {
            if (!this.isRegressing && !this.isGameFinished) {
                this.progress += this.realms[this.realmIndex].speed;
                if (this.progress >= 100) {
                    this.levelUp();
                }
                this.updateUI();
            }
        }, 100);
    }

    startRegression() {
        const regressionInterval = setInterval(() => {
            this.progress -= 2;
            if (this.progress < 0) {
                this.progress = 99;
                this.level--;
                
                if (this.level < 1) {
                    if (this.realmIndex > 0) {
                        this.realmIndex--;
                        this.level = this.realms[this.realmIndex].maxLevel;
                    } else {
                        this.level = 1;
                        this.progress = 0;
                        this.isRegressing = false;
                        this.elements.warning.style.display = 'none';
                        clearInterval(regressionInterval);
                    }
                }
            }
            this.updateUI();
        }, 100);
    }

    levelUp() {
        this.level++;
        this.progress = 0;

        const currentRealm = this.realms[this.realmIndex];
        if (this.level > currentRealm.maxLevel && this.realmIndex < this.realms.length - 1) {
            this.realmIndex++;
            this.level = 1;
            this.addMessage(`突破成功，进入${this.realms[this.realmIndex].name}！`);
        } else if (this.realmIndex === this.realms.length - 1 && this.level >= currentRealm.maxLevel) {
            this.finishGame();
        } else {
            this.addMessage(this.getRandomEvent('success'));
        }
    }

    calculateTimeToNext() {
        const currentRealm = this.realms[this.realmIndex];
        const progressNeeded = 100 - this.progress;
        const timePerProgress = 0.1; // 100ms per progress update
        let estimatedSeconds = (progressNeeded / currentRealm.speed) * timePerProgress;

        // Calculate total time to next realm
        if (this.realmIndex < this.realms.length - 1) {
            const remainingLevelsInRealm = currentRealm.maxLevel - this.level;
            const totalSecondsToNextRealm = ((remainingLevelsInRealm * 100) / currentRealm.speed) * timePerProgress + estimatedSeconds;

            if (this.level === currentRealm.maxLevel) {
                return `距离${this.realms[this.realmIndex + 1].name}还需 ${Math.ceil(estimatedSeconds)}秒`;
            } else {
                return `距离下一等级还需 ${Math.ceil(estimatedSeconds)}秒 (到${this.realms[this.realmIndex + 1].name}还需 ${Math.ceil(totalSecondsToNextRealm)}秒)`;
            }
        } else {
            return `距离下一等级还需 ${Math.ceil(estimatedSeconds)}秒`;
        }
    }

    updateUI() {
        const currentRealm = this.realms[this.realmIndex];
        this.elements.realm.textContent = currentRealm.name;
        this.elements.levelInfo.textContent = `等级: ${this.level} (${this.calculateTimeToNext()})`;
        this.elements.progress.style.width = `${this.progress}%`;
    }

    finishGame() {
        this.isGameFinished = true;
        clearInterval(this.gameInterval);
        const totalTime = Math.floor((Date.now() - this.startTime) / 1000);
        const hours = Math.floor(totalTime / 3600);
        const minutes = Math.floor((totalTime % 3600) / 60);
        const seconds = totalTime % 60;
        const timeString = `${hours}小时${minutes}分${seconds}秒`;

        const endingMessage = [
            '恭喜你，终于修炼到了大乘境界巅峰！',
            '历经无数磨难，你终于踏上了修仙之路的巅峰。',
            '回首往事，曾经的凡人境界恍如昨日，而今已是举手投足间便可移山倒海。',
            '天地之力尽在掌握，举手投足间可达万里，一念之间可洞察天机。',
            '而这一切，正是源于你那永不放弃的道心，和对大道的不懈追求。',
            `在这漫长的修炼过程中，你总共花费了${timeString}。`,
            '愿你带着这份坚持之心，在现实中也能达到人生的巅峰！'
        ].join('\n\n');

        this.elements.warning.style.display = 'none';
        this.elements.messageLog.innerHTML = '';
        const finalMessage = document.createElement('div');
        finalMessage.className = 'message final-message';
        finalMessage.style.whiteSpace = 'pre-wrap';
        finalMessage.style.fontSize = '1.2em';
        finalMessage.style.color = '#4CAF50';
        finalMessage.style.padding = '20px';
        finalMessage.style.border = '2px solid #4CAF50';
        finalMessage.style.borderRadius = '10px';
        finalMessage.style.margin = '20px 0';
        finalMessage.style.backgroundColor = 'rgba(76, 175, 80, 0.1)';
        finalMessage.textContent = endingMessage;
        this.elements.messageLog.appendChild(finalMessage);
    }
}

// 启动游戏
new Game();