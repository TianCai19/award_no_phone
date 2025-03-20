class Game {
    constructor() {
        this.level = 1;
        this.progress = 0;
        this.isRegressing = false;
        this.realmIndex = 0;
        this.realms = [
            { name: '凡人境界', maxLevel: 10, speed: 1 },
            { name: '练气境界', maxLevel: 20, speed: 1.5 },
            { name: '筑基境界', maxLevel: 30, speed: 2 },
            { name: '金丹境界', maxLevel: 40, speed: 2.5 },
            { name: '元婴境界', maxLevel: 50, speed: 3 },
            { name: '化神境界', maxLevel: 60, speed: 3.5 },
            { name: '大乘境界', maxLevel: 100, speed: 4 }
        ];

        this.elements = {
            realm: document.getElementById('realm'),
            levelInfo: document.getElementById('level-info'),
            progress: document.getElementById('progress'),
            warning: document.getElementById('warning')
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
            this.startRegression();
        }
    }

    startCultivation() {
        setInterval(() => {
            if (!this.isRegressing) {
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
        }
    }

    updateUI() {
        const currentRealm = this.realms[this.realmIndex];
        this.elements.realm.textContent = currentRealm.name;
        this.elements.levelInfo.textContent = `等级: ${this.level}`;
        this.elements.progress.style.width = `${this.progress}%`;
    }
}

// 启动游戏
new Game();