# 合肥同城家教平台（MVP）

Vue3 + Vite + Element Plus + SCSS + TypeScript 前端。对接平级 Java 后端 `tonghao-server`。

## 技术栈

- Vue 3（Composition API + `<script setup>`）
- Vite 5
- TypeScript
- Element Plus
- SCSS
- Pinia（含持久化）
- Vue Router

## 快速开始

```bash
# 安装依赖
npm install

# 本地开发（默认 http://localhost:5173）
npm run dev

# 类型检查 + 生产构建
npm run build

# 预览构建产物
npm run preview
```

## 演示账号

| 角色 | 手机号 | 验证码 |
|------|--------|--------|
| 管理员 | `18800000000` | `123456` |
| 学员/老师 | 任意 11 位手机号 | `123456` |

- 老师入驻提交后默认为「待审核」，管理员在后台「老师资质审核」通过后才会出现在前台列表。
- 预约咨询会弹出弹窗，仅 Mock 成功提示。

## 目录结构（便于迁移 UniApp）

```
src/
  api/           # 接口层（当前走 Store Mock，后续可换成 uni.request）
  components/    # 通用组件（layout / teacher）
  constants/     # 科目、区县等常量
  mock/          # 示例老师、需求、评论数据
  pages/         # 页面（按业务拆分，接近 UniApp pages）
  router/        # 路由
  store/         # Pinia 状态
  styles/        # 全局样式与变量
  types/         # TS 类型
  utils/         # 工具函数
```

迁移建议：页面放在 `pages/`，请求统一走 `api/`，样式变量集中在 `styles/variables.scss`，业务状态在 `store/`。

## 已实现页面

1. 首页：导航、搜索、快捷筛选、热门老师、最新需求、简介、页脚
2. 老师列表：多维筛选 + 卡片网格
3. 老师详情：资料、证书、时间、评价、咨询预约
4. 学员求聘：需求表单（Mock 保存）
5. 老师入驻：入驻表单（待审核）
6. 登录注册：手机号 + 验证码（Mock）
7. 管理后台：看板 / 用户 / 审核 / 需求 / 评论
8. 用户协议、隐私政策

## 交互规则摘要

- 未审核通过的老师不对前台展示
- 详情页「咨询预约」弹出咨询弹窗
- 主色浅蓝 `#3b9eff`，点缀橙色 `#ff8a3d`
- 页面底部有风险提示：平台仅信息撮合，不担保教学质量

## 说明

本项目为前端 MVP，已对接平级后端仓库 `tonghao-server`（开发时 Vite 将 `/api` 代理到 `http://localhost:8080`）。请先启动后端再访问前端。
