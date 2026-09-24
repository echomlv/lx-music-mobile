import { memo } from 'react'
import { View, type StyleProp, type ViewStyle } from 'react-native'

export interface DashedLineProps {
  color: string
  /** 竖线;默认横线 */
  vertical?: boolean
  /** 线宽,默认 1 */
  thickness?: number
  style?: StyleProp<ViewStyle>
}

/**
 * 单条虚线。
 * iOS 只支持四边宽度、颜色一致的虚线边框,单边 borderStyle: 'dashed' 会告警
 * "Unsupported dashed / dotted border style" 并退化为实线;
 * 这里给内层一个四边一致的虚线框,再用外层裁掉多余的边,只露出一条虚线。
 */
export default memo(({ color, vertical = false, thickness = 1, style }: DashedLineProps) => (
  <View style={[vertical ? { width: thickness } : { height: thickness }, { overflow: 'hidden' }, style]}>
    <View
      style={[
        vertical ? { flex: 1, width: thickness * 2 } : { height: thickness * 2 },
        { borderWidth: thickness, borderStyle: 'dashed', borderColor: color },
      ]}
    />
  </View>
))
