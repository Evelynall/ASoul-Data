// 测试时区解析
const testCases = [
    {
        name: 'UTC时间 (Z结尾)',
        input: '20240307T120000Z',
        expected: '北京时间 2024/03/07 20:00'
    },
    {
        name: '东八区时间 (+0800)',
        input: '20240307T200000+0800',
        expected: '北京时间 2024/03/07 20:00'
    },
    {
        name: '无时区信息',
        input: '20240307T200000',
        expected: '本地时间 2024/03/07 20:00'
    },
    {
        name: '全天事件',
        input: '20240307',
        expected: '2024/03/07 00:00'
    }
];

function parseDateTime(dtstart) {
    let date = '', time = '';

    const tzMatch = dtstart.match(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z|[+-]\d{4})?/);
    if (tzMatch) {
        const [, year, month, day, hour, minute, second, timezone] = tzMatch;
        let eventDate;

        if (timezone === 'Z') {
            // UTC时间：创建UTC时间戳，然后转换为本地时间
            const utcTime = Date.UTC(year, month - 1, day, hour, minute, second || 0);
            eventDate = new Date(utcTime);
            console.log(`  UTC时间戳: ${utcTime}, 转换为本地: ${eventDate.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}`);
        } else if (timezone && timezone.match(/[+-]\d{4}/)) {
            // 带时区偏移的时间
            const offsetHours = parseInt(timezone.substring(1, 3));
            const offsetMinutes = parseInt(timezone.substring(3, 5));
            const totalOffsetMinutes = (timezone[0] === '+' ? offsetHours : -offsetHours) * 60 +
                (timezone[0] === '+' ? offsetMinutes : -offsetMinutes);

            console.log(`  时区偏移: ${timezone} = ${totalOffsetMinutes}分钟`);

            // 创建UTC时间戳，减去时区偏移得到真实UTC时间
            const utcTime = Date.UTC(year, month - 1, day, hour, minute, second || 0) - (totalOffsetMinutes * 60000);
            eventDate = new Date(utcTime);
            console.log(`  UTC时间戳: ${utcTime}, 转换为本地: ${eventDate.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}`);
        } else {
            // 无时区信息：假设为本地时间
            eventDate = new Date(year, month - 1, day, hour, minute, second || 0);
            console.log(`  本地时间: ${eventDate.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}`);
        }

        date = `${eventDate.getFullYear()}/${String(eventDate.getMonth() + 1).padStart(2, '0')}/${String(eventDate.getDate()).padStart(2, '0')}`;
        time = `${String(eventDate.getHours()).padStart(2, '0')}:${String(eventDate.getMinutes()).padStart(2, '0')}`;
    } else {
        const dm = dtstart.match(/(\d{4})(\d{2})(\d{2})/);
        if (dm) {
            date = `${dm[1]}/${dm[2]}/${dm[3]}`;
            time = '00:00';
        }
    }

    return { date, time };
}

console.log('=== 时区解析测试 ===\n');
console.log(`当前系统时区: ${Intl.DateTimeFormat().resolvedOptions().timeZone}\n`);

testCases.forEach(testCase => {
    console.log(`测试: ${testCase.name}`);
    console.log(`输入: ${testCase.input}`);
    const result = parseDateTime(testCase.input);
    console.log(`输出: ${result.date} ${result.time}`);
    console.log(`预期: ${testCase.expected}`);
    console.log('---\n');
});

// 额外测试：不同时区的相同时刻
console.log('=== 相同时刻不同时区测试 ===\n');
const sameTime = [
    { tz: 'UTC', input: '20240307T120000Z' },
    { tz: 'UTC+8', input: '20240307T200000+0800' },
    { tz: 'UTC+9', input: '20240307T210000+0900' },
    { tz: 'UTC-5', input: '20240307T070000-0500' }
];

sameTime.forEach(test => {
    const result = parseDateTime(test.input);
    console.log(`${test.tz}: ${test.input} => ${result.date} ${result.time}`);
});
console.log('\n以上所有时间应该相同（都是北京时间 2024/03/07 20:00）');
