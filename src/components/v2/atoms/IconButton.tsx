import { memo } from 'react'
import { type StyleProp, type ViewStyle } from 'react-native'
import { useDesignTokens } from '@/theme/v2'
import { Icon } from '@/components/common/Icon'
import { V2Pressable } from './Pressable'
import type { RadiusToken } from '@/theme/v2/tokens'

export interface IconButtonProps {
  name: string
  size?: number
  color?: string
  /** 触控圆形/圆角的直径(默认 40) */
  hitSize?: number
  radius?: RadiusToken
  background?: 'none' | 'subtle' | 'primary'
  onPress?: () => void
  disabled?: boolean
  style?: StyleProp<ViewStyle>
  accessibilityLabel?: string
}

/**
 * v2 图标按钮,统一手感与命中区。
 * background:
 *   - 'none'    无背景(默认)
 *   - 'subtle'  半透明 fill,适合 toolbar
 *   - 'primary' 主题色 fill,适合主操作
 */
export const IconButton = memo(({
  name,
  size = 18,
  color,
  hitSize = 40,
  radius = 'pill',
  background = 'none',
  onPress,
  disabled,
  style,
  accessibilityLabel,
}: IconButtonProps) => {
  const { colors, tokens } = useDesignTokens()

  const bg = background === 'none'
    ? 'transparent'
    : background === 'subtle'
      ? colors['c-primary-light-100-alpha-700']
      : colors['c-primary']

  const iconColor = color ?? (background === 'primary' ? colors['c-primary-light-1000'] : colors['c-font'])

  return (
    <V2Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      style={[
        {
          width: hitSize,
          height: hitSize,
          borderRadius: tokens.radius[radius],
          backgroundColor: bg,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: disabled ? 0.4 : 1,
        },
        style,
      ]}
    >
      <Icon name={name} size={size} color={iconColor} />
    </V2Pressable>
  )
})

IconButton.displayName = 'v2.IconButton'
