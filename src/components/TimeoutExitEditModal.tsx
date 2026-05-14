import { useRef, useImperativeHandle, forwardRef, useState, useEffect } from 'react'
import { View } from 'react-native'

import ConfirmAlert, { type ConfirmAlertType } from '@/components/common/ConfirmAlert'
import Input, { type InputType } from '@/components/common/Input'
import { createStyle, toast } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
import { useDesignTokens } from '@/theme/v2'
import { Typography, V2Pressable } from '@/components/v2/atoms'
import {
  cancelTimeoutExit,
  getTimeoutExitTime,
  onTimeUpdate,
  startTimeoutExit,
  stopTimeoutExit,
  useTimeoutExitTimeInfo,
} from '@/core/player/timeoutExit'
import { useI18n } from '@/lang'
import CheckBox from './common/CheckBox'
import { useSettingValue } from '@/store/setting/hook'
import { updateSetting } from '@/core/common'
import settingState from '@/store/setting/state'

const MAX_MIN = 1440
const rxp = /([1-9]\d*)/

const PRESETS = [30, 45, 60] as const
type PresetMinutes = typeof PRESETS[number]
type Selection = PresetMinutes | 'custom'

const formatTime = (time: number) => {
  let h = Math.trunc(time / 3600)
  let hStr = h ? h.toString() + ':' : ''
  time = time % 3600
  const m = Math.trunc(time / 60).toString().padStart(2, '0')
  const s = Math.trunc(time % 60).toString().padStart(2, '0')
  return `${hStr}${m}:${s}`
}

const resolveSelectionFromSetting = (raw: string): Selection => {
  const n = parseInt(raw)
  if (!Number.isFinite(n) || n <= 0) return PRESETS[0]
  return (PRESETS as readonly number[]).includes(n) ? (n as PresetMinutes) : 'custom'
}

const Status = () => {
  const { colors } = useDesignTokens()
  const t = useI18n()
  const exitTimeInfo = useTimeoutExitTimeInfo()
  const statusText = exitTimeInfo.time < 0
    ? t('timeout_exit_tip_off')
    : t('timeout_exit_tip_on', { time: formatTime(exitTimeInfo.time) })
  return (
    <View style={styles.statusBlock}>
      <Typography variant="body" weight="600">{statusText}</Typography>
      {exitTimeInfo.isPlayedStop
        ? (
            <Typography variant="caption" color={colors['c-font-label']} style={{ marginTop: 2 }}>
              {t('timeout_exit_btn_wait_tip')}
            </Typography>
          )
        : null}
    </View>
  )
}

const Chip = ({ active, label, onPress }: {
  active: boolean
  label: string
  onPress: () => void
}) => {
  const { colors, tokens } = useDesignTokens()
  return (
    <V2Pressable
      onPress={onPress}
      style={{
        paddingHorizontal: tokens.spacing.md,
        paddingVertical: tokens.spacing.xs + 2,
        borderRadius: tokens.radius.pill,
        borderWidth: 1,
        borderColor: active ? colors['c-primary'] : colors['c-border-background'],
        backgroundColor: active ? colors['c-primary-light-200-alpha-700'] : 'transparent',
      }}
    >
      <Typography
        variant="label"
        weight={active ? '600' : '500'}
        color={active ? colors['c-primary'] : undefined}
      >
        {label}
      </Typography>
    </V2Pressable>
  )
}

const PresetRow = ({ selection, onSelect }: {
  selection: Selection
  onSelect: (s: Selection) => void
}) => {
  const t = useI18n()
  const { tokens } = useDesignTokens()
  return (
    <View style={[styles.chipsRow, { gap: tokens.spacing.sm }]}>
      {PRESETS.map(m => (
        <Chip
          key={m}
          active={selection === m}
          label={t('timeout_exit_option_minutes', { minutes: m })}
          onPress={() => { onSelect(m) }}
        />
      ))}
      <Chip
        active={selection === 'custom'}
        label={t('timeout_exit_option_custom')}
        onPress={() => { onSelect('custom') }}
      />
    </View>
  )
}

interface TimeInputType {
  setText: (text: string) => void
  getText: () => string
  focus: () => void
}

const TimeInput = forwardRef<TimeInputType, { onChange?: (text: string) => void }>(({ onChange }, ref) => {
  const theme = useTheme()
  const [text, setText] = useState('')
  const inputRef = useRef<InputType>(null)
  const t = useI18n()

  useImperativeHandle(ref, () => ({
    getText() {
      return text.trim()
    },
    setText(value) {
      setText(value)
    },
    focus() {
      inputRef.current?.focus()
    },
  }))

  const handleChange = (value: string) => {
    setText(value)
    onChange?.(value)
  }

  return (
    <Input
      ref={inputRef}
      placeholder={t('timeout_exit_input_tip')}
      value={text}
      onChangeText={handleChange}
      keyboardType="number-pad"
      style={{ ...styles.input, backgroundColor: theme['c-primary-input-background'] }}
    />
  )
})

