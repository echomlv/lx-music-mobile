# LX Music Mobile (iOS Port)

LX Music(洛雪音乐)移动版的 iOS 适配分支。上游仓库 `lyswhut/lx-music-mobile` 官方仅支持 Android,本仓库在原工程上补齐 iOS 平台所需的原生模块、构建配置与平台分支代码。

- 上游项目: https://github.com/lyswhut/lx-music-mobile
- 当前工作分支: `ios`(主分支为 `master`)
- 包/版本: `package.json` → `name: lx-music-mobile`, `version: 1.8.4`
- Bundle Display Name: `LX Music`,URL Scheme: `lxmusic://`

## 技术栈

- React Native 0.73.11,React 18.2.0,TypeScript 5.x(`tsconfig.json` 继承 `@react-native/typescript-config`)
- 导航: `react-native-navigation` 7.39.x(原生 Navigation,非 React Navigation)
- 状态管理: 自研 `state + action + hook` 模式,无 Redux(`src/store/Provider/Provider.tsx` 留有历史 Redux 注释但已废弃)
- 播放器: 上游 fork 的 `react-native-track-player`(`github:lyswhut/react-native-track-player`),底层 iOS 走 `SwiftAudioEx`
- 高码率 FLAC: 自带 `ios/Vendor/LXLibFLAC` xcframework + 原生 `StreamingFlacPlayerModule`,在 quality 为 `flac/flac24bit` 时绕过 TrackPlayer 走原生流式 FLAC
- 存储: `@react-native-async-storage/async-storage`(包裹在 `src/plugins/storage.ts`)
- 工具链: Node ≥ 18,iOS 需要 CocoaPods、Xcode

## 目录速览

```
.
├── android/                       # 上游保留的 Android 工程(本仓库主要关注 iOS,但仍可编译 Android)
├── ios/
│   ├── LxMusicMobile/             # Xcode 工程 AppDelegate / Info.plist / 资源
│   ├── LxMusicMobile.xcodeproj/
│   ├── LxMusicMobileTests/
│   ├── Podfile                    # 内含 LXLibFLAC 构建钩子与 SwiftAudioEx 补丁
│   └── Vendor/LXLibFLAC/          # 自带 libFLAC xcframework 源码 + build_xcframework.sh
├── patches/                       # 通过 dependencies-patch.js 应用的 npm 包补丁
├── dependencies-patch.js          # postinstall 触发,修改 node_modules 中的源文件
├── index.js                       # 入口: 加载 shim + src/app
├── shim.js                        # buffer/process 等 polyfill
├── babel.config.js                # 配置 @ → ./src,优先解析 .ios.ts(x) / .android.ts(x)
├── metro.config.js
└── src/                           # 业务代码(所有平台共享,通过 .ios.* / .android.* 区分平台)
```

### `src/` 核心目录

