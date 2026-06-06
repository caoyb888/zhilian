# 绿产智链前端界面统一美化提升计划

> **版本**：V1.0  
> **日期**：2026-06-06  
> **范围**：Sprint 2（权限 & 标签 & 门户后台）+ Sprint 3（门户前台 & 文件服务 & 会员中心）前端界面  
> **参考文档**：`docs/ui-demo.tsx`、`三种风格的主要设计样式.md`、`sprint-plan.md`  
> **技术栈**：React 18 + Vite + Tailwind CSS 3.x + Headless UI + Zustand

---

## 一、项目背景与范围

### 1.1 背景

目前 Sprint 2 与 Sprint 3 的前端功能代码已开发完毕并合并至 `develop` 分支，但存在以下视觉层面的问题：

- ** Emoji 泛滥 **：导航、按钮、卡片中大量使用 emoji（`🍃`、`♻`、`📍`、`☰`）代替图标，缺乏专业感且在不同操作系统下渲染不一致。
- ** 设计风格碎片化 **：Portal 端、会员中心、管理端三套布局的 active 状态、卡片圆角、阴影层级、边框色号互不统一。
- ** 三种风格令牌沉睡 **：`tailwind.config.js` 中已定义 `brand.tech`、`brand.nordic`、`brand.office` 三套设计令牌，但组件层完全未接入。
- ** 组件重复造轮子 **：`Field` 表单包裹器、`INPUT_CLS` 输入框样式串在 `MemberProfilePage.tsx` 与 `SubAccountPage.tsx` 中完全复制粘贴，未复用已有的 `components/FormField.tsx`。
- ** 缺失设计系统原子 **：无统一图标系统、无共享 Skeleton/Empty/Error 状态、无标准 Badge/Banner 组件。

### 1.2 美化范围

| 模块 | Sprint | 涉及页面 / 组件 |
|---|---|---|
| **门户前台（Portal）** | Sprint 3 | `PortalHomePage`、`PortalArticleListPage`、`PortalArticleDetailPage`、`PortalActivityListPage`、`PortalActivityDetailPage`、`PortalNav` |
| **会员中心（Member）** | Sprint 3 | `MemberLayout`、`MemberProfilePage`、`SubAccountPage`、`MemberSidebar` |
| **管理后台（Admin）** | Sprint 2 | `AdminLayout`、`AdminDashboardPage`、`MemberListPage`、`MemberAuditPage`、`ArticleListPage`、`ActivityListPage`、`TagListPage`、`SupplyAuditPage` |
| **认证模块（Auth）** | Sprint 1+2 | `LoginPage`、`RegisterPage` |
| **共享组件（Shared）** | — | `Button`、`Input`、`FormField`、`FileUploader`、`Pagination`、`Spinner`、`RichEditor` |
| **业务组件（Business）** | — | `PortalNav`、`MemberSidebar`、`SupplyDemandResponsiveGrid` |

> **不在本次范围**：Sprint 4 及以后的供需列表/发布/匹配引擎页面，仅做基础设计系统预留。

---

## 二、设计目标与风格定位

### 2.1 总体目标

以 **`nordic`（清新北欧绿）为默认底座风格**，对现有 Sprint 2 & 3 全部前端界面进行统一美化，建立**可维护、可复用、可一键换肤**的设计系统基座。

### 2.2 风格选择依据

参考 `三种风格的主要设计样式.md` 的混合部署建议：

| 风格 | 适用场景 | 当前匹配度 |
|---|---|---|
| **nordic（清新北欧绿）** | 表单、长文、高频填报、协会公信力背书 | ⭐ 当前页面以白色/浅灰为底，emerald 为主色，与 nordic 最接近 |
| **tech（智慧极客绿）** | 大数据大盘、管理驾驶舱、 executive 汇报 | 预留，二期 dashboard 使用 |
| **office（商务蔚蓝绿）** | 绿色金融、产学研对接、政企联合会商 | 预留，二期签约/金融专区使用 |

**决策**：本次统一美化以 `nordic` 为默认风格，同时建立运行时风格切换机制（通过 `<html data-theme="nordic">` + CSS 变量），为二期 `tech` / `office` 切场打好基础。

