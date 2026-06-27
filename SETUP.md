# 配置指南

## 第一步：配置ICS订阅链接

1. 访问 https://github.com/Evelynall/ASoul-Data/settings/secrets/actions

2. 点击 **"New repository secret"** 按钮

3. 填写以下信息：
   - **Name**: `ICS_URLS`
   - **Secret**: 你的ICS订阅链接（多个链接用换行符分隔）
   
   示例：
   ```
   https://example.com/calendar1.ics
   https://example.com/calendar2.ics
   https://example.com/calendar3.ics
   ```

4. 点击 **"Add secret"** 保存

## 第二步：验证GitHub Actions权限

1. 访问 https://github.com/Evelynall/ASoul-Data/settings/actions

2. 确保以下选项已启用：
   - **Actions permissions**: 选择 "Allow all actions and reusable workflows"
   - **Workflow permissions**: 选择 "Read and write permissions"
   - 勾选 "Allow GitHub Actions to create and approve pull requests"

3. 点击 **"Save"** 保存设置

## 第三步：手动触发第一次更新

1. 访问 https://github.com/Evelynall/ASoul-Data/actions

2. 在左侧选择 **"更新基础日程库"** 工作流

3. 点击右侧的 **"Run workflow"** 按钮

4. 选择 `main` 分支，点击绿色的 **"Run workflow"** 按钮

5. 等待工作流执行完成（通常需要1-2分钟）

6. 查看执行日志，确认更新成功

## 第四步：验证数据更新

1. 访问 https://github.com/Evelynall/ASoul-Data/blob/main/base-schedules.json

2. 检查文件是否已更新（查看版本号和日程数量）

3. 使用以下URL在你的应用中访问数据：
   ```
   https://raw.githubusercontent.com/Evelynall/ASoul-Data/main/base-schedules.json
   ```

## 第五步：配置 Bilibili API 代理（可选，推荐）

如果 GitHub Actions 的 IP 被 B 站拦截导致录播链接更新失败，可以使用 Cloudflare Worker 作为代理中转请求。

### 5.1 部署 Cloudflare Worker

**前置条件**：你需要有一个 [Cloudflare](https://dash.cloudflare.com/) 账号（免费版即可）。

#### 方法一：通过 Cloudflare Dashboard 部署（推荐新手）

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)

2. 在左侧菜单选择 **"Workers & Pages"**

3. 点击 **"Create application"** → 选择 **"Create Worker"**

4. 输入 Worker 名称（例如 `bilibili-api-proxy`），点击 **"Deploy"**

5. 部署成功后，点击 **"Edit code"** 进入代码编辑器

6. 用仓库根目录下的 [cloudflare-worker.js](file:///workspace/cloudflare-worker.js) 文件内容完全替换编辑器中的默认代码

7. 点击右上角的 **"Deploy"** 按钮保存

8. 记录下你的 Worker 访问地址，格式类似：
   ```
   https://bilibili-api-proxy.your-username.workers.dev
   ```

#### 方法二：通过 Wrangler CLI 部署

如果你熟悉命令行工具，可以使用 Wrangler：

```bash
# 安装 Wrangler
npm install -g wrangler

# 登录 Cloudflare
wrangler login

# 初始化项目（在项目根目录执行）
wrangler init bilibili-api-proxy

# 将 cloudflare-worker.js 的内容复制到 src/index.js

# 部署
wrangler deploy
```

### 5.2 测试 Worker 是否正常工作

在浏览器中访问你的 Worker 地址，例如：
```
https://bilibili-api-proxy.your-username.workers.dev/
```

如果显示 `Bilibili API Proxy Worker is running.` 说明部署成功。

再测试一下 API 转发：
```
https://bilibili-api-proxy.your-username.workers.dev/x/series/archives?mid=672353429&series_id=222938&only_normal=true&sort=desc&pn=1&ps=1
```

如果返回 JSON 数据（包含 `code: 0`），说明代理工作正常。

### 5.3 配置 GitHub Secrets

1. 访问 https://github.com/Evelynall/ASoul-Data/settings/secrets/actions

2. 点击 **"New repository secret"** 按钮

3. 填写以下信息：
   - **Name**: `BILIBILI_PROXY_URL`
   - **Secret**: 你的 Cloudflare Worker 地址，例如：
     ```
     https://bilibili-api-proxy.your-username.workers.dev
     ```

4. 点击 **"Add secret"** 保存

### 5.4 验证代理生效

1. 访问 https://github.com/Evelynall/ASoul-Data/actions

2. 在左侧选择 **"更新录播链接"** 工作流

3. 点击右侧的 **"Run workflow"** 手动触发一次

4. 等待执行完成后，查看日志中是否显示：
   ```
   使用代理: https://bilibili-api-proxy.your-username.workers.dev
   ```

5. 确认录播链接获取成功

## 自动更新时间表

配置完成后，系统将在以下时间自动更新：
- **每天北京时间早上8点**（UTC 0点）
- 你也可以随时手动触发更新

## 故障排查

### 问题1：工作流执行失败

**可能原因**：
- ICS_URLS密钥未配置或格式错误
- ICS订阅链接无法访问
- GitHub Actions权限不足

**解决方法**：
1. 检查 Settings > Secrets and variables > Actions 中的 ICS_URLS 配置
2. 确保ICS链接可以正常访问
3. 检查 Settings > Actions > General 中的权限设置

### 问题2：数据未更新

**可能原因**：
- ICS订阅源没有新数据
- 工作流未正常执行

**解决方法**：
1. 查看 Actions 页面的执行日志
2. 手动触发一次工作流测试
3. 检查ICS订阅源是否有新内容

### 问题3：录播链接更新失败（Bilibili API 被拦截）

**现象**：
- 日志显示 "获取视频列表失败: Invalid response body" 或 "Premature close"
- 本地运行正常，但 GitHub Actions 中失败

**可能原因**：
- GitHub Actions 的 IP 地址被 B 站反爬虫机制拦截

**解决方法**：
1. 按照本文档 **"第五步：配置 Bilibili API 代理"** 部署 Cloudflare Worker
2. 配置 `BILIBILI_PROXY_URL` secret
3. 重新运行工作流

### 问题4：合并冲突

**可能原因**：
- 手动修改了base-schedules.json文件

**解决方法**：
1. 避免手动修改base-schedules.json
2. 如果需要修改，请在工作流执行前完成
3. 或者暂时禁用自动更新，手动解决冲突后再启用

## 本地测试

如果需要在本地测试更新脚本：

```bash
# 安装依赖
npm install

# 设置环境变量（Windows PowerShell）
$env:ICS_URLS="https://example.com/calendar.ics"

# 运行脚本
npm run update
```

### 本地测试录播链接脚本（带代理）

```bash
# 设置代理（可选，用于本地测试代理是否工作）
$env:BILIBILI_PROXY_URL="https://bilibili-api-proxy.your-username.workers.dev"

# 运行录播链接获取脚本
node scripts/fetch-replay-links.js
```

## 需要帮助？

如果遇到问题，请：
1. 查看 Actions 页面的详细日志
2. 检查本文档的故障排查部分
3. 在仓库中创建 Issue 描述问题
