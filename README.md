# make the fucking money

面向企业内部工作台场景的微信小程序，基于 **TDesign Miniprogram** 构建，集成登录鉴权、站内信、组织与权限管理等功能。

## 功能概览

### 主包

| 模块 | 路径 | 说明 |
|------|------|------|
| 登录 | `pages/login/index` | 账号密码登录 |
| 站内信 | `pages/notification/index` | Tab 页，收件箱列表、未读、实时推送 |
| 站内信详情 | `pages/notification/detail/index` | 消息详情与已读 |
| 撰写站内信 | `pages/notification/compose/index` | 发送通知（需权限） |
| 工作台 | `pages/workspace/index` | Tab 页，管理入口聚合 |
| 我的 | `pages/my/index` | Tab 页，个人中心 |
| 个人资料 | `pages/my/profile/index` | 查看/编辑资料 |
| 账号设置 | `pages/my/settings/index` | 主题、密码等入口 |
| 修改密码 | `pages/my/password/index` | 修改登录密码 |
| 我的权限 | `pages/my/permissions/index` | 当前角色与权限码 |
| 错误页 | `pages/error/index` | 统一错误展示 |

### Admin 分包（`pages/admin`）

| 模块 | 路径 | 说明 |
|------|------|------|
| 部门管理 | `department/index`、`department/form/index` | 树形列表、左滑编辑/删除 |
| 职位管理 | `position/index`、`position/form/index` | 列表 CRUD |
| 用户管理 | `user/index`、`user/form/index`、`user/roles/index` | 用户 CRUD、角色分配 |
| 角色管理 | `role/index`、`role/form/index`、`role/permissions/index` | 角色 CRUD、权限配置 |

Admin 列表统一使用 `t-swipe-cell` 左滑操作；表单页底部保存按钮固定于屏幕下方。

## 技术栈

- 微信原生小程序（基础库 `3.7.8`）
- [tdesign-miniprogram](https://github.com/Tencent/tdesign-miniprogram) `^1.15.1`
- Less（`project.config.json` 已启用编译插件）
- ESLint + Prettier
- 按需组件加载：`lazyCodeLoading: requiredComponents`

## 目录结构

```
├── app.js / app.json / app.less    # 应用入口与全局配置
├── config.js                       # baseUrl 等运行时配置
├── api/                            # 主包 API 封装（auth、notification、department…）
├── behaviors/                      # useToast、useTheme、useAuthority
├── components/                     # admin-fab、theme-switch、color-theme-switch 等
├── constants/                      # 权限码、主题、工作台常量
├── custom-tab-bar/                 # 自定义 TabBar（TDesign t-tab-bar）
├── pages/
│   ├── admin/                      # Admin 分包
│   │   ├── shared/                 # 分包专用 API / behaviors / utils（@admin/*）
│   │   ├── department/
│   │   ├── position/
│   │   ├── user/
│   │   └── role/
│   ├── login/
│   ├── notification/
│   ├── workspace/
│   ├── my/
│   └── error/
├── styles/                         # admin.less、theme.less、palettes.less
├── utils/                          # auth、permission、inbox-realtime、admin 等
└── variable.less                   # 设计变量
```

## 快速开始

### 环境要求

- [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)（稳定版）
- Node.js >= 18

### 安装与预览

```bash
npm install
npm run lint        # 代码检查
npm run lint:fix    # 自动修复
```

1. 用微信开发者工具导入**项目根目录**
2. 菜单 **工具 → 构建 npm**
3. 编译后在模拟器预览

### 配置

`config.js`：

```js
export default {
  isMock: false,
  baseUrl: 'http://your-api-host:8080',
};
```

- 登录成功后 Token 存入 `access_token`，请求层自动附加 `Authorization`
- 路径别名（`app.json` → `resolveAlias`）：
  - `~/*` → 项目根目录
  - `@admin/*` → `pages/admin/shared/*`

## UI 开发约定

**优先使用 TDesign 组件**（`t-button`、`t-input`、`t-swipe-cell`、`t-picker` 等），详见 [TDesign 小程序文档](https://tdesign.tencent.com/miniprogram/overview)。

- 全局仅注册 `t-toast`、`t-message`、`t-loading`
- 各页面在 `index.json` 按需声明其余 TDesign 组件
- Toast 通过 `useToast` behavior 调用，避免页面内直接 `wx.showToast`

## 主题

支持明暗模式与多套配色主题，由 `useTheme` behavior 与 `styles/theme.less` 驱动。设置页可切换主题。

## 权限

权限码定义于 `constants/permissions.js`。页面通过 `useAuthority` behavior 的 `PermissionCode` 控制按钮显隐与操作拦截；Admin 模块按 CRUD 权限码划分。

## 新增页面

1. 创建四件套：`index.js`、`.json`、`.wxml`、`.less`
2. 注册路由：主包 → `app.json` pages；Admin → `subpackages` 对应 root
3. Tab 页额外同步 `tabBar.list` 与 `custom-tab-bar/`
4. 在 `index.json` 按需注册 TDesign 组件
5. Tab 页用 `wx.switchTab`，其余用 `wx.navigateTo`

## 开发规范

Cursor AI 规则见 [`.cursor/rules/wechat-miniprogram.mdc`](.cursor/rules/wechat-miniprogram.mdc)，涵盖 **TDesign 优先**、分包放置、请求层、命名等约定。

## 开源协议

[MIT License](./LICENSE)
