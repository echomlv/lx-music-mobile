import { View } from 'react-native'

import { useDesignTokens } from '@/theme/v2'
import { createStyle } from '@/utils/tools'

import PlayerBar from '@/components/player/PlayerBar'
import Aside from './Aside'
import Header from './Header'
import Main from './Main'

/**
 * v2 横屏 Home — 三栏:Aside / (Header + Main + PlayerBar)。
 * Aside 始终在左侧(与 v1 一致),Header 标题左右随 drawerLayoutPosition。
 * PlayerBar 已内置 useModernUI 分支,自动渲染 PlayerBarV2。
 */
export default () => {
  const { colors } = useDesignTokens()

  return (
    <View style={[styles.container, { backgroundColor: colors['c-content-background'] }]}>
      <Aside />
      <View style={styles.content}>
        <Header />
        <View style={styles.body}>
          <Main />
        </View>
        <PlayerBar isHome />
      </View>
    </View>
  )
}

const styles = createStyle({
  container: {
    flex: 1,
    flexDirection: 'row',
  },
  content: {
    flex: 1,
    overflow: 'hidden',
  },
  body: {
    flex: 1,
    overflow: 'hidden',
  },
})