### 2.3 设计原则

1. **自然材质感**：以 stone（矿石灰）+ emerald（林木绿）为核心，避免纯黑/高饱和荧光色。
2. **信息层级清晰**：通过字号（`text-xs` / `text-sm` / `text-base` / `text-lg` / `text-xl`）+ 字重（`font-normal` / `font-medium` / `font-semibold` / `font-bold`）+ 色彩饱和度建立严格层级。
3. **呼吸感留白**：卡片内边距统一为 `p-5`（20px），模块间距统一为 `gap-6`（24px），避免拥挤。
4. **动态微交互**：所有可交互元素必须具备 `transition-all duration-200` + `hover` 状态 + `active:scale-[0.98]` 按压反馈。
5. **Mobile First**：所有页面必须优先保证 `375px` 手机端可用，再向 `md` / `lg` / `xl` 延展。

---

## 三、基础设施层改造（Foundation）

### 3.1 Tailwind Config 扩展

将 `tailwind.config.js` 从静态色值升级为 **CSS 变量驱动**，支持运行时换肤。

```js
// tailwind.config.js 关键改动
module.exports = {
  // ... 保持 content 不变
  theme: {
    extend: {
      colors: {
        // === 运行时主题变量（由 <html data-theme> 控制）===
        theme: {
          bg: 'var(--theme-bg)',
          surface: 'var(--theme-surface)',
          border: 'var(--theme-border)',
          'text-main': 'var(--theme-text-main)',
          'text-muted': 'var(--theme-text-muted)',
          accent: 'var(--theme-accent)',
          'accent-hover': 'var(--theme-accent-hover)',
        },
        // === 保留原有 emerald 品牌色阶（兼容旧代码过渡）===
        brand: { /* 原有 50-950 不变 */ },
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgb(0 0 0 / 0.04), 0 1px 2px -1px rgb(0 0 0 / 0.04)',
        'card-hover': '0 10px 15px -3px rgb(0 0 0 / 0.05), 0 4px 6px -4px rgb(0 0 0 / 0.05)',
        'nordic': '0 4px 20px -2px rgb(4 120 87 / 0.08)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      }
    }
  }
}
```

在 `index.css` 中定义三套 CSS 变量：

```css
@layer base {
  /* 默认：清新北欧绿 */
  :root, [data-theme="nordic"] {
    --theme-bg: #fafaf9;
    --theme-surface: #ffffff;
    --theme-border: #e7e5e4;
    --theme-text-main: #292524;
    --theme-text-muted: #78716c;
    --theme-accent: #047857;
    --theme-accent-hover: #065f46;
  }

  [data-theme="tech"] {
    --theme-bg: #020617;
    --theme-surface: #0f172a;
    --theme-border: #1e293b;
    --theme-text-main: #f1f5f9;
    --theme-text-muted: #94a3b8;
    --theme-accent: #34d399;
    --theme-accent-hover: #10b981;
  }

  [data-theme="office"] {
    --theme-bg: #f8fafc;
    --theme-surface: #ffffff;
    --theme-border: #e2e8f0;
    --theme-text-main: #1e293b;
    --theme-text-muted: #64748b;
    --theme-accent: #0369a1;
    --theme-accent-hover: #075985;
  }
}
```

### 3.2 图标系统（Icon System）

**目标**：彻底替换所有 emoji，建立统一的 SVG 图标库。

**方案**：使用 `lucide-react`（轻量、Tree-shakeable、与 Tailwind 完美配合）。

| 原 Emoji | 替换为 Lucide Icon | 使用场景 |
|---|---|---|
| `🍃` | `Leaf` | 品牌 Logo、绿色认证标识 |
| `♻` | `Recycle` | 门户 Logo、固废循环分类 |
| `📍` | `MapPin` | 活动地点、省份筛选 |
| `🗓` / `⏰` | `Calendar` / `Clock` | 活动时间、截止日期 |
| `☰` | `Menu` | 移动端汉堡菜单 |
| `✕` | `X` | 关闭、删除、移除 |
| `✓` | `Check` | 成功状态、已签到 |
| `👤` | `User` | 个人中心、账号头像占位 |
| `📎` | `Paperclip` | 附件上传 |
| `🔍` | `Search` | 搜索框 |
| `🔔` | `Bell` | 消息通知（角标） |
| `📊` | `BarChart3` | 数据看板、统计 |

