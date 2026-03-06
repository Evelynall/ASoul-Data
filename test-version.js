// 测试版本号生成
const now = new Date();

console.log('当前时间:', now.toISOString());
console.log('');

// 旧版本号格式
const oldVersion = now.toISOString().replace(/[-:T]/g, '').slice(0, 14);
console.log('旧格式版本号:', oldVersion);

// 新版本号格式
const newVersion = now.toISOString().replace(/[-:T.]/g, '').slice(0, 14);
console.log('新格式版本号:', newVersion);

console.log('');
console.log('版本号格式说明:');
console.log('- 格式: YYYYMMDDHHmmss');
console.log('- 示例: 20260307120530 表示 2026年3月7日 12:05:30');
console.log('');

// 测试多个时间点
const testTimes = [
    new Date('2026-03-07T12:05:30.123Z'),
    new Date('2026-03-07T12:05:31.456Z'),
    new Date('2026-03-08T08:00:00.000Z')
];

console.log('测试不同时间点的版本号:');
testTimes.forEach(time => {
    const version = time.toISOString().replace(/[-:T.]/g, '').slice(0, 14);
    console.log(`${time.toISOString()} => ${version}`);
});
