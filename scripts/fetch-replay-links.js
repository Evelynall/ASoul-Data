const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

const BASE_SCHEDULES_PATH = path.join(__dirname, '..', 'base-schedules.json');

const MEMBER_CONFIG = {
    '贝拉': { mid: 672353429, seriesName: '直播回放' },
    '嘉然': { mid: 672328094, seriesName: '直播回放' },
    '乃琳': { mid: 672342685, seriesName: '直播回放' },
    '向晚': { mid: 3537115310721181, seriesName: '直播回放' },
    '珈乐': { mid: 3537115310721781, seriesName: '直播回放' }
};

const ID_MEMBER_MAP = {
    'bella': '贝拉',
    'diana': '嘉然',
    'eileen': '乃琳',
    'ava': '向晚',
    'carol': '珈乐'
};

const BILIBILI_SERIES_API = 'https://api.bilibili.com/x/polymer/web-space/home/seasons_series';

function extractMemberFromId(scheduleId) {
    const match = scheduleId.match(/^(\d{8})-(\d{4})-(.+?)@/);
    if (match) {
        const idPart = match[3].toLowerCase();
        return ID_MEMBER_MAP[idPart] || null;
    }
    return null;
}

function extractDateTime(scheduleId) {
    const match = scheduleId.match(/^(\d{4})(\d{2})(\d{2})-(\d{2})(\d{2})-/);
    if (match) {
        return {
            date: `${match[1]}/${match[2]}/${match[3]}`,
            time: `${match[4]}:${match[5]}`
        };
    }
    return null;
}

async function fetchAllVideos(mid) {
    const allVideos = [];
    let pageNum = 1;
    const pageSize = 20;
    let hasMore = true;
    const targetVideos = [];

    while (hasMore) {
        const url = `${BILIBILI_SERIES_API}?mid=${mid}&page_num=${pageNum}&page_size=${pageSize}`;

        try {
            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Referer': 'https://www.bilibili.com'
                }
            });

            if (!response.ok) {
                console.error(`API请求失败: HTTP ${response.status}`);
                break;
            }

            const data = await response.json();

            if (data.code !== 0) {
                console.error(`API返回错误: ${data.message}`);
                break;
            }

            const seriesList = data.data?.items_lists?.series_list || [];
            
            for (const series of seriesList) {
                const meta = series.meta || {};
                if (meta.name === '直播回放') {
                    const archives = series.archives || [];
                    targetVideos.push(...archives);
                }
            }

            const pageInfo = data.data?.items_lists?.page || {};
            if (pageNum >= pageInfo.total || seriesList.length < pageSize) {
                hasMore = false;
            } else {
                pageNum++;
            }

            await new Promise(resolve => setTimeout(resolve, 300));
        } catch (error) {
            console.error(`获取视频列表失败: ${error.message}`);
            break;
        }
    }

    return targetVideos;
}

function parseVideoDateTime(title) {
    const datePatterns = [
        { regex: /(\d{4})年(\d{1,2})月(\d{1,2})日/, format: (m) => `${m[1]}/${m[2].padStart(2, '0')}/${m[3].padStart(2, '0')}` },
        { regex: /(\d{4})-(\d{2})-(\d{2})/, format: (m) => `${m[1]}/${m[2]}/${m[3]}` },
        { regex: /(\d{4})(\d{2})(\d{2})/, format: (m) => `${m[1]}/${m[2]}/${m[3]}` }
    ];

    const timePattern = /(\d{2})点(\d{2})场/;

    let date = null;
    for (const pattern of datePatterns) {
        const match = title.match(pattern.regex);
        if (match) {
            date = pattern.format(match);
            break;
        }
    }

    let time = null;
    const timeMatch = title.match(timePattern);
    if (timeMatch) {
        time = `${timeMatch[1].padStart(2, '0')}:${timeMatch[2]}`;
    }

    return { date, time };
}

