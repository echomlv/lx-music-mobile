import { memo } from 'react'

import { View } from 'react-native'

import CheckBox, { type CheckBoxProps } from '@/components/common/CheckBox'
import { createStyle } from '@/utils/tools'
import { useSettingValue } from '@/store/setting/hook'
import { SettingRow } from '@/components/v2/molecules'


export default memo((props: CheckBoxProps) => {
  const useModernUI = useSettingValue('theme.useModernUI')

  if (useModernUI) {
    const canToggle = !props.disabled && !(props.need && props.check)
    return (
      <SettingRow
        label={props.label ?? ''}
        description={props.helpDesc}
        onPress={canToggle ? () => { props.onChange(!props.check) } : undefined}
        disabled={props.disabled}
        control={(
          <CheckBox
            {...props}
            label={undefined}
          />
        )}
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
