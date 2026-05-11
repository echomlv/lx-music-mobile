import { forwardRef, useCallback, useImperativeHandle, useRef, useState } from 'react'
import { TextInput, View, type StyleProp, type ViewStyle } from 'react-native'

import { useDesignTokens } from '@/theme/v2'
import { useI18n } from '@/lang'
import { setSpText } from '@/utils/pixelRatio'
import { Icon } from '@/components/common/Icon'

import SourceSelector, {
  type SourceSelectorProps as _SourceSelectorProps,
  type SourceSelectorType as _SourceSelectorType,
} from '@/components/SourceSelector'
import { type Source as MusicSource } from '@/store/search/music/state'
import { type Source as SonglistSource } from '@/store/search/songlist/state'

import { IconButton, Surface } from '@/components/v2/atoms'

type Sources = Readonly<Array<MusicSource | SonglistSource>>
type SourceSelectorProps = _SourceSelectorProps<Sources>
type SourceSelectorType = _SourceSelectorType<Sources>

export interface HeaderBarProps {
  onSourceChange: SourceSelectorProps['onSourceChange']
  onTipSearch: (text: string) => void
  onSearch: (text: string) => void
  onHideTipList: () => void
  onShowTipList: () => void
}

export interface HeaderBarType {
  setSourceList: SourceSelectorType['setSourceList']
  setText: (text: string) => void
  blur: () => void
}

/**
 * v2 搜索条:
 * - 左侧 source chip(沿用 v1 SourceSelector 下拉菜单逻辑,壳改 pill)
 * - 右侧 pill 搜索输入框 + 内嵌清空键
 */
export default forwardRef<HeaderBarType, HeaderBarProps>(({
  onSourceChange,
  onTipSearch,
  onSearch,
  onHideTipList,
  onShowTipList,
}, ref) => {
  const { colors, tokens } = useDesignTokens()
  const t = useI18n()
  const inputRef = useRef<TextInput>(null)
  const sourceSelectorRef = useRef<SourceSelectorType>(null)
  const [text, setText] = useState('')

  useImperativeHandle(ref, () => ({
    setSourceList(list, active) {
      sourceSelectorRef.current?.setSourceList(list, active)
    },
    setText(value) {
      setText(value)
    },
    blur() {
      inputRef.current?.blur()
    },
  }), [])

  const handleChange = useCallback((value: string) => {
    setText(value)
    onTipSearch(value.trim())
  }, [onTipSearch])

  const handleSubmit = useCallback(() => {
    onSearch(text.trim())
  }, [onSearch, text])

  const handleClear = useCallback(() => {
    setText('')
    onTipSearch('')
    onSearch('')
  }, [onSearch, onTipSearch])

  const sourceChipStyle: StyleProp<ViewStyle> = {
    height: 36,
    paddingHorizontal: tokens.spacing.sm,
    borderRadius: tokens.radius.pill,
    backgroundColor: colors['c-primary-light-200-alpha-700'],
    justifyContent: 'center',
    flexGrow: 0,
    flexShrink: 0,
    minWidth: 60,
  }

  return (
    <Surface
      variant="solid"
      radius="none"
      elevation="none"
      backgroundColor={colors['c-content-background']}
      style={{ zIndex: 2 }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: tokens.spacing.md,
          paddingVertical: tokens.spacing.sm,
          gap: tokens.spacing.sm,
        }}
      >
        <View style={sourceChipStyle}>
          <SourceSelector
            ref={sourceSelectorRef}
            onSourceChange={onSourceChange}
            center
            fontSize={13}
          />
        </View>

        <View
          style={{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            height: 36,
            paddingLeft: tokens.spacing.md,
            paddingRight: tokens.spacing.xs,
            borderRadius: tokens.radius.pill,
            backgroundColor: colors['c-primary-input-background'],
          }}
        >
          <Icon name="search-2" color={colors['c-font-label']} size={14} />
          <TextInput
            ref={inputRef}
            value={text}
            placeholder={t('search_input_placeholder')}
            placeholderTextColor={colors['c-primary-dark-100-alpha-600']}
            selectionColor={colors['c-primary-light-100-alpha-300']}
            autoCapitalize="none"
            autoComplete="off"
            returnKeyType="search"
            onChangeText={handleChange}
            onTouchStart={onShowTipList}
            onBlur={onHideTipList}
            onSubmitEditing={handleSubmit}
            style={{
              flex: 1,
              marginLeft: tokens.spacing.xs,
              paddingVertical: 0,
              color: colors['c-font'],
              fontSize: setSpText(14),
            }}
          />
          {text.length > 0
            ? (
                <IconButton
                  name="remove"
                  size={11}
                  hitSize={28}
                  radius="pill"
                  onPress={handleClear}
                  accessibilityLabel="clear"
                />
              )
            : null}
        </View>
      </View>
    </Surface>
  )
})
