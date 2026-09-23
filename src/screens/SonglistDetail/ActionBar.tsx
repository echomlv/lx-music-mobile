import { memo } from 'react'
import { View } from 'react-native'
import Button from '@/components/common/Button'

import { createStyle } from '@/utils/tools'
import { pop } from '@/navigation'
import { useTheme } from '@/store/theme/hook'
import { useSettingValue } from '@/store/setting/hook'
import { useDesignTokens } from '@/theme/v2'
import commonState from '@/store/common/state'
import Text from '@/components/common/Text'
import { handleCollect, handlePlay } from './listAction'
import songlistState from '@/store/songlist/state'
import { useI18n } from '@/lang'
import { useListInfo } from './state'
import { PillButton } from '@/components/v2/atoms'
import { Icon } from '@/components/common/Icon'

const ActionBarV1 = () => {
  const theme = useTheme()
  const t = useI18n()
  const info = useListInfo()

  const back = () => {
    void pop(commonState.componentIds.songlistDetail!)
  }

  const handlePlayAll = () => {
    if (!songlistState.listDetailInfo.info.name) return
    void handlePlay(info.id, info.source, songlistState.listDetailInfo.list)
  }

  const handleCollection = () => {
    if (!songlistState.listDetailInfo.info.name) return
    void handleCollect(info.id, info.source, songlistState.listDetailInfo.info.name || info.name)
  }

  return (
    <View style={styles.container}>
      <Button onPress={handleCollection} style={styles.controlBtn}>
        <Text style={{ ...styles.controlBtnText, color: theme['c-button-font'] }}>{t('collect_songlist')}</Text>
      </Button>
      <Button onPress={handlePlayAll} style={styles.controlBtn}>
        <Text style={{ ...styles.controlBtnText, color: theme['c-button-font'] }}>{t('play_all')}</Text>
      </Button>
      <Button onPress={back} style={styles.controlBtn}>
        <Text style={{ ...styles.controlBtnText, color: theme['c-button-font'] }}>{t('back')}</Text>
      </Button>
    </View>
  )
}

const ActionBarV2 = () => {
  const { colors, tokens } = useDesignTokens()
  const t = useI18n()
  const info = useListInfo()

  const back = () => {
    void pop(commonState.componentIds.songlistDetail!)
  }
  const handlePlayAll = () => {
    if (!songlistState.listDetailInfo.info.name) return
    void handlePlay(info.id, info.source, songlistState.listDetailInfo.list)
  }
  const handleCollection = () => {
    if (!songlistState.listDetailInfo.info.name) return
    void handleCollect(info.id, info.source, songlistState.listDetailInfo.info.name || info.name)
  }

  return (
    <View style={{
      flexDirection: 'row',
      paddingHorizontal: tokens.spacing.lg,
      gap: tokens.spacing.sm,
    }}>
      <PillButton
        fullWidth
        variant="primary"
        size="sm"
        label={t('play_all')}
        leading={<Icon name="play" size={12} color={colors['c-primary-light-1000']} />}
        onPress={handlePlayAll}
        style={{ flex: 1 }}
      />
      <PillButton
        fullWidth
        variant="secondary"
        size="sm"
        label={t('collect_songlist')}
        leading={<Icon name="love" size={12} color={colors['c-primary']} />}
        onPress={handleCollection}
        style={{ flex: 1 }}
      />
      <PillButton
        fullWidth
        variant="ghost"
        size="sm"
        label={t('back')}
        leading={<Icon name="chevron-left" size={12} color={colors['c-font']} />}
        onPress={back}
        style={{ flex: 1 }}
      />
    </View>
  )
}

export default memo(() => {
  const useModernUI = useSettingValue('theme.useModernUI')
  return useModernUI ? <ActionBarV2 /> : <ActionBarV1 />
})

const styles = createStyle({
  container: {
    flexDirection: 'row',
    width: '100%',
    flexGrow: 0,
    flexShrink: 0,
  },
  controlBtn: {
    flexGrow: 1,
    flexShrink: 1,
    width: '33%',
    paddingTop: 12,
    paddingBottom: 12,
    paddingLeft: 10,
    paddingRight: 10,
  },
  controlBtnText: {
    fontSize: 13,
    textAlign: 'center',
  },
})