**实施步骤**：
1. `npm install lucide-react`
2. 新建 `src/components/Icon.tsx`：对 `lucide-react` 做一层薄封装，统一默认尺寸（`w-5 h-5`）和 strokeWidth（`1.5`）。
3. 全局搜索 `emoji-regex` 或人工扫描所有 `.tsx` 文件，逐项替换。

### 3.3 共享状态组件（Shared States）

新建 `src/components/states/` 目录，统一空态/骨架屏/错误态：

```
components/states/
├── EmptyState.tsx       # 空列表、无搜索结果
├── SkeletonCard.tsx     # 卡片骨架屏（3 行文字 + 1 按钮）
├── SkeletonList.tsx     # 列表骨架屏（5 行）
├── ErrorState.tsx       # 接口失败、网络错误
└── ForbiddenState.tsx   # 403 无权限（替代纯文字）
```

---

## 四、组件层统一（Component Layer）

### 4.1 基础原子组件改造

#### Button.tsx

基于 `ui-demo.tsx` 中三种风格的按钮规范，统一为 **4 个变体**：

| 变体 | 样式 | 用途 |
|---|---|---|
| `primary` | `bg-theme-accent text-white hover:bg-theme-accent-hover shadow-sm active:scale-[0.98]` | 主操作（提交、保存、报名） |
| `secondary` | `border border-theme-border bg-theme-surface hover:bg-gray-50 text-theme-text-main` | 次要操作（取消、返回） |
| `ghost` | `text-theme-accent hover:bg-theme-accent/5` | 文字按钮（编辑、查看更多） |
| `danger` | `bg-red-600 text-white hover:bg-red-700` | 危险操作（删除、禁用） |

统一 props：`size: 'sm' | 'md' | 'lg'`，`loading: boolean`（带 Spinner），`icon: LucideIcon`。

#### Input.tsx / FormField.tsx

- **统一边框色**：`border-stone-200 focus:border-emerald-600 focus:ring-emerald-600/20`（nordic 风格）。
- **统一圆角**：`rounded-lg`（8px）。
- **统一高度**：`h-10`（40px，sm）/ `h-11`（44px，md）。
- **统一错误态**：边框变 `border-red-300`，下方显示 `text-xs text-red-600` 错误文本。
- **强制复用**：`MemberProfilePage` 与 `SubAccountPage` 中内联的 `Field` 和 `INPUT_CLS` 必须删除，统一 import `components/FormField.tsx`。

#### Badge.tsx（新建）

统一标签/徽章视觉：

```tsx
// 语义化颜色映射
const badgeVariants = {
  news: 'bg-blue-50 text-blue-700 border-blue-200',
  notice: 'bg-amber-50 text-amber-700 border-amber-200',
  policy: 'bg-purple-50 text-purple-700 border-purple-200',
  activity: 'bg-teal-50 text-teal-700 border-teal-200',
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  error: 'bg-red-50 text-red-700 border-red-200',
  vip: 'bg-amber-50 text-amber-700 border-amber-300',
}
```

### 4.2 业务组件改造

#### PortalNav.tsx

**当前问题**：
- 无移动端菜单（`hidden md:flex` 直接隐藏，无汉堡按钮）。
- active 状态为下划线形式。

**美化方案**：
1. **Logo 区**：使用 `Leaf` 图标 + "绿产智链" 文字，增加品牌辨识度。
2. **桌面端导航**：active 状态改为 `bg-emerald-50 text-emerald-700 rounded-lg`（pill 形状，与 MemberSidebar 统一）。
3. **移动端**：增加 `Sheet`（Headless UI Dialog）底部滑出菜单，点击区域 ≥ 44px。
4. **用户信息区**：未登录显示 "登录 / 注册" 按钮；已登录显示头像下拉（`Menu` + `Transition` from Headless UI）。

