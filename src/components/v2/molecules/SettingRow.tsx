import { memo, type ReactNode } from 'react'
import { TouchableOpacity, View, type StyleProp, type ViewStyle } from 'react-native'

import { useDesignTokens } from '@/theme/v2'
import { Icon } from '@/components/common/Icon'
import { Typography, V2Pressable } from '../atoms'

export interface SettingRowProps {
  label: string
  description?: string
  control?: ReactNode
  trailing?: ReactNode
  showChevron?: boolean
  disabled?: boolean
  onPress?: () => void
  /** 传入时在标题右侧显示帮助图标,点击触发 */
  onHelp?: () => void
  style?: StyleProp<ViewStyle>
}

/** iOS 设置分组中的标准行，控制件由调用方注入以保留现有业务逻辑。 */
export const SettingRow = memo(({
  label,
  description,
  control,
  trailing,
  showChevron = false,
  disabled = false,
  onPress,
  onHelp,
  style,
}: SettingRowProps) => {
  const { tokens, semanticColors } = useDesignTokens()
  const accessory = control ?? trailing ?? (showChevron
    ? <Icon name="chevron-right" size={14} color={semanticColors.textTertiary} />
    : null)

  return (
    <V2Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole={onPress ? 'button' : undefined}
      style={[
        {
          minHeight: 52,
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: tokens.spacing.md,
          paddingVertical: tokens.spacing.sm,
          opacity: disabled ? 0.45 : 1,
        },
        style,
      ]}
    >
      <View style={{ flex: 1, minWidth: 0, paddingRight: tokens.spacing.md }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Typography variant="body" numberOfLines={1} style={{ flexShrink: 1 }}>{label}</Typography>
          {onHelp
            ? (
                <TouchableOpacity
                  onPress={onHelp}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel="help"
                  style={{ marginLeft: tokens.spacing.xs }}
                >
                  <Icon name="help" size={14} color={semanticColors.textTertiary} />
                </TouchableOpacity>
              )
            : null}
        </View>
        {description
          ? (
              <Typography
                variant="label"
                weight="400"
                color={semanticColors.textSecondary}
                numberOfLines={2}
                style={{ marginTop: 2 }}
              >
                {description}
              </Typography>
            )
          : null}
      </View>
      {accessory ? <View style={{ flexShrink: 0 }}>{accessory}</View> : null}
    </V2Pressable>
  )
})

SettingRow.displayName = 'v2.SettingRow'