function timeMatch(scheduleTime, videoTime) {
    if (!videoTime) return true;
    
    const [sh, sm] = scheduleTime.split(':').map(Number);
    const [vh, vm] = videoTime.split(':').map(Number);
    
    const diff = Math.abs(sh * 60 + sm - (vh * 60 + vm));
    return diff <= 30;
}

async function main() {
    console.log('开始获取Bilibili录播链接...\n');

    if (!fs.existsSync(BASE_SCHEDULES_PATH)) {
        console.error('错误：未找到基础日程库文件');
        process.exit(1);
    }

    let scheduleData;
    try {
        const content = fs.readFileSync(BASE_SCHEDULES_PATH, 'utf-8');
        scheduleData = JSON.parse(content);
    } catch (error) {
        console.error('读取日程库失败:', error.message);
        process.exit(1);
    }

    const schedules = scheduleData.schedules || [];
    console.log(`当前日程总数: ${schedules.length}`);

    const memberVideos = {};
    for (const [memberName, config] of Object.entries(MEMBER_CONFIG)) {
        console.log(`\n正在获取 ${memberName} 的录播列表...`);
        console.log(`  MID: ${config.mid}, Series: ${config.seriesName}`);

        try {
            const videos = await fetchAllVideos(config.mid);
            console.log(`  获取到 ${videos.length} 个视频`);

            const videoMap = new Map();
            for (const video of videos) {
                const { date, time } = parseVideoDateTime(video.title);
                if (date) {
                    const key = `${date}_${time || 'unknown'}`;
                    if (!videoMap.has(key)) {
                        videoMap.set(key, {
                            url: `https://www.bilibili.com/video/${video.bvid}`,
                            title: video.title,
                            pubdate: video.pubdate,
                            time: time
                        });
                    }
                }
            }

            memberVideos[memberName] = videoMap;
            console.log(`  解析到 ${videoMap.size} 个带日期的视频`);
        } catch (error) {
            console.error(`  获取 ${memberName} 录播失败: ${error.message}`);
            memberVideos[memberName] = new Map();
        }
    }

    console.log('\n开始匹配日程和录播...\n');

    let updateCount = 0;
    let skipCount = 0;

    for (const schedule of schedules) {
        if (schedule.replayUrl && schedule.replayUrl.includes('bilibili.com')) {
            skipCount++;
            continue;
        }

        const member = extractMemberFromId(schedule.id);
        if (!member) continue;

        const dateTime = extractDateTime(schedule.id);
        if (!dateTime) continue;

        const videoMap = memberVideos[member];
        if (!videoMap || videoMap.size === 0) continue;

        const { date, time } = dateTime;
        const scheduleDate = date;
        const scheduleTime = time;

        for (const [key, videoInfo] of videoMap) {
            const [videoDate, videoTime] = key.split('_');
            
            if (videoDate === scheduleDate) {
                if (timeMatch(scheduleTime, videoTime)) {
                    schedule.replayUrl = videoInfo.url;
                    updateCount++;
                    console.log(`✓ 匹配成功!`);
                    console.log(`  日程: ${schedule.id}`);
                    console.log(`  标题: ${schedule.title}`);
                    console.log(`  录播: ${videoInfo.title}`);
                    console.log(`  链接: ${videoInfo.url}`);
                    console.log('');
                    break;
                }
            }
        }
    }

    const now = new Date();
    scheduleData.lastReplayUpdate = now.toISOString();

    fs.writeFileSync(BASE_SCHEDULES_PATH, JSON.stringify(scheduleData, null, 2), 'utf-8');

    console.log('========================================');
    console.log('录播链接更新完成！');
    console.log(`匹配更新: ${updateCount} 个日程`);
    console.log(`已有链接跳过: ${skipCount} 个日程`);
    console.log(`更新时间: ${now.toISOString()}`);
    console.log('========================================');
}

main().catch(error => {
    console.error('执行失败:', error);
    process.exit(1);
});
