import { Platform, type ViewStyle } from 'react-native'

/**
 * Design tokens v2 — 与旧 useTheme() 颜色解耦。仅扩展 spacing / radius / elevation /
 * motion / blur 五类语义令牌,旧主题颜色由 useDesignTokens() 内部合并,旧主题包零迁移。
 *
 * 命名遵循 Tailwind / Material You 习惯,数值与 4px 网格对齐。
 */

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 40,
} as const
export type SpacingToken = keyof typeof spacing

export const radius = {
  none: 0,
  sm: 6,
  md: 10,
  lg: 16,
  xl: 24,
  pill: 9999,
} as const
export type RadiusToken = keyof typeof radius

/**
 * iOS 使用 shadow*,Android 使用 elevation。直接展开到 View 的 style 即可。
 */
export const elevation: Record<'none' | 'sm' | 'md' | 'lg' | 'xl', ViewStyle> = {
  none: Platform.select({
    ios: { shadowOpacity: 0 },
    default: { elevation: 0 },
  })!,
  sm: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOpacity: 0.06,
      shadowOffset: { width: 0, height: 1 },
      shadowRadius: 2,
    },
    default: { elevation: 1 },
  })!,
  md: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOpacity: 0.08,
      shadowOffset: { width: 0, height: 2 },
      shadowRadius: 6,
    },
    default: { elevation: 3 },
  })!,
  lg: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOpacity: 0.12,
      shadowOffset: { width: 0, height: 4 },
      shadowRadius: 12,
    },
    default: { elevation: 6 },
  })!,
  xl: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOpacity: 0.18,
      shadowOffset: { width: 0, height: 8 },
      shadowRadius: 24,
    },
    default: { elevation: 10 },
  })!,
}
export type ElevationToken = keyof typeof elevation

export const motion = {
  duration: {
    fast: 150,
    base: 220,
    slow: 320,
    page: 420,
  },
  // RN 不直接支持 cubic-bezier 字符串,这里输出 4 元组以便 Animated.bezier 或 Reanimated 使用
  easing: {
    standard: [0.2, 0, 0, 1] as const,
    enter: [0, 0, 0, 1] as const,
    exit: [0.4, 0, 1, 1] as const,
    spring: { damping: 18, stiffness: 200 } as const,
  },
} as const
export type DurationToken = keyof typeof motion.duration

/**
 * 毛玻璃配置,供 @react-native-community/blur 的 BlurView 使用。
 * 真机 iOS 用系统材质效果最佳;低端设备由 Surface 组件自动降级为 solid。
 */
export const blur = {
  intensity: {
    thin: 10,
    regular: 20,
    thick: 30,
  },
  tint: {
    light: 'light',
    dark: 'dark',
    material: 'systemMaterial',
    chromeMaterial: 'systemChromeMaterial',
    thin: 'systemThinMaterial',
  },
} as const
export type BlurIntensityToken = keyof typeof blur.intensity
export type BlurTintToken = keyof typeof blur.tint

/**
 * 字号语义化映射。具体像素值仍由 pixelRatio.setSpText 在消费端计算(尊重 global.lx.fontSize)。
 * 这里只是一组「相对单位」,便于组件内部统一引用。
 */
export const typography = {
  display: 32,
  title: 22,
  subtitle: 18,
  body: 15,
  label: 13,
  caption: 11,
} as const
export type TypographyToken = keyof typeof typography

export const tokens = {
  spacing,
  radius,
  elevation,
  motion,
  blur,
  typography,
} as const

export type DesignTokens = typeof tokens
