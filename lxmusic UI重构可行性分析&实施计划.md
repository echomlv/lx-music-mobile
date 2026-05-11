# lx-music-mobile iOS UI 重构可行性分析 & 实施计划

> 文档目标:在不改动播放/同步/音源等核心功能的前提下,把上游 Android-first 工程在 iOS 上的视觉与交互升级到「网易云音乐」风格(沉浸式大封面、毛玻璃、卡片化列表、圆角、留白、流畅动效)。
>
> 决策已对齐:**渐进并存 + 竖屏与横屏同步重构 + 引入 BlurView 与 Reanimated 3、不引入 BottomSheet**。

---

## 1. 背景与目标

### 1.1 现状
- 项目自 [lyswhut/lx-music-mobile](https://github.com/lyswhut/lx-music-mobile) fork,上游官方明确**只支持 Android**,iOS 适配在本仓库 `ios` 分支补齐。
- UI 沿用 Android 时代的扁平 + 单色 + 极简思路,在 iPhone 上观感不现代:
  - 元素无阴影/无 elevation,缺少层次
  - 圆角偏小且不统一(2/4/6 px 硬编码)
  - 缺少毛玻璃/沉浸式背景
  - PlayerBar(mini player)是 Android 风格水平工具栏
  - 列表是分隔线驱动,而非卡片驱动
- 工程上,**主题系统、状态管理、组件复用度都已经很好**,具备整体换肤而非推倒重来的条件。

### 1.2 目标视觉(参考网易云音乐 / Apple Music 通用现代风格)
- **沉浸式封面**: PlayDetail 用大封面 + BlurView 背景层 + 渐变蒙版
- **毛玻璃 mini player**: PlayerBar 采用半透明 + UIVisualEffectView 背板
- **卡片化列表**: 歌单/排行榜/我的列表用圆角卡片 + 微阴影,而非长分隔线
- **大圆角输入框**: 搜索框采用 pill 形态
- **更克制的颜色 + 更大的留白**: spacing scale 升 12/16/20/24
- **流畅动效**: 进出场过渡、列表手势、歌词滚动用 Reanimated 3 UI 线程动画
- **完整覆盖深浅色/13 个旧主题**: 不破坏现有主题包

### 1.3 约束
- **功能不动**: 播放管线(`react-native-track-player` fork + `StreamingFlacPlayerModule`)、锁屏元数据、同步、音源解析、设置项一律保持
- **iOS 优先,Android 不退化**: 新 UI 默认在 iOS 启用;Android 用户可通过 Feature Flag 继续看旧 UI(逐步迁移)
- **渐进并存**: 新代码落 `src/components/v2/`、`src/screens/v2/`,Feature Flag(`setting['theme.useModernUI']`)切换
- **不引入大型 UI 框架**: 不上 NativeBase / Tamagui / RN Paper,只补 BlurView + Reanimated 两个原子能力

---

## 2. 现有 UI 架构盘点

### 2.1 导航层

| 项 | 现状 | 文件 |
|---|---|---|
| 导航库 | `react-native-navigation@7.39.2`(原生) | `src/navigation/{index.ts,navigation.ts}` |
| 屏幕注册 | `HOME / PLAY_DETAIL / SONGLIST_DETAIL / COMMENT` + 3 个 Modal | `src/navigation/{screenNames.ts,registerScreens.tsx}` |
| 屏幕呈现 | `setRoot(stack)` 起步 / 详情页 `push` / 弹层 `showOverlay` | `src/navigation/navigation.ts` |
| 转场动效 | shared element animations(进出 PlayDetail 时封面图过渡) | `src/navigation/utils.ts` |
| topBar | 全部关闭原生 topBar,自绘 AppBar | 各屏幕 `Header.tsx` |

**关键约束**: RNN 7.39.2 不提供原生 half-sheet,所有「拉起底部菜单」目前是 `showOverlay` + 透明背景 + 自绘 Popup。我们继续走这条路,在 v2 里给 `Modal/Popup/Dialog` 加 drag handle + 圆角 + BlurView 背板。

### 2.2 屏幕层

| 屏幕 | 布局结构 | 关键文件 |
|---|---|---|
| **Home(竖屏)** | `DrawerLayoutFixed`(自绘抽屉,70%/最多 300px)+ `PagerView` 5 tab(Search / SongList / Mylist / Leaderboard / Setting)+ 底部 PlayerBar | `src/screens/Home/Vertical/{Content,Main,DrawerNav}.tsx` |
| **Home(横屏)** | 三栏布局(Aside / Main / Header) | `src/screens/Home/Horizontal/` |
| **PlayDetail(竖屏)** | PagerView 3 页(Pic / Lyric / Player 控制条),Header 浮在顶部 | `src/screens/PlayDetail/Vertical/{index.tsx,Pic.tsx,Lyric/,Player/,Header.tsx}` |
| **PlayDetail(横屏)** | 左右分栏,封面 + 歌词 + 控制条 | `src/screens/PlayDetail/Horizontal/` |
| **SonglistDetail** | FlatList 渲染歌曲 + 固定 Header/ActionBar + 底部 PlayerBar | `src/screens/SonglistDetail/index.tsx` |
| **Comment** | PagerView 切 Hot/New 评论 | `src/screens/Comment/index.tsx` |

横竖屏切换走 `src/utils/hooks/useHorizontalMode.ts`,**两套 JSX 完全独立**,所以横屏重做需要复制工作量——这部分用户已确认同步重做。

### 2.3 主题层

| 项 | 现状 | 文件 |
|---|---|---|
| 主题包 | 13 个预设 | `src/theme/themes/themes.ts`,生成器 `createThemes.js` |
| 颜色 token | `c-primary` / `c-font` / `c-content-background` 等 + 9 级 alpha + 9 级 shade | `src/theme/themes/createThemes.js` |
| 字号 | `Heading-1/2/3 + Title + Body + Caption` + 全局缩放 `global.lx.fontSize` | `src/theme/Typography.js`、`src/utils/pixelRatio.ts` |
| 圆角 | 仅 `BorderRadius.normal = 4`(其余硬编码) | `src/theme/Typography.js` |
| 阴影 | **无统一 token** | — |
| 间距 | **无统一 token** | — |
| 毛玻璃 | **无** | — |
| 运行时切换 | `useTheme()` 注入到 50+ 组件,`global.state_event.emit('themeUpdated')` 广播 | `src/store/Provider/ThemeProvider.tsx`、`src/store/theme/`、`src/core/theme.ts` |

### 2.4 通用组件层

`src/components/common/` 下 34 个组件,**全部基于裸 RN + inline style + useTheme**,无第三方 UI 库依赖:

- 容器/布局:`Modal`、`Popup`、`Dialog`、`ConfirmAlert`、`DrawerLayoutFixed.ios.tsx`、`Menu`、`DorpDownMenu`、`DorpDownPanel`、`Badge`、`StatusBar`
- 输入:`Button`、`ButtonPrimary`、`Input`、`CheckBox`、`Slider`、`FileSelect`、`ChoosePath`
- 展示:`Text`、`Icon`、`Image`、`ImageBackground`、`ScaledImage`、`Loading`、`LoadingMask`

样式风格特征:**每个组件 inline + 主题色直绑 + 弱 token 化**。重构时如果在原文件直接改,会引发 50+ 文件同时变更;**渐进策略**让我们在 `components/v2/` 重写一层,旧组件保留作回退。

### 2.5 播放器 UI 层

| 组件 | 现状 |
|---|---|
| `PlayerBar/index.tsx` | 水平 toolbar:[Pic 46×46 圆角 2] + [Title + Progress 3.6px] + [ControlBtn] |
| `Progress.tsx` / `ProgressBar.tsx` | PanResponder 手势,DefaultBar/BufferedBar/DragBar 三层渲染 |
| `SoundEffectControl.tsx` | 均衡器面板 |
| `PlayDetail/Vertical/Pic.tsx` | 大封面,shared element 转场 |
| `PlayDetail/Vertical/Lyric/` | 歌词,基于 `lrc-file-parser` |

**复用价值高**: `ProgressBar` 内部手势逻辑无需重写,只换视觉壳;`ControlBtn` 仅是 Icon 包装。

### 2.6 字体/图标
- `icomoon.ttf`(iOS:`ios/LxMusicMobile/icomoon.ttf`,Android:`android/app/src/main/assets/fonts/`)
- 元数据 `src/resources/fonts/selection.json`
- `src/components/common/Icon.tsx` 用 `createIconSetFromIcoMoon` 包装
- **可继续往 icomoon 集合里加图标**,或换 SF Symbols(iOS only)取得更原生观感

### 2.7 国际化
- `src/lang/{zh-cn,zh-tw,en-us}.json`,~1000+ key,通过 `global.i18n.t()` 调用
- UI 重构基本不动 key,只在「新增提示文案」或「删除被合并按钮」时少量增删

---

## 3. 可行性分析(绿/黄/红灯)

### 🟢 绿灯(零阻碍)
1. **主题系统已就位**: 仅需扩展 token,不改变现有 13 个主题包的色值;`useTheme()` 已经覆盖 50+ 组件,新增字段直接消费即可。
2. **组件 100% 自研**: 没有「替换第三方 UI 库」这种破坏性动作,改 inline style 即可。
3. **播放/锁屏/同步逻辑与 UI 解耦**: 重构不会触碰 `src/core/player/`、`src/plugins/player/`、`src/utils/nativeModules/`,锁屏元数据仍走原通道。
4. **i18n key 稳定**: 文案绑定影响小。
5. **横竖屏布局物理隔离**: 两套 JSX 独立,可分别推进互不阻塞。

### 🟡 黄灯(需绕过/管理)
1. **react-native-navigation topBar 配置死板**: 已经在用「关闭原生 topBar,自绘 Header」的策略,继续沿用即可。
2. **无原生 BottomSheet**: 用户已决定不引入第三方,改用现有 `Modal/Popup/Dialog` + drag handle + BlurView 背板,视觉略弱于 `@gorhom/bottom-sheet` 但能满足。
3. **横竖屏代码复制**: 用户确认同步重构,工时较「仅竖屏」+40~50%。要点是 v2 原子组件双布局共用,以减少重复 UI 逻辑。
4. **主题切换重渲染开销**: 50+ 组件订阅同一 context,新增 token 后重渲染范围更大。需要在 v2 里把 `useTheme()` 返回值用 `useMemo` + 浅比较优化。
5. **Reanimated 3 集成**: 需要在 `babel.config.js` 加 `'react-native-reanimated/plugin'`(必须放在 plugins 数组最后),且与现有 fork 包(track-player / background-timer)做一次全量回归。
6. **iOS 包体增量**: BlurView ≈ 50KB,Reanimated 3 ≈ 1.5MB(包含 worklet runtime)。可以接受。

### 🔴 红灯
**无致命阻碍**。唯一需要警惕的是「过度动效导致中低端 iPhone(iPhone 8 / SE)体感卡顿」,通过 Feature Flag 在低端机降级为 RN Animated 即可。

---

## 4. 设计令牌升级方案(Design Token v2)

在不破坏旧主题包的前提下,**扩展**新令牌字段,旧色值零迁移。新增字段集中在 `src/theme/v2/tokens.ts`(新建),并由 v2 主题 hook `useDesignTokens()` 暴露。

### 4.1 新增 token

```ts
// src/theme/v2/tokens.ts(示意)
export const spacing = {
  xxs: 2, xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32,
} as const

export const radius = {
  sm: 6, md: 10, lg: 16, xl: 24, pill: 9999,
} as const

export const elevation = {
  // iOS shadow
  none: {},
  sm:  { shadowColor: '#000', shadowOpacity: 0.06, shadowOffset: { width: 0, height: 1 }, shadowRadius: 2,  elevation: 1 },
  md:  { shadowColor: '#000', shadowOpacity: 0.08, shadowOffset: { width: 0, height: 2 }, shadowRadius: 6,  elevation: 3 },
  lg:  { shadowColor: '#000', shadowOpacity: 0.12, shadowOffset: { width: 0, height: 4 }, shadowRadius: 12, elevation: 6 },
  xl:  { shadowColor: '#000', shadowOpacity: 0.18, shadowOffset: { width: 0, height: 8 }, shadowRadius: 24, elevation: 10 },
}

export const motion = {
  duration: { fast: 150, base: 220, slow: 320 },
  easing: { standard: 'cubic-bezier(0.2,0,0,1)', enter: 'cubic-bezier(0,0,0,1)', exit: 'cubic-bezier(0.4,0,1,1)' },
}

export const blur = {
  thin: 10, regular: 20, thick: 30,
  tint: { light: 'light', dark: 'dark', material: 'systemMaterial' as const },
}
```

### 4.2 与现有主题颜色融合
- 新 `useDesignTokens()` hook **内部调用** `useTheme()` 拿颜色,再合并 spacing/radius/elevation/motion/blur,**返回单一 tokens 对象**。
- 颜色字段不动,只读消费;新组件用 `tokens.spacing.lg` 等替代散落的数字。

### 4.3 字号系统升级
- 保留 `global.lx.fontSize` 全局缩放,但 v2 里包一层 `useTypography()` 输出语义化字号:`display / title / body / label / caption`,对应到现有 `Typography.js` 的 size 表,避免直接传 px。

---

## 5. 依赖增补建议

| 包 | 用途 | 状态 | 注意 |
|---|---|---|---|
| `@react-native-community/blur` | iOS UIVisualEffectView 毛玻璃 | ✅ 引入 | 需 `pod install`;支持 light/dark/material 多种 tint |
| `react-native-reanimated@3.x` | UI 线程动画/手势 | ✅ 引入 | 改 `babel.config.js` 加 `'react-native-reanimated/plugin'`(必须放最后);需 `pod install`;与 fork 包做兼容性回归(主要是 track-player + background-timer 的 JNI/Bridge 路径) |
| `@gorhom/bottom-sheet` | half-sheet 模态 | ❌ 不引入 | 用现有 `Modal/Popup/Dialog` 替代 |
| `react-native-svg` | 矢量绘制 | ⏸ 视需求 | 若做圆形进度条 / 黑胶旋转可考虑;不强需 |
| SF Symbols | iOS 原生图标 | ⏸ 视需求 | 跨平台一致性会破坏,慎选 |

### 5.1 BlurView 接入清单
1. `npm install @react-native-community/blur`
2. `cd ios && pod install`(注意会触发 LXLibFLAC 重新构建 — 详见 `CLAUDE.md`)
3. 新建 `src/components/v2/atoms/Surface.tsx`,封装 `BlurView` + `View` 双模式,允许传 `variant='blur' | 'solid'`
4. 在 PlayerBar / PlayDetail / Modal 背景启用

### 5.2 Reanimated 3 接入清单
1. `npm install react-native-reanimated@~3.6.0`(0.73 兼容范围,需确认)
2. 改 `babel.config.js`:
   ```js
   module.exports = {
     presets: ['module:@react-native/babel-preset'],
     plugins: [
       '@babel/plugin-proposal-export-namespace-from',
       ['module-resolver', { /* 现有配置不变 */ }],
       'react-native-reanimated/plugin',   // 必须放最后
     ],
   }
   ```
3. `cd ios && pod install`
4. 在 `index.js` 顶部 `import 'react-native-reanimated'`(若 hermes 启用需注意 init 顺序)
5. **回归用例**:
   - 启动到 HomeScreen 不报错
   - 播放/暂停/切歌 → 锁屏元数据正常
   - 后台播放 → 不被 background-timer 异常打断
   - 同步功能开关 → 不影响 sync 客户端

---

## 6. 实施计划(6 阶段渐进重构)

> **总工期:7 周(单人) + 1 周 buffer = 8 周**。
> 每阶段独立可运行 / 可回退;新代码全部在 `components/v2`、`screens/v2`、`theme/v2`;由 Feature Flag `setting['theme.useModernUI']` 控制启用。

### 阶段 0 — 准备(0.5 周)

- [ ] 新建目录:`src/components/v2/{atoms,molecules,organisms}/`、`src/screens/v2/`、`src/theme/v2/`
- [ ] 写 `src/theme/v2/tokens.ts`(spacing / radius / elevation / motion / blur)
- [ ] 写 `src/theme/v2/useDesignTokens.ts`(合并旧 `useTheme()` 颜色)
- [ ] 在 `src/types/app_setting.d.ts`、`src/config/defaultSetting.ts` 加 `theme.useModernUI: boolean`(默认 `false`)
- [ ] 在「设置」屏幕加切换开关(沿用现有 `CheckBox`)
- [ ] 写 README:v2 目录约定 + 何时升降级

**产出**: 切换开关可见,新主题 tokens 可被 hook 拿到,但没有任何视觉变化。

### 阶段 1 — 基础设施(1.5 周)

- [ ] 安装 `@react-native-community/blur`,`pod install`
- [ ] 安装 `react-native-reanimated@~3.6.0`,改 babel 配置,`pod install`
- [ ] **Reanimated 集成回归**:播放/锁屏/同步全量回归(详见 §5.2)
- [ ] 写 v2 原子组件:
  - `Surface` — 卡片/容器底,支持 `variant: solid/blur/glass`
  - `Card` — 圆角 + 阴影 + padding
  - `AppBar` — 顶部栏(替代 navigation topBar)
  - `Pressable` — 加入 Reanimated press 反馈
  - `IconButton`、`PillButton` — 圆角按钮族
  - `SectionTitle`、`Divider` — 标题 + 分隔
- [ ] 性能优化:`useTheme()` / `useDesignTokens()` 返回值 `useMemo` 化
- [ ] 写一个 `Storybook-lite` 屏幕(开发用,只在开发态显示)展示 v2 atoms,方便对比

**产出**: 原子组件库 v2 就绪,文档展示页可视。

### 阶段 2 — 全局元素 v2(1 周)

- [ ] **PlayerBar v2**(`src/components/v2/organisms/PlayerBarV2.tsx`)
  - Surface variant=blur 背板
  - Pic 56×56 + radius=md
  - 双行信息(歌名 / 艺人 · 来源)
  - 控制按钮 → 双按钮(播放 + 列表入口)
  - 进度条改为细长 hairline(高 2px,贴底)
  - 复用现有 `ProgressBar.tsx` 手势逻辑,只换样式 props
  - Feature Flag 开 → 渲染 v2;关 → 渲染旧
- [ ] **StatusBar v2**:沉浸式 translucent + 按主题切换 light/dark content
- [ ] **AppBar v2**:替代各屏幕自绘 Header
- [ ] **Drawer v2**:新版`DrawerNavV2`,紧凑布局,顶部用户/版本卡片化
- [ ] 沿用旧 `Modal/Popup/Dialog` 但 wrap 一层 `SheetSurface` 加 drag handle + radius + blur 背板

**产出**: 切换 Feature Flag 后,全局壳已现代化,屏幕内部仍是旧 UI。

### 阶段 3 — Home 重做(2 周)

- [ ] 竖屏:
  - Search 页:大圆角搜索框(pill)+ 搜索建议卡片化
  - SongList 页:歌单卡片化,封面更大,标题/副标题清晰
  - Mylist 页:列表分区(我的喜欢 / 自建 / 收藏),卡片分组
  - Leaderboard 页:横向滚动榜单 chip + 内容卡片
  - Setting 页:分组卡片,iOS 风格 disclosure
- [ ] 横屏:三栏布局保持,Aside / Main / Header 全部走 v2 atoms,视觉一致
- [ ] DrawerNav 紧凑版
- [ ] 调用方在 `screens/Home/index.tsx` 加 Flag 分支:`useModernUI` → `screens/v2/Home`

**产出**: 默认开启 Feature Flag 即可看到完整主屏新视觉。

### 阶段 4 — PlayDetail + SonglistDetail + Comment(1.5 周)

- [ ] PlayDetail v2(竖屏):
  - **沉浸式封面背景**:从封面图取主色 + BlurView + LinearGradient 蒙版(可用 `react-native-linear-gradient`,如不想再加依赖可用 `Image` + 半透明 View)
  - 中央封面悬浮 + 微 shadow
  - 控制条用 Reanimated 做按下反馈
  - 歌词:行间距加大,当前行高亮 + 微缩放动画
- [ ] PlayDetail v2(横屏):左右分栏 + 沉浸式背景
- [ ] SonglistDetail v2:Header 大封面 + ActionBar 浮起 + FlatList 卡片化
- [ ] Comment v2:Tab pill 风格 + 评论卡片化 + 头像圆形

**产出**: 进入播放详情/歌单/评论页视觉全面现代化。

### 阶段 5 — 收尾 / QA(0.5 周)

- [ ] 横竖屏切换冒烟(快速旋转 30 次不崩)
- [ ] 13 个主题包逐个截图比对(深色 4 + 浅色 9)
- [ ] 低端机测试:iPhone 8 / SE 2,关注 BlurView 帧率(必要时降级为半透明色块)
- [ ] 播放/锁屏/同步/搜索/下载全链路回归
- [ ] 默认 Feature Flag 翻转为 ON(`theme.useModernUI = true`)
- [ ] 留「经典视觉」开关可在设置里关回旧 UI(供用户反馈期)
- [ ] CHANGELOG 与发版说明

### Buffer(1 周)
处理 QA 反馈、性能调优、未预期的兼容性问题。

---

## 7. 风险与缓解

| 风险 | 影响 | 缓解 |
|---|---|---|
| Reanimated 3 与 fork 包(track-player / background-timer)冲突 | 编译/运行时崩溃 | 阶段 1 集成后立即跑全量播放回归;若冲突,锁定 Reanimated 至已知兼容版本或退回 RN Animated |
| 主题切换重渲染开销过大 | 列表卡顿 | `useDesignTokens()` 用 `useMemo` + 浅比较;关键列表用 `React.memo` |
| BlurView 在低端机掉帧 | 用户体感差 | `Surface variant='blur'` 在低端机自动降级为半透明 solid;运行时检测 RAM/CPU(可粗略用 `Platform.constants.osVersion` 兜底) |
| 老用户偏好被破坏 | 差评 | 阶段 5 留「经典视觉」开关,默认开新 UI,设置可回旧;CHANGELOG 详细说明 |
| 横屏布局工时翻倍超预算 | 延期 | 阶段 3/4 内部按「竖屏先 → 横屏后」顺序,横屏遇阻可临时切回旧版,不阻塞发布 |
| react-native-navigation topBar 限制 | 自绘 AppBar 与原生过渡不一致 | 关闭 RNN topBar,完全 RN 绘制(已是现状) |
| iOS 包体增量(BlurView+Reanimated ≈ 1.5MB) | App Store 体积上升 | 可接受,无替代;Android 同样有效 |
| 锁屏元数据回归 | 显示异常 | 阶段 5 必须覆盖回归:播放/暂停/切歌/快进/拔耳机/中断恢复 |

---

## 8. 验证清单(每阶段交付前必跑)

### 8.1 视觉验证
- [ ] 13 个主题包(深色 4 + 浅色 9)逐个截图,Feature Flag ON/OFF 对比
- [ ] 竖屏 + 横屏 4 个屏幕(Home / PlayDetail / SonglistDetail / Comment)截图归档
- [ ] 中文长歌名 / 长艺人名 / Emoji 不溢出

### 8.2 功能回归(不许退化)
- [ ] 启动 → 主屏 < 3s
- [ ] 播放在线音乐(MP3 / FLAC)
- [ ] 播放本地音乐
- [ ] 切歌 / 上下首 / 随机模式
- [ ] 锁屏元数据:封面、歌名、艺人、进度、Remote 命令
- [ ] 后台播放、拔耳机、来电中断后恢复
- [ ] 同步服务连接、收发列表
- [ ] 搜索、歌单、排行榜
- [ ] 下载、收藏
- [ ] 评论查看
- [ ] 设置 → 主题切换实时生效
- [ ] Feature Flag 关 → 完全回到旧 UI(回归测试也要在旧 UI 下跑一次)

### 8.3 性能
- [ ] iPhone 8 / SE 2 上 PlayDetail 滚动稳定 60fps(BlurView 必要时降级)
- [ ] 主屏 5 tab 切换流畅
- [ ] 启动到主屏内存占用与旧 UI 差距 < 30MB

### 8.4 兼容
- [ ] Android 端:Feature Flag 关闭时 UI 与重构前完全一致(避免 iOS 重构波及 Android)
- [ ] 横竖屏快速切换 30 次不崩
- [ ] 13 个主题包切换不闪屏、不报错

---

## 附录 A:关键文件改动一览(预估)

> 不在表内的旧文件原则上不改;新功能落 `v2/` 目录。

| 类别 | 改动文件 | 类型 |
|---|---|---|
| 设置 | `src/config/defaultSetting.ts`、`src/types/app_setting.d.ts` | 新增 `theme.useModernUI` |
| 主题 | `src/theme/v2/{tokens.ts,useDesignTokens.ts,useTypography.ts}` | 新建 |
| 原子组件 | `src/components/v2/atoms/*` | 新建 |
| 分子/组织组件 | `src/components/v2/{molecules,organisms}/*` | 新建 |
| 屏幕 | `src/screens/v2/{Home,PlayDetail,SonglistDetail,Comment}/*` | 新建 |
| 屏幕入口 | `src/screens/{Home,PlayDetail,SonglistDetail,Comment}/index.tsx` | 加 Feature Flag 分支 |
| 全局壳 | `src/components/v2/organisms/PlayerBarV2.tsx` | 新建 |
| 配置 | `babel.config.js` | 加 reanimated 插件 |
| iOS Pods | `ios/Podfile.lock`(自动) | `pod install` 后变更 |
| 文档 | `CLAUDE.md`、`CHANGELOG.md` | 阶段 5 更新 |

## 附录 B:不在本次重构范围

明确**不动**的部分,避免误伤:
- `src/core/player/*`(播放编排)
- `src/plugins/player/*`(TrackPlayer 包装、NativeFlac、SoundEffect)
- `src/utils/nativeModules/*`(原生模块 JS 端)
- `src/utils/musicSdk/*`(音源 SDK)
- `src/plugins/sync/*`(同步)
- `src/core/init/*`(启动流程)
- `ios/Vendor/LXLibFLAC/`(原生 FLAC)
- 任何 `*.android.ts(x)` 平台分支文件(本次只动跨平台 + `.ios.tsx`)
- `react-native-navigation` 升级(继续锁 7.39.2)
- `react-native` 升级(继续锁 0.73.11)

---

## 决策摘要(已锁定)

| 决策项 | 选择 |
|---|---|
| 重构策略 | **渐进并存**(v2 目录 + Feature Flag) |
| 横竖屏 | **同步重构** |
| BlurView | ✅ 引入 |
| Reanimated 3 | ✅ 引入 |
| BottomSheet | ❌ 不引入,沿用 Modal/Popup |
| 工期 | 7 周 + 1 周 buffer = **8 周** |
| 默认开关 | 阶段 5 前 OFF;阶段 5 完成后 ON(并保留回退) |

如需细化某一阶段的设计稿、组件 API、或想先看某一屏的视觉概念图,告诉我具体的优先级,我可以单独展开。
