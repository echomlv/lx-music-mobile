import { useEffect, useRef } from 'react'
import DrawerLayoutFixed, { type DrawerLayoutFixedType } from '@/components/common/DrawerLayoutFixed'
import { useSettingValue } from '@/store/setting/hook'
import { COMPONENT_IDS } from '@/config/constant'
import { scaleSizeW } from '@/utils/pixelRatio'
import { DrawerNavV2 } from '@/components/v2/organisms'

import Header from './Header'
import Main from './Main'

const MAX_WIDTH = scaleSizeW(180)

const Content = () => {
  const drawer = useRef<DrawerLayoutFixedType>(null)
  const drawerLayoutPosition = useSettingValue('common.drawerLayoutPosition')

  useEffect(() => {
    const changeVisible = (visible: boolean) => {
      if (visible) drawer.current?.openDrawer()
      else drawer.current?.closeDrawer()
    }
    global.app_event.on('changeMenuVisible', changeVisible)
    return () => {
      global.app_event.off('changeMenuVisible', changeVisible)
    }
  }, [])

  const navigationView = () => <DrawerNavV2 />

  return (
    <DrawerLayoutFixed
      ref={drawer}
      widthPercentage={0.55}
      widthPercentageMax={MAX_WIDTH}
      visibleNavNames={[COMPONENT_IDS.home]}
      drawerPosition={drawerLayoutPosition}
      renderNavigationView={navigationView}
    >
      <Header />
      <Main />
    </DrawerLayoutFixed>
  )
}

export default Content
