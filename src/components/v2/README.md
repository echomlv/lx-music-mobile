# v2 组件目录

「现代 UI(v2)」重构的隔离区。所有视觉升级组件落在这里,**不修改 `src/components/`(v1)下的旧组件**,以便 Feature Flag 切换时随时回退。

> 详细背景见仓库根 `lxmusic UI重构可行性分析&实施计划.md`。

## 目录约定

```
src/components/v2/
├── atoms/        # 最小可复用单元(Surface / Card / Pressable / IconButton / PillButton...)
├── molecules/    # 由 atoms 组装的中等组件(ListRow / SearchBar / SectionHeader...)
├── organisms/    # 屏幕级组合(PlayerBarV2 / AppBar / DrawerNavV2...)
└── README.md
```

对应的:
- `src/theme/v2/` — 设计令牌(spacing / radius / elevation / motion / blur) + `useDesignTokens()` hook
- `src/screens/v2/` — 新视觉屏幕,与 `src/screens/{Home,PlayDetail,...}` 并存

## 何时使用 v2

旧屏幕入口在 render 时根据 `setting['theme.useModernUI']` 分支:

```tsx
// 例:src/screens/Home/index.tsx 改造示意
const useModernUI = useSettingValue('theme.useModernUI')
return useModernUI
  ? <HomeV2 {...props} />
  : <HomeLegacy {...props} />
```

**默认 Flag = false**,直到阶段 5 完成 QA 才翻转为 true(详见实施计划文档)。

## 写组件的硬约束

1. **不导入 `src/components/common/*`(旧 v1)**,避免混用造成视觉断层。需要复用基础能力时:
   - 文字 → 自写或包装 RN `<Text>`,从 `useDesignTokens().colors` 取色
   - 图标 → 复用 `src/components/common/Icon.tsx`(icomoon 字体,无视觉负担)
   - 复杂手势(如 ProgressBar 拖拽)→ 复用旧文件的逻辑层,只换 UI 包装层
2. **样式必须走 token**:`tokens.spacing.lg`、`tokens.radius.md`、`tokens.elevation.md`,不要硬编码 px。
3. **颜色继续走旧主题** `colors['c-primary']` 等,保证 13 个主题包都能切换。
4. **动效优先用 `react-native-reanimated@3`**,UI 线程跑;过渡时长读 `tokens.motion.duration.*`。
5. **iOS 优先**: 平台分支用 `.ios.tsx` 与 `.android.tsx`(babel module-resolver 已配)。BlurView 在 Android 上自动降级,见 `atoms/Surface`。

## 测试与回退

切换设置开关「启用现代 UI」可实时在新旧 UI 间切换。如发现新视觉破坏功能,关闭开关即可立刻退回旧 UI,不影响播放/锁屏/同步等核心管线。

## 当前进度(对应实施计划阶段 0)

- [x] 目录脚手架
- [x] `theme/v2/tokens.ts` + `useDesignTokens()` hook
- [x] `theme.useModernUI` 设置项 + 设置屏开关 + i18n(zh-cn / zh-tw / en-us)
- [ ] 阶段 1 起:`atoms/Surface`、`atoms/Card`、`atoms/AppBar` 等
