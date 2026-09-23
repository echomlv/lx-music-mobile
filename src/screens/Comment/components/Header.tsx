import { memo } from 'react'
import { View, TouchableOpacity } from 'react-native'

import { Icon } from '@/components/common/Icon'
import { pop } from '@/navigation'
// import { AppColors } from '@/theme'
import StatusBar from '@/components/common/StatusBar'
import { useI18n } from '@/lang'
import { createStyle } from '@/utils/tools'
import Text from '@/components/common/Text'
import { HEADER_HEIGHT as _HEADER_HEIGHT } from '@/config/constant'
import { scaleSizeH } from '@/utils/pixelRatio'
import commonState from '@/store/common/state'
import { useStatusbarHeight } from '@/store/common/hook'
import { useSettingValue } from '@/store/setting/hook'
import { useDesignTokens } from '@/theme/v2'
import { Surface, Typography, V2Pressable } from '@/components/v2/atoms'

const HEADER_HEIGHT = scaleSizeH(_HEADER_HEIGHT)

export default memo(({ musicInfo }: {
  musicInfo: LX.Music.MusicInfo
}) => {
  const t = useI18n()
  const statusBarHeight = useStatusbarHeight()
  const useModernUI = useSettingValue('theme.useModernUI')
  const { tokens, semanticColors } = useDesignTokens()

  const back = () => {
    void pop(commonState.componentIds.comment!)
  }

  const content = (
    <View style={{ ...styles.container }}>
      {useModernUI
        ? (
            <V2Pressable onPress={back} style={{ ...styles.button, width: HEADER_HEIGHT }} accessibilityRole="button">
              <Icon name="chevron-left" size={18} />
            </V2Pressable>
          )
        : (
            <TouchableOpacity onPress={back} style={{ ...styles.button, width: HEADER_HEIGHT }}>
              <Icon name="chevron-left" size={18} />
            </TouchableOpacity>
          )}
      {useModernUI
        ? <Typography variant="body" weight="600" numberOfLines={1} style={styles.title}>{t('comment_title', { name: musicInfo.name, singer: musicInfo.singer })}</Typography>
        : <Text numberOfLines={1} size={16} style={styles.title}>{t('comment_title', { name: musicInfo.name, singer: musicInfo.singer })}</Text>}
    </View>
  )

  return (
    <View style={{ height: HEADER_HEIGHT + statusBarHeight, paddingTop: statusBarHeight }}>
      <StatusBar />
      {useModernUI
        ? (
            <Surface
              variant="blur"
              radius="none"
              elevation="none"
              style={{ flex: 1, paddingHorizontal: tokens.spacing.xs, borderBottomWidth: 1, borderBottomColor: semanticColors.border }}
            >
              {content}
            </Surface>
          )
        : content}
    </View>
  )
})


const styles = createStyle({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    height: '100%',
    paddingRight: 40,
    // backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  button: {
    // paddingLeft: 10,
    // paddingRight: 10,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    flex: 1,
    textAlign: 'center',
  },
  icon: {
    paddingLeft: 4,
    paddingRight: 4,
  },
})