#### MemberSidebar.tsx

**当前问题**：
- 与 PortalNav 视觉语言不一致（border-l active vs border-b active）。
- 子账号管理链接指向未注册路由（S3-05 遗留问题，S3-10 已补，需确认）。

**美化方案**：
1. 统一 active 态为 pill：`bg-emerald-50 text-emerald-700 rounded-lg`。
2. 增加会员等级徽章（`VIP` / `理事` 使用 `Badge` 组件）。
3. 底部增加 "退出登录" 区域，使用 `LogOut` 图标。

#### FileUploader.tsx

**当前问题**：
- React 18 setState during render 缺陷（P0）。
- 手写的 progress bar 无 ARIA 属性。
- 未接入 `value/defaultValue` 受控模式。

**美化方案**：
1. 先修复 P0 缺陷（见 review 报告）。
2. **拖拽区域**：使用虚线边框 `border-2 border-dashed border-stone-300 rounded-xl`，hover 时 `border-emerald-500 bg-emerald-50/50`。
3. **文件列表项**：使用 `File` / `Image` / `X` Lucide 图标替代原有 SVG。
4. **进度条**：增加 `role="progressbar"` + `aria-valuenow`。

---

## 五、页面层美化（Page Layer）

### 5.1 门户前台（Portal）— Sprint 3

#### PortalHomePage

**当前问题**：
- 统计数字写死（`200+`、`1,500+`）。
- banner 图片 `key={item.id}` 导致 remount 闪动。
- 活动区块调用错误 API 端点（`/portal/activities` 而非 `/portal/public/activities`）。

**美化方案**：
1. **Hero 区**：保留渐变背景，但增加 subtle 的噪点纹理或网格底纹（`bg-[url('/grid.svg')]`），提升质感。
2. **统计条**：改为从后端 `/portal/stats` 拉取真实数据（如后端暂无，则保留占位但增加 skeleton loading 动画）。
3. **轮播图**：
   - 修复 remount：将 `key` 移至 wrapper div，`<img>` 本身不加 `key`。
   - 增加指示器（小圆点）和左右箭头（`ChevronLeft` / `ChevronRight`）。
   - 增加 `transition-opacity duration-500` 淡入淡出。
4. **文章/活动卡片**：统一使用 `shadow-card hover:shadow-card-hover` 阴影，hover 时轻微上浮 `hover:-translate-y-0.5`。
5. **分类 badge**：按 `categoryId` 映射颜色（修复颜色失效问题）。

#### PortalArticleListPage / PortalArticleDetailPage

**美化方案**：
1. **列表页搜索框**：增加 `Search` 图标在左侧，`Command + K` 快捷键聚焦（参考现代 SaaS）。
2. **列表卡片**：封面图增加 `aspect-[16/10]` 比例裁剪，防止图片变形。
3. **详情页阅读进度条**：当前为顶部细条，改为固定在 `PortalNav` 下方的 `h-1 bg-emerald-500` 进度指示器。
4. **富文本内容区**：`.article-content` 增加 `prose prose-stone max-w-none` 样式（若允许引入 `@tailwindcss/typography`，否则手动优化段落/列表/引用块样式）。
5. **高亮关键词**：ES 返回的 `<em>` 标签使用 `bg-yellow-100 text-yellow-800 px-0.5 rounded` 高亮底纹。

#### PortalActivityListPage / PortalActivityDetailPage

**美化方案**：
1. **列表页状态标签**：
   - 筹备中：`bg-stone-100 text-stone-600`
   - 报名中：`bg-emerald-50 text-emerald-700`
   - 已结束：`bg-gray-100 text-gray-500`
2. **详情页报名面板**：
   - 容量条改为可视化进度条（`bg-gray-100 rounded-full h-2` + `bg-emerald-500 h-2 rounded-full`）。
   - 已报名状态增加 `CheckCircle2` 绿色图标提示。
3. **活动地点**：使用 `MapPin` + 文字，增加地图入口预留样式。

