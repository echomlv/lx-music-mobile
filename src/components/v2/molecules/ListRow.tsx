import { memo, type ReactNode } from 'react'
import { View, type StyleProp, type ViewStyle } from 'react-native'

import { useDesignTokens } from '@/theme/v2'
import { Typography, V2Pressable } from '../atoms'

export interface ListRowProps {
  title: string
  subtitle?: string
  leading?: ReactNode
  trailing?: ReactNode
  selected?: boolean
  disabled?: boolean
  onPress?: () => void
  onLongPress?: () => void
  style?: StyleProp<ViewStyle>
}

/**
 * 通用列表行，统一标题层级、选中态、点击反馈和最小触控高度。
 */
export const ListRow = memo(({
  title,
  subtitle,
  leading,
  trailing,
  selected = false,
  disabled = false,
  onPress,
  onLongPress,
  style,
}: ListRowProps) => {
  const { tokens, semanticColors } = useDesignTokens()

  return (
    <V2Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      disabled={disabled}
      accessibilityRole="button"
      style={[
        {
          minHeight: 56,
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: tokens.spacing.md,
          paddingVertical: tokens.spacing.sm,
          borderRadius: tokens.radius.md,
          backgroundColor: selected ? semanticColors.surfaceMuted : 'transparent',
          opacity: disabled ? 0.45 : 1,
        },
        style,
      ]}
    >
      {leading
        ? <View style={{ width: 40, marginRight: tokens.spacing.md, alignItems: 'center' }}>{leading}</View>
        : null}
      <View style={{ flex: 1, minWidth: 0 }}>
        <Typography variant="body" weight={selected ? '600' : '500'} numberOfLines={1}>
          {title}
        </Typography>
        {subtitle
          ? (
              <Typography
                variant="caption"
                color={semanticColors.textSecondary}
                numberOfLines={1}
                style={{ marginTop: 2 }}
              >
                {subtitle}
              </Typography>
            )
          : null}
      </View>
      {trailing ? <View style={{ marginLeft: tokens.spacing.sm }}>{trailing}</View> : null}
    </V2Pressable>
  )
})

ListRow.displayName = 'v2.ListRow'
