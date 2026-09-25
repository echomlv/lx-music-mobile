import TrackPlayer, { Event as TPEvent, State as TPState } from 'react-native-track-player'
import { Platform } from 'react-native'
import { getCurrentTrackId } from '../../trackPlayerCore'
import type { UnifiedPlaybackState } from '../types'
import type { UnifiedPlayerEventBus } from '../EventBus'

// iOS 上 SwiftAudioEx 在播放途中卡住缓冲时上报的原生状态值。TrackPlayer 的 State 枚举里没有对应项
// (State.Buffering 实际是 'loading',对应资源加载),不单独识别会被当成未知状态
export const IOS_STALLED_STATE = 'buffering'

const mapTrackPlayerState = (state: TPState): UnifiedPlaybackState | null => {
  switch (state) {
    case TPState.Playing:
      return 'playing'
    case TPState.Buffering:
      return 'buffering'
    case TPState.Connecting:
      return 'loading'
    case TPState.Paused:
      return 'paused'
    case TPState.Stopped:
      return 'stopped'
    case TPState.Ready:
      return 'paused'
    case TPState.None:
      return 'idle'
    default:
      if ((state as string) == IOS_STALLED_STATE) return 'buffering'
      // 不认识的状态直接忽略:当成 idle 会触发暂停,弱网下卡顿时按钮和锁屏会在暂停/播放之间来回跳
      return null
  }
}

export const createTrackPlayerDriver = (bus: UnifiedPlayerEventBus, shouldIgnoreLifecycle: () => boolean) => {
  let isInitialized = false

  const init = () => {
    if (isInitialized) return

    TrackPlayer.addEventListener(TPEvent.PlaybackState, async(info) => {
      if (shouldIgnoreLifecycle()) return
      const state = mapTrackPlayerState(info.state as TPState)
      if (!state) return
      bus.emit({ type: 'state', driver: 'trackPlayer', state })
    })

    TrackPlayer.addEventListener(TPEvent.PlaybackError, async(err: any) => {
      if (shouldIgnoreLifecycle()) return
      bus.emit({ type: 'error', driver: 'trackPlayer', error: err })
    })

    TrackPlayer.addEventListener(TPEvent.PlaybackTrackChanged, async(info: any) => {
      if (shouldIgnoreLifecycle()) return
      const trackId = await getCurrentTrackId().catch(() => '')
      bus.emit({
        type: 'trackChanged',
        driver: 'trackPlayer',
        info,
        trackId: trackId ?? '',
      })
    })

    const playbackQueueEndedEvent = ((TPEvent as unknown as { PlaybackQueueEnded?: TPEvent }).PlaybackQueueEnded ?? 'playback-queue-ended') as TPEvent
    TrackPlayer.addEventListener(playbackQueueEndedEvent, async(info: any) => {
      if (shouldIgnoreLifecycle()) return
      if (Platform.OS != 'ios') return
      bus.emit({
        type: 'ended',
        driver: 'trackPlayer',
        position: info?.position,
        duration: info?.duration,
      })
    })

    isInitialized = true
  }

  return { init }
}
