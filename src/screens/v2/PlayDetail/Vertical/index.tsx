import { memo, useState, useRef, useMemo, useEffect } from 'react'
import { View, AppState, StyleSheet } from 'react-native'
import PagerView, { type PagerViewOnPageSelectedEvent } from 'react-native-pager-view'

import Header from '@/screens/PlayDetail/Vertical/components/Header'
import Player from '@/screens/PlayDetail/Vertical/Player'
import Pic from '@/screens/PlayDetail/Vertical/Pic'
import Lyric from '@/screens/PlayDetail/Vertical/Lyric'
import { screenkeepAwake, screenUnkeepAwake } from '@/utils/nativeModules/utils'
import commonState, { type InitState as CommonState } from '@/store/common/state'

import Background from '../Background'

/**
 * v2 PlayDetail 竖屏:沉浸背景层 + 复用 v1 内部组件树(透明 bg 自然透出)。
 */

const LyricPage = ({ activeIndex }: { activeIndex: number }) => {
  const initedRef = useRef(false)
  const lyric = useMemo(() => <Lyric />, [])
  switch (activeIndex) {
    case 1:
      if (!initedRef.current) initedRef.current = true
      return lyric
    default:
      return initedRef.current ? lyric : null
  }
}

export default memo(({ componentId }: { componentId: string }) => {
  const [pageIndex, setPageIndex] = useState(0)
  const showLyricRef = useRef(false)

  const onPageSelected = ({ nativeEvent }: PagerViewOnPageSelectedEvent) => {
    setPageIndex(nativeEvent.position)
    showLyricRef.current = nativeEvent.position == 1
    if (showLyricRef.current) screenkeepAwake()
    else screenUnkeepAwake()
  }

  useEffect(() => {
    const appstateListener = AppState.addEventListener('change', (state) => {
      switch (state) {
        case 'active':
          if (showLyricRef.current && !commonState.componentIds.comment) screenkeepAwake()
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
      <Background />
      <View style={StyleSheet.absoluteFillObject}>
        <Header />
        <View style={{ flex: 1, flexDirection: 'column' }}>
          <PagerView onPageSelected={onPageSelected} style={{ flex: 1 }}>
            <View collapsable={false}>
              <Pic componentId={componentId} />
            </View>
            <View collapsable={false}>
              <LyricPage activeIndex={pageIndex} />
            </View>
          </PagerView>
          <Player />
        </View>
      </View>
    </>
  )
})
