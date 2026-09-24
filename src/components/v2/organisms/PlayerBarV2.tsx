import { memo, useCallback, useMemo, useRef, useState } from 'react'
import { Dimensions, Platform, StyleSheet, View } from 'react-native'

import { useDesignTokens } from '@/theme/v2'
import { useHorizontalMode, useKeyboard, useWindowSize } from '@/utils/hooks'
import { usePageVisible } from '@/store/common/hook'
import { useIsPlay, usePlayerMusicInfo, useProgress, useStatusText } from '@/store/player/hook'
import { useSettingValue } from '@/store/setting/hook'
import { useLrcPlay } from '@/plugins/lyric'
import { useBufferProgress } from '@/plugins/player'

import { navigations } from '@/navigation'
import commonState from '@/store/common/state'
import playerState from '@/store/player/state'
import { setLoadErrorPicUrl, setMusicInfo } from '@/core/player/playInfo'
import { playNext, playPrev, togglePlay } from '@/core/player/player'
import { markTimeoutExitInteraction } from '@/core/player/timeoutExit'
import { COMPONENT_IDS, LIST_IDS, NAV_SHEAR_NATIVE_IDS } from '@/config/constant'
import { formatMusicName } from '@/utils/tools'

import Image, { PLAYER_PIC_RETRY_COUNT } from '@/components/common/Image'
import Progress, { ProgressPlain } from '@/components/player/Progress'

import { IconButton, Surface, Typography, V2Pressable } from '@/components/v2/atoms'

interface PlayerBarV2Props {
  /** 来自旧 PlayerBar 的同名 prop:仅在主屏挂载时为 true,影响长按跳列表行为 */
  isHome?: boolean
}

// 播放条尺寸。横屏沿用固定值;竖屏按窗口高度等比缩放(见 getVerticalMetrics),
// 让 iPad 竖屏这类高屏幕上的播放条跟随 Typography(setSpText 已按屏幕放大)一起变大。
interface BarMetrics {
  coverSize: number
  paddingTop: number
  /** 竖屏时也是进度条的命中区域高度 */
  paddingBottom: number
  paddingHorizontal: number
  gap: number
  progressPaddingTop: number
  progressPaddingBottom: number
  playIconSize: number
  nextIconSize: number
  buttonHitSize: number
}

const HORIZONTAL_METRICS: BarMetrics = {
  coverSize: 56,
  paddingTop: 8,
  paddingBottom: 12,
  paddingHorizontal: 12,
  gap: 12,
  // 横屏时 home indicator 已在安全区之外,且列表区域很矮:进度条收窄命中区域留在布局流里,避免播放条下方出现空白
  progressPaddingTop: 6,
  progressPaddingBottom: 0,
  playIconSize: 22,
  nextIconSize: 20,
  buttonHitSize: 40,
}
const PROGRESS_STRIP_HEIGHT_HORIZONTAL = 10

// 竖屏以 iPhone 15(窗口高 852)为基准;iPhone SE 略缩,iPad mini ≈ 1.33,iPad Pro 12.9 顶到上限 1.5
const VERTICAL_BASE_HEIGHT = 852
const VERTICAL_SCALE_MIN = 0.9
const VERTICAL_SCALE_MAX = 1.5

// 竖屏:播放条背景铺进页面 SafeAreaView 的底部安全区直到屏幕底边,内容也下移进安全区,
// 只给 home indicator 手势区留 getHomeIndicatorReserve,让封面在可见的播放条区域内大致上下居中。
// 进度条绝对定位在内容行的底部内边距里,命中区域即整个底部内边距,可视细线粗细由 paddingTop / paddingBottom 控制。
const getVerticalMetrics = (windowHeight: number): BarMetrics => {
  const scale = Math.min(Math.max(windowHeight / VERTICAL_BASE_HEIGHT, VERTICAL_SCALE_MIN), VERTICAL_SCALE_MAX)
  const s = (size: number) => Math.round(size * scale)
  const paddingBottom = s(12)
  const progressPaddingTop = s(5)
  const lineWidth = scale >= 1.25 ? 4 : 3
  return {
    coverSize: s(60),
    paddingTop: s(18),
    paddingBottom,
    paddingHorizontal: s(12),
    gap: s(12),
    progressPaddingTop,
    progressPaddingBottom: paddingBottom - progressPaddingTop - lineWidth,
    playIconSize: s(22),
    nextIconSize: s(20),
    buttonHitSize: s(40),
  }
}