### 5.2 会员中心（Member）— Sprint 3

#### MemberProfilePage

**美化方案**：
1. **Logo 上传区**：
   - 当前为简单文件选择，改为圆形/圆角头像上传组件，hover 时显示相机图标（`Camera`）。
   - 修复 `URL.createObjectURL` 内存泄漏。
2. **表单布局**：
   - 从单列改为双列网格（`grid grid-cols-1 md:grid-cols-2 gap-6`），减少页面高度。
   - 标签输入框增加 `Tag` 图标。
3. **信息卡片**：会员等级、信用分、入会日期使用 `Card` 组件横向排列，增加图标（`Award`、`Shield`、`CalendarDays`）。

#### SubAccountPage

**美化方案**：
1. **表格美化**：
   - 表头：`bg-stone-50 text-stone-600 text-xs font-semibold uppercase tracking-wider`。
   - 行 hover：`hover:bg-stone-50/80`。
   - 状态列：启用为 `bg-emerald-50 text-emerald-700` 小圆点；禁用为 `bg-red-50 text-red-600`。
2. **新建弹窗**：
   - 手撸 modal 必须替换为 Headless UI `<Dialog>`，获得 focus trap + Escape 关闭 + ARIA。
   - 表单增加 `UserPlus` 图标标题。
3. **操作按钮**：启用/禁用使用 `Switch` 组件（Headless UI）替代原生的 toggle 按钮，更直观。

### 5.3 管理后台（Admin）— Sprint 2

**当前问题**：
- Admin 布局与 Portal 视觉语言完全脱节（无品牌色渐变、不同的 Logo 处理、更紧凑但压抑的间距）。
- 侧边栏 active 状态为填充式 `bg-brand-500 text-white`，与 Portal/Member 的 outline 风格不一致。

**美化方案**：
1. **侧边栏统一**：
   - active 态改为 `bg-emerald-50 text-emerald-700 border-r-2 border-emerald-600`（与 MemberSidebar 一致）。
   - 图标统一使用 Lucide（`Users`、`FileText`、`Tag`、`CheckSquare`、`BarChart3`、`Settings`）。
2. **顶部 Header**：
   - 左侧显示当前页面面包屑（`Breadcrumb` 组件）。
   - 右侧增加消息通知铃铛（`Bell`）+ 全局搜索（`Search`）。
3. **数据表格**：
   - 所有管理端表格统一增加：表头排序图标（`ArrowUpDown`）、行尾操作按钮组（编辑 `Pencil` / 删除 `Trash2`）、分页器（`Pagination` 组件）。
   - 增加批量操作栏（选中行后顶部滑出 `bg-stone-50 border-b` 操作条）。
4. **Dashboard 页**：
   - 指标卡统一使用 `shadow-nordic` 阴影 + `rounded-2xl`。
   - 图表区域（Recharts）增加 `rounded-xl border border-stone-200 p-4 bg-white` 容器。

### 5.4 认证模块（Auth）— Sprint 1+2

#### LoginPage / RegisterPage

**美化方案**：
1. **登录卡片**：
   - 增加左侧品牌展示区（大屏幕 `lg:` 显示）：渐变背景 + 平台 Slogan + `Leaf` 大图标。
   - 右侧表单区：`bg-white rounded-2xl shadow-nordic p-8`。
2. **输入框**：增加 `Mail`、`Lock`、`Smartphone` 左侧图标。
3. **图形验证码**：增加刷新按钮（`RefreshCw`），点击旋转动画。
4. **微信登录**：二维码区域增加扫描框动效（边框扫描线）。

---

## 六、三种风格切换预留机制

虽然本次默认使用 `nordic`，但必须在基础设施层为 `tech` / `office` 预留切换能力，避免二期返工。

### 6.1 运行时切换架构

```
stores/themeStore.ts（Zustand）
  └── themeId: 'nordic' | 'tech' | 'office'
  └── setTheme(id) => document.documentElement.setAttribute('data-theme', id)
```

### 6.2 组件层适配策略

