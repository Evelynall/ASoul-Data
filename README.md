# ASoul-Data

A-SOUL 日程数据仓库，提供基础日程库供日历应用使用。

## 功能特性

- 自动从ICS订阅源拉取日程数据
- 每天自动更新基础日程库
- 支持手动触发更新
- 自动提交并推送到GitHub

## 配置说明

### 1. 设置ICS订阅链接

在GitHub仓库中配置ICS订阅链接：

1. 进入仓库的 `Settings` > `Secrets and variables` > `Actions`
2. 点击 `New repository secret`
3. 名称填写：`ICS_URLS`
4. 值填写：ICS订阅链接（多个链接用换行符分隔）

示例：
```
https://example.com/calendar1.ics
https://example.com/calendar2.ics
```

### 2. 自动更新

GitHub Actions会在以下情况自动运行：
- 每天北京时间早上8点（UTC 0点）
- 手动触发（在Actions页面点击"Run workflow"）

### 3. 数据格式

`base-schedules.json` 文件格式：

```json
{
  "version": "20240307001",
  "schedules": [
    {
      "id": "唯一标识符",
      "date": "2024/03/07",
      "time": "20:00",
      "title": "日程标题",
      "type": "日程类型",
      "subTitle": "副标题",
      "category": "成员分类",
      "dynamicUrl": "动态链接",
      "liveRoomUrl": "直播间链接",
      "icsUrl": "ICS链接",
      "completed": false,
      "note": "",
      "isIcs": true,
      "isAnime": false,
      "isFavorite": false
    }
  ]
}
```

## 本地开发

### 安装依赖

```bash
npm install node-fetch@2
```

### 运行更新脚本

```bash
# 设置环境变量
export ICS_URLS="https://example.com/calendar.ics"

# 运行脚本
node scripts/update-schedules.js
```

## 使用数据

在你的应用中通过以下URL访问基础日程库：

```
https://raw.githubusercontent.com/Evelynall/ASoul-Data/main/base-schedules.json
```

## 许可证

MIT License