| 路径 | 作用 |
|---|---|
| `src/app.ts` | 启动序列: 初始化日志/字体/窗口尺寸 → 触发 `core/init` → push HomeScreen。失败时弹出 `tipDialog` 显示 boot log 并 `exitApp` |
| `src/core/init/` | 各子系统初始化(theme / i18n / userApi / player / data / common / sync / deeplink);串行执行,过程通过 `bootLog()` 记录 |
| `src/core/player/` | 播放调度: `player.ts` 是主控,内含 `playNext/playPrev/playList/setMusicUrl`,处理列表过滤、随机/循环模式、超时重试 |
| `src/core/music/` | 音乐源逻辑(在线/本地/下载),包装 `musicSdk` |
| `src/core/list.ts` / `songlist.ts` / `search/` / `lyric*.ts` / `leaderboard.ts` / `hotSearch.ts` / `sync.ts` | 业务模块 |
| `src/plugins/player/` | TrackPlayer 封装层(`utils.ts` `playList.ts` `service.ts`)、统一播放引擎(`engine/` 内 `trackPlayerDriver` + `nativeFlacDriver`)、`nativeFlac.ts` iOS 流式 FLAC 适配、`soundEffect/` 均衡器 |
| `src/plugins/sync/` | LAN 同步客户端(对接 lx-music-sync-server / 桌面端) |
| `src/plugins/storage.ts` | AsyncStorage 包装 |
| `src/navigation/` | `react-native-navigation` 注册、`screenNames.ts` 屏幕 ID 常量、`navigation.ts` push/pop 工具 |
| `src/screens/` | `Home` / `PlayDetail` / `SonglistDetail` / `Comment`,每屏分 `Horizontal` 和 `Vertical` 子目录适配横竖屏 |
| `src/components/` | UI 组件: `common/`(Button/Modal/Slider/Icon...)、`player/`、各种 Modal、`MetadataEditModal`、`OnlineList` 等 |
| `src/store/` | 各特性独立目录,每个含 `state.ts` `action.ts` `hook.ts`;`Provider/Provider.tsx` 是 React Context 包装 |
| `src/event/` | 全局事件总线类(`Event.ts`),实例化为 `global.app_event` `global.state_event` `global.list_event` `global.dislike_event` 等 |
| `src/utils/nativeModules/` | 各原生模块 JS 端封装(`utils.ts` 通用、`streamingFlac.ts`、`nowPlaying.ts`、`soundEffect.ts`、`lyricDesktop.ts`、`cache.ts`、`crypto.ts`、`userApi.ts`) |
| `src/utils/musicSdk/` | 音乐源 SDK: `kg` `kw` `mg` `tx` `wy` `bd` `xm.js` + `api-source.js` 自定义源支持 |
| `src/utils/hooks/` | `useLayout` / `useHorizontalMode` / `useBackHandler` / `useDrag` 等 |
| `src/utils/fs.ts` / `fs.ios.ts` | 平台分支的文件系统访问;iOS 走 `react-native-fs` + 原生 `FilePickerModule` |
| `src/utils/localMediaMetadata.ts` / `localMediaMetadata.ios.ts` | 平台分支的本地媒体元数据读取 |
| `src/types/` | 全局 TypeScript 命名空间 `LX.*`(`LX.Music.MusicInfo`、`LX.Player.PlayMusicInfo`、`LX.AppSetting` ...) |
| `src/config/` | `defaultSetting.ts`(默认设置全表)、`constant.ts`(LIST_IDS/storage key)、`setting.ts`(初始化/迁移)、`globalData.ts` 初始化 `global.lx` |
| `src/lang/` | i18n: `zh-cn.json` `zh-tw.json` `en-us.json`,挂载在 `global.i18n` |
| `src/theme/` | 主题; `themes/themes.ts` 列出预置主题,运行 `npm run build:theme` 重新生成 |
| `src/plugins/lyric.ts` / `lxLyricPlayer.ts` | 歌词解析与播放(基于 `lrc-file-parser`) |

## 启动流程(读代码先看这里)

`index.js` → `shim.js` → `src/app.ts`:
1. `errorHandle` 注册全局错误捕获
2. 加载字体尺寸 + 窗口尺寸 → `bootLog('Font size setting loaded.')`
3. 动态 `import('@/core/init')` 调用默认导出:
   - `initSetting` 读 AsyncStorage,处理 v1 之前格式的迁移(`migrateMetaData / migrateListData`)
   - `initTheme` → `initI18n` → `initUserApi`
   - `setApiSource` 设置音源
   - `registerPlaybackService()` 注册 TrackPlayer 后台服务 + 监听 RemotePlay/Pause/Next/Prev/Stop/Duck/Seek
   - `initPlayer` 初始化播放器、监听 list/state 变化
   - `dataInit` 加载本地列表/喜欢/历史
   - `initCommonState` / `initSync` / `initDeeplink`
4. `Navigation.events().registerAppLaunchedListener` 触发后 `navigations.pushHomeScreen()`

任何一步抛错都会触发 `tipDialog` 显示 boot log 并 `exitApp`,所以新增初始化逻辑务必加 `bootLog`。

## iOS 适配的关键点

- **Podfile**(`ios/Podfile`):
  - 在 `pod install` 前调用 `lx_build_libflac_xcframework`,执行 `ios/Vendor/LXLibFLAC/build_xcframework.sh` 生成 xcframework
  - `post_install` 中两处补丁:
    - `lx_patch_swift_audio_seek`: 改写 `SwiftAudioEx` 的 `AVPlayerWrapper.swift`,启用精确 seek(tolerance zero + 回退重试)
    - `lx_patch_swift_audio_player_access`: 给 `QueuedAudioPlayer.swift` 暴露 `currentPlayerItem`
- **原生 FLAC 流式播放器**(`StreamingFlacPlayerModule`):
  - JS 侧封装在 `src/utils/nativeModules/streamingFlac.ts` 与 `src/plugins/player/nativeFlac.ts`
  - 在 `quality ∈ {flac, flac24bit}` 且非本地源时启用,绕开 TrackPlayer
  - 状态机: `idle/loading/playing/paused/buffering/stopped`,通过 `streaming-flac-event` 事件回传
  - 在播放器配置 reload 时通过 `snapshotNativeFlacPlayback` / `restoreNativeFlacPlayback` 保留进度
