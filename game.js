import themes from './themes.js';

// 新增：资源映射（背景与徽章文件名，均为 PNG）。你可按需逐步补齐对应文件。
const ASSETS = {
    backgrounds: {
        cultivation: 'assets/backgrounds/cultivation.png',
        career: 'assets/backgrounds/career.png',
        study: 'assets/backgrounds/study.png',
        entrepreneurship: 'assets/backgrounds/entrepreneurship.png',
        emperor: 'assets/backgrounds/emperor.png'
    },
    badges: {
        // 文件放在 assets/realms/<themeKey>/ 下
        cultivation: [
            '01-mortal.png',
            '02-qi.png',
            '03-foundation.png',
            '04-goldencore.png',
            '05-nascent-soul.png',
            '06-spirit-severing.png',
            '07-ascension.png'
        ],
        career: [
            '01-intern.png',
            '02-junior.png',
            '03-mid.png',
            '04-senior.png',
            '05-lead.png',
            '06-manager.png',
            '07-director.png'
        ],
        study: [
            '01-novice.png',
            '02-underachiever.png',
            '03-average.png',
            '04-honors.png',
            '05-top.png',
            '06-genius.png',
            '07-prodigy.png'
        ],
        entrepreneurship: [
            '01-newbie.png',
            '02-micro.png',
            '03-startup.png',
            '04-growth.png',
            '05-leader.png',
            '06-unicorn.png',
            '07-empire.png'
        ],
        emperor: [
            '01-commoner.png',
            '02-noble.png',
            '03-prince.png',
            '04-duke.png',
            '05-emperor.png',
            '06-wise-emperor.png',
            '07-legendary-emperor.png'
        ]
    }
};

class Game {
    constructor(themeKey = 'cultivation') {
        this.level = 1;
        this.progress = 0;
        this.isRegressing = false;
        this.realmIndex = 0;
        this.currentThemeKey = themeKey;
        this.theme = themes[themeKey];
        this.realms = this.theme.realms;
        // 新增：保存回退定时器句柄，避免泄漏
        this.regressionInterval = null;
        
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
            messageLog: document.getElementById('message-log'),
            // 新增：徽章与 body
            badge: document.getElementById('realm-badge'),
            body: document.body
        };

        // 新增：徽章图片加载/失败处理（不存在时自动隐藏）
        if (this.elements.badge) {
            this.elements.badge.addEventListener('load', () => {
                this.elements.badge.style.display = 'block';
            });
            this.elements.badge.addEventListener('error', () => {
                this.elements.badge.style.display = 'none';
            });
        }

        document.title = this.theme.name;

        this.applyThemeAssets();
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
            // 新增：阻止选择器自身的按下/触摸事件冒泡，避免误触发回退
            ['mousedown', 'touchstart'].forEach(evt => {
                themeSelect.addEventListener(evt, (e) => e.stopPropagation());
            });
            themeSelect.addEventListener('change', (e) => {
                // 防止点击下拉菜单触发handleInteraction
                e.stopPropagation();
                this.changeTheme(e.target.value);
            });
        }
    }

    // 新增：根据当前主题与境界应用资源（背景与徽章）
    applyThemeAssets() {
        // 背景（若未提供对应图片则不设置）
        const bg = ASSETS.backgrounds[this.currentThemeKey];
        if (bg) {
            this.elements.body.style.backgroundImage = `url('${bg}')`;
        } else {
            this.elements.body.style.backgroundImage = '';
        }

        // 徽章（根据当前境界索引选择文件名）
        const themeBadges = ASSETS.badges[this.currentThemeKey];
        const fileName = themeBadges && themeBadges[this.realmIndex];
        if (this.elements.badge) {
            if (fileName) {
                this.elements.badge.src = `assets/realms/${this.currentThemeKey}/${fileName}`;
                // 显示与否由 load/error 事件决定
            } else {
                this.elements.badge.removeAttribute('src');
                this.elements.badge.style.display = 'none';
            }
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
        // 新增：启动前清理旧的回退定时器
        if (this.regressionInterval) {
            clearInterval(this.regressionInterval);
            this.regressionInterval = null;
        }
        this.regressionInterval = setInterval(() => {
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
                        // 清理回退定时器
                        clearInterval(this.regressionInterval);
                        this.regressionInterval = null;
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
        // 每次等级或境界变化后尝试更新徽章
        this.applyThemeAssets();
    }

    calculateTimeToNext() {
        const currentRealm = this.realms[this.realmIndex];
        const progressNeeded = 100 - this.progress;
        const timePerProgress = 0.1; // 100ms per progress update
        let estimatedSeconds = (progressNeeded / currentRealm.speed) * timePerProgress;

        // 统一使用主题文案
        const toNextLevelText = this.theme.events.timeToNext.replace('{seconds}', Math.ceil(estimatedSeconds));

        if (this.realmIndex < this.realms.length - 1) {
            const remainingLevelsInRealm = currentRealm.maxLevel - this.level;
            const totalSecondsToNextRealm = ((remainingLevelsInRealm * 100) / currentRealm.speed) * timePerProgress + estimatedSeconds;
            const nextRealmName = this.realms[this.realmIndex + 1].name;

            if (this.level === currentRealm.maxLevel) {
                return this.theme.events.timeToNextRealm
                    .replace('{realm}', nextRealmName)
                    .replace('{seconds}', Math.ceil(estimatedSeconds));
            } else {
                return `${toNextLevelText} (${this.theme.events.timeToNextRealm
                    .replace('{realm}', nextRealmName)
                    .replace('{seconds}', Math.ceil(totalSecondsToNextRealm))})`;
            }
        } else {
            return toNextLevelText;
        }
    }

    updateUI() {
        const currentRealm = this.realms[this.realmIndex];
        this.elements.realm.textContent = currentRealm.name;
        this.elements.levelInfo.textContent = `等级: ${this.level} (${this.calculateTimeToNext()})`;
        this.elements.progress.style.width = `${this.progress}%`;
        // UI 更新时也尝试刷新徽章（防首次渲染遗漏）
        this.applyThemeAssets();
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
            // 新增：清理可能存在的回退定时器
            if (this.regressionInterval) {
                clearInterval(this.regressionInterval);
                this.regressionInterval = null;
            }
            
            // 更新UI元素
            document.title = this.theme.name;
            this.elements.warning.style.display = 'none';
            this.elements.warning.textContent = this.theme.events.warning;
            
            // 清空消息日志
            this.elements.messageLog.innerHTML = '';
            
            // 添加主题切换消息
            this.addMessage(`切换到${this.theme.name}主题`);
            
            // 应用资源并更新UI
            this.applyThemeAssets();
            this.updateUI();
        }
    }
}

// 启动游戏
new Game();