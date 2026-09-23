import { memo, type ReactNode } from 'react'
import { View, type StyleProp, type ViewStyle } from 'react-native'

import { useDesignTokens } from '@/theme/v2'
import { IconButton, Surface, Typography } from '../atoms'

export interface SheetSurfaceProps {
  title?: string
  onClose?: () => void
  children?: ReactNode
  style?: StyleProp<ViewStyle>
  contentStyle?: StyleProp<ViewStyle>
  showHandle?: boolean
}

/**
 * 弹层的视觉容器。显示、拖拽和键盘行为继续由现有 Modal/Popup 负责。
 */
export const SheetSurface = memo(({
  title,
  onClose,
  children,
  style,
  contentStyle,
  showHandle = true,
}: SheetSurfaceProps) => {
  const { tokens, semanticColors } = useDesignTokens()

  return (
    <Surface
      variant="blur"
      radius="xl"
      elevation="xl"
      style={[{ paddingBottom: tokens.spacing.lg }, style]}
    >
      {showHandle
        ? (
            <View
              pointerEvents="none"
              style={{
                alignSelf: 'center',
                width: 36,
                height: 4,
                marginTop: tokens.spacing.sm,
                borderRadius: tokens.radius.pill,
                backgroundColor: semanticColors.textTertiary,
                opacity: 0.65,
              }}
            />
          )
        : null}
      {title != null || onClose != null
        ? (
            <View
              style={{
                minHeight: 48,
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: tokens.spacing.md,
              }}
            >
              <View style={{ flex: 1, minWidth: 0 }}>
                {title ? <Typography variant="subtitle" weight="600" numberOfLines={1}>{title}</Typography> : null}
              </View>
              {onClose
                ? <IconButton name="close" size={16} hitSize={40} onPress={onClose} accessibilityLabel="close" />
                : null}
            </View>
          )
        : null}
      <View style={contentStyle}>{children}</View>
    </Surface>
  )
})

SheetSurface.displayName = 'v2.SheetSurface'