const PlayedSetting = () => {
  const t = useI18n()
  const timeoutExitPlayed = useSettingValue('player.timeoutExitPlayed')
  const onCheckChange = (check: boolean) => {
    updateSetting({ 'player.timeoutExitPlayed': check })
  }

  return (
    <View style={styles.checkbox}>
      <CheckBox check={timeoutExitPlayed} label={t('timeout_exit_label_isPlayed')} onChange={onCheckChange} />
    </View>
  )
}

export const useTimeInfo = () => {
  const [exitTimeInfo, setExitTimeInfo] = useState<{
    cancelText: string
    confirmText: string
    isPlayedStop: boolean
    active: boolean
    mode: 'off' | 'timer'
  }>({
    cancelText: '',
    confirmText: '',
    isPlayedStop: false,
    active: false,
    mode: 'off' as const,
  })
  const t = useI18n()

  useEffect(() => {
    let active: boolean | null = null
    const remove = onTimeUpdate(({ time, isPlayedStop, mode, active: isActive }) => {
      if (!isActive) {
        if (active) {
          setExitTimeInfo({
            cancelText: '',
            confirmText: '',
            isPlayedStop,
            active: false,
            mode,
          })
          active = false
        }
      } else {
        const cancelText = isPlayedStop
          ? t('timeout_exit_btn_wait_cancel')
          : mode == 'timer'
            ? t('timeout_exit_btn_cancel')
            : ''
        const confirmText = mode == 'timer' ? t('timeout_exit_btn_update') : ''
        setExitTimeInfo({
          cancelText,
          confirmText,
          isPlayedStop,
          active: true,
          mode,
        })
        active = true
      }
    })

    return () => {
      remove()
    }
  }, [t])

  return exitTimeInfo
}

export interface TimeoutExitEditModalType {
  show: () => void
}

interface TimeoutExitEditModalProps {
  timeInfo: ReturnType<typeof useTimeInfo>
}

export default forwardRef<TimeoutExitEditModalType, TimeoutExitEditModalProps>(({ timeInfo }, ref) => {
  const alertRef = useRef<ConfirmAlertType>(null)
  const timeInputRef = useRef<TimeInputType>(null)
  const [visible, setVisible] = useState(false)
  const [selection, setSelection] = useState<Selection>(PRESETS[0])
  const { tokens } = useDesignTokens()
  const t = useI18n()

  const handleShow = () => {
    alertRef.current?.setVisible(true)
    requestAnimationFrame(() => {
      const saved = settingState.setting['player.timeoutExit']
      const next = resolveSelectionFromSetting(saved)
      setSelection(next)
      if (next === 'custom') timeInputRef.current?.setText(saved)
      else timeInputRef.current?.setText('')
    })
  }

  useImperativeHandle(ref, () => ({
    show() {
      if (visible) handleShow()
      else {
        setVisible(true)
        requestAnimationFrame(() => {
          handleShow()
        })
      }
    },
  }))

  const handleCancel = () => {
    if (timeInfo.isPlayedStop) {
      cancelTimeoutExit()
      return
    }
    if (!timeInfo.active) return
    stopTimeoutExit()
    toast(t('timeout_exit_tip_cancel'))
  }

  const handleSelect = (next: Selection) => {
    setSelection(next)
    if (next === 'custom') {
      requestAnimationFrame(() => { timeInputRef.current?.focus() })
    }
  }

  const resolveMinutes = (): number | null => {
    if (selection !== 'custom') return selection
    let raw = timeInputRef.current?.getText() ?? ''
    if (!rxp.test(raw)) {
      if (raw.length) toast(t('input_error'))
      return null
    }
    raw = RegExp.$1
    const n = parseInt(raw)
    if (n > MAX_MIN) {
      toast(t('timeout_exit_tip_max', { num: MAX_MIN }))
      return null
    }
    return n
  }

  const handleConfirm = () => {
    const minutes = resolveMinutes()
    if (minutes == null) return
    cancelTimeoutExit()
    startTimeoutExit(minutes * 60)
    toast(t('timeout_exit_tip_on', { time: formatTime(getTimeoutExitTime()) }))
    updateSetting({ 'player.timeoutExit': String(minutes) })
    alertRef.current?.setVisible(false)
  }

  return (
    visible
      ? (
          <ConfirmAlert
            ref={alertRef}
            cancelText={timeInfo.cancelText}
            confirmText={timeInfo.confirmText}
            onCancel={handleCancel}
            onConfirm={handleConfirm}
          >
            <View style={styles.content}>
              <Status />
              <View style={{ marginTop: tokens.spacing.md }}>
                <PresetRow selection={selection} onSelect={handleSelect} />
              </View>
              {selection === 'custom'
                ? (
                    <View style={[styles.inputRow, { marginTop: tokens.spacing.md, gap: tokens.spacing.sm }]}>
                      <TimeInput ref={timeInputRef} />
                      <Typography variant="label">{t('timeout_exit_min')}</Typography>
                    </View>
                  )
                : null}
              <PlayedSetting />
            </View>
          </ConfirmAlert>
        )
      : null
  )
})

const styles = createStyle({
  content: {
    flexShrink: 1,
    flexDirection: 'column',
  },
  statusBlock: {
    marginBottom: 4,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  checkbox: {
    marginTop: 12,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flexGrow: 1,
    flexShrink: 1,
  },
})
