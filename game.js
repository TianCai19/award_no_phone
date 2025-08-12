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

        this.progressBoost = 1;        // 专注加成倍率（1.0 起）
        this.streakSeconds = 0;        // 专注时长（秒）
        this.maxBoost = 3;             // 最高倍率
        this.boostRampSeconds = 60;    // 从 x1.0 线性攀升到 x3.0 所需秒数
        this.idleEventsTimer = 0;      // 用于随机趣味事件

        this.cumulativeFocus = 0; // 累计专注秒数（会随时间增长，不因回退清零）
        this.bestFocus = 0;       // 历史最长专注秒数
        // 可选：从 localStorage 恢复
        try {
            const saved = JSON.parse(localStorage.getItem('focus_stats') || '{}');
            if (typeof saved.cumulativeFocus === 'number') this.cumulativeFocus = saved.cumulativeFocus;
            if (typeof saved.bestFocus === 'number') this.bestFocus = saved.bestFocus;
        } catch {}

        this.elements = {
            realm: document.getElementById('realm'),
            levelInfo: document.getElementById('level-info'),
            progress: document.getElementById('progress'),
            warning: document.getElementById('warning'),
            messageLog: document.getElementById('message-log'),
            // 新增：徽章与 body
            badge: document.getElementById('realm-badge'),
            body: document.body,
            streakInfo: document.getElementById('streak-info'),
            realmEta: document.getElementById('realm-eta'),
            realmProgress: document.getElementById('realm-progress'),
            levelStepsContainer: document.getElementById('level-steps'),
            levelStepsLabel: document.getElementById('level-steps-label'),
            realmNextName: document.getElementById('realm-next-name'),
            focusStats: document.getElementById('focus-stats')
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

    persistFocusStats() {
        try {
            localStorage.setItem('focus_stats', JSON.stringify({
                cumulativeFocus: this.cumulativeFocus,
                bestFocus: this.bestFocus,
            }));
        } catch {}
    }

    // 新增：专注倍率与时长更新（每秒调用）
    tickPerSecond() {
        if (!this.isRegressing) {
            this.streakSeconds += 1;
            this.cumulativeFocus += 1; // 累计专注 +1s
            if (this.streakSeconds > this.bestFocus) {
                this.bestFocus = this.streakSeconds;
            }
            // 线性提升倍率：1.0 -> maxBoost（默认 3.0）
            const t = Math.min(this.streakSeconds / this.boostRampSeconds, 1);
            this.progressBoost = 1 + (this.maxBoost - 1) * t;
            // 偶发趣味事件
            this.rollRandomIdleEvent();
        } else {
            // 回退中降低倍率并清空连击时长
            this.streakSeconds = 0;
            this.progressBoost = 1;
        }
        this.updateStreakUI();
        this.updateFocusStatsUI();
        this.persistFocusStats();
    }

    // 新增：随机趣味事件（不打断，不回退，只发消息）
    rollRandomIdleEvent() {
        // 每 10~20 秒随机触发一次趣味提示
        this.idleEventsTimer += 1;
        const trigger = 10 + Math.floor(Math.random() * 11); // 10~20
        if (this.idleEventsTimer >= trigger) {
            this.idleEventsTimer = 0;
            const funTips = [
                '你感到一缕灵光掠过，似乎悟到了什么。',
                '远处钟声回响，心神更静了几分。',
                '丹田温热如春，灵气自动涌动。',
                '窗外风起，心境如水波不惊。',
                '忽觉身轻如燕，呼吸与天地同频。'
            ];
            this.addMessage(funTips[Math.floor(Math.random() * funTips.length)]);
        }
    }

    startCultivation() {
        // 主循环（100ms）
        setInterval(() => {
            if (!this.isRegressing) {
                const speed = this.realms[this.realmIndex].speed * this.progressBoost;
                this.progress += speed;
                if (this.progress >= 100) {
                    this.levelUp();
                }
                this.updateUI();
            }
        }, 100);
        // 每秒节拍（倍率与趣味事件）
        setInterval(() => this.tickPerSecond(), 1000);
        // 初次渲染分段结构
        this.renderLevelSteps(true);
    }

    handleInteraction() {
        if (!this.isRegressing) {
            // 交互打断时不清空累计与历史，只重置当前连击在回退逻辑中处理
            this.isRegressing = true;
            this.elements.warning.style.display = 'block';
            this.elements.warning.textContent = this.theme.events.warning;
            // 新增：在回退提示前加入一些有梗文案
            const fail = this.getRandomEvent('failure');
            const spice = [
                '（小声）修为说：别点了别点了……',
                '手一抖，心魔乐开花。',
                '你瞟了一眼，心神散作满天星。'
            ];
            this.addMessage(`${fail} ${spice[Math.floor(Math.random() * spice.length)]}`);
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

    // 新增：天劫配置与工具函数
    rand(min, max) {
        return Math.random() * (max - min) + min;
    }
    chooseSeverityByRealm() {
        // 根据境界越高，越容易遭遇严重天劫
        const i = this.realmIndex; // 0..6
        const weights = i < 2
            ? { minor: 0.65, mid: 0.3, severe: 0.05 }
            : i < 4
            ? { minor: 0.5, mid: 0.4, severe: 0.1 }
            : { minor: 0.35, mid: 0.45, severe: 0.2 };
        const r = Math.random();
        if (r < weights.minor) return 'minor';
        if (r < weights.minor + weights.mid) return 'mid';
        return 'severe';
    }
    rollTribulationConfig() {
        const severity = this.chooseSeverityByRealm();
        if (severity === 'minor') {
            return {
                name: '心魔小劫',
                ticks: Math.floor(this.rand(8, 14)),
                drainMin: 1.5,
                drainMax: 3.5,
                maxLevelDrops: Math.floor(this.rand(0, 2)), // 0~1
            };
        } else if (severity === 'mid') {
            return {
                name: '气海风暴',
                ticks: Math.floor(this.rand(12, 20)),
                drainMin: 2.5,
                drainMax: 6.0,
                maxLevelDrops: Math.floor(this.rand(1, 3)), // 1~2
            };
        } else {
            return {
                name: '雷罚天劫',
                ticks: Math.floor(this.rand(16, 26)),
                drainMin: 4.0,
                drainMax: 10.0,
                maxLevelDrops: Math.floor(this.rand(2, 4)), // 2~3
            };
        }
    }

    startRegression() {
        // 改为“天劫”式的有限随机倒退，而非一直退到底
        if (this.regressionInterval) {
            clearInterval(this.regressionInterval);
            this.regressionInterval = null;
        }
        const cfg = this.rollTribulationConfig();
        let ticksLeft = cfg.ticks;
        let droppedLevels = 0;
        let totalDrain = 0;

        this.addMessage(`天劫来袭：${cfg.name}！请稳住心神。`);

        this.regressionInterval = setInterval(() => {
            // 若到最低境界1级且0进度，提前结束
            if (this.realmIndex === 0 && this.level === 1 && this.progress <= 0) {
                ticksLeft = 0;
            }

            const drain = this.rand(cfg.drainMin, cfg.drainMax);
            this.progress -= drain;
            totalDrain += drain;

            // 处理掉级（限制最大掉级数）
            while (this.progress < 0) {
                if (droppedLevels >= cfg.maxLevelDrops) {
                    // 达到掉级上限则停在0
                    this.progress = 0;
                    break;
                }
                this.progress += 100;
                this.level--;
                droppedLevels++;
                if (this.level < 1) {
                    if (this.realmIndex > 0) {
                        this.realmIndex--;
                        this.level = this.realms[this.realmIndex].maxLevel;
                    } else {
                        // 已到最低，钳制
                        this.level = 1;
                        this.progress = 0;
                        break;
                    }
                }
            }

            this.updateUI();
            ticksLeft--;

            if (ticksLeft <= 0) {
                clearInterval(this.regressionInterval);
                this.regressionInterval = null;
                this.isRegressing = false;
                this.elements.warning.style.display = 'none';
                const lostText = droppedLevels > 0 ? `，损失 ${droppedLevels} 级` : '';
                this.addMessage(`你挺过了${cfg.name}${lostText}。`);
                // 回退后专注归零
                this.streakSeconds = 0;
                this.progressBoost = 1;
                this.updateStreakUI && this.updateStreakUI();
            }
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
        // 境界或等级变化后刷新分段
        this.renderLevelSteps();
        // 升级时小概率触发“机缘倍增”（短时提升倍率）
        if (Math.random() < 0.15) {
            const oldMax = this.maxBoost;
            this.maxBoost = Math.max(this.maxBoost, 3.5);
            this.progressBoost = Math.max(this.progressBoost, 3.0);
            this.addMessage('天降小机缘！短时间内修炼效率提升。');
            setTimeout(() => {
                this.maxBoost = oldMax;
            }, 10000); // 10 秒后恢复
        }
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

    // 新增：计算到下一个境界的总体进度（0~1）与预计秒数
    computeRealmProgressAndETA() {
        const currentRealm = this.realms[this.realmIndex];
        const speed = currentRealm.speed * (this.isRegressing ? 1 : this.progressBoost);
        const timePerProgress = 0.1; // 秒/进度点（100ms tick）

        // 1) 当前等级内的完成度（0~1）
        const levelFrac = Math.min(Math.max(this.progress / 100, 0), 1);
        // 2) 该境界总等级数与当前等级序号（从0计）
        const totalLevels = currentRealm.maxLevel;
        const levelIndex0 = Math.max(this.level - 1, 0);

        // 3) 境界整体进度：已完成的等级 + 当前等级内的百分比
        const realmCompleted = levelIndex0 + levelFrac; // 0 ~ totalLevels
        const realmProgress01 = Math.min(realmCompleted / totalLevels, 1);

        // 预计时间计算：
        // 剩余当前等级进度 + 剩余等级所需的 100 进度点
        const currentLevelRemaining = Math.max(100 - this.progress, 0);
        const remainingLevels = Math.max(totalLevels - this.level, 0);
        const totalProgressPointsRemaining = currentLevelRemaining + remainingLevels * 100;
        const estimatedSeconds = speed > 0 ? (totalProgressPointsRemaining / speed) * timePerProgress : Infinity;

        return { realmProgress01, estimatedSeconds };
    }

    formatSeconds(sec) {
        if (!isFinite(sec)) return '∞';
        const s = Math.ceil(sec);
        if (s < 60) return `${s}秒`;
        const m = Math.floor(s / 60);
        const r = s % 60;
        return r ? `${m}分${r}秒` : `${m}分`;
    }

    // 新增：渲染当前境界的等级分段条（只在境界或初次进入时重建DOM）
    renderLevelSteps(force = false) {
        const container = this.elements.levelStepsContainer;
        if (!container) return;
        const currentRealm = this.realms[this.realmIndex];
        const total = currentRealm.maxLevel;
        const prevMeta = container.getAttribute('data-total');
        if (!force && prevMeta && Number(prevMeta) === total) {
            // 结构相同，仅更新填充
            this.updateLevelStepsFill();
            return;
        }
        container.innerHTML = '';
        container.setAttribute('data-total', String(total));
        for (let i = 0; i < total; i++) {
            const step = document.createElement('div');
            step.className = 'level-step';
            step.setAttribute('data-index', String(i));
            const fill = document.createElement('div');
            fill.className = 'fill';
            step.appendChild(fill);
            container.appendChild(step);
        }
        if (this.elements.levelStepsLabel) {
            this.elements.levelStepsLabel.textContent = `（共 ${total} 级）`;
        }
        this.updateLevelStepsFill();
    }

    // 新增：更新当前各等级块的填充与状态
    updateLevelStepsFill() {
        const container = this.elements.levelStepsContainer;
        if (!container) return;
        const steps = container.querySelectorAll('.level-step');
        const currentIndex0 = Math.max(this.level - 1, 0);

        steps.forEach((el, idx) => {
            el.classList.remove('completed', 'current');
            const fill = el.firstElementChild;
            if (!(fill instanceof HTMLElement)) return;
            if (idx < currentIndex0) {
                el.classList.add('completed');
                fill.style.width = '100%';
            } else if (idx === currentIndex0) {
                el.classList.add('current');
                const pct = Math.min(Math.max(this.progress, 0), 100);
                fill.style.width = `${pct}%`;
            } else {
                fill.style.width = '0%';
            }
        });
    }

    updateUI() {
        const currentRealm = this.realms[this.realmIndex];
        this.elements.realm.textContent = currentRealm.name;
        this.elements.levelInfo.textContent = `等级: ${this.level} (${this.calculateTimeToNext()})`;
        this.elements.progress.style.width = `${this.progress}%`;
        // UI 更新时也尝试刷新徽章（防首次渲染遗漏）
        this.applyThemeAssets();
        
        // 新增：下一个境界名
        if (this.elements.realmNextName) {
            if (this.realmIndex >= this.realms.length - 1) {
                this.elements.realmNextName.textContent = '巅峰';
            } else {
                this.elements.realmNextName.textContent = this.realms[this.realmIndex + 1].name;
            }
        }

        // 更新“到下一个境界”的整体进度与预计时间
        if (this.elements.realmProgress && this.elements.realmEta) {
            const { realmProgress01, estimatedSeconds } = this.computeRealmProgressAndETA();
            this.elements.realmProgress.style.width = `${(realmProgress01 * 100).toFixed(2)}%`;
            // 如果已是最后一个境界，显示“已至巅峰”
            if (this.realmIndex >= this.realms.length - 1) {
                this.elements.realmEta.textContent = '已至巅峰';
            } else {
                this.elements.realmEta.textContent = `预计 ${this.formatSeconds(estimatedSeconds)}`;
            }
        }
        // 更新分段条的填充（结构已存在时仅更新）
        this.updateLevelStepsFill();
    }
    
    updateStreakUI() {
        if (!this.elements.streakInfo) return;
        const boost = `x${this.progressBoost.toFixed(1)}`;
        this.elements.streakInfo.innerHTML = `专注 ${this.streakSeconds} 秒 · 倍率 <span class="boost">${boost}</span>`;
        if (this.isRegressing) {
            this.elements.streakInfo.innerHTML = `专注中断 · 倍率 <span class="debuff">x1.0</span>`;
        }
    }

    updateFocusStatsUI() {
        if (!this.elements.focusStats) return;
        const fmt = (s) => {
            if (s < 60) return `${s}秒`;
            const m = Math.floor(s / 60);
            const r = s % 60;
            return r ? `${m}分${r}秒` : `${m}分`;
        };
        this.elements.focusStats.textContent = `累计 ${fmt(this.cumulativeFocus)} · 最长 ${fmt(this.bestFocus)}`;
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
            // 主题切换后重建分段结构
            this.renderLevelSteps(true);
            this.updateUI();
        }
        // 切换主题不清空累计与历史，仅重置当前连击
        this.streakSeconds = 0;
        this.progressBoost = 1;
        this.updateStreakUI();
        this.updateFocusStatsUI();
    }
}

// 启动游戏
new Game();