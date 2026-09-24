import { memo, useMemo } from 'react'

import { StyleSheet, View } from 'react-native'

import SubTitle from '../../components/SubTitle'
import CheckBox from '@/components/common/CheckBox'
import { useSettingValue } from '@/store/setting/hook'
import { updateSetting } from '@/core/common'
import { useI18n } from '@/lang'
import { TRY_QUALITYS_LIST } from '@/core/music/utils'

// 仅用于显示,保存的设置值仍是原始 quality id
const QUALITY_LABELS: Partial<Record<LX.Quality, string>> = {
  '128k': '128K',
  '320k': '320K',
  flac: 'FLAC',
  flac24bit: 'FLAC24',
}

const useActive = (id: LX.Quality) => {
  const q = useSettingValue('player.playQuality')
  const isActive = useMemo(() => q == id, [q, id])
  return isActive
}

const Item = ({ id, name }: {
  id: LX.Quality
  name: string
}) => {
  const isActive = useActive(id)
  // const [toggleCheckBox, setToggleCheckBox] = useState(false)
  return <CheckBox marginRight={8} check={isActive} label={name} onChange={() => { updateSetting({ 'player.playQuality': id }) }} need />
}

export default memo(() => {
  const t = useI18n()
  const useModernUI = useSettingValue('theme.useModernUI')
  const playQualityList = useMemo(() => {
    return [...TRY_QUALITYS_LIST, '128k'].reverse() as LX.Quality[]
  }, [])

  return (
    <SubTitle title={t('setting_play_play_quality')}>
      <View style={styles.list}>
        {
          playQualityList.map((q) => {
            const item = <Item name={QUALITY_LABELS[q] ?? q} id={q} key={q} />
            // 现代 UI 下每项占半行,四个音质整齐排成两行两列
            return useModernUI ? <View style={styles.itemModern} key={q}>{item}</View> : item
          })
        }
      </View>
    </SubTitle>
  )
})

const styles = StyleSheet.create({
  list: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  itemModern: {
    width: '50%',
    marginBottom: 8,
  },
})


// export default memo(() => {
//   const t = useI18n()
//   const isPlayHighQuality = useSettingValue('player.isPlayHighQuality')
//   const setPlayHighQuality = (isPlayHighQuality: boolean) => {
//     updateSetting({ 'player.isPlayHighQuality': isPlayHighQuality })
//   }

//   return (
//     <View style={styles.content}>
//       <CheckBoxItem check={isPlayHighQuality} onChange={setPlayHighQuality} label={t('setting_play_quality')} />
//     </View>
//   )
// })


// const styles = createStyle({
//   content: {
//     marginTop: 5,
//   },
// })

