import { memo } from 'react'
import { StyleSheet, View } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'

import { useDesignTokens } from '@/theme/v2'
import { usePlayerMusicInfo } from '@/store/player/hook'
import { isBlurAvailable } from '@/components/v2/atoms'
import Image from '@/components/common/Image'

let BlurView: typeof import('@react-native-community/blur').BlurView | null = null
if (isBlurAvailable()) {
  try { BlurView = require('@react-native-community/blur').BlurView } catch {}
}

/**
 * v2 PlayDetail 沉浸背景层:封面 → 自适应模糊 → 顶/底主题色渐变收口。
 *
 * 落地策略:
 * - Image 平铺成大背景(resizeMode=cover);若无封面则纯 content-background 兜底
 * - BlurView blurType="regular" 自适应主题(浅/深),amount=50 模糊掉细节
 * - 一层 content-background 主体半透明,让色调跟主屏一致(不再叠主题主色)
 * - LinearGradient 顶/底各 25% 渐变至 content-background,跟 status bar/home indicator 区平滑过渡
 */
export default memo(() => {
  const { colors } = useDesignTokens()
  const musicInfo = usePlayerMusicInfo()
  const bg = colors['c-content-background']

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      {musicInfo.pic
        ? <Image url={musicInfo.pic} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
        : <View style={[StyleSheet.absoluteFillObject, { backgroundColor: bg }]} />}
      {BlurView
        ? <BlurView style={StyleSheet.absoluteFillObject} blurType="regular" blurAmount={50} reducedTransparencyFallbackColor={bg} />
        : <View style={[StyleSheet.absoluteFillObject, { backgroundColor: bg, opacity: 0.85 }]} />}
      <View style={[StyleSheet.absoluteFillObject, { backgroundColor: bg, opacity: 0.55 }]} />
      <LinearGradient
        colors={[bg, 'transparent', 'transparent', bg]}
        locations={[0, 0.25, 0.75, 1]}
        style={StyleSheet.absoluteFillObject}
      />
    </View>
  )
})
