import { memo, useCallback, useMemo, useState } from 'react'
import { View } from 'react-native'
import Button from '@/components/common/Button'

import { createStyle, toast } from '@/utils/tools'
import { pop } from '@/navigation'
import { useTheme } from '@/store/theme/hook'
import { useSettingValue } from '@/store/setting/hook'
import { useDesignTokens } from '@/theme/v2'
import commonState from '@/store/common/state'
import Text from '@/components/common/Text'
import { findCollectedList, handleCollect, handlePlay } from './listAction'
import songlistState from '@/store/songlist/state'
import { useI18n } from '@/lang'
import { useListInfo } from './state'
import { PillButton } from '@/components/v2/atoms'
import { Icon } from '@/components/common/Icon'
import { useMyList } from '@/store/list/hook'

const useCollect = () => {
  const info = useListInfo()
  const lists = useMyList()
  const [collecting, setCollecting] = useState(false)
  const collected = useMemo(() => !!findCollectedList(lists, info.id, info.source), [lists, info.id, info.source])

  const collect = useCallback(() => {
    if (collecting || !songlistState.listDetailInfo.info.name) return
    // 已收藏时 handleCollect 只弹确认框并在后台同步,不进入「收藏中」状态
    if (!collected) setCollecting(true)
    handleCollect(info.id, info.source, songlistState.listDetailInfo.info.name || info.name).catch((err) => {
      console.log(err)
      toast(global.i18n.t('collect_failed'))
    }).finally(() => {
      setCollecting(false)
    })
  }, [collecting, collected, info.id, info.source, info.name])

  const labelKey = collecting
    ? 'collect_songlist_collecting'
    : collected ? 'collect_songlist_collected' : 'collect_songlist'

  return { collected, collecting, collect, labelKey } as const
}

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

  const { collected, collecting, collect, labelKey } = useCollect()

  return (
    <View style={styles.container}>
      <Button onPress={collect} disabled={collecting} style={styles.controlBtn}>
        <Text style={{ ...styles.controlBtnText, color: theme['c-button-font'] }}>
          {collected && !collecting ? <Icon name="love-fill" size={12} color={theme['c-button-font']} /> : null}
          {collected && !collecting ? ' ' : null}
          {t(labelKey)}
        </Text>
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

const ActionBarV2 = ({ compact = false }: { compact?: boolean }) => {
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
  const { collected, collecting, collect, labelKey } = useCollect()

  const playAllBtn = (
    <PillButton
      fullWidth
      variant="primary"
      size="sm"
      label={t('play_all')}
      leading={<Icon name="play" size={12} color={colors['c-primary-light-1000']} />}
      onPress={handlePlayAll}
      style={{ flex: 1 }}
    />
  )
  const collectBtn = (
    <PillButton
      fullWidth
      variant="secondary"
      size="sm"
      label={t(labelKey)}
      leading={<Icon name={collected && !collecting ? 'love-fill' : 'love'} size={12} color={colors['c-primary']} />}
      onPress={collect}
      disabled={collecting}
      style={{ flex: 1 }}
    />
  )
  const backBtn = (
    <PillButton
      fullWidth
      variant="ghost"
      size="sm"
      label={t('back')}
      leading={<Icon name="chevron-left" size={12} color={colors['c-font']} />}
      onPress={back}
      style={{ flex: 1 }}
    />
  )

  // 横屏侧栏较窄:播放全部独占一行,收藏与返回并排一行
  if (compact) {
    return (
      <View style={{ gap: tokens.spacing.sm }}>
        <View style={{ flexDirection: 'row' }}>{playAllBtn}</View>
        <View style={{ flexDirection: 'row', gap: tokens.spacing.sm }}>
          {collectBtn}
          {backBtn}
        </View>
      </View>
    )
  }

  return (
    <View style={{
      flexDirection: 'row',
      paddingHorizontal: tokens.spacing.lg,
      gap: tokens.spacing.sm,
    }}>
      {playAllBtn}
      {collectBtn}
      {backBtn}
    </View>
  )
}

export default memo(({ compact }: { compact?: boolean }) => {
  const useModernUI = useSettingValue('theme.useModernUI')
  return useModernUI ? <ActionBarV2 compact={compact} /> : <ActionBarV1 />
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