// iPhone 底部安全区 34 → 留 20;iPad 安全区 20 → 留 12
const getHomeIndicatorReserve = (bottomInset: number) => bottomInset > 0 ? Math.max(bottomInset - 14, 12) : 0
// 安全区高度只在首次测量时有跳动,缓存后其他页面的播放条直接使用
let cachedBottomInset = 0

const handlePlayPrev = () => {
  markTimeoutExitInteraction()
  void playPrev()
}
const handlePlayNext = () => {
  markTimeoutExitInteraction()
  void playNext()
}
const handleTogglePlay = () => {
  markTimeoutExitInteraction()
  togglePlay()
}

const Cover = memo(({ isHome, size }: { isHome: boolean, size: number }) => {
  const { tokens } = useDesignTokens()
  const musicInfo = usePlayerMusicInfo()

  const handlePress = useCallback(() => {
    if (!musicInfo.id) return
    navigations.pushPlayDetailScreen(commonState.componentIds.home!)
  }, [musicInfo.id])

  const handleLongPress = useCallback(() => {
    if (!isHome) return
    const listId = playerState.playMusicInfo.listId
    if (!listId || listId == LIST_IDS.DOWNLOAD) return
    global.app_event.jumpListPosition()
  }, [isHome])

  const handleError = useCallback((url: string | number) => {
    setLoadErrorPicUrl(url as string)
    setMusicInfo({ pic: null })
  }, [])

  return (
    <V2Pressable
      onPress={handlePress}
      onLongPress={handleLongPress}
      style={{
        width: size,
        height: size,
        borderRadius: tokens.radius.md,
        overflow: 'hidden',
      }}
    >
      <Image
        url={musicInfo.pic}
        retryCount={PLAYER_PIC_RETRY_COUNT}
        nativeID={NAV_SHEAR_NATIVE_IDS.playDetail_pic}
        style={{ width: size, height: size }}
        onError={handleError}
      />
    </V2Pressable>
  )
})
Cover.displayName = 'v2.PlayerBar.Cover'

const Info = memo(({ isHome, autoUpdate }: { isHome: boolean, autoUpdate: boolean }) => {
  const { colors } = useDesignTokens()
  const musicInfo = usePlayerMusicInfo()
  const downloadFileName = useSettingValue('download.fileName')
  const { text: lyricLine } = useLrcPlay(autoUpdate)
  const statusText = useStatusText()
  const isPlay = useIsPlay()

  const title = musicInfo.id
    ? musicInfo.singer
      ? formatMusicName(downloadFileName, musicInfo.name, musicInfo.singer)
      : musicInfo.name
    : ''

  const subtitle = isPlay ? lyricLine : statusText

  const handlePress = useCallback(() => {
    if (!musicInfo.id) return
    navigations.pushPlayDetailScreen(commonState.componentIds.home!)
  }, [musicInfo.id])

  const handleLongPress = useCallback(() => {
    if (!isHome) return
    const listId = playerState.playMusicInfo.listId
    if (!listId || listId == LIST_IDS.DOWNLOAD) return
    global.app_event.jumpListPosition()
  }, [isHome])

  return (
    <V2Pressable
      onPress={handlePress}
      onLongPress={handleLongPress}
      style={{ flex: 1, justifyContent: 'center' }}
    >
      <Typography variant="body" weight="600" numberOfLines={1}>
        {title}
      </Typography>
      <Typography
        variant="caption"
        color={colors['c-font-label']}
        numberOfLines={1}
        style={{ marginTop: 2 }}
      >
        {subtitle || (musicInfo.singer ?? '')}
      </Typography>
    </V2Pressable>
  )
})
Info.displayName = 'v2.PlayerBar.Info'

const Actions = memo(({ metrics }: { metrics: BarMetrics }) => {
  const isPlay = useIsPlay()
  const isHorizontal = useHorizontalMode()

  return (
    <View style={styles.actions}>
      {isHorizontal
        ? (
            <IconButton
              name="prevMusic"
              size={metrics.nextIconSize}
              hitSize={metrics.buttonHitSize}
              onPress={handlePlayPrev}
              accessibilityLabel="prev"
            />
          )
        : null}
      <IconButton
        name={isPlay ? 'pause' : 'play'}
        size={metrics.playIconSize}
        hitSize={metrics.buttonHitSize}
        background="subtle"
        onPress={handleTogglePlay}
        accessibilityLabel="toggle play"
      />
      <IconButton
        name="nextMusic"
        size={metrics.nextIconSize}
        hitSize={metrics.buttonHitSize}
        onPress={handlePlayNext}
        accessibilityLabel="next"
      />
    </View>
  )
})
Actions.displayName = 'v2.PlayerBar.Actions'

