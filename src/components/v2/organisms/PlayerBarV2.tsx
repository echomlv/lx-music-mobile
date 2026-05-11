import { memo, useCallback, useMemo, useState } from 'react'
import { StyleSheet, View } from 'react-native'

import { useDesignTokens } from '@/theme/v2'
import { useHorizontalMode, useKeyboard } from '@/utils/hooks'
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

import Image from '@/components/common/Image'
import Progress, { ProgressPlain } from '@/components/player/Progress'

import { IconButton, Surface, Typography, V2Pressable } from '@/components/v2/atoms'

interface PlayerBarV2Props {
  /** 来自旧 PlayerBar 的同名 prop:仅在主屏挂载时为 true,影响长按跳列表行为 */
  isHome?: boolean
}

const COVER_SIZE = 56

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

const Cover = memo(({ isHome }: { isHome: boolean }) => {
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
        width: COVER_SIZE,
        height: COVER_SIZE,
        borderRadius: tokens.radius.md,
        overflow: 'hidden',
      }}
    >
      <Image
        url={musicInfo.pic}
        nativeID={NAV_SHEAR_NATIVE_IDS.playDetail_pic}
        style={{ width: COVER_SIZE, height: COVER_SIZE }}
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

const Actions = memo(() => {
  const isPlay = useIsPlay()
  const isHorizontal = useHorizontalMode()

  return (
    <View style={styles.actions}>
      {isHorizontal
        ? (
            <IconButton
              name="prevMusic"
              size={20}
              onPress={handlePlayPrev}
              accessibilityLabel="prev"
            />
          )
        : null}
      <IconButton
        name={isPlay ? 'pause' : 'play'}
        size={22}
        background="subtle"
        onPress={handleTogglePlay}
        accessibilityLabel="toggle play"
      />
      <IconButton
        name="nextMusic"
        size={20}
        onPress={handlePlayNext}
        accessibilityLabel="next"
      />
    </View>
  )
})
Actions.displayName = 'v2.PlayerBar.Actions'

// 命中区域 28px(足够手指点击);可视部分由 paddingTop 控制,留 4px 细条贴底。
// 原本 14/11 → 可视 3px、命中 14px,贴在屏幕底部时不易点中。
const PROGRESS_STRIP_HEIGHT = 28
const PROGRESS_PADDING_TOP = 24

const ProgressStrip = memo(({ autoUpdate }: { autoUpdate: boolean }) => {
  const { progress, maxPlayTime } = useProgress(autoUpdate)
  const buffered = useBufferProgress()
  const allowProgressBarSeek = useSettingValue('common.allowProgressBarSeek')

  return (
    <View style={styles.progressWrap}>
      {allowProgressBarSeek
        ? <Progress progress={progress} duration={maxPlayTime} buffered={buffered} paddingTop={PROGRESS_PADDING_TOP} />
        : <ProgressPlain progress={progress} duration={maxPlayTime} buffered={buffered} paddingTop={PROGRESS_PADDING_TOP} />}
    </View>
  )
})
ProgressStrip.displayName = 'v2.PlayerBar.ProgressStrip'

export const PlayerBarV2 = memo(({ isHome = false }: PlayerBarV2Props) => {
  const { tokens } = useDesignTokens()
  const { keyboardShown } = useKeyboard()
  const autoHidePlayBar = useSettingValue('common.autoHidePlayBar')
  const [autoUpdate, setAutoUpdate] = useState(true)

  usePageVisible([COMPONENT_IDS.home], useCallback((visible) => {
    if (isHome) setAutoUpdate(visible)
  }, [isHome]))

  const body = useMemo(() => (
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
          paddingHorizontal: tokens.spacing.md,
          paddingTop: tokens.spacing.sm,
          paddingBottom: tokens.spacing.sm + 4,
          gap: tokens.spacing.md,
        }}
      >
        <Cover isHome={isHome} />
        <Info isHome={isHome} autoUpdate={autoUpdate} />
        <Actions />
      </View>
      <ProgressStrip autoUpdate={autoUpdate} />
    </Surface>
  ), [tokens, isHome, autoUpdate])

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
    height: PROGRESS_STRIP_HEIGHT,
    width: '100%',
  },
})