**策略 A：CSS 变量驱动（推荐）**
- 所有颜色使用 `theme-bg`、`theme-surface`、`theme-accent` 等语义化 class。
- 切换主题时只需改 `<html data-theme>`，无需重渲染 React。
- **局限**：渐变、阴影、特殊背景图无法完全用 CSS 变量表达。

**策略 B：Style Dictionary（参考 `三种风格的主要设计样式.md`）**
- 建立 `src/styles/themeSchema.ts`：
  ```ts
  export const COMPONENT_THEMES = {
    nordic: { card: 'bg-white border-stone-200 ...', primaryBtn: 'bg-emerald-700 ...' },
    tech: { card: 'bg-slate-900 border-slate-800 ...', primaryBtn: 'bg-gradient-to-r from-emerald-400 to-cyan-400 ...' },
    office: { card: 'bg-white border-slate-200 ...', primaryBtn: 'bg-gradient-to-r from-sky-600 to-emerald-600 ...' },
  }
  ```
- 组件通过 `const style = COMPONENT_THEMES[themeId]` 动态取 class。
- **局限**：class 字符串无法被 Tailwind JIT 扫描（需使用 `safelist`）。

**推荐方案**：
- **基础色值**（背景、文字、边框）走 **CSS 变量**（策略 A）。
- **复杂样式**（渐变按钮、特殊阴影、暗色模式卡片）走 **Style Dictionary + Tailwind safelist**（策略 B）。

### 6.3 本次必须完成的预留工作

1. `tailwind.config.js` 中增加 `safelist` 配置，收录三种风格的所有特殊 class。
2. `index.css` 中完成三套 CSS 变量定义。
3. 至少在一个页面（如 `PortalHomePage`）中做三种风格的演示性适配，验证切换机制可行。

---

## 七、验收标准

### 7.1 功能验收

| 编号 | 验收项 | 通过标准 |
|---|---|---|
| V-01 | Emoji 清零 | 全局 `grep -r "emoji\|[\u{1F300}-\u{1F9FF}]" src/` 无命中（除富文本内容外） |
| V-02 | 图标统一 | 所有功能图标通过 `lucide-react` 渲染，尺寸统一 `w-5 h-5` |
| V-03 | 风格一致性 | Portal / Member / Admin 三端 active 状态、卡片、按钮、表单视觉统一 |
| V-04 | 移动端可用 | 所有页面在 `375px` 宽度下无横向滚动条、无元素溢出、按钮可点击 |
| V-05 | 主题切换 | 通过 Zustand store 切换 `data-theme` 属性，基础色值实时变化无闪烁 |
| V-06 | 无障碍基础 | 所有 `<img>` 有 `alt`、所有按钮有 `aria-label`、颜色对比度 ≥ 4.5:1 |

### 7.2 性能验收

| 编号 | 验收项 | 通过标准 |
|---|---|---|
| V-07 | 包体积 | `lucide-react` 按需引入后，首屏 JS 增量 ≤ 30KB（gzip） |
| V-08 | 动画性能 | 所有 `transition` 仅使用 `transform` / `opacity`，避免触发 layout/paint |
| V-09 | 骨架屏 | 列表页首屏加载时展示 Skeleton，白屏时间 ≤ 200ms |

---

## 八、排期与分工

> **总工时估算**：约 40h（5 个工作日），建议作为独立 **Sprint 3.5** 或并入 Sprint 4 开头执行。

