// 测试更新逻辑 - 验证版本号是否每次都会变化
const fs = require('fs');
const path = require('path');

const BASE_SCHEDULES_PATH = path.join(__dirname, 'base-schedules.json');

console.log('=== 测试版本号更新 ===\n');

// 读取当前文件
if (fs.existsSync(BASE_SCHEDULES_PATH)) {
    const content = fs.readFileSync(BASE_SCHEDULES_PATH, 'utf-8');
    const data = JSON.parse(content);

    console.log('当前文件信息:');
    console.log(`- 版本号: ${data.version}`);
    console.log(`- 日程数量: ${data.schedules ? data.schedules.length : 0}`);
    if (data.lastUpdate) {
        console.log(`- 最后更新: ${data.lastUpdate}`);
    }
    if (data.updateInfo) {
        console.log(`- 更新信息:`, data.updateInfo);
    }
    console.log('');

    // 模拟更新
    const now = new Date();
    const newVersion = now.toISOString().replace(/[-:T.]/g, '').slice(0, 14);

    console.log('模拟更新后:');
    console.log(`- 新版本号: ${newVersion}`);
    console.log(`- 新更新时间: ${now.toISOString()}`);
    console.log('');

    // 检查版本号是否不同
    if (data.version !== newVersion) {
        console.log('✓ 版本号会发生变化');
        console.log(`  ${data.version} => ${newVersion}`);
    } else {
        console.log('✗ 版本号相同（这不应该发生，除非在同一秒内运行）');
    }

    // 等待1秒后再次测试
    console.log('\n等待1秒后再次测试...');
    setTimeout(() => {
        const now2 = new Date();
        const newVersion2 = now2.toISOString().replace(/[-:T.]/g, '').slice(0, 14);
        console.log(`1秒后的版本号: ${newVersion2}`);

        if (newVersion !== newVersion2) {
            console.log('✓ 确认：不同时间点的版本号不同');
        } else {
            console.log('✗ 警告：版本号相同（可能是时间精度问题）');
        }
    }, 1000);

} else {
    console.log('错误: base-schedules.json 文件不存在');
}
