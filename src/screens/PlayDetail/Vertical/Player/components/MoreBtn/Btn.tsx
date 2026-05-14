import { TouchableOpacity } from 'react-native'
import { Icon } from '@/components/common/Icon'
import { createStyle } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
import { useSettingValue } from '@/store/setting/hook'
import { scaleSizeW } from '@/utils/pixelRatio'
import { V2Pressable } from '@/components/v2/atoms'

export const BTN_WIDTH = scaleSizeW(36)
export const BTN_ICON_SIZE = 24

export default ({ icon, color, onPress, onLongPress }: {
  icon: string
  color?: string
  onPress: () => void
  onLongPress?: () => void
}) => {
  const theme = useTheme()
  const useModernUI = useSettingValue('theme.useModernUI')
  const iconNode = <Icon name={icon} color={color ?? theme['c-font-label']} size={BTN_ICON_SIZE} />
  if (useModernUI) {
    return (
      <V2Pressable
        onPress={onPress}
        onLongPress={onLongPress}
        pressScale={0.9}
        pressOverlay={0.08}
        style={{ ...styles.cotrolBtn, width: BTN_WIDTH, height: BTN_WIDTH }}
      >
        {iconNode}
      </V2Pressable>
    )
  }
  return (
    <TouchableOpacity style={{ ...styles.cotrolBtn, width: BTN_WIDTH, height: BTN_WIDTH }} activeOpacity={0.5} onPress={onPress} onLongPress={onLongPress}>
      {iconNode}
    </TouchableOpacity>
  )
}

const styles = createStyle({
  cotrolBtn: {
    marginLeft: 5,
    justifyContent: 'center',
    alignItems: 'center',

    // backgroundColor: '#ccc',
  },
})
