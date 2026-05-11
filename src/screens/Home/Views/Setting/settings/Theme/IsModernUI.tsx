import { memo } from 'react'
import { View } from 'react-native'

import CheckBoxItem from '../../components/CheckBoxItem'
import { createStyle } from '@/utils/tools'
import { useI18n } from '@/lang'
import { updateSetting } from '@/core/common'
import { useSettingValue } from '@/store/setting/hook'

export default memo(() => {
  const t = useI18n()
  const isModernUI = useSettingValue('theme.useModernUI')
  const setIsModernUI = (value: boolean) => {
    updateSetting({ 'theme.useModernUI': value })
  }

  return (
    <View style={styles.content}>
      <CheckBoxItem check={isModernUI} label={t('setting_basic_theme_modern_ui')} onChange={setIsModernUI} />
    </View>
  )
})

const styles = createStyle({
  content: {
    marginTop: 5,
    marginBottom: 15,
  },
})
