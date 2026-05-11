import { useEffect, useRef } from 'react'

import { useDesignTokens } from '@/theme/v2'
import settingState from '@/store/setting/state'
import DrawerLayoutFixed, { type DrawerLayoutFixedType } from '@/components/common/DrawerLayoutFixed'
import { COMPONENT_IDS } from '@/config/constant'
import { scaleSizeW } from '@/utils/pixelRatio'
import type { InitState as CommonState } from '@/store/common/state'

import TagList from '@/screens/Home/Views/SongList/TagList'
import Content from './Content'

const MAX_WIDTH = scaleSizeW(560)

/**
 * v2 歌单页:沿用 v1 DrawerLayoutFixed + TagList 抽屉(数据/交互不变),
 * 内容区(Content)走 v2 atoms 重写。
 */
export default () => {
  const drawer = useRef<DrawerLayoutFixedType>(null)
  const { colors } = useDesignTokens()

  useEffect(() => {
    const handleFixDrawer = (id: CommonState['navActiveId']) => {
      if (id == 'nav_songlist') drawer.current?.fixWidth()
    }
    const handleShow = () => {
      requestAnimationFrame(() => { drawer.current?.openDrawer() })
    }
    const handleHide = () => { drawer.current?.closeDrawer() }

    global.state_event.on('navActiveIdUpdated', handleFixDrawer)
    global.app_event.on('showSonglistTagList', handleShow)
    global.app_event.on('hideSonglistTagList', handleHide)
    return () => {
      global.state_event.off('navActiveIdUpdated', handleFixDrawer)
      global.app_event.off('showSonglistTagList', handleShow)
      global.app_event.off('hideSonglistTagList', handleHide)
    }
  }, [])

  const navigationView = () => <TagList />

  return (
    <DrawerLayoutFixed
      ref={drawer}
      visibleNavNames={[COMPONENT_IDS.home]}
      widthPercentage={0.8}
      widthPercentageMax={MAX_WIDTH}
      drawerPosition={settingState.setting['common.drawerLayoutPosition']}
      renderNavigationView={navigationView}
      drawerBackgroundColor={colors['c-content-background']}
      style={{ elevation: 1 }}
    >
      <Content />
    </DrawerLayoutFixed>
  )
}
