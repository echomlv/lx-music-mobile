# iPad mini 6 适配可行性分析

> 评估基线:`ios` 分支 v1.8.4,LX Music Mobile iOS Port
> 目标设备:iPad mini 6(A15 Bionic / iPadOS 15+ / 744×1133pt 竖屏 · 1133×744pt 横屏 · @2x)

---

## 一、可行性 — 高,基础已具备

| 维度 | 现状 | 结论 |
|---|---|---|
| 横竖屏布局 | `useHorizontalMode` 已存在,阈值 `w/h > 1.2`(`src/utils/tools.ts:533`);Home / PlayDetail 都有 `Horizontal/` + `Vertical/` 两套实现 | iPad mini 横屏 1133/744 ≈ **1.52** → 自动走 Horizontal;竖屏 744/1133 ≈ **0.66** → 走 Vertical。**布局层 0 改动可跑** |
| 旋转支持 | Info.plist `UISupportedInterfaceOrientations` 已开 Portrait + LandscapeLeft + LandscapeRight | 直接支持旋转 |
| 部署目标 | `IPHONEOS_DEPLOYMENT_TARGET = 13.4` | iPad mini 6 ≥ iPadOS 15,无门槛 |
| 架构 | arm64 only;`ios/Vendor/LXLibFLAC` xcframework 含 arm64 device slice | 无需重打 framework |
| 原生模块 | TrackPlayer / SwiftAudioEx / StreamingFlacPlayer / NowPlaying / Crypto / Cache 全部 device-agnostic | 无需改动 |
| DocumentPicker | `FilePickerModule`(`AppDelegate.mm:3817`)已用 `UIModalPresentationFullScreen` 呈现,不需要 iPad popover anchor | 无改动 |

---

## 二、必做改动(基础打通,约半天)

### 1. `TARGETED_DEVICE_FAMILY = "1,2"`
- 文件:`ios/LxMusicMobile.xcodeproj/project.pbxproj`
- 当前**未显式设置**,RN 模板默认 `1`(仅 iPhone)。需在 Debug / Release 两个 buildSettings 块都加上。

### 2. `UIRequiresFullScreen = true`(Info.plist)
- **关键决策点**:加上即声明不支持 Split View / Slide Over,可大幅缩减测试矩阵(避免 Compact 宽度的边缘情况)。
- 若计划支持多任务,留空但要承担额外 QA 成本(见路线 D)。

### 3. AppIcon 补 iPad 尺寸
- 文件:`ios/LxMusicMobile/Images.xcassets/AppIcon.appiconset/Contents.json`
- 当前所有条目 `"idiom": "iphone"`,需要补:
  - `76×76 @2x`(iPad app)
  - `83.5×83.5 @2x`(iPad Pro app)
  - 现有 `1024×1024` 已含 `ios-marketing`,可复用

### 4. LaunchScreen 验证
- 文件:`ios/LxMusicMobile/LaunchScreen.storyboard`
- 已用 safe area + autoresize,理论上 iPad 自适应。`device id="retina4_7"` 只是预览基线,不影响真机。
- **真机验证一次**即可,无需改动。

---

## 三、应做改动(UX 不变形,约 1 天)

### 5. PixelRatio scale 上限
- 文件:`src/utils/pixelRatio.ts:34`
- 当前:`const scale = Math.min(scaleW, scaleH, 3.1)`
- iPad mini 计算:scaleW ≈ 3.97, scaleH ≈ 3.40 → **命中 3.1 上限**
- 现象:所有 `scaleSizeW/H` 元素被放大到约 3.1×,触控不会偏小,**但字体偏大、间距过宽**
- 建议方案二选一:
  - **方案 A(快)**:给 iPad 单独 clamp,例如 `Platform.isPad ? 2.4 : 3.1`
  - **方案 B(干净)**:把 design baseline 从 iPhone 6(375)改成响应式,iPad 按 768 基准重算
- 工作量主要在 13 个屏幕的肉眼回归,代码改动仅 1 行

### 6. DrawerLayout 抽屉宽度
- 文件:`src/components/common/DrawerLayoutFixed.ios.tsx`、`src/screens/Home/Views/Mylist/index.tsx:56`
- iPad mini 上抽屉默认占满约 80% 屏宽会很怪
- 改动:加 `maxDrawerWidth ≈ 320`,iPad 横屏可再放宽到 360–400

### 7. ActionSheetIOS anchor
- 文件:`src/screens/Home/Views/Setting/settings/Basic/UserApiEditModal/ImportBtn.tsx:48`
- 全项目唯一一处使用。iPad 上不传 anchor 不会崩(RN 提供默认锚点),但弹窗位置较突兀
- 改动:补 `anchor` 让 popover 贴到触发按钮上,~10 行

---

## 四、可选打磨(锦上添花,约 1–2 天)

### 8. 三栏紧凑布局
- iPad mini 横屏 1133pt 足以做 **Aside(68pt) + 列表(380pt) + 详情(685pt)** 同屏
- 当前 `src/screens/v2/Home/Horizontal/Main.tsx` 仍是单栏,可加 `width > 1024` 分支拼合双栏
- 同理 `src/screens/v2/PlayDetail/Horizontal/index.tsx` 可让封面+歌词左右占比更平衡

