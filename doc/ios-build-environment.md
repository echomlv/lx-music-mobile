# iOS 构建环境搭建

本文档说明如何在 macOS 上搭建本仓库的 iOS 开发与构建环境。仓库当前使用 React Native `0.73.11`，Node.js `18`，最低 iOS 版本为 `13.4`。

## 1. 环境要求

- macOS，支持 Apple Silicon 与 Intel Mac
- 完整版 Xcode，不仅是 Command Line Tools
- Homebrew
- Node.js 18，与仓库根目录的 `.nvmrc` 一致
- Ruby `>= 3.2.0`，与 iOS CI 一致
- Bundler `4.0.21` 与 CocoaPods
- Git

仅构建 iOS 时，不需要安装 Android Studio、Android SDK 或 JDK。

## 2. 安装并配置 Xcode

从 App Store 或 Apple Developer 网站安装完整 Xcode，然后让命令行工具指向它：

```bash
sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer
sudo xcodebuild -license accept
sudo xcodebuild -runFirstLaunch
```

检查配置：

```bash
xcode-select -p
xcodebuild -version
```

`xcode-select -p` 应输出：

```text
/Applications/Xcode.app/Contents/Developer
```

如果 Xcode 安装在其他目录，请将命令中的路径替换为实际路径。

## 3. 安装 Homebrew

