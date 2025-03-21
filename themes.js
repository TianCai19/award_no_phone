const themes = {
    cultivation: {
        name: '修仙模拟器',
        realms: [
            { name: '凡人境界', maxLevel: 10, speed: 1 },
            { name: '练气境界', maxLevel: 20, speed: 1.5 },
            { name: '筑基境界', maxLevel: 30, speed: 2 },
            { name: '金丹境界', maxLevel: 40, speed: 2.5 },
            { name: '元婴境界', maxLevel: 50, speed: 3 },
            { name: '化神境界', maxLevel: 60, speed: 3.5 },
            { name: '大乘境界', maxLevel: 100, speed: 4 }
        ],
        events: {
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
            ],
            breakthrough: '突破成功，进入{realm}！',
            warning: '检测到互动，修为正在倒退！',
            timeToNext: '距离下一等级还需 {seconds}秒',
            timeToNextRealm: '距离{realm}还需 {seconds}秒'
        }
    },
    career: {
        name: '职场模拟器',
        realms: [
            { name: '实习生', maxLevel: 10, speed: 1 },
            { name: '初级员工', maxLevel: 20, speed: 1.5 },
            { name: '中级员工', maxLevel: 30, speed: 2 },
            { name: '高级员工', maxLevel: 40, speed: 2.5 },
            { name: '项目主管', maxLevel: 50, speed: 3 },
            { name: '部门经理', maxLevel: 60, speed: 3.5 },
            { name: '总监', maxLevel: 100, speed: 4 }
        ],
        events: {
            success: [
                '工作表现出色，获得领导赏识！',
                '成功完成项目，能力提升！',
                '加班加点，成果显著！',
                '团队协作，贡献突出！',
                '创新思维，解决难题！'
            ],
            failure: [
                '工作失误，绩效下滑！',
                '项目延期，信心受挫！',
                '注意力分散，效率低下！',
                '压力过大，状态不佳！',
                '团队配合不畅，任务受阻！'
            ],
            breakthrough: '恭喜晋升为{realm}！',
            warning: '摸鱼被发现，工作效率下降！',
            timeToNext: '距离下次晋升还需 {seconds}秒',
            timeToNextRealm: '距离晋升{realm}还需 {seconds}秒'
        }
    },
    study: {
        name: '学霸养成记',
        realms: [
            { name: '小白', maxLevel: 10, speed: 1 },
            { name: '学渣', maxLevel: 20, speed: 1.5 },
            { name: '普通生', maxLevel: 30, speed: 2 },
            { name: '优等生', maxLevel: 40, speed: 2.5 },
            { name: '学霸', maxLevel: 50, speed: 3 },
            { name: '学神', maxLevel: 60, speed: 3.5 },
            { name: '天才', maxLevel: 100, speed: 4 }
        ],
        events: {
            success: [
                '醍醐灌顶，茅塞顿开！',
                '刻苦学习，成绩进步！',
                '举一反三，理解深刻！',
                '专注学习，效率倍增！',
                '知识积累，突破瓶颈！'
            ],
            failure: [
                '贪玩偷懒，成绩下滑！',
                '注意力不集中，效率低下！',
                '学习态度散漫，进度落后！',
                '思维混乱，理解困难！',
                '压力过大，状态不佳！'
            ],
            breakthrough: '恭喜提升为{realm}！',
            warning: '玩手机被发现，学习效率下降！',
            timeToNext: '距离下次提升还需 {seconds}秒',
            timeToNextRealm: '距离成为{realm}还需 {seconds}秒'
        }
    }
};

export default themes;