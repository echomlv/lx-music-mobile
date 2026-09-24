import { memo } from 'react'

import { View } from 'react-native'

import CheckBox, { type CheckBoxProps } from '@/components/common/CheckBox'
import { createStyle, tipDialog } from '@/utils/tools'
import { useSettingValue } from '@/store/setting/hook'
import { SettingRow } from '@/components/v2/molecules'


export default memo((props: CheckBoxProps) => {
  const useModernUI = useSettingValue('theme.useModernUI')

  if (useModernUI) {
    // 帮助说明由 SettingRow 显示在标题旁,不传给 CheckBox,避免它在复选框右侧再渲染帮助按钮导致列不对齐
    const { helpTitle, helpDesc, label, ...checkBoxProps } = props
    const canToggle = !props.disabled && !(props.need && props.check)
    const handleShowHelp = helpDesc
      ? () => {
          void tipDialog({
            title: helpTitle ?? label ?? '',
            message: helpDesc,
            btnText: global.i18n.t('understand'),
          })
        }
      : undefined
    return (
      <SettingRow
        label={label ?? ''}
        description={helpDesc}
        onPress={canToggle ? () => { props.onChange(!props.check) } : undefined}
        onHelp={handleShowHelp}
        disabled={props.disabled}
        control={<CheckBox {...checkBoxProps} />}
      />
    )
  }

  return (
    <View style={styles.container}>
      <CheckBox {...props} />
    </View>
  )
})

const styles = createStyle({
  container: {
    paddingLeft: 25,
    // marginTop: -10,
    // marginBottom: 0,
  },
})
