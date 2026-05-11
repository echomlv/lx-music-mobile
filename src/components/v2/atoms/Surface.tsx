import { memo, useMemo, type ReactNode } from 'react'
import { Platform, View, type StyleProp, type ViewStyle } from 'react-native'
import { BlurView as RNBlurView } from '@react-native-community/blur'
import { useDesignTokens } from '@/theme/v2'
import type { ElevationToken, RadiusToken, BlurIntensityToken, BlurTintToken } from '@/theme/v2/tokens'

type BlurViewComponent = (props: {
  blurType?: string
  blurAmount?: number
  reducedTransparencyFallbackColor?: string
  style?: StyleProp<ViewStyle>
  children?: ReactNode
}) => JSX.Element | null

const BlurView = RNBlurView as unknown as BlurViewComponent

export const isBlurAvailable = (): boolean => Platform.OS === 'ios'

export type SurfaceVariant = 'solid' | 'blur' | 'glass'

export interface SurfaceProps {
  /** 容器视觉类型:solid 实心 / blur 毛玻璃 / glass 玻璃(blur + 内边描边) */
  variant?: SurfaceVariant
  /** 圆角档位 */
  radius?: RadiusToken
  /** 阴影档位 */
  elevation?: ElevationToken
  /** 毛玻璃强度档位(仅 blur/glass 生效) */
  blurIntensity?: BlurIntensityToken
  /** 毛玻璃 tint(仅 blur/glass 生效) */
  blurTint?: BlurTintToken
  /** solid 模式或 blur 降级时的底色;不传则取 colors['c-content-background'] */
  backgroundColor?: string
  /** 额外样式叠加 */
  style?: StyleProp<ViewStyle>
  children?: ReactNode
}

/**
 * 通用容器底。优先使用 BlurView,未安装或非 iOS 降级为半透明 View。
 * 切忌嵌套两层 Surface(BlurView 嵌套会跨平台不一致)。
 */
export const Surface = memo(({
  variant = 'solid',
  radius = 'md',
  elevation = 'none',
  blurIntensity = 'regular',
  blurTint,
  backgroundColor,
  style,
  children,
}: SurfaceProps) => {
  const { tokens, colors, isDark } = useDesignTokens()

  const baseStyle = useMemo<ViewStyle>(() => ({
    borderRadius: tokens.radius[radius],
    overflow: 'hidden',
    ...tokens.elevation[elevation],
  }), [tokens, radius, elevation])

  // BlurView 不可用 → 用半透明色块降级,glass 比 blur 略不透明
  if (variant === 'solid' || !isBlurAvailable() || !BlurView) {
    const bg = backgroundColor ??
      (variant === 'solid'
        ? colors['c-content-background']
        : isDark
          ? 'rgba(20,20,20,0.72)'
          : 'rgba(255,255,255,0.72)')
    return <View style={[baseStyle, { backgroundColor: bg }, style]}>{children}</View>
  }

  const resolvedTint = blurTint ?? (isDark ? 'dark' : 'light')
  const tintValue = tokens.blur.tint[resolvedTint]
  const intensity = tokens.blur.intensity[blurIntensity]

  return (
    <View style={[baseStyle, style]}>
      <BlurView
        blurType={tintValue}
        blurAmount={intensity}
        reducedTransparencyFallbackColor={isDark ? '#141414' : '#FFFFFF'}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />
      {variant === 'glass'
        ? (
            <View
              pointerEvents="none"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                borderRadius: tokens.radius[radius],
                borderWidth: 1,
                borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.55)',
              }}
            />
          )
        : null}
      {children}
    </View>
  )
})

Surface.displayName = 'v2.Surface'
