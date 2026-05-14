import { StyleSheet, TouchableOpacity, View } from 'react-native'
import { Icon } from '@/components/common/Icon'
import { useTheme } from '@/store/theme/hook'
import { useSettingValue } from '@/store/setting/hook'
import { playNext, playPrev, togglePlay } from '@/core/player/player'
import { useIsPlay } from '@/store/player/hook'
import { useLayout } from '@/utils/hooks'
import { marginLeft } from '../constant'
import { BTN_WIDTH } from '../MoreBtn/Btn'
import { markTimeoutExitInteraction } from '@/core/player/timeoutExit'
import { V2Pressable } from '@/components/v2/atoms'

const Btn = ({ size, onPress, children }: {
  size: number
  onPress: () => void
  children: React.ReactNode
}) => {
  const useModernUI = useSettingValue('theme.useModernUI')
  if (useModernUI) {
    return (
      <V2Pressable
        onPress={onPress}
        pressScale={0.9}
        pressOverlay={0.08}
        style={{ ...styles.cotrolBtn, width: size, height: size }}
      >
        {children}
      </V2Pressable>
    )
  }
  return (
    <TouchableOpacity style={{ ...styles.cotrolBtn, width: size, height: size }} activeOpacity={0.5} onPress={onPress}>
      {children}
    </TouchableOpacity>
  )
}

const PrevBtn = ({ size }: { size: number }) => {
  const theme = useTheme()
  const handlePlayPrev = () => {
    markTimeoutExitInteraction()
    void playPrev()
  }
  return (
    <Btn size={size} onPress={handlePlayPrev}>
      <Icon name='prevMusic' color={theme['c-button-font']} rawSize={size * 0.7} />
    </Btn>
  )
}
const NextBtn = ({ size }: { size: number }) => {
  const theme = useTheme()
  const handlePlayNext = () => {
    markTimeoutExitInteraction()
    void playNext()
  }
  return (
    <Btn size={size} onPress={handlePlayNext}>
      <Icon name='nextMusic' color={theme['c-button-font']} rawSize={size * 0.7} />
    </Btn>
  )
}

const TogglePlayBtn = ({ size }: { size: number }) => {
  const theme = useTheme()
  const isPlay = useIsPlay()
  return (
    <Btn size={size} onPress={() => {
      markTimeoutExitInteraction()
      togglePlay()
    }}>
      <Icon name={isPlay ? 'pause' : 'play'} color={theme['c-button-font']} rawSize={size * 0.7} />
    </Btn>
  )
}

const MIN_SIZE = BTN_WIDTH * 1.1
export default () => {
  const { onLayout, height, width } = useLayout()
  const size = Math.max(Math.min(height * 0.65, (width - marginLeft) * 0.52 * 0.3) * global.lx.fontSize, MIN_SIZE)
  return (
    <View style={{ ...styles.content, gap: size * 0.5 }} onLayout={onLayout}>
      <PrevBtn size={size} />
      <TogglePlayBtn size={size}/>
      <NextBtn size={size} />
    </View>
  )
}


const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    flexShrink: 1,
    flexDirection: 'row',
    // paddingVertical: 8,
    gap: 22,
    // backgroundColor: 'rgba(0,0,0,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cotrolBtn: {
    justifyContent: 'center',
    alignItems: 'center',

    // backgroundColor: '#ccc',
    // marginLeft: 10,
  },
})
