# make the fucking money

基于 [TDesign Miniprogram](https://tdesign.tencent.com/miniprogram/overview) 搭建的微信小程序，面向业务工作台场景，当前处于页面骨架搭建阶段。

## 当前功能

| 模块 | 路径 | 状态 |
|------|------|------|
| 站内信 | `pages/notification/index` | Tab 页，待实现 |
| 工作台 | `pages/workspace/index` | Tab 页，待实现 |
| 我的 | `pages/my/index` | Tab 页，待实现 |
| 个人信息编辑 | `pages/my/info-edit/index` | 已创建，尚未注册到 `app.json` |

底部导航使用**自定义 TabBar**（`custom-tab-bar/`），基于 TDesign `t-tab-bar` 组件实现。

## 技术栈

- 微信原生小程序（基础库 `3.7.8`）
- [tdesign-miniprogram](https://github.com/Tencent/tdesign-miniprogram) `^1.11.2`
- Less 样式（`project.config.json` 已启用 less 编译插件）
- ESLint + Prettier 代码规范
- GitHub Actions PR lint 检查

## 目录结构

```
miniprogram-1/
├── app.js                  # 应用入口（版本更新、全局 eventBus）
├── app.json                # 全局配置（页面路由、TabBar、组件别名）
├── app.less                # 全局样式
├── config.js               # 运行时配置（baseUrl、isMock）
├── api/
│   └── request.js          # 统一网络请求封装
├── behaviors/
│   └── useToast.js         # Toast 复用 Behavior
├── components/             # 自定义组件（nav、card，来自模板遗留）
├── custom-tab-bar/         # 自定义底部 TabBar
├── pages/
│   ├── notification/       # 站内信
│   ├── workspace/          # 工作台
│   └── my/                 # 我的
│       └── info-edit/      # 个人信息编辑（未注册）
├── utils/
│   ├── eventBus.js         # 全局事件总线
│   └── util.js             # 通用工具函数
└── project.config.json     # 微信开发者工具项目配置
```

## 快速开始

### 环境要求

- [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)（稳定版）
- Node.js >= 18

### 安装与预览

```bash
# 安装依赖
npm install

# 代码检查
npm run lint

# 自动修复格式问题
npm run lint:fix
```

1. 用微信开发者工具导入项目根目录
2. 菜单栏选择 **工具 → 构建 npm**
3. 编译后即可在模拟器中预览

### 配置说明

`config.js` 控制 API 行为：

```js
export default {
  isMock: true,   // 是否启用 Mock 延迟（当前 Mock 层已移除，待接真实 API 时改为 false）
  baseUrl: '',    // 后端 API 根地址
};
```

接入真实后端时，将 `isMock` 设为 `false` 并填写 `baseUrl`。登录态 Token 通过 `wx.setStorageSync('access_token')` 存储，请求层会自动附加 `Authorization` 头。

路径别名已在 `app.json` 中配置：

```json
"resolveAlias": {
  "~/*": "/*"
}
```

引用示例：`import request from '~/api/request'`

## 新增页面

1. 在 `pages/` 下创建页面四件套：`index.js`、`index.json`、`index.wxml`、`index.less`
2. 在 `app.json` 的 `pages` 数组中注册路径
3. 若为 Tab 页，同步更新 `tabBar.list` 和 `custom-tab-bar/index.js`
4. 非 Tab 页使用 `wx.navigateTo`，Tab 页使用 `wx.switchTab`

## 开发规范

项目 Cursor AI 规则见 [`.cursor/rules/wechat-miniprogram.mdc`](.cursor/rules/wechat-miniprogram.mdc)，涵盖页面结构、命名、路由、组件、请求层等微信小程序开发约定。

## 开源协议

[MIT License](./LICENSE)
