const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

// ICS订阅链接配置（从环境变量读取，多个链接用换行符分隔）
const ICS_URLS = (process.env.ICS_URLS || '').split('\n').filter(url => url.trim().startsWith('http'));

// 基础日程库文件路径
const BASE_SCHEDULES_PATH = path.join(__dirname, '..', 'base-schedules.json');

// 成员配置
const MEMBER_CONFIG = {
    '贝拉': { color: '#DB7D74', textColor: '#FFFFFF' },
    '嘉然': { color: '#E799B0', textColor: '#FFFFFF' },
    '乃琳': { color: '#576690', textColor: '#FFFFFF' },
    '思诺': { color: '#7252C0', textColor: '#FFFFFF' },
    '心宜': { color: '#C93773', textColor: '#FFFFFF' },
    'A-SOUL': { color: '#55ACEE', textColor: '#FFFFFF' },
    '小心思': { color: '#4CADAF', textColor: '#FFFFFF' },
    '其他': { color: '#94a3b8', textColor: '#FFFFFF' }
};

// ICS解析函数（与App.jsx中的逻辑一致）
function parseICS(icsText) {
    const unfoldedText = icsText.replace(/\r\n[ \t]/g, '').replace(/\n[ \t]/g, '');
    const lines = unfoldedText.split(/\r?\n/);
    const events = [];
    let currentEvent = null;

    const getVal = (line) => {
        const parts = line.split(':');
        return parts.slice(1).join(':').trim();
    };

    lines.forEach(line => {
        if (line.startsWith('BEGIN:VEVENT')) {
            currentEvent = {};
        } else if (line.startsWith('END:VEVENT')) {
            if (currentEvent) events.push(currentEvent);
            currentEvent = null;
        } else if (currentEvent) {
            if (line.startsWith('SUMMARY')) currentEvent.summary = getVal(line);
            else if (line.startsWith('DTSTART')) currentEvent.dtstart = getVal(line);
            else if (line.startsWith('DTEND')) currentEvent.dtend = getVal(line);
            else if (line.startsWith('DESCRIPTION')) currentEvent.description = getVal(line).replace(/\\n/g, '\n');
            else if (line.startsWith('UID')) currentEvent.uid = getVal(line);
            else if (line.startsWith('URL')) currentEvent.url = getVal(line);
        }
    });

    return events.map(ev => {
        let date = '', time = '';
        if (ev.dtstart) {
            const tzMatch = ev.dtstart.match(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z|[+-]\d{4})?/);
            if (tzMatch) {
                const [, year, month, day, hour, minute, second, timezone] = tzMatch;
                let eventDate;

                if (timezone === 'Z') {
                    // UTC时间：创建UTC时间戳，然后转换为本地时间
                    const utcTime = Date.UTC(year, month - 1, day, hour, minute, second || 0);
                    eventDate = new Date(utcTime);
                } else if (timezone && timezone.match(/[+-]\d{4}/)) {
                    // 带时区偏移的时间：先创建UTC时间，再应用偏移
                    const offsetHours = parseInt(timezone.substring(1, 3));
                    const offsetMinutes = parseInt(timezone.substring(3, 5));
                    const totalOffsetMinutes = (timezone[0] === '+' ? offsetHours : -offsetHours) * 60 +
                        (timezone[0] === '+' ? offsetMinutes : -offsetMinutes);

                    // 创建UTC时间戳，减去时区偏移得到真实UTC时间
                    const utcTime = Date.UTC(year, month - 1, day, hour, minute, second || 0) - (totalOffsetMinutes * 60000);
                    eventDate = new Date(utcTime);
                } else {
                    // 无时区信息：假设为本地时间
                    eventDate = new Date(year, month - 1, day, hour, minute, second || 0);
                }

                date = `${eventDate.getFullYear()}/${String(eventDate.getMonth() + 1).padStart(2, '0')}/${String(eventDate.getDate()).padStart(2, '0')}`;
                time = `${String(eventDate.getHours()).padStart(2, '0')}:${String(eventDate.getMinutes()).padStart(2, '0')}`;
            } else {
                const dm = ev.dtstart.match(/(\d{4})(\d{2})(\d{2})/);
                if (dm) {
                    date = `${dm[1]}/${dm[2]}/${dm[3]}`;
                    time = '00:00';
                }
            }
        }

        let type = '订阅';
        let dynamicUrl = '';
        let liveRoomUrl = '';

        if (ev.description) {
            const desc = ev.description;
            const tagMatch = desc.match(/^([^|]+)\|/);
            if (tagMatch) type = tagMatch[1].trim();

            const urlMatch = desc.match(/https?:\/\/www\.bilibili\.com\/[^\s\n]+/);
            if (urlMatch) dynamicUrl = urlMatch[0];
        }

        let icsUrl = null;
        if (ev.url) {
            liveRoomUrl = ev.url;
            icsUrl = ev.url;
        }

        let summary = ev.summary || '无标题';
        summary = summary.replace(/^【[^】]+】/, '').trim();
        let subTitle = '';
        let title = summary;
        const colonIndex = summary.indexOf('：') !== -1 ? summary.indexOf('：') : summary.indexOf(':');
        if (colonIndex !== -1) {
            subTitle = summary.substring(0, colonIndex).trim();
            title = summary.substring(colonIndex + 1).trim();
        } else {
            subTitle = title;
        }

        let category = '其他';
        const fullText = (ev.summary + (ev.description || '')).toLowerCase();

        const has贝拉 = fullText.includes('贝拉');
        const has嘉然 = fullText.includes('嘉然');
        const has乃琳 = fullText.includes('乃琳');
        const has心宜 = fullText.includes('心宜');
        const has思诺 = fullText.includes('思诺');

        if (has贝拉 && has嘉然 && has乃琳) {
            category = 'A-SOUL';
        } else if (has心宜 && has思诺) {
            category = '小心思';
        } else {
            const foundMembers = [];
            const memberNames = Object.keys(MEMBER_CONFIG).filter(name =>
                name !== 'A-SOUL' && name !== '小心思' && name !== '其他'
            );

            for (const name of memberNames) {
                if (fullText.includes(name.toLowerCase())) {
                    foundMembers.push(name);
                }
            }

            if (foundMembers.length >= 2 && foundMembers.length <= 5) {
                const liveRoomPriority = ['贝拉', '嘉然', '乃琳', '心宜', '思诺'];
                foundMembers.sort((a, b) => {
                    const aIndex = liveRoomPriority.indexOf(a);
                    const bIndex = liveRoomPriority.indexOf(b);
                    if (aIndex === -1 && bIndex === -1) return 0;
                    if (aIndex === -1) return 1;
                    if (bIndex === -1) return -1;
                    return aIndex - bIndex;
                });
                category = foundMembers.join('+');
            } else if (foundMembers.length === 1) {
                category = foundMembers[0];
            }
        }

        if (category === '其他' && fullText.includes('有点宜思')) category = '小心思';

        return {
            id: ev.uid || `ics-${date}-${time}-${ev.summary}`,
            date,
            time,
            title,
            type,
            subTitle,
            category,
            dynamicUrl,
            liveRoomUrl: liveRoomUrl || '',
            icsUrl: icsUrl || ev.url || '',
            completed: false,
            note: '',
            isIcs: true,
            isAnime: false,
            isFavorite: false
        };
    }).filter(ev => ev.date);
}

