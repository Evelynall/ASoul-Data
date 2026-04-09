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
- 每天北京时间中午12点（UTC 4点）
- 每天北京时间下午4点（UTC 8点）
- 每天北京时间晚上8点（UTC 12点）
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

## 手动修改日程数据

当需要修正特定日程的字段（如标记已完成、添加备注等）时，可使用 **"修改日程数据"** 工作流。

### 触发方式

1. 进入仓库 Actions 页面
2. 左侧选择 **"修改日程数据"** 工作流
3. 点击 **"Run workflow"**
4. 在 `patch_data` 输入框中填入 JSON 数据，点击绿色 **"Run workflow"** 按钮

### 输入格式

**单条修改**（修改一个日程的指定字段）：
```json
{"id":"20210128-2000-bella@asoul.love","completed":true,"note":"演唱会"}
```

**批量修改**（一次修改多个日程）：
```json
[
  {"id":"20210128-2000-bella@asoul.love","completed":true,"note":"演唱会"},
  {"id":"20210129-2000-ava@asoul.love","isFavorite":true}
]
```

### 可修改的字段

| 字段 | 类型 | 说明 |
|------|------|------|
| `title` | string | 日程标题 |
| `type` | string | 日程类型 |
| `subTitle` | string | 副标题 |
| `category` | string | 成员分类 |
| `dynamicUrl` | string | B站动态链接 |
| `liveRoomUrl` | string | 直播间链接 |
| `icsUrl` | string | ICS 链接 |
| `completed` | boolean | 是否已完成 |
| `note` | string | 备注 |
| `isAnime` | boolean | 是否为动画 |
| `isFavorite` | boolean | 是否收藏 |

> `id`、`date`、`time` 等标识性字段不允许通过此工作流修改。

### 通过 API 触发（远程调用）

可以从其他系统通过 GitHub API 触发此工作流，实现自动化修改：

```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_GITHUB_TOKEN" \
  -H "Accept: application/vnd.github+json" \
  https://api.github.com/repos/Evelynall/ASoul-Data/actions/workflows/patch-schedule.yml/dispatches \
  -d '{
    "ref": "main",
    "inputs": {
      "patch_data": "{\"id\":\"20210128-2000-bella@asoul.love\",\"completed\":true,\"note\":\"已完成\"}"
    }
  }'
```

## 许可证

MIT License
