// 测试时区解析 - 强制输出北京时间
const testCases = [
    {
        name: 'UTC时间 (Z结尾) - 12:00 UTC',
        input: '20240307T120000Z',
        expected: '北京时间 2024/03/07 20:00'
    },
    {
        name: '东八区时间 (+0800) - 20:00 北京时间',
        input: '20240307T200000+0800',
        expected: '北京时间 2024/03/07 20:00'
    },
    {
        name: '无时区信息 - 假设为北京时间',
        input: '20240307T200000',
        expected: '北京时间 2024/03/07 20:00'
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
        let utcTime;

        if (timezone === 'Z') {
            // UTC时间：直接使用
            utcTime = Date.UTC(year, month - 1, day, hour, minute, second || 0);
            console.log(`  UTC时间戳: ${utcTime}`);
        } else if (timezone && timezone.match(/[+-]\d{4}/)) {
            // 带时区偏移的时间
            const offsetHours = parseInt(timezone.substring(1, 3));
            const offsetMinutes = parseInt(timezone.substring(3, 5));
            const totalOffsetMinutes = (timezone[0] === '+' ? offsetHours : -offsetHours) * 60 +
                (timezone[0] === '+' ? offsetMinutes : -offsetMinutes);

            console.log(`  时区偏移: ${timezone} = ${totalOffsetMinutes}分钟`);

            // 创建UTC时间戳，减去时区偏移得到真实UTC时间
            utcTime = Date.UTC(year, month - 1, day, hour, minute, second || 0) - (totalOffsetMinutes * 60000);
            console.log(`  UTC时间戳: ${utcTime}`);
        } else {
            // 无时区信息：假设为北京时间（UTC+8），转换为UTC
            utcTime = Date.UTC(year, month - 1, day, hour, minute, second || 0) - (8 * 60 * 60000);
            console.log(`  假设为北京时间，UTC时间戳: ${utcTime}`);
        }

        // 将UTC时间转换为北京时间（UTC+8）
        const beijingTime = new Date(utcTime + (8 * 60 * 60000));
        console.log(`  北京时间对象: ${beijingTime.toISOString()}`);

        date = `${beijingTime.getUTCFullYear()}/${String(beijingTime.getUTCMonth() + 1).padStart(2, '0')}/${String(beijingTime.getUTCDate()).padStart(2, '0')}`;
        time = `${String(beijingTime.getUTCHours()).padStart(2, '0')}:${String(beijingTime.getUTCMinutes()).padStart(2, '0')}`;
    } else {
        const dm = dtstart.match(/(\d{4})(\d{2})(\d{2})/);
        if (dm) {
            date = `${dm[1]}/${dm[2]}/${dm[3]}`;
            time = '00:00';
        }
    }

    return { date, time };
}

console.log('=== 时区解析测试（强制输出北京时间）===\n');
console.log(`当前系统时区: ${Intl.DateTimeFormat().resolvedOptions().timeZone}`);
console.log(`注意：无论在什么环境运行，输出都应该是北京时间\n`);

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
    { tz: 'UTC 12:00', input: '20240307T120000Z' },
    { tz: 'UTC+8 20:00', input: '20240307T200000+0800' },
    { tz: 'UTC+9 21:00', input: '20240307T210000+0900' },
    { tz: 'UTC-5 07:00', input: '20240307T070000-0500' }
];

sameTime.forEach(test => {
    const result = parseDateTime(test.input);
    console.log(`${test.tz}: ${test.input} => ${result.date} ${result.time}`);
});
console.log('\n✓ 以上所有时间应该相同（都是北京时间 2024/03/07 20:00）');
