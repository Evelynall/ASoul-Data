# 时区问题修复说明

## 问题描述

原本的ICS解析代码在GitHub Actions（UTC环境）中运行时，会将时间错误地转换为UTC时间而不是北京时间。

例如：
- ICS中的 `20240307T120000Z`（UTC 12:00）
- 应该显示为：`2024/03/07 20:00`（北京时间）
- 但在UTC环境中被错误显示为：`2024/03/07 04:00`

## 根本原因

JavaScript的 `Date` 对象会根据运行环境的时区自动转换时间：
- 在北京时区（UTC+8）环境中，`new Date(utcTime)` 会正确显示北京时间
- 在UTC环境中，`new Date(utcTime)` 会显示UTC时间

GitHub Actions默认运行在UTC环境中，导致时间显示错误。

## 解决方案

强制将所有时间转换为北京时间（UTC+8），无论在什么环境运行：

```javascript
// 1. 先将ICS时间转换为UTC时间戳
let utcTime;
if (timezone === 'Z') {
    // UTC时间
    utcTime = Date.UTC(year, month - 1, day, hour, minute, second || 0);
} else if (timezone && timezone.match(/[+-]\d{4}/)) {
    // 带时区偏移的时间
    const totalOffsetMinutes = ...;
    utcTime = Date.UTC(year, month - 1, day, hour, minute, second || 0) - (totalOffsetMinutes * 60000);
} else {
    // 无时区信息：假设为北京时间
    utcTime = Date.UTC(year, month - 1, day, hour, minute, second || 0) - (8 * 60 * 60000);
}

// 2. 将UTC时间戳转换为北京时间（UTC+8）
const beijingTime = new Date(utcTime + (8 * 60 * 60000));

// 3. 使用getUTC*方法获取时间（此时UTC表示的就是北京时间）
date = `${beijingTime.getUTCFullYear()}/${...}/${beijingTime.getUTCDate()}`;
time = `${beijingTime.getUTCHours()}:${beijingTime.getUTCMinutes()}`;
```

## 测试验证

运行测试脚本验证修复：

```bash
# 在本地时区测试
node test-timezone.js

# 在UTC环境测试
TZ=UTC node test-timezone.js
```

两种环境下的输出应该完全一致，都显示北京时间。

## 测试用例

| ICS时间 | 说明 | 输出（北京时间） |
|---------|------|------------------|
| `20240307T120000Z` | UTC 12:00 | 2024/03/07 20:00 |
| `20240307T200000+0800` | 北京时间 20:00 | 2024/03/07 20:00 |
| `20240307T210000+0900` | 东京时间 21:00 | 2024/03/07 20:00 |
| `20240307T070000-0500` | 纽约时间 07:00 | 2024/03/07 20:00 |
| `20240307T200000` | 无时区（假设北京） | 2024/03/07 20:00 |

## 影响范围

- ✅ `scripts/update-schedules.js` - 已修复
- ⚠️ `App.jsx` - 需要在前端项目中同步修复

## 前端修复建议

如果你的前端应用（App.jsx）也需要解析ICS，建议使用相同的逻辑：

1. 将ICS时间转换为UTC时间戳
2. 加上8小时（北京时间偏移）
3. 使用 `getUTC*` 方法获取时间组件

这样可以确保前后端显示的时间完全一致。