### 9. Split View / Slide Over 多任务
- 不加 `UIRequiresFullScreen` 即可启用,但 Compact 宽度(~320pt)会触发"竖屏"分支
- 理论可跑,但要把 13 个屏在 **320 / 414 / 744 / 1133** 四档全过一遍
- **这是最大的隐藏成本**,不推荐 v1 阶段做

### 10. 键盘快捷键 / 鼠标 hover
- iPad 用户常配蓝牙键盘,可考虑:空格暂停、←→ 切歌、⌘F 聚焦搜索
- `react-native-navigation` 7 已支持 `keyCommands` API
- 改造点:`src/plugins/player/utils.ts` 暴露 toggle/next/prev,Home 注册键位

---

## 五、风险点

| 风险 | 说明 | 缓解 |
|---|---|---|
| **后台音频策略** | iPad 多窗口下与 iPhone 不同,TrackPlayer + Now Playing 行为可能差异 | **必须真机回归**;若启用 Split View 更要重点测 |
| **LinearGradient + BlurView 性能** | A15 比 iPhone 14 还强 | **0 担心** |
| **签名 / Provisioning** | 开发者证书 Capability 需要包含 iPad,Distribution 同样 | 提前在 Apple Developer 后台勾选 |
| **App Store 提交** | Universal app 需要 iPad 截图(12.9" 和 6.5"/6.7" iPhone 各 5 张) | 发行阶段事项,不在开发 |
| **scale clamp 改动副作用** | 调整 `pixelRatio.ts` 可能影响现有 iPhone 视觉 | 用 `Platform.isPad` 隔离,iPhone 路径保持不变 |

---

## 六、推荐节奏 & 总工时

| 路线 | 范围 | 预估工时 |
|---|---|---|
| **A — 兼容跑通**(推荐起点) | `1,2` + `UIRequiresFullScreen=true` + iPad 图标 + 抽屉宽度 + ActionSheet anchor + scale clamp + 真机回归 | **1.5–2 天** |
| **B — 体验合格** | A + 13 个屏 iPad 横竖两态肉眼回归 + 字号/间距微调 | **+1 天** |
| **C — iPad 优化** | B + Home / PlayDetail 双栏布局 + 键盘快捷键 | **+2 天** |
| **D — 多任务支持** | C + 取消 `UIRequiresFullScreen`,跑 Split View 全尺寸矩阵 | **+2 天** |

---

## 七、关键结论

**95% 的工作只是设备族 flag + 图标 + 几个调参**。主代码已经 "iPad-ready"——这是上一轮 v1 横屏 Home + v2 重构时无意中带来的红利:

- `useHorizontalMode` 阈值在 1.2,iPad 横屏自然命中
- v2 design tokens 系统是响应式的,scale clamp 调整一行即可影响全局
- `Horizontal/` + `Vertical/` 双套屏已经写好,无需新增 layout
- 原生层(FLAC / TrackPlayer / FilePicker / NowPlaying)全部 device-agnostic

**建议先按路线 A 出一个可上架的 Universal 版本**,看用户反馈再决定是否进 B/C/D。

---

## 八、Checklist(路线 A 立即可执行)

- [x] `project.pbxproj`:`TARGETED_DEVICE_FAMILY = "1,2"`(Debug + Release)
- [x] `Info.plist`:`UIRequiresFullScreen = true`
- [x] `AppIcon.appiconset`:补 iPad 76×76@2x、83.5×83.5@2x(从 1024 源 sips 生成)
- [x] `src/utils/pixelRatio.ts`:iPad 路径 clamp 改为 2.4(`Platform.isPad` 分支)
- [x] `ImportBtn.tsx`:`ActionSheetIOS` 补 anchor(`event.nativeEvent.target`)
- [x] iPad mini 模拟器烟雾验证通过
- [ ] (沿用现有 `widthPercentageMax = scaleSizeW(...)`,scale clamp 调整后已落到合理范围,无需再硬编码 320)
- [ ] Apple Developer Portal:Provisioning Profile 启用 iPad(发包前再做)
- [ ] 真机 iPad mini 6 回归(签名 / 锁屏 / 后台 / FLAC)


## 验证
接下来要你手动做的两件事

1. 真机/模拟器跑一遍(原生层改了 pbxproj + Info.plist + AppIcon,JS 改了 pixelRatio 全局影响):
```shell
cd ios && pod install && cd ..
npm start -- --reset-cache    # 终端 A
npm run ios -- --simulator "iPad mini (6th generation)"   # 终端 B
```

1. 重点回归:启动 → Home 横竖切换 → 抽屉 → 播放/锁屏 → FLAC → FilePicker。
2. Apple Developer Portal:进入对应 App ID,把 Capability / Device Family 改成 Universal,重新生成 Distribution Provisioning Profile;Xcode 里 Automatic
Signing 应该会自动拉新 profile。
