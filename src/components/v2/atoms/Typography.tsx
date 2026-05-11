import { memo, type ComponentProps } from 'react'
import { StyleSheet, Text as RNText, type TextStyle, type ColorValue } from 'react-native'
import { useDesignTokens } from '@/theme/v2'
import { useTextShadow } from '@/store/theme/hook'
import { setSpText } from '@/utils/pixelRatio'
import type { TypographyToken } from '@/theme/v2/tokens'

export type TypographyVariant = TypographyToken

export interface TypographyProps extends ComponentProps<typeof RNText> {
  variant?: TypographyVariant
  color?: ColorValue
  weight?: '400' | '500' | '600' | '700'
  /** 强调色 — 启用后忽略 color,使用主题主色 */
  emphasis?: boolean
}

const weightDefault: Record<TypographyVariant, '400' | '500' | '600' | '700'> = {
  display: '700',
  title: '600',
  subtitle: '600',
  body: '400',
  label: '500',
  caption: '400',
}

/**
 * v2 语义化文本。size 通过 token 而非裸 px,保留 `global.lx.fontSize` 全局缩放与字体阴影。
 */
export const Typography = memo(({
  variant = 'body',
  color,
  weight,
  emphasis,
  style,
  children,
  ...rest
}: TypographyProps) => {
  const { colors, tokens } = useDesignTokens()
  const textShadow = useTextShadow()

  const base: TextStyle = {
    fontSize: setSpText(tokens.typography[variant]),
    fontWeight: weight ?? weightDefault[variant],
    color: emphasis ? colors['c-primary'] : color ?? colors['c-font'],
  }

  const shadow: TextStyle | undefined = textShadow
    ? {
        textShadowColor: colors['c-primary-dark-300-alpha-800'],
        textShadowOffset: { width: 0.2, height: 0.2 },
        textShadowRadius: 2,
      }
    : undefined

  return (
    <RNText style={StyleSheet.compose(shadow ? { ...base, ...shadow } : base, style)} {...rest}>
      {children}
    </RNText>
  )
})

Typography.displayName = 'v2.Typography'