const ProgressStrip = memo(({ autoUpdate, bottom, metrics }: { autoUpdate: boolean, bottom: number, metrics: BarMetrics }) => {
  const { progress, maxPlayTime } = useProgress(autoUpdate)
  const buffered = useBufferProgress()
  const allowProgressBarSeek = useSettingValue('common.allowProgressBarSeek')
  const isHorizontal = useHorizontalMode()
  const paddingTop = metrics.progressPaddingTop
  const paddingBottom = metrics.progressPaddingBottom

  return (
    <View style={isHorizontal ? styles.progressWrapHorizontal : [styles.progressWrap, { bottom, height: metrics.paddingBottom }]}>
      {allowProgressBarSeek
        ? <Progress progress={progress} duration={maxPlayTime} buffered={buffered} paddingTop={paddingTop} paddingBottom={paddingBottom} />
        : <ProgressPlain progress={progress} duration={maxPlayTime} buffered={buffered} paddingTop={paddingTop} paddingBottom={paddingBottom} />}
    </View>
  )
})
ProgressStrip.displayName = 'v2.PlayerBar.ProgressStrip'

export const PlayerBarV2 = memo(({ isHome = false }: PlayerBarV2Props) => {
  const { tokens } = useDesignTokens()
  const { keyboardShown } = useKeyboard()
  const autoHidePlayBar = useSettingValue('common.autoHidePlayBar')
  const isHorizontal = useHorizontalMode()
  const windowSize = useWindowSize()
  const metrics = useMemo(() => isHorizontal ? HORIZONTAL_METRICS : getVerticalMetrics(windowSize.height), [isHorizontal, windowSize.height])
  const [autoUpdate, setAutoUpdate] = useState(true)
  const [measuredBottomInset, setMeasuredBottomInset] = useState(cachedBottomInset)
  const wrapRef = useRef<View>(null)
  const bottomInset = isHorizontal ? 0 : measuredBottomInset
  const appliedBottomInsetRef = useRef(bottomInset)
  appliedBottomInsetRef.current = bottomInset

  usePageVisible([COMPONENT_IDS.home], useCallback((visible) => {
    if (isHome) setAutoUpdate(visible)
  }, [isHome]))

  // RN 自带的 SafeAreaView 拿不到 inset:播放条位于页面 SafeAreaView 底部,
  // 用它在窗口中的底边反推底部安全区高度(已铺进安全区的部分用当前生效值补回)
  const handleLayout = useCallback(() => {
    if (Platform.OS != 'ios' || isHorizontal) return
    wrapRef.current?.measureInWindow((x, y, width, height) => {
      if (!height) return
      const inset = Math.round(Dimensions.get('window').height - (y + height) + appliedBottomInsetRef.current)
      if (inset < 0 || inset > 60 || inset == appliedBottomInsetRef.current) return
      cachedBottomInset = inset
      setMeasuredBottomInset(inset)
    })
  }, [isHorizontal])

  const homeIndicatorReserve = getHomeIndicatorReserve(bottomInset)

  const body = useMemo(() => (
    <View ref={wrapRef} onLayout={handleLayout} style={{ marginBottom: -bottomInset }}>
      <Surface
        variant="blur"
        radius="none"
        elevation="md"
        style={{
          borderTopLeftRadius: tokens.radius.xl,
          borderTopRightRadius: tokens.radius.xl,
          overflow: 'hidden',
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: metrics.paddingHorizontal,
            paddingTop: metrics.paddingTop,
            paddingBottom: metrics.paddingBottom,
            gap: metrics.gap,
          }}
        >
          <Cover isHome={isHome} size={metrics.coverSize} />
          <Info isHome={isHome} autoUpdate={autoUpdate} />
          <Actions metrics={metrics} />
        </View>
        {homeIndicatorReserve ? <View style={{ height: homeIndicatorReserve }} /> : null}
        <ProgressStrip autoUpdate={autoUpdate} bottom={homeIndicatorReserve} metrics={metrics} />
      </Surface>
    </View>
  ), [tokens, isHome, autoUpdate, metrics, bottomInset, homeIndicatorReserve, handleLayout])

  return autoHidePlayBar && keyboardShown ? null : body
})

PlayerBarV2.displayName = 'v2.PlayerBar'

const styles = StyleSheet.create({
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexGrow: 0,
    flexShrink: 0,
  },
  progressWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
  progressWrapHorizontal: {
    height: PROGRESS_STRIP_HEIGHT_HORIZONTAL,
    width: '100%',
  },
})