// 主函数
async function main() {
    console.log('开始更新基础日程库...');

    if (ICS_URLS.length === 0) {
        console.error('错误：未配置ICS订阅链接');
        console.log('请在GitHub仓库的Settings > Secrets and variables > Actions中添加ICS_URLS密钥');
        process.exit(1);
    }

    console.log(`配置的ICS订阅链接数量: ${ICS_URLS.length}`);

    // 读取现有的基础日程库
    let existingData = { version: '', schedules: [] };
    if (fs.existsSync(BASE_SCHEDULES_PATH)) {
        try {
            const content = fs.readFileSync(BASE_SCHEDULES_PATH, 'utf-8');
            existingData = JSON.parse(content);
            console.log(`当前版本: ${existingData.version}`);
            console.log(`现有日程数量: ${existingData.schedules.length}`);
        } catch (error) {
            console.warn('读取现有文件失败，将创建新文件:', error.message);
        }
    }

    // 创建ID到日程的映射
    const existingSchedulesMap = new Map();
    existingData.schedules.forEach(schedule => {
        existingSchedulesMap.set(schedule.id, schedule);
    });

    // 从ICS订阅获取新日程
    let newSchedulesCount = 0;
    let updatedSchedulesCount = 0;

    for (const url of ICS_URLS) {
        console.log(`\n正在处理: ${url}`);
        try {
            const response = await fetch(url.trim());
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const icsText = await response.text();
            const parsedEvents = parseICS(icsText);
            console.log(`解析到 ${parsedEvents.length} 个事件`);

            parsedEvents.forEach(event => {
                if (existingSchedulesMap.has(event.id)) {
                    // 更新现有日程（保留用户数据，更新基础信息）
                    const existing = existingSchedulesMap.get(event.id);
                    existingSchedulesMap.set(event.id, {
                        ...event,
                        completed: existing.completed || false,
                        note: existing.note || '',
                        isFavorite: existing.isFavorite || false,
                        isAnime: existing.isAnime || false
                    });
                    updatedSchedulesCount++;
                } else {
                    // 添加新日程
                    existingSchedulesMap.set(event.id, event);
                    newSchedulesCount++;
                }
            });
        } catch (error) {
            console.error(`处理失败: ${error.message}`);
        }
    }

    // 转换为数组并按日期排序
    const allSchedules = Array.from(existingSchedulesMap.values());
    allSchedules.sort((a, b) => {
        const dateA = new Date(a.date.replace(/\//g, '-') + ' ' + a.time);
        const dateB = new Date(b.date.replace(/\//g, '-') + ' ' + b.time);
        return dateA - dateB;
    });

    // 生成新版本号
    const newVersion = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);

    // 保存更新后的数据
    const updatedData = {
        version: newVersion,
        schedules: allSchedules
    };

    fs.writeFileSync(BASE_SCHEDULES_PATH, JSON.stringify(updatedData, null, 2), 'utf-8');

    console.log('\n更新完成！');
    console.log(`新版本号: ${newVersion}`);
    console.log(`总日程数量: ${allSchedules.length}`);
    console.log(`新增日程: ${newSchedulesCount}`);
    console.log(`更新日程: ${updatedSchedulesCount}`);
}

// 运行主函数
main().catch(error => {
    console.error('执行失败:', error);
    process.exit(1);
});
