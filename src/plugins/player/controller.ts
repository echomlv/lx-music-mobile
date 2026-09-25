import TrackPlayer from 'react-native-track-player'
import { Platform } from 'react-native'
import BackgroundTimer from 'react-native-background-timer'
import { updateMetaDataImmediately } from './playList'
import { initUnifiedPlayerEngine, onUnifiedPlayerEvent } from './engine'
import { getNativeFlacTrackId, setNativeFlacRate, setNativeFlacVolume } from './nativeFlac'
import { getPosition, isEmpty, isTempId, setStop } from './utils'
import { exitApp } from '@/core/common'
import { playNext, setMusicUrl } from '@/core/player/player'
import { setStatusText } from '@/core/player/playStatus'
import { isActive } from '@/utils/tools'
import playerState from '@/store/player/state'
import settingState from '@/store/setting/state'
import { setNowPlayTime } from '@/core/player/progress'

let isInitialized = false

const handleExitApp = async(reason: string) => {
  global.lx.isPlayedStop = false
  exitApp(reason)
}

export const initUnifiedPlayerController = () => {
  if (isInitialized) return
  initUnifiedPlayerEngine()

  let retryNum = 0
  let prevTimeoutId: string | null = null
  let loadingTimeout: number | null = null
  let delayNextTimeout: number | null = null
  // true 表示当前正处于 loading/buffering 但尚未抵达 playing。
  // 用于在 iOS AVPlayer 因为播放地址挂死把 rate 拉到 0 触发 'paused' 事件时,
  // 仍然保留 watchdog,而不是被 'paused' 把 25s 兜底误清掉导致永久卡死。
  let isLoadingPhase = false

  const clearLoadingTimeout = () => {
    if (!loadingTimeout) return
    BackgroundTimer.clearTimeout(loadingTimeout)
    loadingTimeout = null
  }

  const startLoadingTimeout = () => {
    isLoadingPhase = true
    clearLoadingTimeout()
    loadingTimeout = BackgroundTimer.setTimeout(() => {
      if (prevTimeoutId == playerState.musicInfo.id) {
        prevTimeoutId = null
        void playNext(true)
      } else {
        prevTimeoutId = playerState.musicInfo.id
        if (playerState.playMusicInfo.musicInfo) setMusicUrl(playerState.playMusicInfo.musicInfo, true)
      }
    }, 25000)
  }

  const clearDelayNextTimeout = () => {
    if (!delayNextTimeout) return
    BackgroundTimer.clearTimeout(delayNextTimeout)
    delayNextTimeout = null
  }

  const addDelayNextTimeout = () => {
    clearDelayNextTimeout()
    delayNextTimeout = BackgroundTimer.setTimeout(() => {
      if (global.lx.isPlayedStop) {
        setStatusText('')
        return
      }
      void playNext(true)
    }, 5000)
  }

  const resetRecoveryState = () => {
    retryNum = 0
    prevTimeoutId = null
    isLoadingPhase = false
    clearDelayNextTimeout()
    clearLoadingTimeout()
  }

  const handleControllerError = () => {
    if (!playerState.musicInfo.id) return
    clearLoadingTimeout()
    if (global.lx.isPlayedStop) return
    if (playerState.playMusicInfo.musicInfo && retryNum < 2) {
      const musicInfo = playerState.playMusicInfo.musicInfo
      void getPosition().then((position) => {
        if (position) setNowPlayTime(position)
      }).finally(() => {
        if (playerState.playMusicInfo.musicInfo !== musicInfo) return
        retryNum++
        setMusicUrl(playerState.playMusicInfo.musicInfo, true)
        setStatusText(global.i18n.t('player__refresh_url'))
      })
      return
    }
    if (!isEmpty()) void setStop()
    if (isActive()) {
      setStatusText(global.i18n.t('player__error'))
      setTimeout(addDelayNextTimeout)
    } else {
      void playNext(true)
    }
  }

  onUnifiedPlayerEvent(async(event) => {
    if (event.driver == 'trackPlayer') {
      if (global.lx.gettingUrlId) return
      // 忽略占位静音音轨(启动恢复时 initTrackInfo 放入的 //default 音轨)的状态/结束事件,
      // 否则其 loading 状态会启动 25s 兜底计时器,超时后重新获取地址并自动开始播放
      if ((event.type == 'state' || event.type == 'ended') && isTempId()) return
    }
    switch (event.type) {
      case 'state':
        switch (event.state) {
          case 'loading':
            if (!global.lx.isPlayedStop && playerState.musicInfo.id) startLoadingTimeout()
            global.app_event.playerLoadstart()
            setStatusText(global.i18n.t('player__loading'))
            break
          case 'buffering':
            if (!global.lx.isPlayedStop && playerState.musicInfo.id) startLoadingTimeout()
            if (event.driver == 'nativeFlac' && Platform.OS == 'ios' && (event.duration ?? 0) > 0 && playerState.musicInfo.id) {
              void updateMetaDataImmediately(playerState.musicInfo, playerState.isPlay, playerState.lastLyric)
            }
            global.app_event.pause()
            global.app_event.playerWaiting()
            setStatusText(global.i18n.t('player__buffering'))
            break
          case 'playing':
            isLoadingPhase = false
            clearLoadingTimeout()
            setStatusText('')
            if (event.driver == 'nativeFlac') {
              global.lx.playerTrackId = getNativeFlacTrackId()
              void setNativeFlacVolume(settingState.setting['player.volume'])
              void setNativeFlacRate(settingState.setting['player.playbackRate'])
            } else if (Platform.OS == 'ios') {
              void TrackPlayer.setVolume(settingState.setting['player.volume'])
            }
            if (Platform.OS == 'ios' && playerState.musicInfo.id) {
              // Refresh duration/elapsed metadata after playback actually starts so the
              // iOS lockscreen can render an active progress bar.
              void updateMetaDataImmediately(playerState.musicInfo, true, playerState.lastLyric)
            }
            global.app_event.playerPlaying()
            global.app_event.play()
            break
          case 'paused':
            if (event.driver == 'nativeFlac' && Platform.OS == 'ios' && (event.duration ?? 0) > 0 && playerState.musicInfo.id) {
              void updateMetaDataImmediately(playerState.musicInfo, false, playerState.lastLyric)
            }
            // 仅在已经成功进入过 playing 才清掉 watchdog;若仍处在 loading/buffering
            // 阶段,这次 'paused' 多半是引擎放弃了挂死的 URL(例如 AVPlayer 把 rate
            // 拉到 0),保留 timer 让 25s 兜底有机会触发重试/切歌。
            if (!isLoadingPhase) clearLoadingTimeout()
            global.app_event.playerPause()
            global.app_event.pause()
            break
          case 'stopped':
          case 'idle':
            isLoadingPhase = false
            clearLoadingTimeout()
            if (event.driver == 'nativeFlac') global.lx.playerTrackId = ''
            global.app_event.playerPause()
            global.app_event.pause()
            break
        }
        if (global.lx.isPlayedStop) void handleExitApp('Timeout Exit')
        break
      case 'error':
        isLoadingPhase = false
        global.app_event.error()
        global.app_event.playerError()
        handleControllerError()
        break
      case 'trackChanged':
        global.lx.playerTrackId = event.trackId
        if (event.info?.track == null) return
        if (global.lx.isPlayedStop) return handleExitApp('Timeout Exit')
        if (Platform.OS == 'ios' && event.driver == 'trackPlayer') {
          void TrackPlayer.setVolume(settingState.setting['player.volume'])
        }
        if (Platform.OS != 'ios' && event.driver == 'trackPlayer' && isEmpty()) {
          await TrackPlayer.pause()
          global.app_event.playerPause()
          global.app_event.pause()
          global.app_event.playerEnded()
          global.app_event.playerEmptied()
          clearDelayNextTimeout()
          clearLoadingTimeout()
        }
        break
      case 'ended':
        isLoadingPhase = false
        global.lx.playerTrackId = ''
        global.app_event.playerPause()
        global.app_event.pause()
        global.app_event.playerEnded()
        global.app_event.playerEmptied()
        clearDelayNextTimeout()
        clearLoadingTimeout()
        break
    }
  })

  global.app_event.on('musicToggled', resetRecoveryState)
  // 加载阶段收到播放器的 paused 时会保留看门狗(可能是地址失效),但主动暂停必须清掉,
  // 否则 25 秒后看门狗刷新地址并自动 play(),用户已暂停的歌曲会自己开始播放
  global.app_event.on('userPause', () => {
    isLoadingPhase = false
    clearLoadingTimeout()
  })
  isInitialized = true
}
