import { memo } from 'react'
import { Platform, StatusBar as RNStatusBar } from 'react-native'
import { useDesignTokens } from '@/theme/v2'

export type StatusBarStyle = 'auto' | 'light' | 'dark'

export interface StatusBarV2Props {
  /** 'auto' 跟随主题 isDark;'light' / 'dark' 强制 */
  style?: StatusBarStyle
  hidden?: boolean
  animated?: boolean
}

/**
 * v2 沉浸式 StatusBar。
 * - iOS:无 background,内容可绘制到状态栏下方
 * - Android:translucent + 透明背景
 * - 屏幕级页面(如 PlayDetail 大封面沉浸式)可传 style='light' 强制白字
 */
export const StatusBarV2 = memo(({ style = 'auto', hidden, animated }: StatusBarV2Props) => {
  const { isDark } = useDesignTokens()
  const resolved = style === 'auto' ? (isDark ? 'light' : 'dark') : style
  const barStyle = resolved === 'light' ? 'light-content' : 'dark-content'
  return (
    <RNStatusBar
      backgroundColor="rgba(0,0,0,0)"
      barStyle={barStyle}
      translucent={Platform.OS === 'android'}
      hidden={hidden}
      animated={animated}
    />
  )
})

StatusBarV2.displayName = 'v2.StatusBar'
