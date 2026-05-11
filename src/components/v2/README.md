# v2 组件目录

「现代 UI(v2)」重构的隔离区。所有视觉升级组件落在这里,**不修改 `src/components/`(v1)下的旧组件**,以便 Feature Flag 切换时随时回退。

> 详细背景见仓库根 `lxmusic UI重构可行性分析&实施计划.md`。

## 目录约定

```
src/components/v2/
├── atoms/         # 最小可复用单元
├── molecules/     # 由 atoms 组装的中等组件
├── organisms/     # 屏幕级组合
└── README.md
```

对应的:
- `src/theme/v2/` — 设计令牌 + `useDesignTokens()` hook
- `src/screens/v2/` — 新视觉屏幕(暂空)

## 阶段进度

### ✅ 阶段 0(已完成)
- v2 目录脚手架
- `theme/v2/tokens.ts` — spacing / radius / elevation / motion / blur / typography
- `theme/v2/useDesignTokens.ts` — useMemo 化的设计系统 hook
- Feature Flag `theme.useModernUI`(默认 false)+ 设置屏开关 + i18n

### ✅ 阶段 1.1(本次,已完成)
**原子组件**
- `atoms/Surface` — solid / blur / glass 三种 variant;BlurView 未安装时自动降级为半透明 View
- `atoms/Card` — Surface preset:圆角 16 / 微阴影 / padding=16
- `atoms/Pressable` — 按下缩放 + overlay 反馈,UI 线程动画
- `atoms/IconButton` — 圆形/圆角图标按钮,三种背景档位
- `atoms/PillButton` — pill 形按钮,3 种 variant × 3 种 size
- `atoms/AppBar` — 自绘顶部栏,支持半透明毛玻璃模式
- `atoms/Typography` — 语义化字号(display/title/subtitle/body/label/caption)

**预览页**
- `organisms/V2Showcase` — 开发态可视化预览页,列出所有 atoms 的所有状态

**接入点**
- 设置 → 主题 → 勾选「启用现代 UI」后,出现「预览 v2 组件」按钮 → 全屏 Modal 展示 Showcase

### ✅ 阶段 1.2(已完成)
- `@react-native-community/blur@4.4.1` + `react-native-reanimated@3.6.3` 已装
- `babel.config.js` 加入 `react-native-reanimated/plugin`
- `atoms/Surface.tsx` 改为静态 import 真实 BlurView,blur/glass variant 现在显示原生毛玻璃

### ✅ 阶段 2(本次,已完成)
**PlayerBar v2**
- `organisms/PlayerBarV2.tsx` — 毛玻璃背板 + 56×56 大封面 + 双行文本 + 三按钮
- 复用现有 `Progress`/`ProgressPlain` 手势逻辑,完全保留 seek 与 long-press jump
- shared element nativeID(`NAV_SHEAR_NATIVE_IDS.playDetail_pic`)保留,封面进 PlayDetail 仍走 shared element 转场
- 横屏自动显示 prev 按钮(与旧版行为一致)

**接入**
- `src/components/player/PlayerBar/index.tsx` 加 Feature Flag 分支:`useModernUI` 时返回 `PlayerBarV2`,否则保持旧版。Home(竖+横屏)+ SonglistDetail 三个挂载点同时切换。

**Showcase**
- 「v2 视觉预览」最后一节展示 PlayerBarV2 当前播放状态。

### ⏭️ 阶段 3 起
全局元素 v2(StatusBar / AppBar / Drawer),然后主屏 / PlayDetail / SonglistDetail / Comment 屏幕级换肤。

## 写组件的硬约束

1. **不导入 `src/components/common/*`(旧 v1)**,以保持视觉一致性。例外:可复用 `Icon.tsx`(icomoon 字体,无视觉负担)。
2. **样式走 token**:`tokens.spacing.lg`、`tokens.radius.md`、`tokens.elevation.md`,不硬编码 px。
3. **颜色继续走旧主题** `colors['c-primary']` 等,保证 13 个主题包都能切换。
4. **动效优先用 `react-native-reanimated@3`**(安装后);当前阶段用 RN 自带 `Animated` 兜底。
5. **iOS 优先**: 平台分支用 `.ios.tsx` 与 `.android.tsx`。BlurView 在 Android 自动降级。

## 安装新依赖(阶段 1 收尾)

```bash
# 进入仓库根目录
npm install @react-native-community/blur react-native-reanimated@~3.6.0 --save-exact

# 确认现有 react-native@0.73.11 仍被锁住(之前修复过的 overrides 仍生效)
npm ls react-native | grep -E "react-native@"

# 装好后修改 babel.config.js,把 'react-native-reanimated/plugin' 放到 plugins 数组最后一项

# iOS 原生
cd ios && pod install && cd ..

# 重新编译
npm run ios
```

### 安装后验证清单(必须跑完)
1. 启动 App → 主屏正常 → boot log 无新错误
2. 播放 MP3 → 锁屏元数据正常
3. 播放 FLAC(原生流式) → 进度同步、暂停/恢复
4. 切歌、上下首、随机模式
5. 拔耳机自动暂停 → 戴上不自动恢复
6. 来电中断后恢复播放
7. 同步:开启 sync,扫码连服务器
8. 进入 设置 → 主题 → 勾选「启用现代 UI」→ 点「预览 v2 组件」
   - Surface `blur` / `glass` variant 应该看到**真实毛玻璃**(而不再是色块)
   - PillButton 按下应该有平滑缩放与 overlay 反馈

任何一项异常都先关闭 `theme.useModernUI` 回退,然后排查;不要直接回滚代码。
