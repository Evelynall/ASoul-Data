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

### 问题3：合并冲突

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

## 需要帮助？

如果遇到问题，请：
1. 查看 Actions 页面的详细日志
2. 检查本文档的故障排查部分
3. 在仓库中创建 Issue 描述问题