如果尚未安装 Homebrew，请参考 [brew.sh](https://brew.sh/)。安装完成后检查：

```bash
brew --version
```

## 4. 安装 Node.js 18

推荐使用 nvm 管理 Node.js，避免系统中其他项目的 Node.js 版本影响构建。

```bash
brew install nvm
mkdir -p ~/.nvm
```

将下面内容加入 `~/.zshrc`：

```bash
export NVM_DIR="$HOME/.nvm"
source "$(brew --prefix nvm)/nvm.sh"
```

重新加载 shell，并使用仓库声明的版本：

```bash
source ~/.zshrc
cd /path/to/lx-music-mobile
nvm install
nvm use
```

确认版本：

```bash
node -v
npm -v
```

`node -v` 应为 `v18.x.x`。不建议直接使用较新的 Node.js 主版本构建本项目。

## 5. 安装 Ruby 与 Bundler

仓库的 `Gemfile` 要求 Ruby `>= 3.2.0`，Bundler 固定为 `4.0.21`。为了与 CI 保持一致，推荐使用 Ruby 3.2。

```bash
brew install rbenv ruby-build
```

将 rbenv 初始化命令加入 `~/.zshrc`：

```bash
eval "$(rbenv init - zsh)"
```

重新加载 shell，然后查看可安装的 Ruby 3.2 版本并选择最新版本：

```bash
source ~/.zshrc
rbenv install -l | grep -E '^[[:space:]]*3\.2\.'
rbenv install 3.2.9
cd /path/to/lx-music-mobile
rbenv shell 3.2.9
gem install bundler -v 4.0.21
```

如果 `3.2.9` 不在列表中，请替换为 `rbenv install -l` 显示的最新 Ruby 3.2 版本。

确认版本：

```bash
ruby -v
bundle _4.0.21_ -v
```

不建议使用 `sudo gem install cocoapods`。本仓库通过 Bundler 管理 CocoaPods 版本。

## 6. 安装 JavaScript 依赖

在仓库根目录执行：

```bash
cd /path/to/lx-music-mobile
nvm use
npm ci
```

`npm ci` 会自动运行 `dependencies-patch.js`，为 `react-native-track-player` 应用本仓库所需的 iOS 补丁。不要添加 `--ignore-scripts`。

## 7. 安装 CocoaPods

先在仓库根目录安装 Ruby 依赖：

```bash
cd /path/to/lx-music-mobile
bundle _4.0.21_ install
```

再安装 iOS Pods：

```bash
cd ios
NO_FLIPPER=1 bundle _4.0.21_ exec pod install --repo-update
```

必须使用 `NO_FLIPPER=1`，这与仓库的 iOS CI 配置一致，并能避免安装不需要的 Flipper 与 Boost 依赖。

安装过程中，`Podfile` 会自动执行 `ios/Vendor/LXLibFLAC/build_xcframework.sh`，为真机和模拟器编译 LXLibFLAC。该步骤依赖完整 Xcode 提供的 `xcrun`、`clang`、`libtool` 和 iOS SDK。

Pods 安装成功后应生成：

```text
ios/Pods/
ios/LxMusicMobile.xcworkspace
```

这些内容属于本地生成文件，不提交到 Git。

## 8. 配置 Xcode 使用的 Node.js

通过终端执行构建时，仓库的 `ios/.xcode.env` 通常可以找到当前 Node.js。通过 Finder 启动 Xcode 时，Xcode 可能无法读取 nvm 环境。

激活 Node.js 18 后，在仓库根目录生成本地配置：

```bash
nvm use
echo "export NODE_BINARY=$(command -v node)" > ios/.xcode.env.local
```

`ios/.xcode.env.local` 已被 `.gitignore` 忽略，不应提交。

## 9. 静态检查

在仓库根目录执行 TypeScript 检查：

```bash
npx tsc --noEmit
```

检查 Xcode 工程与 Info.plist：

```bash
plutil -lint ios/LxMusicMobile/Info.plist
plutil -lint ios/LxMusicMobile.xcodeproj/project.pbxproj
xcodebuild -project ios/LxMusicMobile.xcodeproj -list
```

## 10. 日常开发：两个终端窗口

首次完成 `npm ci` 和 Pods 安装后，打开两个终端窗口，都进入仓库根目录并切换到 Node.js 18。

第一个窗口启动 Metro，保持运行：

```bash
cd /path/to/lx-music-mobile
nvm use
npm start
```

第二个窗口编译并启动 iOS 模拟器 App：

```bash
cd /path/to/lx-music-mobile
nvm use
npm run ios

# 指定模拟器
npm run ios -- --simulator="iPhone 16e (18.6)" --mode Debug --no-packager
npm run ios -- --simulator="iPhone 16e (18.6)" --mode Release

npm run ios -- --simulator="iPhone 16e (26.3.1)" --mode Debug --no-packager

```

`npm run ios` 对应仓库的 `react-native run-ios` 脚本。首次编译会比较久；之后修改 JavaScript/TypeScript 代码通常由 Metro 刷新。只有依赖或原生代码发生变化时，才需要重新安装 Pods 或重新编译 App。

也可以打开 CocoaPods 生成的 workspace，在 Xcode 中选择模拟器并运行 `LxMusicMobile` scheme，同时让第一个窗口的 Metro 保持运行：

```bash
open ios/LxMusicMobile.xcworkspace
```

不要直接打开 `ios/LxMusicMobile.xcodeproj`，否则 Pods 依赖不会被加载。

## 11. 可选：命令行构建检查

需要单独验证模拟器原生构建时，可以在仓库根目录执行：

```bash
xcodebuild \
  -workspace ios/LxMusicMobile.xcworkspace \
  -scheme LxMusicMobile \
  -configuration Debug \
  -sdk iphonesimulator \
  -destination 'generic/platform=iOS Simulator' \
  CODE_SIGNING_ALLOWED=NO \
  build
```

该命令不需要 Apple Developer 签名。

## 12. 真机运行与签名

真机运行需要：

- 在 Xcode 的 Settings > Accounts 中登录 Apple ID
- 在 LxMusicMobile target 的 Signing & Capabilities 中选择 Team
- 使用当前 Team 下唯一的 Bundle Identifier
- 让 Xcode 自动管理开发证书与 Provisioning Profile

模拟器构建和无签名构建不需要 Apple Developer 账号。导出可安装 IPA 则需要有效的开发者证书和 Provisioning Profile。

## 13. 常见问题

### `xcrun` 找不到 iOS SDK

确认当前选择的是完整 Xcode：

```bash
xcode-select -p
sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer
```

### Xcode 报 `node: command not found`

重新生成本地 Node.js 路径：

```bash
nvm use
echo "export NODE_BINARY=$(command -v node)" > ios/.xcode.env.local
```

### Pods 安装时长时间下载 Boost 或 Flipper

确认命令包含 `NO_FLIPPER=1`：

```bash
cd ios
NO_FLIPPER=1 bundle _4.0.21_ exec pod install --repo-update
```

### Pods 状态不完整或 workspace 无法打开

先重新执行安装：

```bash
cd ios
NO_FLIPPER=1 bundle _4.0.21_ exec pod install --repo-update
```

如果仍然失败，可重新集成 Pods：

```bash
cd ios
bundle _4.0.21_ exec pod deintegrate
NO_FLIPPER=1 bundle _4.0.21_ exec pod install --repo-update
```

### LXLibFLAC 构建失败

检查完整 Xcode 是否已选择，并确认 SDK 可用：

```bash
xcrun --sdk iphoneos --show-sdk-path
xcrun --sdk iphonesimulator --show-sdk-path
```

### Ruby 原生扩展安装失败

在 Apple Silicon 上可让 Bundler 强制使用当前 Ruby 平台重新安装：

```bash
bundle config set --local force_ruby_platform true
bundle _4.0.21_ install
```

## 14. 环境自检

完成安装后，可以运行：

```bash
node -v
npm -v
ruby -v
bundle -v
bundle _4.0.21_ exec pod --version
xcode-select -p
xcodebuild -version
test -d ios/LxMusicMobile.xcworkspace && echo "workspace ready"
```

预期结果：

- Node.js 为 `v18.x.x`
- Ruby 满足 `>= 3.2.0`
- CocoaPods 可以通过 `bundle _4.0.21_ exec pod` 运行
- Xcode 路径指向完整 Xcode
- `ios/LxMusicMobile.xcworkspace` 存在
