import { forwardRef, memo, type ReactNode } from 'react'
import {
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native'

import { setSpText } from '@/utils/pixelRatio'
import { useDesignTokens } from '@/theme/v2'
import { IconButton } from '../atoms'

export interface SearchFieldProps extends Omit<TextInputProps, 'style'> {
  leading?: ReactNode
  onClear?: () => void
  showClear?: boolean
  containerStyle?: StyleProp<ViewStyle>
  inputStyle?: StyleProp<TextStyle>
}

/**
 * 统一的 iOS pill 搜索输入框。搜索建议、音源选择等业务行为由调用方处理。
 */
export const SearchField = memo(forwardRef<TextInput, SearchFieldProps>(({
  leading,
  onClear,
  showClear = true,
  containerStyle,
  inputStyle,
  value,
  placeholderTextColor,
  ...props
}: SearchFieldProps, ref) => {
  const { tokens, semanticColors } = useDesignTokens()
  const canClear = showClear && Boolean(value) && Boolean(onClear)

  return (
    <View
      style={[
        {
          minHeight: 40,
          flexDirection: 'row',
          alignItems: 'center',
          paddingLeft: tokens.spacing.md,
          paddingRight: tokens.spacing.xs,
          borderRadius: tokens.radius.pill,
          backgroundColor: semanticColors.input,
        },
        containerStyle,
      ]}
    >
      {leading ? <View style={{ marginRight: tokens.spacing.xs }}>{leading}</View> : null}
      <TextInput
        {...props}
        ref={ref}
        value={value}
        placeholderTextColor={placeholderTextColor ?? semanticColors.textTertiary}
        style={[
          {
            flex: 1,
            minWidth: 0,
            paddingVertical: 0,
            color: semanticColors.text,
            fontSize: setSpText(15),
          },
          inputStyle,
        ]}
      />
      {canClear
        ? (
            <IconButton
              name="remove"
              size={11}
              hitSize={32}
              radius="pill"
              onPress={onClear}
              accessibilityLabel="clear search"
            />
          )
        : null}
    </View>
  )
}))

SearchField.displayName = 'v2.SearchField'
