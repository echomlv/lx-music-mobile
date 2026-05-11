import { useCallback, useEffect, useMemo, useRef, useState, type ComponentRef } from 'react'
import { View } from 'react-native'
import PagerView, { type PageScrollStateChangedNativeEvent, type PagerViewOnPageSelectedEvent } from 'react-native-pager-view'

import { setNavActiveId } from '@/core/common'
import commonState, { type InitState as CommonState } from '@/store/common/state'
import settingState from '@/store/setting/state'
import { createStyle } from '@/utils/tools'

import Leaderboard from '@/screens/Home/Views/Leaderboard'
import Setting from '@/screens/Home/Views/Setting'

import Search from '@/screens/v2/Home/Views/Search'
import SongList from '@/screens/v2/Home/Views/SongList'
import Mylist from '@/screens/v2/Home/Views/Mylist'

/**
 * v2 Main:与 v1 共用 PagerView + 懒挂载策略,搜索页切换为 SearchV2,
 * 其他页等后续切片完成后逐个替换 import。
 */

const hideKeys = [
  'list.isShowAlbumName',
  'list.isShowInterval',
  'theme.fontShadow',
] as Readonly<Array<keyof LX.AppSetting>>

const buildLazyPage = (
  navId: CommonState['navActiveId'],
  Component: () => JSX.Element,
) => {
  return () => {
    const [visible, setVisible] = useState(commonState.navActiveId == navId)
    const component = useMemo(() => <Component />, [])
    useEffect(() => {
      let currentId: CommonState['navActiveId'] = commonState.navActiveId
      const handleNavIdUpdate = (id: CommonState['navActiveId']) => {
        currentId = id
        if (id == navId) {
          requestAnimationFrame(() => { setVisible(true) })
        }
      }
      const handleHide = () => {
        if (currentId != 'nav_setting') return
        setVisible(false)
      }
      const handleConfigUpdated = (keys: Array<keyof LX.AppSetting>) => {
        if (keys.some(k => hideKeys.includes(k))) handleHide()
      }
      global.state_event.on('navActiveIdUpdated', handleNavIdUpdate)
      global.state_event.on('themeUpdated', handleHide)
      global.state_event.on('languageChanged', handleHide)
      global.state_event.on('configUpdated', handleConfigUpdated)
      return () => {
        global.state_event.off('navActiveIdUpdated', handleNavIdUpdate)
        global.state_event.off('themeUpdated', handleHide)
        global.state_event.off('languageChanged', handleHide)
        global.state_event.off('configUpdated', handleConfigUpdated)
      }
    }, [])
    return visible ? component : null
  }
}

const SearchPage = buildLazyPage('nav_search', Search)
const SongListPage = buildLazyPage('nav_songlist', SongList)
const LeaderboardPage = buildLazyPage('nav_top', Leaderboard)
const MylistPage = buildLazyPage('nav_love', Mylist)

const SettingPage = () => {
  const [visible, setVisible] = useState(commonState.navActiveId == 'nav_setting')
  const component = useMemo(() => <Setting />, [])
  useEffect(() => {
    const handleNavIdUpdate = (id: CommonState['navActiveId']) => {
      if (id == 'nav_setting') {
        requestAnimationFrame(() => { setVisible(true) })
      }
    }
    global.state_event.on('navActiveIdUpdated', handleNavIdUpdate)
    return () => {
      global.state_event.off('navActiveIdUpdated', handleNavIdUpdate)
    }
  }, [])
  return visible ? component : null
}

const viewMap = {
  nav_search: 0,
  nav_songlist: 1,
  nav_top: 2,
  nav_love: 3,
  nav_setting: 4,
}
const indexMap = [
  'nav_search',
  'nav_songlist',
  'nav_top',
  'nav_love',
  'nav_setting',
] as const

const Main = () => {
  const pagerViewRef = useRef<ComponentRef<typeof PagerView>>(null)
  const activeIndexRef = useRef(viewMap[commonState.navActiveId])
  const [scrollEnabled, setScrollEnabled] = useState(settingState.setting['common.homePageScroll'])

  const onPageSelected = useCallback(({ nativeEvent }: PagerViewOnPageSelectedEvent) => {
    activeIndexRef.current = nativeEvent.position
    if (activeIndexRef.current != viewMap[commonState.navActiveId]) {
      setNavActiveId(indexMap[activeIndexRef.current])
    }
  }, [])

  const onPageScrollStateChanged = useCallback(({ nativeEvent }: PageScrollStateChangedNativeEvent) => {
    const idle = nativeEvent.pageScrollState == 'idle'
    if (global.lx.homePagerIdle != idle) global.lx.homePagerIdle = idle
  }, [])

  useEffect(() => {
    const handleUpdate = (id: CommonState['navActiveId']) => {
      const index = viewMap[id]
      if (activeIndexRef.current == index) return
      activeIndexRef.current = index
      pagerViewRef.current?.setPageWithoutAnimation(index)
    }
    const handleConfigUpdate = (keys: Array<keyof LX.AppSetting>, setting: Partial<LX.AppSetting>) => {
      if (!keys.includes('common.homePageScroll')) return
      setScrollEnabled(setting['common.homePageScroll']!)
    }
    const handleHomePageScrollEnabled = (enabled: boolean) => {
      setScrollEnabled(enabled ? settingState.setting['common.homePageScroll'] : false)
    }
    global.state_event.on('navActiveIdUpdated', handleUpdate)
    global.state_event.on('configUpdated', handleConfigUpdate)
    global.app_event.on('changeHomePageScrollEnabled', handleHomePageScrollEnabled)
    return () => {
      global.state_event.off('navActiveIdUpdated', handleUpdate)
      global.state_event.off('configUpdated', handleConfigUpdate)
      global.app_event.off('changeHomePageScrollEnabled', handleHomePageScrollEnabled)
    }
  }, [])

  const component = useMemo(() => (
    <PagerView
      ref={pagerViewRef}
      initialPage={activeIndexRef.current}
      offscreenPageLimit={1}
      onPageSelected={onPageSelected}
      onPageScrollStateChanged={onPageScrollStateChanged}
      scrollEnabled={scrollEnabled}
      style={styles.pagerView}
    >
      <View collapsable={false} key="nav_search" style={styles.pageStyle}>
        <SearchPage />
      </View>
      <View collapsable={false} key="nav_songlist" style={styles.pageStyle}>
        <SongListPage />
      </View>
      <View collapsable={false} key="nav_top" style={styles.pageStyle}>
        <LeaderboardPage />
      </View>
      <View collapsable={false} key="nav_love" style={styles.pageStyle}>
        <MylistPage />
      </View>
      <View collapsable={false} key="nav_setting" style={styles.pageStyle}>
        <SettingPage />
      </View>
    </PagerView>
  ), [onPageScrollStateChanged, onPageSelected, scrollEnabled])

  return component
}

const styles = createStyle({
  pagerView: {
    flex: 1,
    overflow: 'hidden',
  },
  pageStyle: {
    flex: 1,
    width: '100%',
    overflow: 'hidden',
  },
})

export default Main
