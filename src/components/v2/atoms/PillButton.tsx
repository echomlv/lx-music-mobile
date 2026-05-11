import { memo, type ReactNode } from 'react'
import { Text, View, type StyleProp, type ViewStyle, type TextStyle } from 'react-native'
import { useDesignTokens } from '@/theme/v2'
import { setSpText } from '@/utils/pixelRatio'
import { V2Pressable } from './Pressable'

export type PillButtonVariant = 'primary' | 'secondary' | 'ghost'
export type PillButtonSize = 'sm' | 'md' | 'lg'

export interface PillButtonProps {
  label: string
  onPress?: () => void
  variant?: PillButtonVariant
  size?: PillButtonSize
  leading?: ReactNode
  trailing?: ReactNode
  disabled?: boolean
  fullWidth?: boolean
  style?: StyleProp<ViewStyle>
  labelStyle?: StyleProp<TextStyle>
}

const sizeMap: Record<PillButtonSize, { paddingH: number, paddingV: number, font: number }> = {
  sm: { paddingH: 12, paddingV: 6, font: 13 },
  md: { paddingH: 16, paddingV: 9, font: 15 },
  lg: { paddingH: 20, paddingV: 12, font: 17 },
}

/**
 * Pill 形按钮(完全圆角)。三种 variant 对应主操作 / 次操作 / 透明。
 */
export const PillButton = memo(({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  leading,
  trailing,
  disabled,
  fullWidth,
  style,
  labelStyle,
}: PillButtonProps) => {
  const { colors, tokens } = useDesignTokens()
  const dim = sizeMap[size]

  const bg = variant === 'primary'
    ? colors['c-primary']
    : variant === 'secondary'
      ? colors['c-primary-light-100-alpha-700']
      : 'transparent'
  const fg = variant === 'primary'
    ? colors['c-primary-light-1000']
    : variant === 'secondary'
      ? colors['c-primary']
      : colors['c-font']
  const border = variant === 'ghost'
    ? { borderWidth: 1, borderColor: colors['c-border-background'] }
    : null

  return (
    <V2Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={[
        {
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
          backgroundColor: bg,
          borderRadius: tokens.radius.pill,
          paddingHorizontal: dim.paddingH,
          paddingVertical: dim.paddingV,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: disabled ? 0.4 : 1,
        },
        border,
        style,
      ]}
    >
      {leading
        ? <View style={{ marginRight: tokens.spacing.xs }}>{leading}</View>
        : null}
      <Text
        style={[
          { color: fg, fontSize: setSpText(dim.font), fontWeight: '600' },
          labelStyle,
        ]}
      >{label}</Text>
      {trailing
        ? <View style={{ marginLeft: tokens.spacing.xs }}>{trailing}</View>
        : null}
    </V2Pressable>
  )
})

PillButton.displayName = 'v2.PillButton'
