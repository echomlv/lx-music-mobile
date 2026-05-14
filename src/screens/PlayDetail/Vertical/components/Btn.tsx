import { TouchableOpacity } from 'react-native'
import { Icon } from '@/components/common/Icon'
import { createStyle } from '@/utils/tools'
import { scaleSizeH } from '@/utils/pixelRatio'
import { HEADER_HEIGHT as _HEADER_HEIGHT } from '@/config/constant'
import { useSettingValue } from '@/store/setting/hook'
import { V2Pressable } from '@/components/v2/atoms'

export const HEADER_HEIGHT = scaleSizeH(_HEADER_HEIGHT)

export default ({ icon, size = 18, color, onPress }: {
  icon: string
  size?: number
  color?: string
  onPress: () => void
}) => {
  const useModernUI = useSettingValue('theme.useModernUI')
  const iconNode = <Icon name={icon} color={color} size={size} />
  if (useModernUI) {
    return (
      <V2Pressable
        onPress={onPress}
        pressScale={0.92}
        pressOverlay={0.06}
        style={{ ...styles.button, width: HEADER_HEIGHT }}
      >
        {iconNode}
      </V2Pressable>
    )
  }
  return (
    <TouchableOpacity onPress={onPress} style={{ ...styles.button, width: HEADER_HEIGHT }}>
      {iconNode}
    </TouchableOpacity>
  )
}

const styles = createStyle({
  button: {
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
    flex: 0,
  },
})
