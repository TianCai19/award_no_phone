import themes from './themes.js';

class Game {
    constructor(themeKey = 'cultivation') {
        this.level = 1;
        this.progress = 0;
        this.isRegressing = false;
        this.realmIndex = 0;
        this.currentThemeKey = themeKey;
        this.theme = themes[themeKey];
        this.realms = this.theme.realms;
        
        // 设置主题选择器的初始值
        const themeSelect = document.getElementById('theme-select');
        if (themeSelect) {
            themeSelect.value = themeKey;
        }

        this.elements = {
            realm: document.getElementById('realm'),
            levelInfo: document.getElementById('level-info'),
            progress: document.getElementById('progress'),
            warning: document.getElementById('warning'),
            messageLog: document.getElementById('message-log')
        };

        document.title = this.theme.name;

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
        
        // 主题切换监听
        const themeSelect = document.getElementById('theme-select');
        if (themeSelect) {
            themeSelect.addEventListener('change', (e) => {
                // 防止点击下拉菜单触发handleInteraction
                e.stopPropagation();
                this.changeTheme(e.target.value);
            });
        }
    }

    handleInteraction() {
        if (!this.isRegressing) {
            this.isRegressing = true;
            this.elements.warning.style.display = 'block';
            this.elements.warning.textContent = this.theme.events.warning;
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
        const events = this.theme.events[type];
        return events[Math.floor(Math.random() * events.length)];
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
            this.addMessage(this.theme.events.breakthrough.replace('{realm}', this.realms[this.realmIndex].name));
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
                return this.theme.events.timeToNextRealm
                .replace('{realm}', this.realms[this.realmIndex + 1].name)
                .replace('{seconds}', Math.ceil(estimatedSeconds));
            } else {
                return `距离下一等级还需 ${Math.ceil(estimatedSeconds)}秒 (到${this.realms[this.realmIndex + 1].name}还需 ${Math.ceil(totalSecondsToNextRealm)}秒)`;
            }
        } else {
            return this.theme.events.timeToNext.replace('{seconds}', Math.ceil(estimatedSeconds));
        }
    }

    updateUI() {
        const currentRealm = this.realms[this.realmIndex];
        this.elements.realm.textContent = currentRealm.name;
        this.elements.levelInfo.textContent = `等级: ${this.level} (${this.calculateTimeToNext()})`;
        this.elements.progress.style.width = `${this.progress}%`;
    }
    
    changeTheme(themeKey) {
        if (themes[themeKey] && themeKey !== this.currentThemeKey) {
            // 保存当前主题键值以便后续比较
            this.currentThemeKey = themeKey;
            
            // 更新主题
            this.theme = themes[themeKey];
            this.realms = this.theme.realms;
            
            // 重置游戏状态
            this.level = 1;
            this.progress = 0;
            this.realmIndex = 0;
            this.isRegressing = false;
            
            // 更新UI元素
            document.title = this.theme.name;
            this.elements.warning.style.display = 'none';
            this.elements.warning.textContent = this.theme.events.warning;
            
            // 清空消息日志
            this.elements.messageLog.innerHTML = '';
            
            // 添加主题切换消息
            this.addMessage(`切换到${this.theme.name}主题`);
            
            // 更新UI
            this.updateUI();
        }
    }
}

// 启动游戏
new Game();