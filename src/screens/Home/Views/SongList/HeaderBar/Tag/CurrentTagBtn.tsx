import Button from '@/components/common/Button'
import Text from '@/components/common/Text'
import { useI18n } from '@/lang'
import { createStyle } from '@/utils/tools'
import { forwardRef, useImperativeHandle, useState } from 'react'


export interface CurrentTagBtnProps {
  onShowList: () => void
}

export interface CurrentTagBtnType {
  setCurrentTagInfo: (name: string) => void
  /** 当前排序不支持分类时置灰并显示为默认 */
  setDisabled: (disabled: boolean) => void
}

export default forwardRef<CurrentTagBtnType, CurrentTagBtnProps>(({ onShowList }, ref) => {
  const t = useI18n()
  const [name, setName] = useState('')
  const [disabled, setDisabled] = useState(false)

  useImperativeHandle(ref, () => ({
    setCurrentTagInfo(name) {
      setName(name)
    },
    setDisabled(disabled) {
      setDisabled(disabled)
    },
  }))

  return (
    <Button style={styles.btn} onPress={onShowList} disabled={disabled}>
      <Text style={styles.sourceMenu}>{disabled || !name ? t('songlist_tag_default') : name}</Text>
    </Button>
  )
})


const styles = createStyle({
  btn: {
    paddingLeft: 15,
    paddingRight: 15,
    justifyContent: 'center',
  },
  sourceMenu: {
    // height: 38,
    // lineHeight: 38,
    textAlign: 'center',
    // minWidth: 70,
    // paddingTop: 10,
    // paddingBottom: 10,
  },
})