- **统一播放引擎**(`src/plugins/player/engine/`): 用 `UnifiedPlayerEventBus` 聚合 TrackPlayer 驱动与 NativeFlac 驱动,对上层呈现一个 `UnifiedPlaybackState`。最近几次提交都在修这一层(锁屏元数据 / 进度同步)。
- **平台分支文件**: `babel.config.js` 的 `module-resolver.extensions` 把 `.ios.ts(x)` 排在 `.android.ts(x)` / `.ts(x)` 之前。新增 iOS 专属实现请用 `xxx.ios.ts(x)`;Android 实现保留 `xxx.ts(x)` 或 `xxx.android.ts(x)`。
- **Info.plist**: 已配置 URL Scheme `lxmusic`、文档类型 `cn.toside.music.mobile.songlist` / `.backup`、`NSAllowsArbitraryLoads` 允许 HTTP(音源链接需要)。

## 如何快速跑起来(iOS)

### 1. 环境准备

| 工具 | 要求 | 备注 |
|---|---|---|
| macOS | 必须 | 仅 macOS 可编译 iOS 工程 |
| Xcode | ≥ 15(命令行工具已安装) | `xcode-select --install` 安装 CLT;首次运行 `sudo xcodebuild -license accept` |
| Node.js | `v18`(见 `.nvmrc`) | 推荐用 nvm: `nvm install && nvm use` |
| npm | ≥ 8.5.2 | 见 `package.json#engines` |
| Ruby | ≥ 2.6.10(见 `Gemfile`) | 系统自带或 rbenv/rvm |
| CocoaPods | `~> 1.12` | `gem install cocoapods` 或 `bundle install` |
| Watchman | 可选但推荐 | `brew install watchman` |

### 2. 一次性安装

```bash
# 在仓库根目录
nvm use                              # 切到 Node 18(可选)
npm install                          # 会自动执行 dependencies-patch.js 打补丁

# iOS 原生依赖(首次 pod install 较慢:会构建 LXLibFLAC.xcframework + 给 SwiftAudioEx 打补丁)
cd ios
bundle install                       # 可选,锁定 CocoaPods 版本
pod install                          # 或: bundle exec pod install
cd ..
```

> `pod install` 触发 `ios/Vendor/LXLibFLAC/build_xcframework.sh`,产物落在 `ios/Vendor/LXLibFLAC/build/LXLibFLAC.xcframework`。脚本会编译 device + simulator(arm64 + x86_64),首次约 1–3 分钟。

### 3. 启动

**推荐流程(双终端)**:

```bash
# 终端 A:启动 Metro
npm start                            # 或 npm run sc 重置 Metro 缓存

# 终端 B:编译并安装到模拟器
npm run ios                          # = react-native run-ios,默认装到当前选中的模拟器
```

指定设备/模拟器:

```bash
npm run ios -- --simulator "iPhone 15 Pro"
npm run ios -- --device "我的 iPhone"   # 真机需要在 Xcode 配置签名 Team
```

也可以打开 Xcode 编译:

```bash
open ios/LxMusicMobile.xcworkspace   # 注意是 .xcworkspace 不是 .xcodeproj
```

按 ⌘R 编译运行(Metro 仍需另起一个终端跑 `npm start`)。

### 4. 常见坑

- **不要打开 `.xcodeproj`**: CocoaPods 链接的库只对 `.xcworkspace` 生效。
- **pod install 失败 / 找不到 LXLibFLAC**: 手动执行 `bash ios/Vendor/LXLibFLAC/build_xcframework.sh`,确认 `build/LXLibFLAC.xcframework` 存在后再 `pod install`。
- **SwiftAudio 补丁未生效**: 删 `ios/Pods` 后重新 `pod install`(`lx_patch_swift_audio_seek` / `lx_patch_swift_audio_player_access` 检测到已 patch 会跳过)。
- **Metro 端口被占用**: `lsof -i :8081`,杀掉旧进程或 `npm start -- --port 8082` + `RCT_METRO_PORT=8082 npm run ios`。
- **真机 HTTP 音源失败**: `Info.plist` 已开 `NSAllowsArbitraryLoads`,若 release 包仍报错检查 ATS 配置未被覆盖。
- **修改原生模块后不生效**: JS 改动 reload 即可;原生(Obj-C/Swift/Pods)改动必须重新 `npm run ios` 或在 Xcode 里 Build。
- **`Could not find a 'react-native.config.js'` 之类的告警**: 常见且无害,只要 Metro 正常打包即可。

### 5. 清理重来

```bash
# JS 侧
rm -rf node_modules && npm install
npm run sc                           # 重置 Metro 缓存

# iOS 侧
cd ios
rm -rf Pods Podfile.lock build
rm -rf Vendor/LXLibFLAC/build        # 强制重建 xcframework
pod install
cd ..

# Xcode DerivedData(如遇到诡异链接错误)
rm -rf ~/Library/Developer/Xcode/DerivedData
```

