import { memo, useRef } from 'react'

import { View, StyleSheet } from 'react-native'

import { pop } from '@/navigation'
import StatusBar from '@/components/common/StatusBar'
import { useTheme } from '@/store/theme/hook'
import { usePlayerMusicInfo } from '@/store/player/hook'
import Text from '@/components/common/Text'
import { scaleSizeH } from '@/utils/pixelRatio'
import { HEADER_HEIGHT as _HEADER_HEIGHT, NAV_SHEAR_NATIVE_IDS } from '@/config/constant'
import commonState from '@/store/common/state'
import SettingPopup, { type SettingPopupType } from '../../components/SettingPopup'
import SoundEffectPopup, { type SoundEffectPopupType } from '../../components/SoundEffectPopup'
import { useStatusbarHeight } from '@/store/common/hook'
import { useSetting, useSettingValue } from '@/store/setting/hook'
import { isSoundEffectActive } from '@/plugins/player/soundEffect'
import Btn from './Btn'
import TimeoutExitBtn from './TimeoutExitBtn'
import { useDesignTokens } from '@/theme/v2'
import { Typography } from '@/components/v2/atoms'

export const HEADER_HEIGHT = scaleSizeH(_HEADER_HEIGHT)


const Title = () => {
  const theme = useTheme()
  const musicInfo = usePlayerMusicInfo()


  return (
    <View style={styles.titleContent}>
      <Text numberOfLines={1} style={styles.title}>{musicInfo.name}</Text>
      <Text numberOfLines={1} style={styles.title} size={12} color={theme['c-font-label']}>{musicInfo.singer}</Text>
    </View>
  )
}

const TitleV2 = () => {
  const { semanticColors } = useDesignTokens()
  const musicInfo = usePlayerMusicInfo()

  return (
    <View style={styles.titleContent}>
      <Typography variant="body" weight="600" numberOfLines={1}>{musicInfo.name}</Typography>
      <Typography variant="caption" color={semanticColors.textSecondary} numberOfLines={1}>{musicInfo.singer}</Typography>
    </View>
  )
}

export default memo(() => {
  const popupRef = useRef<SettingPopupType>(null)
  const soundEffectPopupRef = useRef<SoundEffectPopupType>(null)
  const statusBarHeight = useStatusbarHeight()
  const theme = useTheme()
  const setting = useSetting()
  const useModernUI = useSettingValue('theme.useModernUI')
  const { tokens } = useDesignTokens()

  const back = () => {
    void pop(commonState.componentIds.playDetail!)
  }
  const showSetting = () => {
    popupRef.current?.show()
  }
  const showSoundEffect = () => {
    soundEffectPopupRef.current?.show()
  }

  const content = (
    <View style={styles.container}>
      <Btn icon="chevron-left" onPress={back} />
      {useModernUI ? <TitleV2 /> : <Title />}
      <TimeoutExitBtn />
      <Btn icon="slider" color={isSoundEffectActive(setting) ? theme['c-primary-font-active'] : undefined} onPress={showSoundEffect} />
      <Btn icon="setting" size={16} onPress={showSetting} />
    </View>
  )

  return (
    <View style={{ height: HEADER_HEIGHT + statusBarHeight, paddingTop: statusBarHeight }} nativeID={NAV_SHEAR_NATIVE_IDS.playDetail_header}>
      <StatusBar />
      {/* 与横屏一致:顶栏不加底色和分隔线,直接叠在沉浸背景上 */}
      {useModernUI
        ? <View style={{ flex: 1, paddingHorizontal: tokens.spacing.xs }}>{content}</View>
        : content}
      <SoundEffectPopup ref={soundEffectPopupRef} layoutMode="stacked" />
      <SettingPopup ref={popupRef} direction="vertical" />
    </View>
  )
})


const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    // justifyContent: 'center',
    height: '100%',
  },
  titleContent: {
    flex: 1,
    paddingHorizontal: 5,
    // alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    // flex: 1,
    // textAlign: 'center',
  },
  icon: {
    paddingLeft: 4,
    paddingRight: 4,
  },
})
