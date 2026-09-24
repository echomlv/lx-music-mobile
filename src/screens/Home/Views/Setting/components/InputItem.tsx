import { memo, useState, useEffect, useRef } from 'react'

import { StyleSheet, View, Keyboard } from 'react-native'
import type { InputType, InputProps } from '@/components/common/Input'
import Input from '@/components/common/Input'
import { useTheme } from '@/store/theme/hook'
import Text from '@/components/common/Text'
import { useSettingValue } from '@/store/setting/hook'
import { useDesignTokens } from '@/theme/v2'
import { Typography } from '@/components/v2/atoms'


export interface InputItemProps extends InputProps {
  value: string
  label: string
  onChanged: (text: string, callback: (vlaue: string) => void) => void
}

export default memo(({ value, label, onChanged, ...props }: InputItemProps) => {
  const [text, setText] = useState(value)
  const textRef = useRef(value)
  const isMountRef = useRef(false)
  const inputRef = useRef<InputType>(null)
  const theme = useTheme()
  const useModernUI = useSettingValue('theme.useModernUI')
  const { tokens } = useDesignTokens()
  const saveValue = () => {
    onChanged?.(text, (value: string) => {
      if (!isMountRef.current) return
      const newValue = String(value)
      setText(newValue)
      textRef.current = newValue
    })
  }
  useEffect(() => {
    isMountRef.current = true
    return () => {
      isMountRef.current = false
    }
  }, [])
  useEffect(() => {
    const handleKeyboardDidHide = () => {
      if (!inputRef.current?.isFocused()) return
      onChanged?.(textRef.current, value => {
        if (!isMountRef.current) return
        const newValue = String(value)
        setText(newValue)
        textRef.current = newValue
      })
    }
    const keyboardDidHide = Keyboard.addListener('keyboardDidHide', handleKeyboardDidHide)

    return () => {
      keyboardDidHide.remove()
    }
  }, [onChanged])
  useEffect(() => {
    if (value != text) {
      const newValue = String(value)
      setText(newValue)
      textRef.current = newValue
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])
  const handleSetSelectMode = (text: string) => {
    setText(text)
    textRef.current = text
  }
  if (useModernUI) {
    // 与 SettingRow 对齐;背景和圆角由 Input 的现代样式提供,这里只让输入框占满整行
    return (
      <View style={{ paddingHorizontal: tokens.spacing.md, paddingVertical: tokens.spacing.sm }}>
        <Typography variant="body" weight="500" style={{ marginBottom: tokens.spacing.xs }}>{label}</Typography>
        <Input
          value={text}
          ref={inputRef}
          onChangeText={handleSetSelectMode}
          style={styles.inputModern}
          {...props}
          onBlur={saveValue}
        />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label} size={14}>{label}</Text>
      <Input
        value={text}
        ref={inputRef}
        onChangeText={handleSetSelectMode}
        style={{ ...styles.input, backgroundColor: theme['c-primary-input-background'] }}
        {...props}
        onBlur={saveValue}
       />
    </View>
  )
})

const styles = StyleSheet.create({
  container: {
    paddingLeft: 25,
    marginBottom: 15,
  },
  label: {
    marginBottom: 2,
  },
  input: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    flexGrow: 1,
    flexShrink: 1,
    borderRadius: 4,
    // paddingTop: 3,
    // paddingBottom: 3,
    maxWidth: 300,
  },
  inputModern: {
    flexGrow: 1,
    flexShrink: 1,
  },
})
