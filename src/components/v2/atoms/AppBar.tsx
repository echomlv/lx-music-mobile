import { memo, type ReactNode } from 'react'
import { Text, View, type StyleProp, type ViewStyle } from 'react-native'
import { useDesignTokens } from '@/theme/v2'
import { useStatusbarHeight } from '@/store/common/hook'
import { setSpText } from '@/utils/pixelRatio'
import { Surface } from './Surface'

export interface AppBarProps {
  title?: string
  leading?: ReactNode
  /** 右侧 action 区域(图标按钮组等) */
  actions?: ReactNode
  /** 是否使用毛玻璃半透明背板(适合沉浸式页面) */
  translucent?: boolean
  /** 是否考虑状态栏高度 padding(默认 true) */
  withStatusbarPadding?: boolean
  /** 高度(状态栏外) */
  height?: number
  style?: StyleProp<ViewStyle>
}

/**
 * v2 自绘顶部栏,替代 react-native-navigation 的原生 topBar。
 * 配合 setRoot/push 时关闭原生 topBar:
 *   topBar: { visible: false, drawBehind: true }
 */
export const AppBar = memo(({
  title,
  leading,
  actions,
  translucent = false,
  withStatusbarPadding = true,
  height = 48,
  style,
}: AppBarProps) => {
  const { colors, tokens } = useDesignTokens()
  const statusBarHeight = useStatusbarHeight()

  return (
    <Surface
      variant={translucent ? 'blur' : 'solid'}
      radius="none"
      elevation={translucent ? 'none' : 'sm'}
      backgroundColor={translucent ? undefined : colors['c-content-background']}
      style={[{ width: '100%' }, style]}
    >
      <View
        style={{
          paddingTop: withStatusbarPadding ? statusBarHeight : 0,
          height: height + (withStatusbarPadding ? statusBarHeight : 0),
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: tokens.spacing.md,
        }}
      >
        <View style={{ width: 44, alignItems: 'flex-start' }}>{leading}</View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: tokens.spacing.sm }}>
          {title
            ? (
                <Text
                  numberOfLines={1}
                  style={{
                    fontSize: setSpText(17),
                    color: colors['c-font'],
                    fontWeight: '600',
                  }}
                >{title}</Text>
              )
            : null}
        </View>
        <View style={{ minWidth: 44, alignItems: 'flex-end', flexDirection: 'row', justifyContent: 'flex-end' }}>
          {actions}
        </View>
      </View>
    </Surface>
  )
})

AppBar.displayName = 'v2.AppBar'
