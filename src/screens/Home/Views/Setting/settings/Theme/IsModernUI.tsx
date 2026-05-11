import { memo, useState } from 'react'
import { Modal, View } from 'react-native'

import CheckBoxItem from '../../components/CheckBoxItem'
import { createStyle } from '@/utils/tools'
import { useI18n } from '@/lang'
import { updateSetting } from '@/core/common'
import { useSettingValue } from '@/store/setting/hook'
import { PillButton } from '@/components/v2/atoms'
import { V2Showcase } from '@/components/v2/organisms/V2Showcase'

export default memo(() => {
  const t = useI18n()
  const isModernUI = useSettingValue('theme.useModernUI')
  const [previewVisible, setPreviewVisible] = useState(false)

  const setIsModernUI = (value: boolean) => {
    updateSetting({ 'theme.useModernUI': value })
  }

  return (
    <View style={styles.content}>
      <CheckBoxItem
        check={isModernUI}
        label={t('setting_basic_theme_modern_ui')}
        onChange={setIsModernUI}
      />
      {isModernUI
        ? (
            <View style={styles.previewWrap}>
              <PillButton
                label={t('setting_basic_theme_modern_ui_preview')}
                variant="secondary"
                size="sm"
                onPress={() => { setPreviewVisible(true) }}
              />
            </View>
          )
        : null}
      <Modal
        visible={previewVisible}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => { setPreviewVisible(false) }}
      >
        <V2Showcase onClose={() => { setPreviewVisible(false) }} />
      </Modal>
    </View>
  )
})

const styles = createStyle({
  content: {
    marginTop: 5,
    marginBottom: 15,
  },
  previewWrap: {
    marginTop: 8,
    paddingLeft: 26,
  },
})
