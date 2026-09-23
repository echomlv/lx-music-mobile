import { memo, type ReactNode } from 'react'
import { View, type StyleProp, type ViewStyle } from 'react-native'

import { useDesignTokens } from '@/theme/v2'
import { Typography } from '../atoms'

export interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
  style?: StyleProp<ViewStyle>
}

/** 统一空态、错误态和无搜索结果的内容层级。 */
export const EmptyState = memo(({ icon, title, description, action, style }: EmptyStateProps) => {
  const { tokens, semanticColors } = useDesignTokens()

  return (
    <View
      style={[
        {
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: tokens.spacing.xxl,
          paddingVertical: tokens.spacing.xxxl,
        },
        style,
      ]}
    >
      {icon ? <View style={{ marginBottom: tokens.spacing.md }}>{icon}</View> : null}
      <Typography variant="subtitle" weight="600" style={{ textAlign: 'center' }}>
        {title}
      </Typography>
      {description
        ? (
            <Typography
              variant="body"
              color={semanticColors.textSecondary}
              style={{ marginTop: tokens.spacing.xs, textAlign: 'center' }}
            >
              {description}
            </Typography>
          )
        : null}
      {action ? <View style={{ marginTop: tokens.spacing.lg }}>{action}</View> : null}
    </View>
  )
})

EmptyState.displayName = 'v2.EmptyState'