| 阶段 | 任务 | 负责人 | 工时 | 前置依赖 |
|---|---|---|---|---|
| **Phase 1** | 安装 `lucide-react`，建立 `Icon.tsx` | 前端-王 | 2h | — |
| **Phase 1** | Tailwind Config 扩展（CSS 变量 + shadow + safelist） | 前端-吴 | 3h | — |
| **Phase 1** | 新建 `Badge.tsx`、`EmptyState.tsx`、`Skeleton*.tsx`、`ErrorState.tsx` | 前端-王 | 4h | Phase 1 Config |
| **Phase 1** | 改造 `Button.tsx`、`Input.tsx`、`FormField.tsx` | 前端-吴 | 3h | Phase 1 Config |
| **Phase 2** | 全局 Emoji 替换为 Lucide Icon | 前端-王 | 4h | Phase 1 Icon |
| **Phase 2** | 改造 `PortalNav.tsx`（移动端菜单 + active 统一） | 前端-王 | 4h | Phase 1 Button |
| **Phase 2** | 改造 `MemberSidebar.tsx` + `AdminLayout.tsx`（active 统一） | 前端-冯 | 3h | Phase 1 Button |
| **Phase 3** | 门户页面美化（Home + Article + Activity） | 前端-王 | 6h | Phase 2 PortalNav |
| **Phase 3** | 会员中心美化（Profile + SubAccount） | 前端-郑 | 4h | Phase 1 FormField |
| **Phase 3** | 管理端美化（Dashboard + 列表页 + 表格） | 前端-冯 | 5h | Phase 2 AdminLayout |
| **Phase 3** | 认证页美化（Login + Register） | 前端-郑 | 3h | Phase 1 Button/Input |
| **Phase 4** | 主题切换 store + 演示页适配 | 前端-吴 | 4h | Phase 1 Config |
| **Phase 4** | 三端走查与修复（375/768/1280） | 前端-吴 + 全前端 | 4h | Phase 3 全部 |
| **验收** | 代码 Review + SonarQube 扫描 | 前端-吴 | 2h | Phase 4 |

---

## 九、风险提示

1. **Tailwind safelist 配置遗漏**：若三种风格的特殊 class 未被 safelist 收录，生产构建后样式会丢失。建议在 `tailwind.config.js` 中显式列出所有 `COMPONENT_THEMES` 涉及的 class。
2. **Lucide React 版本兼容**：当前项目 React 18，需确认 `lucide-react` 最新版兼容。若出现 Tree-shaking 问题，改用 `import { Icon } from 'lucide-react'` 具体子导入。
3. **Headless UI 版本**：当前项目使用 Headless UI，但 `Switch`、`Dialog` 等组件需要确认版本是否支持。如版本过旧，先升级 `@headlessui/react`。
4. **回归风险**：全局替换 emoji 和统一 active 状态时，需逐一检查每个页面的路由匹配逻辑，防止 `NavLink` / `useLocation` 比较失效。

---

## 十、附录

### A. 快速检查清单（Checklist）

- [ ] `npm install lucide-react`
- [ ] `tailwind.config.js` 增加 `theme.*` 颜色与 `safelist`
- [ ] `index.css` 增加三套 CSS 变量
- [ ] 新建 `src/components/Icon.tsx`
- [ ] 新建 `src/components/Badge.tsx`
- [ ] 新建 `src/components/states/*.tsx`
- [ ] 改造 `Button.tsx`（4 个变体 + loading）
- [ ] 改造 `FormField.tsx`（统一 label/input/error 样式）
- [ ] `MemberProfilePage` 删除内联 `Field`，改用 `FormField`
- [ ] `SubAccountPage` 删除内联 `Field`，改用 `FormField`
- [ ] 全局替换 emoji 为 Lucide Icon
- [ ] `PortalNav` 增加移动端 `Sheet` 菜单
- [ ] `PortalNav` / `MemberSidebar` / `AdminLayout` active 状态统一为 pill 形状
- [ ] `FileUploader` 修复 P0 + 接入 `value/defaultValue`
- [ ] `SubAccountPage` modal 改为 Headless UI `<Dialog>`
- [ ] `LoginPage` / `RegisterPage` 增加左侧品牌展示区
- [ ] 所有列表页增加 `EmptyState` 与 `SkeletonList`
- [ ] 至少在一个页面验证三种风格切换

### B. 参考文件索引

| 文件 | 说明 |
|---|---|
| `docs/ui-demo.tsx` | 三种风格的完整交互演示，包含按钮、卡片、导航、标签的 class 参考 |
| `三种风格的主要设计样式.md` | Tailwind Config 配置与 `COMPONENT_THEMES` 映射表 |
| `green-link-web/tailwind.config.js` | 当前配置，需扩展 CSS 变量与 safelist |
| `green-link-web/src/index.css` | 需注入三套 CSS 变量 |