## 常用命令

```bash
# 安装依赖(postinstall 会执行 dependencies-patch.js 给 node_modules 打补丁)
npm install

# iOS 原生依赖
cd ios && pod install   # 会自动构建 LXLibFLAC xcframework 并补丁 SwiftAudio

# Metro
npm start               # 或 npm run sc 重置缓存

# 运行 iOS(需要 Xcode / 模拟器)
npm run ios             # = react-native run-ios

# 运行 Android(上游保留)
npm run dev

# Lint
npm run lint
npm run lint:fix
npm run lint:sound-effect-dsp   # 单独校验 sound-effect 的 DSP 配置

# 主题表重新生成
npm run build:theme

# 发布(上游脚本)
npm run publish
```

## 项目约定

- **路径别名**: 代码内统一用 `@/...` 引用 `src/...`(`babel.config.js` + `tsconfig.json` 双重定义)。新增模块请遵循这一规则。
- **状态管理三件套**: 在 `src/store/<feature>/` 下创建 `state.ts`(纯数据)、`action.ts`(变更并通过 `global.state_event` 广播)、`hook.ts`(组件订阅)。`Provider` 仅做 Context 注入。
- **全局对象 `global.lx`**(`src/config/globalData.ts`): 存放运行时瞬态信息,如 `playerStatus`、`gettingUrlId`、`fontSize`、`isPlayedStop`、`restorePlayInfo`、`isScreenKeepAwake`。读写时注意它和 `store/*/state.ts` 的区别——前者不受组件订阅。
- **事件总线**: 业务/UI 通信通过 `global.app_event.emit('xxx', payload)` 与 `on('xxx', fn)`(类定义见 `src/event/Event.ts`,`emit` 使用 `setImmediate` 异步派发)。播放器进度、错误、歌词更新等均走此通道。
- **i18n**: 文案统一通过 `global.i18n.t('key')`。新增 key 需要同时补 `zh-cn.json` `zh-tw.json` `en-us.json`(见 `src/lang/Readme.md`)。
- **TypeScript 类型**: `LX.*` 全局命名空间集中在 `src/types/*.d.ts`,业务类型尽量复用既有定义。
- **音源**: 接入新音源走 `src/utils/musicSdk` 与 `src/core/apiSource.ts`;用户自定义源走 `src/core/userApi.ts` + `src/plugins/storage.ts`。
- **forked 依赖**: `package.json` 多个依赖指向 `github:lyswhut/...`,需要本地修改时通过 `patches/` + `dependencies-patch.js` 而不是直接改 `node_modules`。

## 当前 iOS 开发重点(参考 git log)

最近提交集中在 **iOS 锁屏 (Now Playing) + 原生 FLAC** 协同的修复:

- `ae9a7644` 按当前播放提供者(TrackPlayer vs NativeFlac)分发锁屏信息
- `e47cc829` 同步 FLAC 锁屏时间轴
- `cb3daa9c` 暂停/停止时避免覆盖锁屏元数据
- `aaf43341` 使用原生 FLAC 时长填充锁屏
- `e87d2dab` 时长到达后刷新锁屏进度

涉及文件主要分布在 `src/plugins/player/nativeFlac.ts`、`src/plugins/player/engine/`、`src/utils/nativeModules/nowPlaying.ts`,以及 iOS 原生侧 `StreamingFlacPlayerModule`(在 `ios/LxMusicMobile/` 中,具体 .mm/.swift 见 Xcode 工程)。二开新增播放/锁屏相关功能前先看一遍这几次提交。

## 调试提示

- 启动失败:看 `tipDialog` 中的 Boot Log。`src/utils/bootLog.ts` 在内存中累加日志,出错时一次性显示。
- 播放卡住:`src/core/player/player.ts` 中 `addLoadTimeout` 默认 100s 超时;`statusText` 通过 `setStatusText` 显示到 UI,可作为线索。
- 原生 FLAC 没生效:确认 `Platform.OS == 'ios'` + `NativeModules.StreamingFlacPlayerModule` 存在 + `player.playQuality` 为 `flac`/`flac24bit` 且非本地源。
- TrackPlayer / SwiftAudio 修改:每次 `pod install` 都会重新打补丁,自定义补丁请扩展 `Podfile` 的 `post_install`,不要直接改 `ios/Pods/`。
- iOS 远控事件统一走 `service.ts` 中的 `TrackPlayer.addEventListener(TPEvent.Remote*)`;`RemoteDuck` 在 iOS 上承担中断恢复逻辑(`shouldResumeAfterDuck` + 音量重置)。
