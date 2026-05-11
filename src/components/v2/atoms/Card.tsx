import { memo, type ReactNode } from 'react'
import { View, type StyleProp, type ViewStyle } from 'react-native'
import { useDesignTokens } from '@/theme/v2'
import type { ElevationToken, RadiusToken, SpacingToken } from '@/theme/v2/tokens'
import { Surface, type SurfaceVariant } from './Surface'

export interface CardProps {
  variant?: SurfaceVariant
  radius?: RadiusToken
  elevation?: ElevationToken
  /** 内边距档位 */
  padding?: SpacingToken
  /** 给 Surface 的覆盖底色 */
  backgroundColor?: string
  style?: StyleProp<ViewStyle>
  children?: ReactNode
}

/**
 * 卡片容器 = Surface + 默认 elevation=sm + radius=lg + padding=lg。
 * 用于歌单卡片、设置分组、信息块。
 */
export const Card = memo(({
  variant = 'solid',
  radius = 'lg',
  elevation = 'sm',
  padding = 'lg',
  backgroundColor,
  style,
  children,
}: CardProps) => {
  const { tokens } = useDesignTokens()
  return (
    <Surface
      variant={variant}
      radius={radius}
      elevation={elevation}
      backgroundColor={backgroundColor}
      style={style}
    >
      <View style={{ padding: tokens.spacing[padding] }}>{children}</View>
    </Surface>
  )
})

Card.displayName = 'v2.Card'
