import { memo, useRef, type ReactNode } from 'react'
import { Animated, Pressable as RNPressable, StyleSheet, type PressableProps, type StyleProp, type ViewStyle } from 'react-native'
import { useDesignTokens } from '@/theme/v2'

// 这些属性决定 children 的排列方式,必须作用在直接包裹 children 的 RNPressable 上;
// 若留在外层 Animated.View,它只会排列唯一的子节点 RNPressable,children 会退回默认的纵向布局
const CONTENT_LAYOUT_KEYS = [
  'flexDirection',
  'flexWrap',
  'alignItems',
  'alignContent',
  'justifyContent',
  'gap',
  'rowGap',
  'columnGap',
  'padding',
  'paddingHorizontal',
  'paddingVertical',
  'paddingTop',
  'paddingBottom',
  'paddingLeft',
  'paddingRight',
  'paddingStart',
  'paddingEnd',
] as const

const splitStyle = (style: StyleProp<ViewStyle>) => {
  const outer: Record<string, unknown> = { ...StyleSheet.flatten(style) }
  const content: Record<string, unknown> = {}
  for (const key of CONTENT_LAYOUT_KEYS) {
    if (outer[key] === undefined) continue
    content[key] = outer[key]
    delete outer[key]
  }
  return { outer: outer as ViewStyle, content: content as ViewStyle }
}

export interface V2PressableProps extends Omit<PressableProps, 'style' | 'children'> {
  style?: StyleProp<ViewStyle>
  pressableStyle?: StyleProp<ViewStyle>
  /** 按下时的缩放因子(0~1),默认 0.97 */
  pressScale?: number
  /** 按下时叠加的 overlay 透明度(0~1),默认 0.06 */
  pressOverlay?: number
  // 收窄为 ReactNode:V2Pressable 自带 overlay 节点拼在 children 后面,
  // RN Pressable 原生的 render-prop 形式与之冲突,这里只允许静态子节点。
  children?: ReactNode
}

/**
 * v2 通用可点击容器。使用 RN 自带 Animated(无需 Reanimated 也能跑),
 * 按下时同时做缩放 + 叠加深色半透明 overlay,统一各按钮的反馈手感。
 */
export const V2Pressable = memo(({
  style,
  pressableStyle,
  pressScale = 0.97,
  pressOverlay = 0.06,
  onPressIn,
  onPressOut,
  children,
  ...rest
}: V2PressableProps) => {
  const { tokens, isDark } = useDesignTokens()
  const scale = useRef(new Animated.Value(1)).current
  const overlay = useRef(new Animated.Value(0)).current
  const { outer, content } = splitStyle(style)

  const animateTo = (toScale: number, toOverlay: number) => {
    Animated.parallel([
      Animated.timing(scale, {
        toValue: toScale,
        duration: tokens.motion.duration.fast,
        useNativeDriver: true,
      }),
      Animated.timing(overlay, {
        toValue: toOverlay,
        duration: tokens.motion.duration.fast,
        useNativeDriver: true,
      }),
    ]).start()
  }

  return (
    <Animated.View style={[{ transform: [{ scale }] }, outer]}>
      <RNPressable
        style={[{ flexGrow: 1 }, content, pressableStyle]}
        onPressIn={(e) => {
          animateTo(pressScale, pressOverlay)
          onPressIn?.(e)
        }}
        onPressOut={(e) => {
          animateTo(1, 0)
          onPressOut?.(e)
        }}
        {...rest}
      >
        {children}
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: isDark ? '#FFFFFF' : '#000000',
            opacity: overlay,
          }}
        />
      </RNPressable>
    </Animated.View>
  )
})

V2Pressable.displayName = 'v2.Pressable'
