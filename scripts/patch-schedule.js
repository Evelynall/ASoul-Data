const fs = require('fs');
const path = require('path');

// 基础日程库文件路径
const BASE_SCHEDULES_PATH = path.join(__dirname, '..', 'base-schedules.json');

// 允许通过此脚本修改的字段白名单
// id、date、time 等基础标识字段不允许修改，防止数据结构损坏
const ALLOWED_FIELDS = [
  'title',
  'type',
  'subTitle',
  'category',
  'dynamicUrl',
  'liveRoomUrl',
  'icsUrl',
  'completed',
  'note',
  'isAnime',
  'isFavorite'
];

/**
 * 解析补丁数据
 * 支持以下两种输入格式：
 *   1. 单条：{ "id": "...", "completed": true, "note": "xxx" }
 *   2. 批量：[ { "id": "...", ... }, { "id": "...", ... } ]
 */
function parsePatchInput(input) {
  let parsed;
  try {
    parsed = JSON.parse(input);
  } catch (e) {
    throw new Error(`JSON 解析失败：${e.message}`);
  }

  const patches = Array.isArray(parsed) ? parsed : [parsed];

  patches.forEach((patch, index) => {
    if (!patch.id || typeof patch.id !== 'string') {
      throw new Error(`第 ${index + 1} 条补丁缺少有效的 "id" 字段`);
    }
  });

  return patches;
}

/**
 * 将单条补丁应用到日程上
 * 返回 { applied: boolean, changes: string[] }
 */
function applyPatch(schedule, patch) {
  const changes = [];
  let applied = false;

  for (const [key, value] of Object.entries(patch)) {
    if (key === 'id') continue; // id 不修改

    if (!ALLOWED_FIELDS.includes(key)) {
      console.warn(`  ⚠️  字段 "${key}" 不在允许修改的白名单中，已跳过`);
      continue;
    }

    const oldValue = schedule[key];
    if (JSON.stringify(oldValue) !== JSON.stringify(value)) {
      schedule[key] = value;
      changes.push(`${key}: ${JSON.stringify(oldValue)} → ${JSON.stringify(value)}`);
      applied = true;
    } else {
      changes.push(`${key}: 值未变化，跳过`);
    }
  }

  return { applied, changes };
}

// 主函数
function main() {
  // 从环境变量或命令行参数读取补丁数据
  const patchInput = process.env.PATCH_DATA || process.argv[2];

  if (!patchInput) {
    console.error('错误：未提供补丁数据');
    console.error('用法：');
    console.error('  环境变量：PATCH_DATA=\'{"id":"...","completed":true}\' node scripts/patch-schedule.js');
    console.error('  命令行参数：node scripts/patch-schedule.js \'{"id":"...","note":"xxx"}\'');
    process.exit(1);
  }

  // 解析补丁数据
  let patches;
  try {
    patches = parsePatchInput(patchInput);
  } catch (e) {
    console.error(`错误：${e.message}`);
    process.exit(1);
  }

  console.log(`共收到 ${patches.length} 条补丁`);

  // 读取现有日程库
  if (!fs.existsSync(BASE_SCHEDULES_PATH)) {
    console.error(`错误：找不到日程库文件 ${BASE_SCHEDULES_PATH}`);
    process.exit(1);
  }

  let data;
  try {
    data = JSON.parse(fs.readFileSync(BASE_SCHEDULES_PATH, 'utf-8'));
  } catch (e) {
    console.error(`错误：读取日程库失败：${e.message}`);
    process.exit(1);
  }

  // 建立 id → index 的映射，方便快速定位
  const idIndexMap = new Map();
  data.schedules.forEach((s, i) => idIndexMap.set(s.id, i));

  let totalPatched = 0;
  let totalNotFound = 0;

  for (const patch of patches) {
    const { id, ...fields } = patch;
    console.log(`\n处理补丁 id="${id}"...`);

    if (!idIndexMap.has(id)) {
      console.warn(`  ✗ 未找到 id="${id}" 对应的日程，跳过`);
      totalNotFound++;
      continue;
    }

    const index = idIndexMap.get(id);
    const schedule = data.schedules[index];
    const { applied, changes } = applyPatch(schedule, fields);

    changes.forEach(c => console.log(`    ${c}`));

    if (applied) {
      console.log(`  ✓ 已修改`);
      totalPatched++;
    } else {
      console.log(`  - 无实际变化`);
    }
  }

  // 如果有修改，更新版本号并保存
  if (totalPatched > 0) {
    const now = new Date();
    data.version = now.toISOString().replace(/[-:T.]/g, '').slice(0, 14);
    data.lastUpdate = now.toISOString();

    fs.writeFileSync(BASE_SCHEDULES_PATH, JSON.stringify(data, null, 2), 'utf-8');
    console.log(`\n✓ 已保存，新版本号：${data.version}`);
  } else {
    console.log('\n- 没有任何修改，文件未变动');
  }

  console.log(`\n执行结果：成功修改 ${totalPatched} 条，未找到 ${totalNotFound} 条`);

  // 如果存在未找到的 id，以非零退出码提醒 CI
  if (totalNotFound > 0) {
    process.exit(2);
  }
}

main();
