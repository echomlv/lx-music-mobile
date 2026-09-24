import { memo, useEffect } from 'react'
import { View, AppState, StyleSheet } from 'react-native'

import { screenkeepAwake, screenUnkeepAwake } from '@/utils/nativeModules/utils'
import MoreBtn from '@/screens/PlayDetail/Horizontal/MoreBtn'
import Header from '@/screens/PlayDetail/Horizontal/components/Header'
import Pic from '@/screens/PlayDetail/Horizontal/Pic'
import Lyric from '@/screens/PlayDetail/Horizontal/Lyric'
import Player from '@/screens/PlayDetail/Horizontal/Player'
import { marginLeftRaw } from '@/screens/PlayDetail/Horizontal/constant'

import commonState, { type InitState as CommonState } from '@/store/common/state'
import { useStatusbarHeight } from '@/store/common/hook'
import { createStyle } from '@/utils/tools'


/**
 * v2 PlayDetail 横屏:沉浸背景 + 复用 v1 横屏内部组件树。
 */
export default memo(({ componentId }: { componentId: string }) => {
  const statusBarHeight = useStatusbarHeight()

  useEffect(() => {
    screenkeepAwake()
    const appstateListener = AppState.addEventListener('change', (state) => {
      switch (state) {
        case 'active':
          if (!commonState.componentIds.comment) screenkeepAwake()
          break
        case 'background':
          screenUnkeepAwake()
          break
      }
    })

    const handleComponentIdsChange = (ids: CommonState['componentIds']) => {
      if (ids.comment) screenUnkeepAwake()
      else if (AppState.currentState == 'active') screenkeepAwake()
    }

    global.state_event.on('componentIdsUpdated', handleComponentIdsChange)

    return () => {
      global.state_event.off('componentIdsUpdated', handleComponentIdsChange)
      appstateListener.remove()
      screenUnkeepAwake()
    }
  }, [])

  return (
    <>
      <View style={[StyleSheet.absoluteFillObject, styles.container, { paddingTop: statusBarHeight }]}>
        <View style={styles.left}>
          <Header />
          <View style={styles.leftContent}>
            <MoreBtn />
            <Pic componentId={componentId} />
          </View>
          <Player />
        </View>
        <View style={styles.right}>
          <Lyric />
        </View>
      </View>
    </>
  )
})

const styles = createStyle({
  container: {
    flex: 1,
    flexDirection: 'row',
  },
  left: {
    flex: 1,
    width: '45%',
    paddingBottom: 10,
  },
  leftContent: {
    flexShrink: 1,
    flexGrow: 0,
    marginLeft: marginLeftRaw,
  },
  right: {
    width: '55%',
    flexGrow: 0,
    flexShrink: 0,
  },
})
