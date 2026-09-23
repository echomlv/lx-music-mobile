import { useCallback } from 'react'
import { View } from 'react-native'

import { useDesignTokens } from '@/theme/v2'
import { useHorizontalMode } from '@/utils/hooks'
import { useBackHandler } from '@/utils/hooks/useBackHandler'
import commonState from '@/store/common/state'
import { setNavActiveId } from '@/core/common'

import Vertical from '@/screens/Home/Views/Setting/Vertical'
import Horizontal from './Horizontal'

/**
 * v2 设置页:沿用 v1 路由 + 全部设置项,
 * 仅在外层套一层「卡片底色」,配合 Section.tsx 的 useModernUI 分支让分组卡片浮起。
 */
export default () => {
  const isHorizontalMode = useHorizontalMode()
  const { colors } = useDesignTokens()
  useBackHandler(useCallback(() => {
    if (Object.keys(commonState.componentIds).length == 1 && commonState.navActiveId == 'nav_setting') {
      setNavActiveId(commonState.lastNavActiveId)
      return true
    }
    return false
  }, []))

  return (
    <View style={{ flex: 1, backgroundColor: colors['c-primary-light-300-alpha-200'] }}>
      {isHorizontalMode ? <Horizontal /> : <Vertical />}
    </View>
  )
}
