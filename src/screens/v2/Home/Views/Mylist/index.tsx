import { useEffect, useRef } from 'react'

import { useDesignTokens } from '@/theme/v2'
import settingState from '@/store/setting/state'
import DrawerLayoutFixed, { type DrawerLayoutFixedType } from '@/components/common/DrawerLayoutFixed'
import { COMPONENT_IDS } from '@/config/constant'
import { scaleSizeW } from '@/utils/pixelRatio'
import type { InitState as CommonState } from '@/store/common/state'

import MusicList from '@/screens/Home/Views/Mylist/MusicList'
import MyList from './MyList'

const MAX_WIDTH = scaleSizeW(400)

/**
 * v2 Mylist 页:沿用 v1 DrawerLayoutFixed,左侧 drawer (MyList) 改 v2 分区卡片,
 * 右侧主音乐列表沿用 v1(逻辑庞大,后续单独迭代视觉)。
 */
export default () => {
  const drawer = useRef<DrawerLayoutFixedType>(null)
  const { colors } = useDesignTokens()

  useEffect(() => {
    const handleFixDrawer = (id: CommonState['navActiveId']) => {
      if (id == 'nav_love') drawer.current?.fixWidth()
    }
    const changeVisible = (visible: boolean) => {
      if (visible) {
        requestAnimationFrame(() => { drawer.current?.openDrawer() })
      } else {
        drawer.current?.closeDrawer()
      }
    }
    global.state_event.on('navActiveIdUpdated', handleFixDrawer)
    global.app_event.on('changeLoveListVisible', changeVisible)
    return () => {
      global.state_event.off('navActiveIdUpdated', handleFixDrawer)
      global.app_event.off('changeLoveListVisible', changeVisible)
    }
  }, [])

  const navigationView = () => <MyList />

  return (
    <DrawerLayoutFixed
      ref={drawer}
      visibleNavNames={[COMPONENT_IDS.home]}
      widthPercentage={0.82}
      widthPercentageMax={MAX_WIDTH}
      drawerPosition={settingState.setting['common.drawerLayoutPosition']}
      renderNavigationView={navigationView}
      drawerBackgroundColor={colors['c-content-background']}
      style={{ elevation: 1 }}
    >
      <MusicList />
    </DrawerLayoutFixed>
  )
}
